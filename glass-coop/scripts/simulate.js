// simulate.js — headless 로직 검수 (self-check 스킬)
//
// 기획서 ⑦ 완료 기준 중 브라우저 없이 확인 가능한 항목을 전부 테스트로 바꾼다.
// 렌더·입력(Pointer Events)이 필요한 항목은 브라우저 검수에서 따로 본다.
//
// 실행: node scripts/simulate.js

import {
  createState, applyIntent, checkComplete, computeRegions, countSolutions,
  canToggle, isRectangle, seamBetween, describeSeam, vSeamId, hSeamId,
  cellIndex, seamsFromOwner,
} from '../js/puzzle.js';
import { PUZZLES } from '../js/puzzles.js';

let pass = 0;
const failures = [];

function ok(cond, label, detail = '') {
  if (cond) { pass++; return; }
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const eq = (a, b, label) => ok(a === b, label, `기대 ${b}, 실제 ${a}`);

// 정답 납선 배치를 상태에 그대로 넣는다
function loadSolution(state) {
  state.seams = new Set(state.puzzle.solution);
  return state;
}

const MIN_SPAN_RATIO = 0.35;
const seamMid = (size, id) => {
  const s = describeSeam(size, id);
  return s.dir === 'v' ? { x: s.c + 1, y: s.r + 0.5 } : { x: s.c + 0.5, y: s.r + 1 };
};
const seamEnds = (size, id) => {
  const s = describeSeam(size, id);
  return s.dir === 'v'
    ? [{ x: s.c + 1, y: s.r }, { x: s.c + 1, y: s.r + 1 }]
    : [{ x: s.c, y: s.r + 1 }, { x: s.c + 1, y: s.r + 1 }];
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cellCenter = (size, i) => ({ x: (i % size) + 0.5, y: Math.floor(i / size) + 0.5 });

// ═══════════════════════════════════════════════════════════
console.log('── 시나리오 1: 퍼즐 로직 기본 ──');
// ═══════════════════════════════════════════════════════════
{
  // 4x4를 2x2 넷으로 나누는 손수 만든 판
  const puzzle = {
    id: 'hand', size: 4,
    seeds: [
      { cell: cellIndex(4, 0, 0), color: 'azure', size: 4 },
      { cell: cellIndex(4, 0, 2), color: 'crimson', size: 4 },
      { cell: cellIndex(4, 2, 0), color: 'amber', size: 4 },
      { cell: cellIndex(4, 2, 2), color: 'jade', size: 4 },
    ],
    coop: [], solution: [],
  };
  const owner = new Int32Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) owner[r * 4 + c] = (r < 2 ? 0 : 2) + (c < 2 ? 0 : 1);
  }
  puzzle.solution = [...seamsFromOwner(4, owner)].sort((a, b) => a - b);

  const st = createState(puzzle);

  // 납선 하나도 없으면 격자 전체가 영역 1개
  eq(computeRegions(4, st.seams).regions.length, 1, '빈 상태의 영역 수');

  // 납선을 토글하면 즉시 재계산된다
  applyIntent(st, { type: 'toggleSeam', seam: vSeamId(4, 0, 1) });
  ok(st.seams.has(vSeamId(4, 0, 1)), '납선 토글로 그어짐');
  applyIntent(st, { type: 'toggleSeam', seam: vSeamId(4, 0, 1) });
  ok(!st.seams.has(vSeamId(4, 0, 1)), '납선 재토글로 지워짐');

  // 정답 배치 → 완성
  loadSolution(st);
  const res = checkComplete(st);
  ok(res.complete, '정답 배치가 완성 판정됨', JSON.stringify(res.issues));
  eq(res.regions.length, 4, '정답의 영역 수');

  // 규칙 ① 색점 0개 영역: 가운데 십자만 그으면 색점 없는 영역이 생기게 만든다
  {
    const s2 = createState({
      ...puzzle,
      seeds: [{ cell: 0, color: 'azure', size: 4 }],
    });
    s2.seams = new Set(puzzle.solution);
    const r2 = checkComplete(s2);
    ok(!r2.complete, '색점 없는 영역이 있으면 미완성');
    ok(r2.issues.some((i) => i.kind === 'no-seed'), 'no-seed 위반이 보고됨');
  }

  // 규칙 ① 색점 2개 영역
  {
    const s3 = createState({
      ...puzzle,
      seeds: [
        { cell: 0, color: 'azure', size: 8 },
        { cell: 1, color: 'crimson', size: 8 },
      ],
    });
    s3.seams = new Set(); // 전체가 한 영역 → 색점 2개
    const r3 = checkComplete(s3);
    ok(!r3.complete, '색점 2개인 영역이 있으면 미완성');
    ok(r3.issues.some((i) => i.kind === 'multi-seed'), 'multi-seed 위반이 보고됨');
  }

  // 규칙 ② 크기 불일치
  {
    const s4 = createState({ ...puzzle, seeds: [{ cell: 0, color: 'azure', size: 99 }] });
    s4.seams = new Set();
    const r4 = checkComplete(s4);
    ok(!r4.complete, '크기가 다르면 미완성');
    ok(r4.issues.some((i) => i.kind === 'wrong-size'), 'wrong-size 위반이 보고됨');
  }

  // 규칙 ③ 직사각형 아님
  {
    ok(isRectangle(4, [0, 1, 4, 5]), '2x2는 직사각형');
    ok(!isRectangle(4, [0, 1, 4]), 'L자는 직사각형 아님');
    ok(isRectangle(4, [3, 7]), '2x1 세로는 직사각형');

    // ★ ①②는 통과하고 ③만 실패하는 배치를 정확히 만든다.
    //   L{0,1,2,4}=4칸(색점1개) · {3,7}=2칸 · {5,6}=2칸 · {8..15}=8칸
    //   → L만 직사각형이 아니고 나머지는 전부 직사각형이며 크기도 다 맞다.
    const s5 = createState({
      id: 'L4', size: 4,
      seeds: [
        { cell: 0, color: 'azure', size: 4 },    // L자 영역
        { cell: 3, color: 'crimson', size: 2 },
        { cell: 5, color: 'amber', size: 2 },
        { cell: 8, color: 'jade', size: 8 },
      ],
      coop: [], solution: [],
    });
    const ownerL = Int32Array.from([
      0, 0, 0, 1,
      0, 2, 2, 1,
      3, 3, 3, 3,
      3, 3, 3, 3,
    ]);
    s5.seams = seamsFromOwner(4, ownerL);

    const r5 = checkComplete(s5);
    ok(!r5.complete, '직사각형이 아닌 영역이 있으면 미완성');
    ok(r5.issues.length === 1, '위반이 정확히 1건', `${r5.issues.length}건`);
    ok(r5.issues[0]?.kind === 'not-rectangle',
      'not-rectangle 위반만 보고됨 (크기·색점 위반이 아님)',
      JSON.stringify(r5.issues));

    // 같은 배치에서 L을 직사각형으로 고치면 완성돼야 한다 (대조군)
    const s5b = createState({
      id: 'L4fix', size: 4,
      seeds: [
        { cell: 0, color: 'azure', size: 4 },
        { cell: 2, color: 'crimson', size: 4 },
        { cell: 8, color: 'jade', size: 8 },
      ],
      coop: [], solution: [],
    });
    s5b.seams = seamsFromOwner(4, Int32Array.from([
      0, 0, 1, 1,
      0, 0, 1, 1,
      2, 2, 2, 2,
      2, 2, 2, 2,
    ]));
    ok(checkComplete(s5b).complete, '대조군: 전부 직사각형이면 완성');
  }

  // 되돌리기
  {
    const s6 = createState(puzzle);
    applyIntent(s6, { type: 'toggleSeam', seam: 0 });
    applyIntent(s6, { type: 'toggleSeam', seam: 1 });
    const before = new Set(s6.seams);
    applyIntent(s6, { type: 'toggleSeam', seam: 2 });
    applyIntent(s6, { type: 'undo' });
    eq(s6.seams.size, before.size, '되돌리기 후 납선 수');
    ok([...before].every((x) => s6.seams.has(x)), '되돌리기가 직전 상태를 정확히 복원');

    // 되돌릴 게 없으면 거부
    const s7 = createState(puzzle);
    eq(applyIntent(s7, { type: 'undo' }).rejected, 'nothing-to-undo', '빈 히스토리 되돌리기 거부');
  }
}

// ═══════════════════════════════════════════════════════════
console.log('── 시나리오 2: 생성된 18판 전수 검사 ──');
// ═══════════════════════════════════════════════════════════
{
  eq(PUZZLES.length, 18, '퍼즐 개수');

  for (const puzzle of PUZZLES) {
    const tag = `[${puzzle.id}]`;

    // 유일해
    const { count } = countSolutions(puzzle, 2);
    eq(count, 1, `${tag} 해가 정확히 1개`);

    // 정답 배치 → 완성
    const st = loadSolution(createState(puzzle));
    const res = checkComplete(st);
    ok(res.complete, `${tag} 정답 배치가 완성 판정됨`, JSON.stringify(res.issues));
    eq(res.regions.length, puzzle.seeds.length, `${tag} 영역 수 = 색점 수`);

    // 모든 영역이 직사각형이고 크기가 맞다
    ok(res.regions.every((cells) => isRectangle(puzzle.size, cells)),
      `${tag} 정답의 모든 영역이 직사각형`);

    // 색점 수는 pip으로 표시 가능한 범위(2..9)
    ok(puzzle.seeds.every((s) => s.size >= 2 && s.size <= 9),
      `${tag} 모든 영역 넓이가 2..9`,
      puzzle.seeds.map((s) => s.size).join(','));

    // 납선 하나만 빼면 미완성이어야 한다 (정답이 최소 집합인지)
    if (puzzle.solution.length > 0) {
      const st2 = loadSolution(createState(puzzle));
      st2.seams.delete(puzzle.solution[0]);
      ok(!checkComplete(st2).complete, `${tag} 납선 하나 빠지면 미완성`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
console.log('── 시나리오 3: 협동 조작 규칙 ──');
// ═══════════════════════════════════════════════════════════
{
  const withCoop = PUZZLES.filter((p) => p.coop.length > 0);
  ok(withCoop.length >= 14, '협동 조작이 있는 퍼즐 수', `${withCoop.length}판`);

  for (const puzzle of withCoop) {
    const tag = `[${puzzle.id}]`;
    const diag = Math.hypot(puzzle.size, puzzle.size);
    const minSpan = diag * MIN_SPAN_RATIO;

    for (const coop of puzzle.coop) {
      // ★ 협동 납선은 전부 해답에 포함돼야 한다 — 아니면 안 써도 풀린다
      ok(coop.seams.every((s) => puzzle.solution.includes(s)),
        `${tag} ${coop.type} 납선이 전부 해답에 포함`);

      // ★ 두 접점 거리 조건 (혼자 두 손으로 하는 걸 막는다)
      if (coop.type === 'double') {
        const d = dist(seamMid(puzzle.size, coop.seams[0]), seamMid(puzzle.size, coop.seams[1]));
        ok(d >= minSpan, `${tag} 이중납선 접점 거리 ≥ 대각 35%`, `${d.toFixed(2)} < ${minSpan.toFixed(2)}`);
      }
      if (coop.type === 'long') {
        const a = seamEnds(puzzle.size, coop.seams[0])[0];
        const b = seamEnds(puzzle.size, coop.seams[coop.seams.length - 1])[1];
        const d = dist(a, b);
        ok(d >= minSpan, `${tag} 긴납선 양 끝 거리 ≥ 대각 35%`, `${d.toFixed(2)} < ${minSpan.toFixed(2)}`);
        ok(coop.seams.length >= 3, `${tag} 긴납선 길이 ≥ 3`);
      }
      if (coop.type === 'lock') {
        const center = cellCenter(puzzle.size, puzzle.seeds[coop.seed].cell);
        ok(coop.seams.every((s) => dist(seamMid(puzzle.size, s), center) >= minSpan),
          `${tag} 잠긴영역 색점↔납선 거리 ≥ 대각 35%`);
      }

      // ── canToggle 규칙 ──
      const seam = coop.seams[0];

      if (coop.type === 'double') {
        ok(!canToggle(puzzle, seam, { partners: 1 }).ok, `${tag} 이중납선: 혼자면 거부`);
        ok(canToggle(puzzle, seam, { partners: 2 }).ok, `${tag} 이중납선: 둘이면 허용`);
      }

      if (coop.type === 'long') {
        ok(!canToggle(puzzle, seam, { partners: 1, holdMs: 5000 }).ok,
          `${tag} 긴납선: 혼자면 오래 눌러도 거부`);
        ok(!canToggle(puzzle, seam, { partners: 2, holdMs: 799 }).ok,
          `${tag} 긴납선: 799ms면 거부`);
        ok(canToggle(puzzle, seam, { partners: 2, holdMs: 800 }).ok,
          `${tag} 긴납선: 800ms면 허용`);
      }

      if (coop.type === 'lock') {
        ok(!canToggle(puzzle, seam, { heldSeeds: new Set() }).ok,
          `${tag} 잠긴영역: 색점을 안 잡으면 거부`);
        ok(canToggle(puzzle, seam, {
          heldSeeds: new Set([coop.seed]),
          seedHeldBy: new Map([[coop.seed, 'ptrA']]),
          byPointer: 'ptrB',
        }).ok, `${tag} 잠긴영역: 상대가 조작하면 허용`);
        ok(!canToggle(puzzle, seam, {
          heldSeeds: new Set([coop.seed]),
          seedHeldBy: new Map([[coop.seed, 'ptrA']]),
          byPointer: 'ptrA',
        }).ok, `${tag} 잠긴영역: 잡은 손가락 본인은 거부`);
      }
    }

    // ★ 협동 조작 없이는 완성 불가
    // 해가 유일하므로 완성하려면 해답 납선 집합과 정확히 같아야 한다.
    // 협동 납선이 해답에 포함돼 있고 혼자서는 그을 수 없으므로 완성이 불가능하다.
    const coopSeams = new Set(puzzle.coop.flatMap((c) => c.seams));
    const st = createState(puzzle);
    st.seams = new Set(puzzle.solution.filter((s) => !coopSeams.has(s)));
    ok(!checkComplete(st).complete,
      `${tag} 협동 납선을 빼면 완성되지 않음`);

    // 혼자(partners=1, 아무것도 안 잡음) 협동 납선을 그으려 하면 전부 거부돼야 한다
    const soloBlocked = [...coopSeams].every(
      (s) => !canToggle(puzzle, s, { partners: 1, holdMs: 9999, heldSeeds: new Set() }).ok,
    );
    ok(soloBlocked, `${tag} 혼자서는 협동 납선을 하나도 그을 수 없음`);
  }
}

// ═══════════════════════════════════════════════════════════
console.log('── 시나리오 4: 협동 조작 적용 (toggleGroup) ──');
// ═══════════════════════════════════════════════════════════
{
  const p = PUZZLES.find((x) => x.coop.some((c) => c.type === 'double'));
  const coop = p.coop.find((c) => c.type === 'double');
  const st = createState(p);

  // 혼자면 거부되고 상태가 안 변한다
  const r1 = applyIntent(st, { type: 'toggleGroup', seams: coop.seams, ctx: { partners: 1 } });
  eq(r1.rejected, 'need-two-pointers', '이중납선 그룹: 혼자면 거부');
  eq(st.seams.size, 0, '거부됐을 때 상태 변화 없음');

  // 둘이면 두 납선이 함께 그어진다
  applyIntent(st, { type: 'toggleGroup', seams: coop.seams, ctx: { partners: 2 } });
  ok(coop.seams.every((s) => st.seams.has(s)), '이중납선 그룹: 둘이면 함께 그어짐');

  // 다시 하면 함께 지워진다
  applyIntent(st, { type: 'toggleGroup', seams: coop.seams, ctx: { partners: 2 } });
  ok(coop.seams.every((s) => !st.seams.has(s)), '이중납선 그룹: 재토글로 함께 지워짐');
}

// ═══════════════════════════════════════════════════════════
const total = pass + failures.length;
console.log(`\n${'═'.repeat(50)}`);
if (failures.length === 0) {
  console.log(`✅ ${pass}/${total} 단언 통과`);
} else {
  console.log(`❌ ${pass}/${total} 통과, ${failures.length}개 실패\n`);
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
}
