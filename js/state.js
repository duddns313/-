/* ===================== 게임 상태 관리 ===================== */

const SAVE_KEY = 'hp_text_game_save_v1';

let state = null;

function newState(name, houseId) {
  const house = HOUSES[houseId];
  const base = {
    name,
    houseId,
    level: 1,
    exp: 0,
    expToNext: 30,
    hp: 60,
    maxHp: 60,
    mp: 20,
    maxMp: 20,
    baseAtk: 3,
    baseDef: 2,
    intelligence: 5,
    courage: 5,
    charm: 5,
    gold: 25,
    alignment: 0,
    location: 'commonRoom',
    day: 1,
    inventory: { woodenWand: 1, schoolRobe: 1, healPotion: 2 },
    equipped: { wand: 'woodenWand', robe: 'schoolRobe' },
    spells: ['lumos', 'expelliarmus'],
    flags: {},
    log: [],
    mode: 'explore', // explore | combat | ending
    combat: null,
  };
  // 기숙사 보너스 적용
  base.maxHp += house.bonus.hp || 0;
  base.hp = base.maxHp;
  base.maxMp += house.bonus.maxMp || 0;
  base.mp = base.maxMp;
  base.courage += house.bonus.courage || 0;
  base.baseAtk += house.bonus.atk || 0;
  base.baseDef += house.bonus.def || 0;
  base.intelligence += house.bonus.intelligence || 0;
  base.charm += house.bonus.charm || 0;
  return base;
}

function getAtk() {
  const wand = state.equipped.wand ? ITEMS[state.equipped.wand] : null;
  return state.baseAtk + (wand ? wand.atk : 0) + Math.floor(state.level / 2);
}

function getDef() {
  const robe = state.equipped.robe ? ITEMS[state.equipped.robe] : null;
  return state.baseDef + (robe ? robe.def : 0);
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    state = JSON.parse(raw);
    return true;
  } catch (e) {
    return false;
  }
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}
