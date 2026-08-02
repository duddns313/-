/* ===================== 출산 일정표 앱 =====================
 * 외부 라이브러리 없이 동작하는 정적 페이지.
 * 저장은 전부 localStorage (bs.dueDate / bs.mode / bs.checks).
 * ========================================================= */

const BS_MODE_INFO = {
  natural: {
    label: '자연분만',
    hospital: '병원 2박 3일',
    care: '산후조리원 14박 15일',
  },
  csection: {
    label: '제왕절개',
    hospital: '병원 5박 6일 (수술 전날 입원 포함 6박 7일)',
    care: '산후조리원 12박 13일',
  },
};

const LS = { date: 'bs.dueDate', mode: 'bs.mode', checks: 'bs.checks' };

const state = {
  dueDate: '',
  mode: 'natural',
  tab: 'timeline',
  checks: new Set(),
  open: {},          // cardId -> boolean
  openInit: false,   // 최초 렌더에서 기본 접힘 상태를 세팅했는지
  scrolled: false,
};

/* ---------- 저장소 ---------- */

function load() {
  try {
    state.dueDate = localStorage.getItem(LS.date) || '';
    const m = localStorage.getItem(LS.mode);
    if (m === 'natural' || m === 'csection') state.mode = m;
    const raw = localStorage.getItem(LS.checks);
    if (raw) state.checks = new Set(JSON.parse(raw));
  } catch (e) {
    /* 시크릿 모드 등에서 localStorage 접근 불가 — 기본값으로 진행 */
  }
}

function save(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ }
}

function saveChecks() {
  save(LS.checks, JSON.stringify([...state.checks]));
}

/* ---------- 날짜 유틸 ---------- */

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function parseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`;
}

/** 출산 예정일 대비 오늘의 오프셋. 예정일 미입력 시 null. */
function todayOffset() {
  const due = parseDate(state.dueDate);
  if (!due) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - due) / 86400000);
}

function dayLabel(offset) {
  if (offset === 0) return 'D-day';
  return offset < 0 ? `D-${-offset}` : `D+${offset}`;
}

function dayRangeLabel(from, to) {
  return from === to ? dayLabel(from) : `${dayLabel(from)} ~ ${dayLabel(to)}`;
}

function dateRangeLabel(from, to) {
  const due = parseDate(state.dueDate);
  if (!due) return '';
  const a = fmtDate(addDays(due, from));
  return from === to ? a : `${a} ~ ${fmtDate(addDays(due, to))}`;
}

/* ---------- HTML 유틸 ---------- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ---------- 타임테이블 ---------- */

function visibleCards() {
  return BS_TIMELINE.filter((c) => c.modes.indexOf(state.mode) !== -1);
}

function cardDays(card) {
  return card.days ? card.days[state.mode] : null;
}

function renderTimeline() {
  const list = document.getElementById('timeline-list');
  const cards = visibleCards();
  const tOff = todayOffset();
  let todayEl = null;

  list.innerHTML = '';

  cards.forEach((card) => {
    const days = cardDays(card);
    const phase = BS_PHASES[card.phase];

    let isToday = false;
    let isPast = false;
    if (days && tOff !== null) {
      isToday = tOff >= days[0] && tOff <= days[1];
      isPast = tOff > days[1];
    }
    if (state.open[card.id] === undefined) {
      state.open[card.id] = isToday ? true : !card.collapsed;
    }

    const open = state.open[card.id] !== false;

    const badges = [
      `<span class="badge badge-phase" data-phase="${esc(card.phase)}">${phase.icon} ${esc(phase.label)}</span>`,
    ];
    if (days) {
      badges.push(`<span class="badge badge-day">${esc(dayRangeLabel(days[0], days[1]))}</span>`);
      const dt = dateRangeLabel(days[0], days[1]);
      if (dt) badges.push(`<span class="badge badge-date">${esc(dt)}</span>`);
    } else {
      badges.push('<span class="badge badge-routine">매일 반복</span>');
    }
    if (isToday) badges.push('<span class="badge badge-today">● 오늘</span>');

    const rows = card.rows.map((r) => `
      <div class="tt-row">
        <div class="tt-time">${esc(r.time)}</div>
        <div class="tt-main">
          <div class="tt-what"><span class="who who-${esc(r.who)}">${esc(r.who)}</span>${esc(r.what)}</div>
          ${r.note ? `<p class="tt-note">${esc(r.note)}</p>` : ''}
        </div>
      </div>`).join('');

    const todos = (card.todos && card.todos.length)
      ? `<div class="todos"><h4>이 시기의 할 일</h4><ul>${card.todos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`
      : '';

    const node = el(`
      <article class="card${open ? ' open' : ''}${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}"
               data-phase="${esc(card.phase)}" data-card="${esc(card.id)}">
        <button type="button" class="card-head" aria-expanded="${open}">
          <div class="card-head-main">
            <div class="badges">${badges.join('')}</div>
            <div class="card-title">${esc(card.title)}</div>
            <p class="card-summary">${esc(card.summary)}</p>
          </div>
          <span class="chev">▼</span>
        </button>
        <div class="card-body${open ? '' : ' hidden'}">
          <div class="tt">${rows}</div>
          ${todos}
        </div>
      </article>`);

    list.appendChild(node);
    if (isToday && !todayEl) todayEl = node;
  });

  if (todayEl && !state.scrolled && state.tab === 'timeline') {
    state.scrolled = true;
    setTimeout(() => todayEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  }
}

/* ---------- 체크리스트 ---------- */

function allItems() {
  const out = [];
  BS_CHECKLIST.forEach((c) => c.groups.forEach((g) => g.items.forEach((i) => out.push(i))));
  return out;
}

function renderChecklist() {
  const list = document.getElementById('checklist-list');
  list.innerHTML = '';

  BS_CHECKLIST.forEach((card, idx) => {
    if (state.open[card.id] === undefined) state.open[card.id] = idx === 0;
    const open = state.open[card.id] !== false;

    const items = [];
    card.groups.forEach((g) => g.items.forEach((i) => items.push(i)));
    const done = items.filter((i) => state.checks.has(i.id)).length;

    const groups = card.groups.map((g) => `
      <div class="chk-group">
        <h4>${esc(g.name)}</h4>
        ${g.items.map((i) => {
          const checked = state.checks.has(i.id);
          return `
          <label class="chk-item${checked ? ' done' : ''}" data-item="${esc(i.id)}">
            <input type="checkbox" ${checked ? 'checked' : ''} />
            <span class="chk-text">
              <span class="chk-label">${esc(i.text)}</span>
              ${i.deadline ? `<span class="badge badge-deadline">${esc(i.deadline)}</span>` : ''}
              ${i.note ? `<p class="chk-note">${esc(i.note)}</p>` : ''}
            </span>
          </label>`;
        }).join('')}
      </div>`).join('');

    const node = el(`
      <article class="card${open ? ' open' : ''}" data-phase="prep" data-card="${esc(card.id)}">
        <button type="button" class="card-head" aria-expanded="${open}">
          <div class="card-head-main">
            <div class="badges">
              <span class="badge badge-day">${esc(card.when)}</span>
            </div>
            <div class="card-title">${esc(card.title)}</div>
            <p class="card-summary">${esc(card.desc)}</p>
          </div>
          <span class="card-count">${done} / ${items.length}</span>
          <span class="chev">▼</span>
        </button>
        <div class="card-body${open ? '' : ' hidden'}">${groups}</div>
      </article>`);

    list.appendChild(node);
  });

  renderProgress();
}

function renderProgress() {
  const items = allItems();
  const done = items.filter((i) => state.checks.has(i.id)).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  document.getElementById('progress-text').textContent = `${done} / ${items.length} (${pct}%)`;
  document.getElementById('progress-fill').style.width = pct + '%';
}

/* ---------- 안내 문구 ---------- */

function renderSpanNote() {
  const info = BS_MODE_INFO[state.mode];
  const home = BS_TIMELINE.find((c) => c.phase === 'home');
  const last = home && home.days ? home.days[state.mode][1] : 0;
  const total = last + 1;

  const due = parseDate(state.dueDate);
  const dateHint = due
    ? ` 예정일 ${fmtDate(due)} 기준으로 집에 오는 날은 <strong>${fmtDate(addDays(due, last))}</strong>입니다.`
    : ' 출산 예정일을 입력하면 모든 일정에 실제 날짜가 표시됩니다.';

  document.getElementById('span-note').innerHTML =
    `<strong>${esc(info.label)}</strong> 기준 — 출산 당일(D-day)부터 집에 오는 날(${dayLabel(last)})까지 ` +
    `<strong>총 ${total}일</strong>. ${esc(info.hospital)} + ${esc(info.care)}.${dateHint}`;
}

/* ---------- 전체 렌더 ---------- */

function render() {
  document.querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === state.tab);
  });
  document.getElementById('panel-timeline').classList.toggle('hidden', state.tab !== 'timeline');
  document.getElementById('panel-checklist').classList.toggle('hidden', state.tab !== 'checklist');
  document.getElementById('progress-wrap').classList.toggle('hidden', state.tab !== 'checklist');

  renderSpanNote();
  renderTimeline();
  renderChecklist();
}

/* ---------- 이벤트 ---------- */

function currentPanel() {
  return document.getElementById(state.tab === 'timeline' ? 'panel-timeline' : 'panel-checklist');
}

function setAllOpen(open) {
  currentPanel().querySelectorAll('.card').forEach((c) => {
    state.open[c.dataset.card] = open;
  });
  render();
}

function bind() {
  const dateInput = document.getElementById('due-date');
  dateInput.value = state.dueDate;

  dateInput.addEventListener('change', () => {
    state.dueDate = dateInput.value;
    save(LS.date, state.dueDate);
    state.scrolled = false;
    render();
  });

  document.getElementById('btn-clear-date').addEventListener('click', () => {
    state.dueDate = '';
    dateInput.value = '';
    save(LS.date, '');
    render();
  });

  document.querySelectorAll('.seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.mode = b.dataset.mode;
      save(LS.mode, state.mode);
      state.scrolled = false;
      render();
    });
  });

  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.tab = b.dataset.tab;
      render();
      window.scrollTo({ top: 0 });
    });
  });

  document.querySelectorAll('[data-action]').forEach((b) => {
    b.addEventListener('click', () => {
      const a = b.dataset.action;
      if (a === 'expand-all') setAllOpen(true);
      else if (a === 'collapse-all') setAllOpen(false);
      else if (a === 'print') window.print();
      else if (a === 'reset-checks') {
        if (confirm('체크한 항목을 모두 지울까요?')) {
          state.checks.clear();
          saveChecks();
          render();
        }
      }
    });
  });

  // 카드 접기/펼치기 (이벤트 위임)
  document.getElementById('main').addEventListener('click', (e) => {
    const head = e.target.closest('.card-head');
    if (!head) return;
    const card = head.closest('.card');
    const id = card.dataset.card;
    state.open[id] = !(state.open[id] !== false);
    card.classList.toggle('open', state.open[id]);
    card.querySelector('.card-body').classList.toggle('hidden', !state.open[id]);
    head.setAttribute('aria-expanded', String(state.open[id]));
  });

  // 체크박스 (이벤트 위임)
  document.getElementById('checklist-list').addEventListener('change', (e) => {
    const input = e.target;
    if (input.type !== 'checkbox') return;
    const label = input.closest('.chk-item');
    const id = label.dataset.item;
    if (input.checked) state.checks.add(id); else state.checks.delete(id);
    saveChecks();

    label.classList.toggle('done', input.checked);

    // 해당 카드의 카운트만 갱신 (전체 재렌더 없이 스크롤 위치 유지)
    const card = label.closest('.card');
    const data = BS_CHECKLIST.find((c) => c.id === card.dataset.card);
    if (data) {
      const items = [];
      data.groups.forEach((g) => g.items.forEach((i) => items.push(i)));
      const done = items.filter((i) => state.checks.has(i.id)).length;
      card.querySelector('.card-count').textContent = `${done} / ${items.length}`;
    }
    renderProgress();
  });
}

/* ---------- 시작 ---------- */

load();
bind();
render();
