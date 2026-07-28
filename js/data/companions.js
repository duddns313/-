/* ===================== 동료 데이터 ===================== */
/* 2022년 기준 6학년. 상세는 docs/STORY_PLOT.md §2-1 */

const COMPANIONS = {
  albus:    { id: 'albus',    name: '알버스',   desc: '조용하고 생각이 많은 친구', favorStat: 'courage',      giftSlot: 'accessory', giftTemplate: 'silverCharm' },
  rose:     { id: 'rose',     name: '로즈',     desc: '빠르고 정확한 친구',       favorStat: 'intelligence', giftSlot: 'accessory', giftTemplate: 'manaRing' },
  scorpius: { id: 'scorpius', name: '스콜피우스', desc: '지나치게 다정한 친구',    favorStat: 'charm',        giftSlot: 'accessory', giftTemplate: 'rabbitFoot' },
  edith:    { id: 'edith',    name: '이디스',   desc: '모든 것을 적어두는 친구',   favorStat: 'luck',         giftSlot: 'accessory', giftTemplate: 'rabbitFoot' },
};

function companionStatusLabel(affinity) {
  if (affinity >= 90) return '절친';
  if (affinity >= 60) return '각별함';
  if (affinity >= 30) return '친밀함';
  if (affinity > 0) return '아는 사이';
  return '초면';
}
