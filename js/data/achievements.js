/* ===================== 업적 · 칭호 =====================
 * 한 판 안에서 달성 가능한 것만 남긴다. 로그라이크라 장기 누적 업적은 의미가 없다.
 * (회차를 넘는 수집은 「기록」의 엔딩 도감이 맡는다) */

const ACHIEVEMENTS = [
  { id: 'first_blood', name: '첫 승리', desc: '전투에서 처음으로 이긴다.', check: (s) => s.statsTrack.combatWins >= 1, bonus: {} },
  { id: 'seasoned_duelist', name: '숙련된 결투사', desc: '한 판에서 10회 승리한다.', check: (s) => s.statsTrack.combatWins >= 10, bonus: { courage: 2 } },
  { id: 'second_spell', name: '견습을 넘어서', desc: '시작 주문 외의 주문을 익힌다.', check: (s) => Object.keys(s.spells).length >= 3, bonus: { intelligence: 1 } },
  { id: 'spellbound', name: '다재다능', desc: '주문을 여섯 개 이상 보유한다.', check: (s) => Object.keys(s.spells).length >= 6, bonus: { intelligence: 2 } },
  { id: 'grand_master', name: '통달', desc: '주문 하나를 숙련도 90까지 끌어올린다.', check: (s) => Object.values(s.spells).some((m) => m >= 90), bonus: { intelligence: 2 } },
  { id: 'rare_finder', name: '행운의 발견', desc: '진귀한 등급 이상 장비를 얻는다.', check: (s) => s.equipment.some((e) => rarityIndex(e.rarity) >= rarityIndex('rare')), bonus: { luck: 2 } },
  { id: 'legendary_finder', name: '전설의 손길', desc: '전설 등급 장비를 얻는다.', check: (s) => s.equipment.some((e) => e.rarity === 'legendary'), bonus: { luck: 3 } },
  { id: 'fully_equipped', name: '완전 무장', desc: '지팡이·로브·장신구를 모두 갖춘다.', check: (s) => !!(s.equipped.wand && s.equipped.robe && s.equipped.accessory), bonus: { atk: 1, def: 1 } },
  { id: 'ability_bearer', name: '손에 익은 것', desc: '어빌리티가 붙은 장비를 장착한다.', check: () => equippedAbilities().length >= 1, bonus: { luck: 1 } },

  { id: 'holder', name: '붙드는 자', desc: '이름을 세 번 붙든다.', check: (s) => (s.statsTrack.holds || 0) >= 3, bonus: { courage: 2 } },
  { id: 'keeper', name: '아직 다 읽을 수 있다', desc: '진행도 50을 넘도록 이름을 하나도 잃지 않는다.', check: (s) => s.progress >= 50 && heldCount() > 0 && Object.keys(s.register).every((id) => !PEOPLE[id].erodible || erosionOf(id) === 0), bonus: { charm: 2 } },
  { id: 'scribe', name: '옮겨 적는 자', desc: '이름 조각을 처음 확보한다.', check: () => fragmentCount() >= 1, bonus: { intelligence: 1 } },
  { id: 'half_name', name: '절반의 이름', desc: '이름 조각을 셋 이상 모은다.', check: () => fragmentCount() >= 3, bonus: { intelligence: 2 } },

  { id: 'dark_descent', name: '어둠의 발걸음', desc: '성향이 −50 이하로 떨어진다.', check: (s) => s.alignment <= -50, bonus: { atk: 2 } },
  { id: 'golden_boy', name: '황금의 손', desc: '갈레온을 300 이상 모은다.', check: (s) => s.gold >= 300, bonus: { luck: 1 } },
  { id: 'halfway', name: '절반', desc: '진행도 50에 닿는다.', check: (s) => s.progress >= 50, bonus: { courage: 1 } },
  { id: 'the_end_in_sight', name: '끝이 보인다', desc: '진행도 88에 닿는다.', check: (s) => s.progress >= 88, bonus: { courage: 2 } },
];

const TITLES = {
  novice_wizard: { id: 'novice_wizard', name: '견습 마법사', requiresAchievement: 'second_spell', bonus: { intelligence: 1 } },
  lucky_one: { id: 'lucky_one', name: '행운아', requiresAchievement: 'legendary_finder', bonus: { luck: 3 } },
  dark_child: { id: 'dark_child', name: '어둠의 아이', requiresAchievement: 'dark_descent', bonus: { atk: 3 } },
  the_holder: { id: 'the_holder', name: '놓지 않는 자', requiresAchievement: 'holder', bonus: { courage: 2 } },
  the_scribe: { id: 'the_scribe', name: '옮겨 적는 자', requiresAchievement: 'half_name', bonus: { intelligence: 2 } },
};
