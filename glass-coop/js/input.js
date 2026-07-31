// input.js — Pointer Events → intent 변환.
//
// 물리적 동시성(어느 손가락이, 언제, 어디를 눌렀나)은 전부 여기서 판정하고,
// 결과를 intent로 만들어 puzzle.js에 넘긴다. puzzle.js는 규칙만 본다.
// 그래서 나중에 intent를 네트워크로 보내면 로직을 안 고치고 원격 협동이 된다.

import { computeView, seamSegment, seamMidpoint, seedCenter } from './render.js';
import { coopFor, describeSeam, cellRow, cellCol } from './puzzle.js';

// 두 접점이 이만큼 떨어져 있어야 협동 조작으로 인정한다.
// 한 손으로 양쪽에 동시에 닿는 걸 막기 위한 값이다.
// (두 손을 쓰는 1인 플레이까지 원천 차단하지는 못한다 — 협동 게임이라
//  속일 동기가 없고, 이 조건은 "실수로 혼자 되는 것"을 막는 선이다)
const MIN_SPAN_RATIO = 0.35;

const HIT_SEAM = 0.34;   // 셀 크기 대비 납선 히트 반경
const HIT_SEED = 0.42;   // 셀 크기 대비 색점 히트 반경

export function createInput(canvas, getState, emit) {
  /** pointerId → { x, y, target, downAt } */
  const active = new Map();

  /** 협동 대기 상태 */
  const anim = {
    pending: new Set(),        // 짝을 기다리는 협동 납선 id
    gauge: new Map(),          // coopIndex → 0..1
    unlocked: new Set(),       // 지금 잡혀서 열린 seed 인덱스
    winT: 0,
  };

  /** seedIdx → pointerId (누가 잡고 있는지) */
  const seedHeldBy = new Map();

  /** coopIndex → { startedAt, pointers:Set } — 긴납선 홀드 추적 */
  const holds = new Map();

  function localPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function spanOK(a, b) {
    const { puzzle } = getState();
    const view = computeView(canvas, puzzle.size);
    const diag = Math.hypot(view.board, view.board);
    return Math.hypot(a.x - b.x, a.y - b.y) >= diag * MIN_SPAN_RATIO;
  }

  /** 화면 좌표 → 무엇을 눌렀나 */
  function hitTest(p) {
    const { puzzle } = getState();
    const size = puzzle.size;
    const view = computeView(canvas, size);

    // 색점 먼저 (잠긴 영역을 잡는 조작이 납선보다 우선)
    let best = null, bestD = Infinity;
    puzzle.seeds.forEach((seed, idx) => {
      const c = seedCenter(view, size, seed.cell);
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < view.cell * HIT_SEED && d < bestD) {
        bestD = d; best = { kind: 'seed', seed: idx, at: c };
      }
    });
    if (best) return best;

    // 납선
    const total = 2 * size * (size - 1);
    bestD = Infinity;
    for (let id = 0; id < total; id++) {
      const m = seamMidpoint(view, size, id);
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < view.cell * HIT_SEAM && d < bestD) {
        bestD = d; best = { kind: 'seam', seam: id, at: m };
      }
    }
    return best;
  }

  const coopIndexOf = (puzzle, seamId) => puzzle.coop.findIndex((c) => c.seams.includes(seamId));

  // ── 눌림 ──
  function onDown(ev) {
    ev.preventDefault();
    canvas.setPointerCapture?.(ev.pointerId);

    const p = localPoint(ev);
    const hit = hitTest(p);
    if (!hit) return;

    active.set(ev.pointerId, { ...p, target: hit, downAt: performance.now() });

    const { puzzle } = getState();

    // ── 색점을 잡았다 (잠긴 영역 열기) ──
    if (hit.kind === 'seed') {
      const isLock = puzzle.coop.some((c) => c.type === 'lock' && c.seed === hit.seed);
      if (isLock) {
        seedHeldBy.set(hit.seed, ev.pointerId);
        anim.unlocked.add(hit.seed);
      }
      return;
    }

    const seamId = hit.seam;
    const coop = coopFor(puzzle, seamId);

    // ── 보통 납선: 즉시 토글 ──
    if (!coop) {
      emit({ type: 'toggleSeam', seam: seamId, ctx: { partners: 1 } });
      return;
    }

    // ── 잠긴 영역의 납선 ──
    if (coop.type === 'lock') {
      emit({
        type: 'toggleSeam',
        seam: seamId,
        ctx: {
          heldSeeds: new Set(anim.unlocked),
          seedHeldBy: new Map(seedHeldBy),
          byPointer: ev.pointerId,
        },
      });
      return;
    }

    // ── 이중납선: 짝이 이미 눌려 있으면 성립 ──
    if (coop.type === 'double') {
      const partner = coop.seams.find((s) => s !== seamId);
      const partnerEntry = [...active.entries()].find(
        ([pid, a]) => pid !== ev.pointerId && a.target?.kind === 'seam' && a.target.seam === partner,
      );

      if (partnerEntry) {
        const [, pa] = partnerEntry;
        const withinWindow = performance.now() - pa.downAt <= (coop.windowMs ?? 250);
        if (withinWindow && spanOK(p, pa)) {
          anim.pending.clear();
          emit({ type: 'toggleGroup', seams: coop.seams, ctx: { partners: 2 } });
          return;
        }
      }
      // 짝을 기다린다
      anim.pending.add(seamId);
      setTimeout(() => anim.pending.delete(seamId), coop.windowMs ?? 250);
      return;
    }

    // ── 긴납선: 양 끝을 동시에 잡고 버텨야 한다 ──
    if (coop.type === 'long') {
      const ci = coopIndexOf(puzzle, seamId);
      const ends = [coop.seams[0], coop.seams[coop.seams.length - 1]];
      if (!ends.includes(seamId)) return; // 가운데는 잡아도 소용없다

      let hold = holds.get(ci);
      if (!hold) { hold = { pointers: new Map(), startedAt: null }; holds.set(ci, hold); }
      hold.pointers.set(ev.pointerId, { seam: seamId, at: p });

      // 양 끝이 서로 다른 손가락으로, 충분히 떨어져 잡혔는가
      const grabbed = [...hold.pointers.values()];
      const hasBoth =
        hold.pointers.size >= 2 &&
        ends.every((e) => grabbed.some((g) => g.seam === e)) &&
        grabbed.some((a) => grabbed.some((b) => a !== b && spanOK(a.at, b.at)));

      if (hasBoth && hold.startedAt === null) hold.startedAt = performance.now();
      return;
    }
  }

  // ── 이동 (긴납선 홀드 중 손가락 위치 갱신) ──
  function onMove(ev) {
    const a = active.get(ev.pointerId);
    if (!a) return;
    const p = localPoint(ev);
    a.x = p.x; a.y = p.y;
    for (const hold of holds.values()) {
      const g = hold.pointers.get(ev.pointerId);
      if (g) g.at = p;
    }
  }

  // ── 뗌 / 취소 ──
  function release(pointerId) {
    active.delete(pointerId);

    // 잡고 있던 색점 놓기
    for (const [seedIdx, pid] of [...seedHeldBy.entries()]) {
      if (pid === pointerId) {
        seedHeldBy.delete(seedIdx);
        anim.unlocked.delete(seedIdx);
      }
    }

    // 긴납선 홀드 해제 → 게이지 되감김
    for (const [ci, hold] of [...holds.entries()]) {
      if (hold.pointers.has(pointerId)) {
        hold.pointers.delete(pointerId);
        hold.startedAt = null;
        if (hold.pointers.size === 0) holds.delete(ci);
      }
    }
  }

  function onUp(ev) { release(ev.pointerId); }

  // pointercancel: 전화·알림이 오면 터치가 취소된다.
  // 여기서 안 풀면 대기 상태가 유령처럼 남는다.
  function onCancel(ev) {
    release(ev.pointerId);
    anim.pending.clear();
  }

  /** 매 프레임 호출 — 긴납선 게이지를 진행시키고 완성되면 emit */
  function tick() {
    const { puzzle } = getState();
    const now = performance.now();

    for (const [ci, hold] of [...holds.entries()]) {
      const coop = puzzle.coop[ci];
      if (!coop || coop.type !== 'long') continue;

      if (hold.startedAt === null) {
        // 되감김
        const cur = anim.gauge.get(ci) ?? 0;
        const next = Math.max(0, cur - 0.05);
        if (next === 0) anim.gauge.delete(ci); else anim.gauge.set(ci, next);
        continue;
      }

      const holdMs = coop.holdMs ?? 800;
      const g = Math.min(1, (now - hold.startedAt) / holdMs);
      anim.gauge.set(ci, g);

      if (g >= 1) {
        emit({
          type: 'toggleGroup',
          seams: coop.seams,
          ctx: { partners: hold.pointers.size, holdMs: now - hold.startedAt },
        });
        hold.startedAt = null;
        anim.gauge.delete(ci);
        holds.delete(ci);
      }
    }

    // 홀드가 끊긴 게이지도 되감는다
    for (const [ci, v] of [...anim.gauge.entries()]) {
      if (holds.has(ci)) continue;
      const next = Math.max(0, v - 0.05);
      if (next === 0) anim.gauge.delete(ci); else anim.gauge.set(ci, next);
    }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('lostpointercapture', onUp);

  return {
    anim,
    tick,
    reset() {
      active.clear(); seedHeldBy.clear(); holds.clear();
      anim.pending.clear(); anim.gauge.clear(); anim.unlocked.clear(); anim.winT = 0;
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('lostpointercapture', onUp);
    },
  };
}
