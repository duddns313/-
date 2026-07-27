/* ===================== 게임 상태 관리 ===================== */

const SAVE_KEY = 'hp_text_game_save_v2';
const OLD_SAVE_KEYS = ['hp_text_game_save_v1'];
const CURRENT_SAVE_VERSION = 2;

let state = null;

function newState(name, houseId) {
  const house = HOUSES[houseId];
  const base = {
    saveVersion: CURRENT_SAVE_VERSION,
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
    stats: { intelligence: 5, courage: 5, charm: 5, agility: 5, luck: 5 },
    gold: 30,
    alignment: 0,
    location: 'commonRoom',
    day: 1,
    itemStacks: { healPotion: 2 },
    equipment: [],
    equipped: { wand: null, robe: null, accessory: null },
    itemCounter: 0,
    spells: { lumos: 40, expelliarmus: 20 },
    classProgress: {},
    seenEnemies: {},
    flags: {},
    log: [],
    mode: 'explore',
    combat: null,
    pendingEvent: null,
    pendingChapter: null,
    ending: null,
    activeTab: 'adventure',
  };

  base.maxHp += house.bonus.hp || 0;
  base.hp = base.maxHp;
  base.maxMp += house.bonus.maxMp || 0;
  base.mp = base.maxMp;
  base.stats.courage += house.bonus.courage || 0;
  base.baseAtk += house.bonus.atk || 0;
  base.baseDef += house.bonus.def || 0;
  base.stats.intelligence += house.bonus.intelligence || 0;
  base.stats.charm += house.bonus.charm || 0;
  base.stats.agility += house.bonus.agility || 0;
  base.stats.luck += house.bonus.luck || 0;

  state = base; // createEquipInstance/nextItemUid operate on the global `state`
  const wand = createEquipInstance('woodenWand', 'common');
  const robe = createEquipInstance('schoolRobe', 'common');
  base.equipment.push(wand, robe);
  base.equipped.wand = wand.uid;
  base.equipped.robe = robe.uid;

  return base;
}

function getAtk() { return state.baseAtk + getEquippedTotal('atk') + Math.floor(state.level / 2); }
function getDef() { return state.baseDef + getEquippedTotal('def'); }
function getMaxHp() { return state.maxHp + getEquippedTotal('maxHp'); }
function getMaxMp() { return state.maxMp + getEquippedTotal('maxMp'); }

function clampVitals() {
  state.hp = clamp(state.hp, 0, getMaxHp());
  state.mp = clamp(state.mp, 0, getMaxMp());
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

/* v1(구버전) 세이브는 인벤토리·주문·능력치 구조가 근본적으로 달라 안전한 자동 이관이 불가능하다.
 * 발견 시 명확히 알리고 정리한다. v2 이후부터는 saveVersion 기반으로 점진적 이관을 지원한다. */
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ok: false, incompatible: false };
    const parsed = JSON.parse(raw);
    if (!parsed.saveVersion || parsed.saveVersion < CURRENT_SAVE_VERSION) {
      return { ok: false, incompatible: true };
    }
    state = parsed;
    return { ok: true };
  } catch (e) {
    return { ok: false, incompatible: false };
  }
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

function hasIncompatibleSave() {
  if (localStorage.getItem(SAVE_KEY)) {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!parsed.saveVersion || parsed.saveVersion < CURRENT_SAVE_VERSION) return true;
    } catch (e) { return true; }
  }
  return OLD_SAVE_KEYS.some((k) => !!localStorage.getItem(k));
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  OLD_SAVE_KEYS.forEach((k) => localStorage.removeItem(k));
}
