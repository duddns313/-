/* ===================== 동료 데이터 ===================== */

const COMPANIONS = {
  hermione: { id: 'hermione', name: '헤르미온느', desc: '지식을 사랑하는 친구', favorStat: 'intelligence', giftSlot: 'accessory', giftTemplate: 'manaRing' },
  ron: { id: 'ron', name: '론', desc: '의리 있는 친구', favorStat: 'courage', giftSlot: 'accessory', giftTemplate: 'silverCharm' },
  luna: { id: 'luna', name: '루나', desc: '남다른 시선을 가진 친구', favorStat: 'luck', giftSlot: 'accessory', giftTemplate: 'rabbitFoot' },
  neville: { id: 'neville', name: '네빌', desc: '성실하고 다정한 친구', favorStat: 'charm', giftSlot: 'accessory', giftTemplate: 'rabbitFoot' },
};

function companionStatusLabel(affinity) {
  if (affinity >= 90) return '절친';
  if (affinity >= 60) return '각별함';
  if (affinity >= 30) return '친밀함';
  if (affinity > 0) return '아는 사이';
  return '초면';
}
