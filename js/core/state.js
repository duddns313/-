'use strict';
/* 사건 등록소 + 게임 상태 생성·저장 */

const EVENTS = {};
function defineEvents(list) {
  for (const ev of list) {
    if (EVENTS[ev.id]) throw new Error('중복된 사건 id: ' + ev.id);
    EVENTS[ev.id] = ev;
  }
}

const SAVE_KEY = 'hp7_save_v9';
const SAVE_VERSION = 9;
const PROLOGUE_KEY = 'hp7_prologue_v9';

function newState() {
  return {
    v: SAVE_VERSION,
    year: 1,
    turn: 0,
    stage: 'prologue',        // prologue | travel | done
    house: null, wand: null, pet: null,
    /* ❤️ 체력 · 💭 정신력 (한도 5, 0이면 게임 오버) · ⭐ 평판 (1~5) · 🪙 갈레온 · 기숙사 점수(이야기 속에만) */
    res: { hp: 4, mind: 4, rep: 3, galleon: 0, points: 0 },
    rewinds: 0,
    knots: {},            // 운명의 매듭: id → tied | loose | cut
    spells: [], items: {}, memories: [], cards: [],
    flags: {}, marks: {}, rel: {}, visits: {},
    seen: [], later: [], queue: ['pro_1998'],
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
/* 프롤로그를 마친 상태 — 게임 오버 뒤 다시 할 때 건너뛰기용 */
function savePrologue(S) {
  try { localStorage.setItem(PROLOGUE_KEY, JSON.stringify(Object.assign({}, S, { screen: null }))); } catch (e) { /* 무시 */ }
}
function loadPrologue() {
  try {
    const raw = localStorage.getItem(PROLOGUE_KEY);
    const S = raw && JSON.parse(raw);
    return S && S.v === SAVE_VERSION ? S : null;
  } catch (e) { return null; }
}
