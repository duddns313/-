/* ===================== 게임 상태 관리 ===================== */

const FIXED_PLAYER_NAME = '윤영운';
const SAVE_KEY = 'hp_text_game_save_v2';
const OLD_SAVE_KEYS = ['hp_text_game_save_v1'];
const CURRENT_SAVE_VERSION = 4;
const MIN_COMPATIBLE_VERSION = 2; /* v1은 구조 자체가 달라 이관 불가. v2부터는 점진적 이관 지원. */

let state = null;
let pendingCarryOver = null; /* 새 게임+ 승계 데이터 (일시적, 저장되지 않음) */

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
    stamina: 100,
    maxStamina: 100,
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
    seenItemBases: {},
    achievements: {},
    titles: {},
    equippedTitle: null,
    statsTrack: { combatWins: 0, fleeSuccess: 0, exploreByTag: {}, classCompletions: 0, forgetCount: 0, wandMatchCount: 0 },
    dailyCounters: {},
    dailyQuests: [],
    dailyQuestDay: 0,
    ngPlusCount: 0,
    companions: {},
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

  if (pendingCarryOver) {
    applyCarryOver(base, pendingCarryOver);
    pendingCarryOver = null;
  }

  return base;
}

function applyCarryOver(target, carry) {
  target.achievements = { ...carry.achievements };
  target.titles = { ...carry.titles };
  target.seenEnemies = { ...carry.seenEnemies };
  target.seenItemBases = { ...carry.seenItemBases };
  target.ngPlusCount = (carry.ngPlusCount || 0);
  const achCount = Object.keys(target.achievements).length;
  const bonus = clamp(Math.floor(achCount / 5), 0, 5);
  if (bonus > 0) {
    ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => { target.stats[k] += bonus; });
  }
  target.gold += target.ngPlusCount * 10;
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

/* v1(구버전) 세이브는 인벤토리·주문·능력치 구조가 근본적으로 달라 안전한 자동 이관이 불가능해 호환 불가 처리한다.
 * v2 이후부터는 saveVersion을 비교해 누락된 필드를 기본값으로 채우는 점진적 이관을 지원한다. */
function migrateSave(parsed) {
  if (parsed.saveVersion === 2) {
    parsed.statsTrack = parsed.statsTrack || { combatWins: 0, fleeSuccess: 0, exploreByTag: {}, classCompletions: 0, forgetCount: 0, wandMatchCount: 0 };
    parsed.achievements = parsed.achievements || {};
    parsed.titles = parsed.titles || {};
    parsed.equippedTitle = parsed.equippedTitle || null;
    parsed.seenItemBases = parsed.seenItemBases || {};
    parsed.dailyCounters = parsed.dailyCounters || {};
    parsed.dailyQuests = parsed.dailyQuests || [];
    parsed.dailyQuestDay = parsed.dailyQuestDay || 0;
    parsed.ngPlusCount = parsed.ngPlusCount || 0;
    parsed.companions = parsed.companions || {};
    parsed.saveVersion = 3;
  }
  if (parsed.saveVersion === 3) {
    parsed.stamina = parsed.stamina != null ? parsed.stamina : 100;
    parsed.maxStamina = parsed.maxStamina || 100;
    parsed.saveVersion = 4;
  }
  return parsed;
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ok: false, incompatible: false };
    let parsed = JSON.parse(raw);
    if (!parsed.saveVersion || parsed.saveVersion < MIN_COMPATIBLE_VERSION) {
      return { ok: false, incompatible: true };
    }
    if (parsed.saveVersion < CURRENT_SAVE_VERSION) parsed = migrateSave(parsed);
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
      if (!parsed.saveVersion || parsed.saveVersion < MIN_COMPATIBLE_VERSION) return true;
    } catch (e) { return true; }
  }
  return OLD_SAVE_KEYS.some((k) => !!localStorage.getItem(k));
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  OLD_SAVE_KEYS.forEach((k) => localStorage.removeItem(k));
}
