/* ===================== 판(run) 상태 관리 =====================
 *
 * 저장은 두 갈래다.
 *   hp_run_v10   — 지금 돌고 있는 판. 죽으면 지워진다.
 *   hp_ledger_v1 — 「기록」. 회차를 넘어 남는다 (systems/ledger.js)
 *
 * v10에서 허브·이동·시간대·마감을 버리고 진행도 단일 축으로 전환했다.
 * v11에서 전투를 사슬 편성에서 턴제로 되돌리며 state.chain을 없앴다.
 * 둘 다 구조가 근본적으로 달라 하위 호환을 끊는다. */

const FIXED_PLAYER_NAME = '윤영운';
const SAVE_KEY = 'hp_run_v13';
const OLD_SAVE_KEYS = ['hp_text_game_save_v1', 'hp_text_game_save_v2', 'hp_run_v10', 'hp_run_v11', 'hp_run_v12'];
const CURRENT_SAVE_VERSION = 13;
const MIN_COMPATIBLE_VERSION = 11;

let state = null;

function newRun(houseId, backgroundId, traitId, freeAlloc) {
  const house = HOUSES[houseId];
  const bg = BACKGROUNDS[backgroundId];

  const base = {
    saveVersion: CURRENT_SAVE_VERSION,
    name: FIXED_PLAYER_NAME,
    houseId,
    backgroundId,
    traits: [],

    level: 1,
    exp: 0,
    expToNext: expToNextFor(1),
    pendingPoints: 0,

    hp: 60, maxHp: 60,
    mp: 20, maxMp: 20,
    baseAtk: 3, baseDef: 2,
    stats: { intelligence: 5, courage: 5, charm: 5, agility: 5, luck: 5 },
    gold: 30,
    alignment: 0,

    /* ── 진행도 축 ── */
    progress: 0,
    turn: 0,
    sinceErosion: 0,
    sinceClass: 0,
    sinceCombat: 0,
    warnedAt: -1,

    /* ── 지금 보고 있는 인카운터 ── */
    encounterId: null,
    isBeat: false,
    phase: 'body',
    pendingGain: null,
    pendingChain: null,
    pendingDeepen: false,
    stageIndex: 0,
    episode: {},
    seenEncounters: {},
    recent: [],
    beatsDone: {},

    /* ── 명부 ── */
    register: {},
    lastSeen: {},

    /* 손에 익힌 주문 네 자리. 나머지는 수첩에 적혀 있다 (systems/spell.js) */
    spellSlots: [null, null, null, null],

    /* ── 소지품 · 주문 ── */
    itemStacks: { healPotion: 2 },
    equipment: [],
    equipped: { wand: null, robe: null, accessory: null },
    itemCounter: 0,
    spells: { lumos: 40, expelliarmus: 30 },

    /* ── 도감 · 기타 ── */
    seenEnemies: {},
    seenItemBases: {},
    achievements: {},
    titles: {},
    equippedTitle: null,
    statsTrack: { combatWins: 0, holds: 0 },
    flags: {},
    log: [],
    mode: 'run',
    ending: null,
    activeTab: 'adventure',
  };

  /* 기숙사 보너스 */
  base.maxHp += house.bonus.hp || 0;
  base.maxMp += house.bonus.maxMp || 0;
  base.baseAtk += house.bonus.atk || 0;
  base.baseDef += house.bonus.def || 0;
  ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => {
    base.stats[k] += house.bonus[k] || 0;
  });

  /* 배경 보너스 */
  if (bg && bg.bonus) {
    Object.keys(bg.bonus).forEach((k) => {
      if (k === 'maxHp') base.maxHp += bg.bonus[k];
      else if (k === 'maxMp') base.maxMp += bg.bonus[k];
      else if (base.stats[k] != null) base.stats[k] += bg.bonus[k];
    });
  }

  /* 편입생의 자유 분배 + 기록이 주는 시작 보너스 */
  if (freeAlloc) {
    Object.keys(freeAlloc).forEach((k) => { if (base.stats[k] != null) base.stats[k] += freeAlloc[k]; });
  }
  const ledgerBonus = ledgerStartingBonus();
  base.gold += ledgerBonus.gold;
  base.pendingPoints += ledgerBonus.points;

  base.hp = base.maxHp;
  base.mp = base.maxMp;

  state = base;

  /* 특성 (grantTrait이 state를 참조하므로 state 대입 이후에) */
  if (traitId) grantTrait(traitId);

  /* 시작 장비 */
  const wand = createEquipInstance('woodenWand', 'common');
  const robe = createEquipInstance('schoolRobe', 'common');
  base.equipment.push(wand, robe);
  base.equipped.wand = wand.uid;
  base.equipped.robe = robe.uid;

  /* 시작 명부 — 기록에 남은 이름은 한 단계 버틴다 */
  (bg ? bg.startRegister : []).forEach((id) => registerPerson(id));
  registerPerson('lavinia');

  return base;
}

/* 인카운터가 에피소드로 깊어지면서 판정 횟수 자체가 늘었다.
 * 곡선을 그대로 두면 한 판에 Lv.12까지 올라가 계획서(§7 Lv.8~10)를 벗어난다. */
function expToNextFor(level) {
  return 20 + (level - 1) * 21;
}

function getAtk() { return state.baseAtk + getEquippedTotal('atk'); }
function getDef() { return state.baseDef + getEquippedTotal('def'); }
function getMaxHp() { return state.maxHp + getEquippedTotal('maxHp'); }
function getMaxMp() { return state.maxMp + getEquippedTotal('maxMp'); }

function clampVitals() {
  state.hp = clamp(state.hp, 0, getMaxHp());
  state.mp = clamp(state.mp, 0, getMaxMp());
}

/* ---------------- 저장 ---------------- */

function saveGame() {
  if (!state) return false;
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
    if (!raw) return { ok: false, incompatible: false };
    const parsed = JSON.parse(raw);
    if (!parsed.saveVersion || parsed.saveVersion < MIN_COMPATIBLE_VERSION) {
      return { ok: false, incompatible: true };
    }
    state = parsed;
    return { ok: true };
  } catch (e) {
    return { ok: false, incompatible: false };
  }
}

function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

function hasIncompatibleSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.saveVersion || parsed.saveVersion < MIN_COMPATIBLE_VERSION) return true;
    } catch (e) { return true; }
  }
  return OLD_SAVE_KEYS.some((k) => !!localStorage.getItem(k));
}

/* 판만 지운다. 「기록」은 건드리지 않는다 — 그것이 이 게임의 진행도다. */
function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  OLD_SAVE_KEYS.forEach((k) => localStorage.removeItem(k));
}
