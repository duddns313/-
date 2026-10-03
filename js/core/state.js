'use strict';
/* 사건 등록소 + 게임 상태 생성·저장 */

const EVENTS = {};
function defineEvents(list) {
  for (const ev of list) {
    if (EVENTS[ev.id]) throw new Error('중복된 사건 id: ' + ev.id);
    EVENTS[ev.id] = ev;
  }
}

const SAVE_KEY = 'hp7_save_v1';
const SAVE_VERSION = 1;

function newState() {
  return {
    v: SAVE_VERSION,
    year: 1,
    turn: 0,
    stage: 'prologue',        // prologue | travel | done
    house: null, wand: null, pet: null,
    stats: { courage: 2, wisdom: 2, diligence: 2, cunning: 2, magic: 1 },
    res: { hp: 100, heart: 70, galleon: 0, notice: 0, points: 0 },
    spells: [], items: {}, memories: [], cards: [],
    flags: {}, marks: {}, rel: {}, streaks: {},
    seen: [], later: [], queue: ['pro_letter'],
    log: [],
    screen: null,
  };
}

function saveGame(S) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 환경 */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    return S && S.v === SAVE_VERSION ? S : null;
  } catch (e) { return null; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
}
