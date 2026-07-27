/* ===================== 업적 · 칭호 · 일일 과제 데이터 ===================== */

const ACHIEVEMENTS = [
  { id: 'first_blood', name: '첫 승리', desc: '전투에서 처음으로 승리한다.', check: (s) => s.statsTrack.combatWins >= 1, bonus: {} },
  { id: 'seasoned_duelist', name: '숙련된 결투사', desc: '전투에서 20회 승리한다.', check: (s) => s.statsTrack.combatWins >= 20, bonus: { courage: 2 } },
  { id: 'second_spell', name: '견습을 넘어서', desc: '시작 주문 외의 주문을 처음 습득한다.', check: (s) => Object.keys(s.spells).length >= 3, bonus: { intelligence: 1 } },
  { id: 'spellbound', name: '다재다능', desc: '주문을 5개 이상 동시에 보유한다.', check: (s) => Object.keys(s.spells).length >= 5, bonus: { intelligence: 2 } },
  { id: 'grand_master', name: '대마법사의 재능', desc: '어떤 주문이든 숙련도 90(통달)에 도달한다.', check: (s) => Object.values(s.spells).some((m) => m >= 90), bonus: { intelligence: 2, courage: 2 } },
  { id: 'rare_finder', name: '행운의 발견', desc: '진귀한 등급 이상 장비를 처음 얻는다.', check: (s) => s.equipment.some((e) => rarityIndex(e.rarity) >= rarityIndex('rare')), bonus: { luck: 2 } },
  { id: 'legendary_finder', name: '전설의 손길', desc: '전설 등급 장비를 얻는다.', check: (s) => s.equipment.some((e) => e.rarity === 'legendary'), bonus: { luck: 3 } },
  { id: 'master_smith', name: '대장장이의 벗', desc: '장비를 +10까지 강화한다.', check: (s) => s.equipment.some((e) => e.enhanceLevel >= 10), bonus: { luck: 2 } },
  { id: 'wand_chosen', name: '지팡이의 선택', desc: '지팡이 뽑기에서 지팡이가 당신을 선택하게 만든다.', check: (s) => (s.statsTrack.wandMatchCount || 0) >= 1, bonus: { luck: 2 } },
  { id: 'fully_equipped', name: '완전 무장', desc: '지팡이·로브·장신구를 모두 장착한다.', check: (s) => !!(s.equipped.wand && s.equipped.robe && s.equipped.accessory), bonus: { atk: 1, def: 1 } },
  { id: 'dark_descent', name: '어둠의 발걸음', desc: '성향이 -50 이하로 떨어진다.', check: (s) => s.alignment <= -50, bonus: { atk: 2 } },
  { id: 'light_bearer', name: '빛의 인도자', desc: '성향이 +50 이상 오른다.', check: (s) => s.alignment >= 50, bonus: { def: 2 } },
  { id: 'forest_ranger', name: '숲의 방랑자', desc: '금지된 숲을 5회 이상 탐험한다.', check: (s) => ((s.statsTrack.exploreByTag || {}).forest || 0) >= 5, bonus: { agility: 2 } },
  { id: 'bookworm', name: '책벌레', desc: '도서관에서 10회 이상 활동한다.', check: (s) => ((s.statsTrack.exploreByTag || {}).library || 0) >= 10, bonus: { intelligence: 2 } },
  { id: 'class_ace', name: '모범생', desc: '수업을 통해 주문을 3회 습득한다.', check: (s) => (s.statsTrack.classCompletions || 0) >= 3, bonus: { intelligence: 1, charm: 1 } },
  { id: 'clever_escape', name: '영리한 후퇴', desc: '전투에서 10회 도망친다.', check: (s) => (s.statsTrack.fleeSuccess || 0) >= 10, bonus: { agility: 2 } },
  { id: 'reformer', name: '다시 배우는 자', desc: '주문을 잊고 새로 배워본다.', check: (s) => (s.statsTrack.forgetCount || 0) >= 1, bonus: {} },
  { id: 'golden_boy', name: '황금의 손', desc: '갈레온을 500 이상 모은다.', check: (s) => s.gold >= 500, bonus: { luck: 1, charm: 1 } },
  { id: 'riddle_slayer', name: '환영을 물리친 자', desc: '톰 리들의 환영을 물리친다.', check: (s) => !!s.flags.riddle_defeated, bonus: { courage: 2 } },
  { id: 'shadow_slayer', name: '그림자를 물리친 자', desc: '볼드모트의 잔영을 물리치고 이야기를 완결한다.', check: (s) => !!s.flags.voldemort_defeated, bonus: { courage: 3, intelligence: 3, charm: 3, agility: 3, luck: 3 } },
  { id: 'collector', name: '수집가', desc: '서로 다른 소지품을 10종 이상 보유한다.', check: (s) => Object.keys(s.itemStacks).length >= 10, bonus: { luck: 1 } },
  { id: 'dark_scholar', name: '금서의 탐구자', desc: '금서 구역에서 위험한 지식을 얻는다.', check: (s) => (s.itemStacks.scrollSectumsempra || 0) > 0 || s.spells.sectumsempra != null, bonus: { intelligence: 1 } },
  { id: 'friend_of_all', name: '모두의 친구', desc: '동료 한 명 이상과 각별한 사이가 된다. (호감도 60 이상)', check: (s) => Object.values(s.companions || {}).some((v) => v >= 60), bonus: { charm: 2 } },
];

const TITLES = {
  novice_wizard: { id: 'novice_wizard', name: '견습 마법사', requiresAchievement: 'second_spell', bonus: { intelligence: 1 } },
  lucky_one: { id: 'lucky_one', name: '행운아', requiresAchievement: 'legendary_finder', bonus: { luck: 3 } },
  blacksmiths_friend: { id: 'blacksmiths_friend', name: '대장장이의 벗', requiresAchievement: 'master_smith', bonus: { luck: 2 } },
  dark_child: { id: 'dark_child', name: '어둠의 아이', requiresAchievement: 'dark_descent', bonus: { atk: 3 } },
  light_guardian: { id: 'light_guardian', name: '빛의 수호자', requiresAchievement: 'light_bearer', bonus: { def: 3 } },
  shadow_slayer_title: { id: 'shadow_slayer_title', name: '그림자를 물리친 자', requiresAchievement: 'shadow_slayer', bonus: { courage: 3, intelligence: 2 } },
};

/* 일일 과제 템플릿: track은 state.dailyCounters의 키와 대응한다 */
const DAILY_QUEST_TEMPLATES = [
  { id: 'explore3', label: '탐험 3회 하기', track: 'explore', target: 3, reward: { gold: 15, exp: 8 } },
  { id: 'classAttend', label: '수업 1회 참여하기', track: 'classAttend', target: 1, reward: { gold: 10, exp: 6 } },
  { id: 'combatWin', label: '전투에서 1회 승리하기', track: 'combatWin', target: 1, reward: { gold: 20, exp: 10 } },
  { id: 'shopBuy', label: '상점에서 물건 구매하기', track: 'shopBuy', target: 1, reward: { gold: 5, exp: 5 } },
  { id: 'spellCast5', label: '전투 중 주문 5회 시전하기', track: 'spellCast', target: 5, reward: { gold: 15, exp: 8 } },
];
