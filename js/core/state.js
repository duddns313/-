'use strict';
/* 사건 등록소 + 게임 상태 생성·저장 */

const EVENTS = {};
function defineEvents(list) {
  for (const ev of list) {
    if (EVENTS[ev.id]) throw new Error('중복된 사건 id: ' + ev.id);
    EVENTS[ev.id] = ev;
  }
}

/* ── 저장소 — 이 기기의 브라우저 저장소 + (아티팩트에서) 나만 보는 클라우드 사본 ──
   브라우저 저장소는 앱을 닫거나 기기를 바꾸면 사라질 수 있다. 그래서 같은 내용을
   아티팩트의 개인 저장 공간(data/users/<나>/…)에도 남겨 두고, 켤 때 더 새 쪽을 가져온다. */
const Store = (() => {
  const mem = {};                                   // 브라우저 저장소를 못 쓰는 환경의 임시 보관
  const META = 'hp7_store_at';                     // 키마다 마지막으로 쓴 시각
  const CLOUD_IDS = { hp7_save_v9: 'auto', hp7_prologue_v9: 'prologue', hp7_slot_v9_1: 'slot1', hp7_slot_v9_2: 'slot2', hp7_slot_v9_3: 'slot3', hp7_chronicle: 'chronicle' };
  const cloud = { col: null, pending: {}, writing: {}, timer: {} };
  const lsGet = k => { try { const v = localStorage.getItem(k); return v != null ? v : (k in mem ? mem[k] : null); } catch (e) { return k in mem ? mem[k] : null; } };
  const lsSet = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* 메모리에만 */ } };
  const lsDel = k => { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } };
  const metaAll = () => { try { return JSON.parse(lsGet(META) || '{}') || {}; } catch (e) { return {}; } };
  const metaSet = (k, at) => { const m = metaAll(); if (at == null) delete m[k]; else m[k] = at; lsSet(META, JSON.stringify(m)); };

  function push(k, raw) {
    const id = CLOUD_IDS[k];
    if (!id || !cloud.col) return;
    cloud.pending[id] = { raw, at: metaAll()[k] || Date.now() };
    clearTimeout(cloud.timer[id]);
    cloud.timer[id] = setTimeout(() => flush(id), id === 'auto' ? 1500 : 200);
  }
  async function flush(id) {
    if (cloud.writing[id]) return;                   // 쓰는 중이면 끝난 뒤 다시 돈다
    cloud.writing[id] = true;
    try {
      while (cloud.pending[id]) {
        const { raw, at } = cloud.pending[id];
        delete cloud.pending[id];
        const ref = cloud.col.doc(id);
        try {
          if (raw == null) await ref.delete();
          else await ref.set({ json: raw, at });
        } catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); try { if (raw == null) await ref.delete(); else await ref.set({ json: raw, at }); } catch (e2) { /* 포기 — 다음 저장 때 다시 */ } } }
      }
    } finally { cloud.writing[id] = false; }
  }

  return {
    get: lsGet,
    set(k, raw) { lsSet(k, raw); metaSet(k, Date.now()); push(k, raw); },
    remove(k) { lsDel(k); metaSet(k, Date.now()); push(k, null); },
    /* 켤 때 한 번: 클라우드와 맞춘다. 무언가 새로 가져왔으면 onChanged() */
    async init(onChanged) {
      try {
        if (!window.claude || !window.claude.use) return false;
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return false;
        const uid = await user.id();
        if (!uid) return false;
        const col = db.collection('data/users/' + uid);
        const snap = await col.get();
        const meta = metaAll();
        const byId = {};
        snap.docs.forEach(d => { if (d.exists) byId[d.id] = d.data(); });
        let changed = false;
        cloud.col = col;
        for (const [k, id] of Object.entries(CLOUD_IDS)) {
          const remote = byId[id];
          const localAt = meta[k] || 0;
          const localRaw = lsGet(k);
          if (remote && typeof remote.json === 'string' && (remote.at || 0) > localAt) {
            lsSet(k, remote.json); metaSet(k, remote.at); changed = true;       // 클라우드가 더 새것
          } else if (localRaw != null && (!remote || localAt > (remote.at || 0))) {
            push(k, localRaw);                                                   // 이 기기가 더 새것
          }
        }
        if (changed && onChanged) onChanged();
        return true;
      } catch (e) { return false; }
    },
    get cloudReady() { return !!cloud.col; },
  };
})();

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
    knots: {},            // 갈림길: id → tied(바로잡음) | loose(겨우) | cut(어긋남)
    spells: [], items: {}, memories: [], cards: [],
    flags: {}, marks: {}, rel: {}, visits: {},
    seen: [], later: [], queue: ['pro_1998'],
    log: [],
    screen: null,
  };
}

function saveGame(S) {
  Store.set(SAVE_KEY, JSON.stringify(S));
}
function loadGame() {
  try {
    const raw = Store.get(SAVE_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    return S && S.v === SAVE_VERSION ? S : null;
  } catch (e) { return null; }
}
function clearSave() {
  Store.remove(SAVE_KEY);
}
/* 프롤로그를 마친 상태 — 게임 오버 뒤 다시 할 때 건너뛰기용 */
function savePrologue(S) {
  Store.set(PROLOGUE_KEY, JSON.stringify(Object.assign({}, S, { screen: null })));
}
function loadPrologue() {
  try {
    const raw = Store.get(PROLOGUE_KEY);
    const S = raw && JSON.parse(raw);
    return S && S.v === SAVE_VERSION ? S : null;
  } catch (e) { return null; }
}

/* 저장 칸 세 개 — 자동 저장(이어하기)과 따로 남는다. 게임 오버에도 지워지지 않는다. */
const SLOT_COUNT = 3;
const SLOT_KEY = n => `hp7_slot_v9_${n}`;
function saveSlot(n, S, label) {
  try {
    Store.set(SLOT_KEY(n), JSON.stringify({ at: Date.now(), label: label || '', state: S }));
    return true;
  } catch (e) { return false; }
}
function readSlot(n) {
  try {
    const raw = Store.get(SLOT_KEY(n));
    const d = raw && JSON.parse(raw);
    return d && d.state && d.state.v === SAVE_VERSION ? d : null;
  } catch (e) { return null; }
}
function loadSlot(n) { const d = readSlot(n); return d ? JSON.parse(JSON.stringify(d.state)) : null; }
function clearSlot(n) { Store.remove(SLOT_KEY(n)); }
function anySlot() { for (let n = 1; n <= SLOT_COUNT; n++) if (readSlot(n)) return true; return false; }

/* ── 학년 기록(연대기) — 버전이 바뀌어도 다음 학년으로 이어 가기 위한 것 ──
   게임 저장(SAVE_VERSION)은 업데이트마다 바뀔 수 있지만, 이 기록의 형식(f)은 오래 유지한다.
   학년이 끝나면 이 기기에 자동으로 보관되고, 코드(HP7-…)로 옮길 수도 있다. */
const CHRONICLE_KEY = 'hp7_chronicle';
const CHRONICLE_FORMAT = 1;
function makeChronicle(S) {
  const flags = Object.keys(S.flags || {}).filter(f => S.flags[f]);
  return {
    f: CHRONICLE_FORMAT, y: S.year, at: Date.now(),
    house: S.house, wand: S.wand, pet: S.pet,
    res: { hp: S.res.hp, mind: S.res.mind, rep: S.res.rep, galleon: S.res.galleon },
    knots: Object.assign({}, S.knots || {}),
    flags, memories: (S.memories || []).slice(), spells: (S.spells || []).slice(),
    items: Object.assign({}, S.items || {}), rel: Object.assign({}, S.rel || {}), cards: (S.cards || []).slice(),
    rewinds: S.rewinds || 0,
    ending: ['true', 'bent', 'broken'].find(e => S.flags && S.flags['ending_' + e]) || null,
  };
}
function readChronicles() {
  try { return JSON.parse(Store.get(CHRONICLE_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function saveChronicle(c) {
  try { const all = readChronicles(); all[c.y] = c; Store.set(CHRONICLE_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
}
function latestChronicle() {
  const all = readChronicles();
  const ys = Object.keys(all).map(Number).sort((a, b) => b - a);
  return ys.length ? all[ys[0]] : null;
}
/* 코드: HP7-<base64url JSON>-<검사값 4자리> */
function chronicleChecksum(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return (h % 65536).toString(16).padStart(4, '0'); }
function encodeChronicle(c) {
  const json = JSON.stringify(c);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `HP7-${b64}-${chronicleChecksum(b64)}`;
}
function decodeChronicle(code) {
  try {
    const m = String(code).replace(/\s+/g, '').match(/^HP7-([A-Za-z0-9_-]+)-([0-9a-f]{4})$/);
    if (!m || chronicleChecksum(m[1]) !== m[2]) return null;
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const c = JSON.parse(decodeURIComponent(escape(atob(b64))));
    return c && c.f && c.y ? c : null;
  } catch (e) { return null; }
}
/* 다음 학년의 시작 상태 — 2학년이 생기면 이 함수로 이어 받는다 */
function stateFromChronicle(c) {
  const S = newState();
  Object.assign(S, {
    year: c.y + 1, house: c.house, wand: c.wand, pet: c.pet,
    spells: (c.spells || []).slice(), memories: (c.memories || []).slice(), cards: (c.cards || []).slice(),
    items: Object.assign({}, c.items || {}), rel: Object.assign({}, c.rel || {}),
    prev: { knots: c.knots || {}, ending: c.ending, rewinds: c.rewinds },
    queue: [],
  });
  S.flags = {};
  for (const f of c.flags || []) S.flags[f] = true;
  S.res = { hp: 4, mind: 4, rep: c.res ? c.res.rep : 3, galleon: c.res ? c.res.galleon : 0, points: 0 };
  return S;
}
