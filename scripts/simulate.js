/* ===================== 밸런스 시뮬레이터 =====================
 * 헤드리스 브라우저에서 실제 게임 코드를 그대로 실행해, 휴리스틱 AI로
 * 여러 회차를 자동 플레이하고 통계를 수집한다. (개발 도구 — 게임 번들에는 포함되지 않음)
 *
 * 사용법: node scripts/simulate.js [실행횟수] [행동상한]
 *   node scripts/simulate.js 20 600
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const RUNS = parseInt(process.argv[2] || '20', 10);
const ACTION_CAP = parseInt(process.argv[3] || '600', 10);
const HOUSES = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];

/* 정적 파일 서버 (별도 의존성 없이 순수 Node http로 구현) */
function serveStatic(root, port) {
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  };
  const server = http.createServer((req, res) => {
    let filePath = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

/* 브라우저 컨텍스트 안에서 실행되는 AI 플레이 루프 */
function runSimulationInBrowser(houseId, actionCap) {
  /* eslint-disable no-undef */
  state = newState('시뮬레이터', houseId);
  let actions = 0;
  const rotation = ['commonRoom', 'library', 'classroom', 'corridors', 'forbiddenForest', 'corridors', 'hogsmeade', 'headmasterOffice'];
  let rotIdx = 0;
  let visitCounter = 0;
  let lastLoc = null;
  const milestones = {};
  const mark = (key) => { if (milestones[key] == null) milestones[key] = state.day; };

  /* 장비 감정·교체·강화는 턴을 소모하지 않는 관리 행동으로 취급해 매 틱 우선 처리한다 */
  function doMaintenance() {
    for (let i = 0; i < 10; i += 1) {
      const unidentified = state.equipment.find((e) => !e.identified);
      if (unidentified) { identifyInstance(unidentified.uid); continue; }

      let changed = false;
      ['wand', 'robe', 'accessory'].forEach((slot) => {
        const current = getEquippedInstance(slot);
        const currentScore = current ? EQUIP_TEMPLATES[current.baseId].tier * 10 + current.enhanceLevel : -1;
        const better = state.equipment
          .filter((e) => e.slot === slot && e.identified && (!current || e.uid !== current.uid))
          .sort((a, b) => (EQUIP_TEMPLATES[b.baseId].tier * 10 + b.enhanceLevel) - (EQUIP_TEMPLATES[a.baseId].tier * 10 + a.enhanceLevel))[0];
        if (better && (EQUIP_TEMPLATES[better.baseId].tier * 10 + better.enhanceLevel) > currentScore) {
          equipInstance(better.uid);
          changed = true;
        }
      });
      if (changed) continue;

      const equippedList = ['wand', 'robe', 'accessory'].map((s) => getEquippedInstance(s)).filter(Boolean);
      const enhanceTarget = equippedList.sort((a, b) => a.enhanceLevel - b.enhanceLevel)[0];
      if (enhanceTarget && enhanceTarget.enhanceLevel < 6) {
        const cost = enhanceCost(enhanceTarget.enhanceLevel);
        if ((state.itemStacks.magicStone || 0) >= cost.stones && state.gold >= cost.gold + 50) {
          enhanceInstance(enhanceTarget.uid);
          continue;
        }
      }
      break;
    }
  }

  while (state.mode !== 'ending' && actions < actionCap) {
    actions += 1;
    if (state.location !== lastLoc) { lastLoc = state.location; visitCounter = 0; }
    if (state.mode !== 'combat') doMaintenance();

    if (state.mode === 'combat') {
      const c = state.combat;
      const enemy = ENEMIES[c.enemyId];
      const hpRatio = state.hp / getMaxHp();
      if (hpRatio < 0.25 && !enemy.boss) {
        combatFlee();
        continue;
      }
      if (hpRatio < 0.4) {
        const healId = Object.keys(state.itemStacks).find((id) => ITEMS[id].type === 'potion' && ITEMS[id].effect && ITEMS[id].effect.hp);
        if (healId) { combatUseItem(healId); continue; }
      }
      const castable = Object.keys(state.spells)
        .map((id) => ({ id, sp: SPELLS[id], cast: getSpellCastInfo(id) }))
        .filter((x) => x.sp.type === 'attack' && x.cast.mpCost <= state.mp);
      if (castable.length) {
        castable.sort((a, b) => b.cast.power - a.cast.power);
        combatCastSpell(castable[0].id);
      } else {
        combatDefend();
      }
      continue;
    }

    if (state.mode === 'event') {
      const ev = state.pendingEvent;
      let bestIdx = 0;
      let bestScore = -1;
      ev.choices.forEach((c, idx) => {
        if (c.requiresGold && state.gold < c.requiresGold) return;
        const score = c.check ? getCheckRate(c.check.stat, c.check.dc) : 1;
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      });
      resolveEventChoice(bestIdx);
      continue;
    }

    if (state.mode === 'story') {
      resolveChapterChoice(0);
      if (state.flags.ch1_done) mark('ch1_done');
      if (state.flags.ch2_done) mark('ch2_done');
      if (state.flags.ch3_done) mark('ch3_done');
      continue;
    }

    if (state.mode === 'shop') {
      const loc = LOCATIONS[state.location];
      if (loc.shop === 'honeydukes') {
        if ((state.itemStacks.healPotion || 0) < 5 && state.gold >= ITEMS.healPotion.price) buyItem('healPotion');
        else if ((state.itemStacks.manaPotion || 0) < 3 && state.gold >= ITEMS.manaPotion.price) buyItem('manaPotion');
        travelTo('hogsmeade');
        continue;
      }
      if (loc.shop === 'ollivanders') {
        const shop = SHOPS.ollivanders;
        const slot = ['wand', 'robe', 'accessory'].sort((a, b) => {
          const ea = getEquippedInstance(a);
          const eb = getEquippedInstance(b);
          return (ea ? EQUIP_TEMPLATES[ea.baseId].tier : -1) - (eb ? EQUIP_TEMPLATES[eb.baseId].tier : -1);
        })[0];
        const gearCandidates = shop.equipment
          .filter((id) => EQUIP_TEMPLATES[id].slot === slot && EQUIP_TEMPLATES[id].price <= state.gold)
          .sort((a, b) => EQUIP_TEMPLATES[b].tier - EQUIP_TEMPLATES[a].tier);
        if (gearCandidates.length && state.gold > EQUIP_TEMPLATES[gearCandidates[0]].price + 40) {
          buyEquipment(gearCandidates[0]);
        } else if (state.gold >= WAND_GACHA_COST + 120) {
          const coreIds = Object.keys(WAND_CORES);
          doWandGacha(coreIds[Math.floor(Math.random() * coreIds.length)]);
        } else if ((state.itemStacks.magicStone || 0) < 5 && state.gold >= ITEMS.magicStone.price) {
          buyItem('magicStone');
        } else {
          const scrolls = shop.items.filter((id) => ITEMS[id].type === 'scroll' && ITEMS[id].price > 0 && ITEMS[id].price <= state.gold);
          if (scrolls.length) buyItem(scrolls[Math.floor(Math.random() * scrolls.length)]);
        }
        travelTo('hogsmeade');
        continue;
      }
      travelTo('hogsmeade');
      continue;
    }

    // explore 모드
    const loc = LOCATIONS[state.location];
    if (loc.tag === 'chamber') {
      if (state.flags.riddle_defeated && !state.flags.ch3_done) { travelTo('headmasterOffice'); continue; }
      if (state.flags.chamber_unlocked) enterChamber();
      else travelTo(rotation[(rotIdx += 1) % rotation.length]);
      continue;
    }
    // 비밀의 방이 열려 있으면 다른 볼일보다 우선해서 스토리를 진행한다 (실제 플레이어의 목표 지향적 행동을 반영)
    if (state.flags.chamber_unlocked && !state.flags.voldemort_defeated && loc.tag !== 'shop') {
      if (state.flags.riddle_defeated && !state.flags.ch3_done) {
        if (state.location !== 'headmasterOffice') { travelTo('headmasterOffice'); continue; }
      } else if (state.hp / getMaxHp() > 0.7) {
        travelTo('chamberOfSecrets');
        continue;
      }
    }
    if (state.hp / getMaxHp() < 0.6 && loc.tag === 'safe') { rest(); continue; }
    if (loc.tag === 'quest') {
      if (getAvailableChapter()) { enterHeadmasterOffice(); continue; }
      travelTo(rotation[(rotIdx += 1) % rotation.length]);
      continue;
    }
    if (loc.tag === 'training') {
      const target = Object.keys(SUBJECTS).find((sid) => (state.classProgress[sid] || 0) < 100 && nextSpellForSubject(sid));
      if (target) attendClass(target);
      else travelTo(rotation[(rotIdx += 1) % rotation.length]);
      continue;
    }
    if (loc.tag === 'safe') {
      travelTo(rotation[(rotIdx += 1) % rotation.length]);
      continue;
    }
    if (loc.tag === 'village') {
      const healCount = state.itemStacks.healPotion || 0;
      if (healCount < 3 && state.gold >= ITEMS.healPotion.price * 2) { travelTo('honeydukes'); continue; }
      if (state.gold > 200) { travelTo('ollivanders'); continue; }
      if (visitCounter >= 2) { travelTo(rotation[(rotIdx += 1) % rotation.length]); visitCounter = 0; continue; }
      visitCounter += 1;
      explore();
      continue;
    }

    // corridor/forest/library: 같은 곳에서 3번 넘게 탐험했으면 다음 로테이션으로 이동
    if (visitCounter >= 3) {
      travelTo(rotation[(rotIdx += 1) % rotation.length]);
      visitCounter = 0;
      continue;
    }
    visitCounter += 1;
    explore();
  }

  return {
    actions, day: state.day, level: state.level, mode: state.mode,
    endingId: state.ending ? state.ending.id : null,
    alignment: state.alignment, gold: state.gold,
    milestones,
    achievements: Object.keys(state.achievements).length,
    combatWins: state.statsTrack.combatWins || 0,
    combatLosses: state.statsTrack.combatLosses || 0,
    fleeSuccess: state.statsTrack.fleeSuccess || 0,
    equipmentRarities: state.equipment.map((e) => e.rarity),
    companions: { ...state.companions },
    spellsLearned: Object.keys(state.spells).length,
    riddleDefeated: !!state.flags.riddle_defeated,
    voldemortDefeated: !!state.flags.voldemort_defeated,
  };
  /* eslint-enable no-undef */
}

async function main() {
  const root = path.join(__dirname, '..');
  const port = 8935;
  const server = await serveStatic(root, port);
  console.log(`정적 서버 시작: http://localhost:${port}`);

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const results = [];
  const runErrors = [];

  for (let i = 0; i < RUNS; i += 1) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => runErrors.push(`run${i}: ${e.message}`));
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForSelector('#house-select .house-card');
    const houseId = HOUSES[i % HOUSES.length];
    const result = await page.evaluate(
      ({ hid, cap, fnBody }) => {
        // eslint-disable-next-line no-new-func
        const fn = new Function('houseId', 'actionCap', fnBody);
        return fn(hid, cap);
      },
      { hid: houseId, cap: ACTION_CAP, fnBody: `return (${runSimulationInBrowser.toString()})(houseId, actionCap);` },
    );
    result.houseId = houseId;
    results.push(result);
    process.stdout.write(`.`);
    await page.close();
  }
  console.log(`\n${RUNS}회 시뮬레이션 완료.`);

  await browser.close();
  server.close();

  fs.writeFileSync(path.join(__dirname, 'simulation_raw.json'), JSON.stringify({ results, runErrors }, null, 2));
  console.log('원본 데이터 저장: scripts/simulation_raw.json');
  if (runErrors.length) console.log('런타임 에러:', runErrors);

  printSummary(results);
}

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function printSummary(results) {
  const completed = results.filter((r) => r.mode === 'ending');
  const incomplete = results.filter((r) => r.mode !== 'ending');

  console.log('\n=== 요약 ===');
  console.log(`완결: ${completed.length}/${results.length} (${incomplete.length}건은 행동 상한 도달)`);
  console.log(`평균 완결 소요일: ${avg(completed.map((r) => r.day)).toFixed(1)}일 (중앙값 ${median(completed.map((r) => r.day))}일)`);
  console.log(`평균 최종 레벨: ${avg(results.map((r) => r.level)).toFixed(1)} (완결자 평균 ${avg(completed.map((r) => r.level)).toFixed(1)})`);
  console.log(`평균 전투 승/패: ${avg(results.map((r) => r.combatWins)).toFixed(1)} / ${avg(results.map((r) => r.combatLosses)).toFixed(1)}`);
  console.log(`평균 도주 성공: ${avg(results.map((r) => r.fleeSuccess)).toFixed(1)}`);
  console.log(`평균 최종 골드: ${avg(results.map((r) => r.gold)).toFixed(0)} G`);
  console.log(`평균 습득 주문 수: ${avg(results.map((r) => r.spellsLearned)).toFixed(1)}`);
  console.log(`평균 업적 수: ${avg(results.map((r) => r.achievements)).toFixed(1)}`);

  const endingCounts = {};
  completed.forEach((r) => { endingCounts[r.endingId] = (endingCounts[r.endingId] || 0) + 1; });
  console.log('엔딩 분포:', JSON.stringify(endingCounts));

  const riddleWinRate = results.filter((r) => r.riddleDefeated).length / results.length;
  const voldemortWinRate = results.filter((r) => r.voldemortDefeated).length / results.length;
  console.log(`톰 리들 환영 처치율: ${(riddleWinRate * 100).toFixed(0)}%`);
  console.log(`볼드모트 잔영 처치율(=클리어율): ${(voldemortWinRate * 100).toFixed(0)}%`);

  const rarityCounts = {};
  results.forEach((r) => r.equipmentRarities.forEach((rar) => { rarityCounts[rar] = (rarityCounts[rar] || 0) + 1; }));
  console.log('전체 장비 등급 분포:', JSON.stringify(rarityCounts));

  const ch1Days = completed.map((r) => r.milestones.ch1_done).filter((v) => v != null);
  const ch2Days = completed.map((r) => r.milestones.ch2_done).filter((v) => v != null);
  const ch3Days = completed.map((r) => r.milestones.ch3_done).filter((v) => v != null);
  console.log(`1장 완료 평균일: ${avg(ch1Days).toFixed(1)}, 2장: ${avg(ch2Days).toFixed(1)}, 3장: ${avg(ch3Days).toFixed(1)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
