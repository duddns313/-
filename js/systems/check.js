/* ===================== 능력 판정 시스템 =====================
 * 모든 의미 있는 선택에 성공률을 부여하고, 누르기 전에 보여준다.
 *
 * 계수 근거 (ADVENTURE_PLAN §4):
 *   로그라이크는 한 판이 짧아 스탯 성장 폭이 작다. 그래서 기저값을 낮추고
 *   (58→50) 스탯 1점의 체감을 키웠다(×4→×5). 행운은 전 판정에 붙는 만큼
 *   과중했던 계수를 낮췄다(0.6→0.4). */

const CHECK_BASE = 50;
const CHECK_STAT_WEIGHT = 5;
const CHECK_LUCK_WEIGHT = 0.4;

/* 이 다섯 개 밖의 DC는 쓰지 않는다 — 난이도 체감을 일정하게 유지하기 위함 */
const DC_TIERS = {
  4: '쉬움',
  8: '보통',
  12: '어려움',
  16: '매우 어려움',
  20: '지독함',
};

function getStatValue(statKey) {
  const base = (state.stats && state.stats[statKey]) || 0;
  const gear = typeof getEquippedTotal === 'function' ? (getEquippedTotal(statKey) || 0) : 0;
  return base + gear;
}

function luckBonus() {
  return Math.floor(getStatValue('luck') * CHECK_LUCK_WEIGHT);
}

/* 판정에 붙는 상황 보정을 모은다 (ADVENTURE_PLAN §4-3).
 * check.about: 이 판정이 누구에 관한 것인가 — 붙들고 있는 이름이면 더 잘 붙는다. */
function situationalBonus(check) {
  let bonus = 0;
  if (!check) return 0;

  if (check.about) {
    if (typeof erosionOf === 'function' && state.register[check.about] && erosionOf(check.about) === 0) bonus += 10;
    if (typeof ledgerHasName === 'function' && ledgerHasName(check.about)) bonus += 5;
  }
  /* 상위 특성 「이음매를 읽는 눈」 — 조사 계열 판정 전부 */
  if (check.search && typeof hasTrait === 'function' && hasTrait('keenEye2')) bonus += 8;
  /* 상위 특성 「끈질김」 계열 — 붙들기 판정 */
  if (check.hold && typeof hasTrait === 'function') {
    if (hasTrait('tenacious')) bonus += 10;
    if (hasTrait('tenacious2')) bonus += 10;
  }
  return bonus;
}

/* 성공률만 계산 (굴리지 않음) — 버튼에 미리 표시할 때 사용 */
function getCheckRate(statKey, dc, bonusPercent, check) {
  const stat = getStatValue(statKey);
  const bonus = (bonusPercent || 0) + situationalBonus(check);
  return clamp(CHECK_BASE + (stat - dc) * CHECK_STAT_WEIGHT + luckBonus() + bonus, 5, 95);
}

/* 실제 판정 굴림. tier: critical(대성공) / success(성공) / fail(실패) / fumble(대실패) */
function skillCheck(statKey, dc, bonusPercent, check) {
  const rate = getCheckRate(statKey, dc, bonusPercent, check);
  const roll = randInt(1, 100);
  const critLine = Math.max(1, Math.floor(rate * 0.12));
  const fumbleLine = 97; // 성공률과 무관하게 항상 존재하는 3% 리스크
  let tier;
  if (roll <= critLine) tier = 'critical';
  else if (roll <= rate) tier = 'success';
  else if (roll > fumbleLine) tier = 'fumble';
  else tier = 'fail';
  return { statKey, dc, rate, roll, tier };
}

const CHECK_TIER_LABEL = {
  critical: '대성공',
  success: '성공',
  fail: '실패',
  fumble: '대실패',
};

/* 경험치는 판정 성공과 전투 승리로만 얻는다 — 진행도(시간)와 경험치(실력)의 분리 (§5-1).
 * 계수는 시뮬레이션으로 맞췄다: 한 판 45턴에 Lv.8~10에 닿아야 한다. */
function checkExpReward(dc, tier) {
  if (tier === 'critical') return Math.round(dc * 4);
  if (tier === 'success') return Math.round(dc * 2);
  return 0;
}
