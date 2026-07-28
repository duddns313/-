/* ===================== 능력 판정 시스템 ===================== */
/* 서울 2033 / 모험과 이야기류의 핵심: 모든 의미 있는 선택에 성공률을 부여한다. */

const CHECK_BASE = 45;

function getStatValue(statKey) {
  const base = (state.stats && state.stats[statKey]) || 0;
  const gear = typeof getEquippedTotal === 'function' ? (getEquippedTotal(statKey) || 0) : 0;
  return base + gear;
}

function luckBonus() {
  return Math.floor(getStatValue('luck') * 0.6);
}

/* dc(난이도)와 statKey로 성공률만 계산 (굴리지 않음) — 버튼에 미리 표시할 때 사용
 * bonusPercent: 기억(memory) 등으로 얻는 판정 보정을 성공률에 직접 더한다 */
function getCheckRate(statKey, dc, bonusPercent) {
  const stat = getStatValue(statKey);
  return clamp(CHECK_BASE + (stat - dc) * 4 + luckBonus() + (bonusPercent || 0), 5, 95);
}

/* 실제 판정 굴림. tier: critical(대성공) / success(성공) / fail(실패) / fumble(대실패) */
function skillCheck(statKey, dc, bonusPercent) {
  const rate = getCheckRate(statKey, dc, bonusPercent);
  const roll = randInt(1, 100);
  const critLine = Math.max(1, Math.floor(rate * 0.12));
  const fumbleLine = 97; // roll > 97 이면 무조건 대실패 (판정 성공률과 무관하게 항상 존재하는 리스크)
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
