/* ===================== 적 데이터 (tier: 드랍 품질에 영향) ===================== */

const ENEMIES = {
  pixie: { id: 'pixie', name: '콘월 픽시', hp: 20, atk: 4, def: 1, exp: 8, gold: [2, 6], tier: 1 },
  flobberworm: { id: 'flobberworm', name: '성난 플러버웜', hp: 14, atk: 2, def: 0, exp: 4, gold: [1, 3], tier: 1 },
  boggart: { id: 'boggart', name: '보가트', hp: 34, atk: 8, def: 2, exp: 16, gold: [4, 10], tier: 1 },
  rivalStudent: { id: 'rivalStudent', name: '결투를 신청한 학생', hp: 30, atk: 7, def: 2, exp: 14, gold: [3, 9], tier: 1 },
  hinkypunk: { id: 'hinkypunk', name: '힝키펑크', hp: 24, atk: 6, def: 1, exp: 10, gold: [2, 7], tier: 1 },
  bowtruckle: { id: 'bowtruckle', name: '보우트러클', hp: 16, atk: 3, def: 2, exp: 6, gold: [1, 4], tier: 1 },
  troll: { id: 'troll', name: '산 트롤', hp: 65, atk: 13, def: 4, exp: 32, gold: [12, 22], tier: 2 },
  darkCreature: { id: 'darkCreature', name: '그림자 생명체', hp: 48, atk: 15, def: 3, exp: 28, gold: [8, 18], tier: 2 },
  dementor: { id: 'dementor', name: '디멘터', hp: 55, atk: 11, def: 6, exp: 36, gold: [0, 4], tier: 2, weakness: 'expectoPatronum' },
  acromantula: { id: 'acromantula', name: '아크로만툴라', hp: 72, atk: 17, def: 5, exp: 42, gold: [10, 26], tier: 3 },
  deathEater: { id: 'deathEater', name: '죽음을 먹는 자', hp: 80, atk: 19, def: 7, exp: 55, gold: [20, 40], tier: 3 },
  werewolfShade: { id: 'werewolfShade', name: '늑대인간의 그림자', hp: 85, atk: 20, def: 6, exp: 48, gold: [15, 30], tier: 3 },
  riddleShade: { id: 'riddleShade', name: '톰 리들의 환영', hp: 115, atk: 26, def: 10, exp: 90, gold: [25, 45], tier: 3, boss: true },
  basilisk: { id: 'basilisk', name: '바실리스크', hp: 150, atk: 28, def: 12, exp: 150, gold: [40, 70], tier: 4, boss: true },
  voldemortShadow: { id: 'voldemortShadow', name: '볼드모트의 잔영', hp: 195, atk: 36, def: 15, exp: 250, gold: [100, 200], tier: 4, boss: true, finalBoss: true },
};
