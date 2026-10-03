'use strict';
/* 화면 그리기 — 상태(S.screen)를 읽어 그리기만 한다. 게임 규칙은 core/에 있다. */

const UI = (() => {
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = (t) => Rules.text(Game.state(), t);
  let lastRes = null;

  /* ───────── 타자기 ───────── */
  let typing = null;
  function tokens(par) {
    const out = [];
    par.split(/(\*[^*]+\*)/).forEach(part => {
      if (!part) return;
      const em = part.startsWith('*') && part.endsWith('*') && part.length > 2;
      const body = em ? part.slice(1, -1) : part;
      body.split('\n').forEach((line, i) => {
        if (i > 0) out.push({ br: true });
        if (line) out.push({ s: line, em });
      });
    });
    return out;
  }
  function paragraphs(text) { return String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean); }

  /* 문단을 하나씩 타자로 쳐서 container에 붙인다 */
  function typeInto(container, text, cls, done) {
    const pars = paragraphs(text);
    const delay = Settings.charDelay();
    const job = { skip: false, done: false };
    typing = job;
    const nodes = pars.map(p => {
      const pe = el('p', cls || null);
      container.appendChild(pe);
      return { pe, toks: tokens(p) };
    });
    const finish = () => {
      if (job.done) return;
      job.done = true;
      for (const n of nodes) if (!n.filled) fill(n, true);
      if (typing === job) typing = null;
      done && done();
    };
    function fill(n, all) {
      n.pe.innerHTML = '';
      for (const t of n.toks) {
        if (t.br) n.pe.appendChild(el('br'));
        else n.pe.appendChild(t.em ? el('em', null, esc(t.s)) : document.createTextNode(t.s));
      }
      n.filled = all;
      n.pe.classList.add('shown');
    }
    if (!delay) { finish(); return job; }
    let pi = 0;
    const nextPar = () => {
      if (job.skip) return finish();
      if (pi >= nodes.length) return finish();
      const n = nodes[pi++];
      n.pe.classList.add('shown');
      let ti = 0, ci = 0, cur = null;
      const step = () => {
        if (job.skip) return finish();
        if (ti >= n.toks.length) { n.filled = true; return setTimeout(nextPar, delay * 10); }
        const t = n.toks[ti];
        if (t.br) { n.pe.appendChild(el('br')); ti++; return step(); }
        if (!cur) { cur = t.em ? el('em') : document.createTextNode(''); n.pe.appendChild(cur); }
        const chunk = delay < 12 ? 3 : 1;
        const add = t.s.slice(ci, ci + chunk);
        if (t.em) cur.textContent += add; else cur.data += add;
        ci += chunk;
        if (ci >= t.s.length) { ti++; ci = 0; cur = null; }
        setTimeout(step, /[.!?…]$/.test(add) ? delay * 6 : delay);
      };
      step();
    };
    nextPar();
    return job;
  }
  function skipTyping() { if (typing && !typing.done) { typing.skip = true; return true; } return false; }

  /* ───────── 상단 ───────── */
  function renderTop() {
    const S = Game.state();
    $('#topbar').hidden = false;
    const h = HOUSES[S.house];
    const date = S.screen && S.screen.date ? S.screen.date : '';
    $('#dateline').innerHTML = `<span class="year">${S.year}학년</span><span class="date">${esc(date)}</span>${h ? `<span class="house" style="--house:${h.color}">${h.name}</span>` : ''}`;
    const r = S.res;
    const items = [
      ['hp', `${RESOURCES.hp.icon}`, r.hp], ['heart', RESOURCES.heart.icon, r.heart], ['galleon', RESOURCES.galleon.icon, r.galleon],
      ['notice', RESOURCES.notice.icon, r.notice], ['points', RESOURCES.points.icon, (r.points > 0 ? '+' : '') + r.points],
    ];
    const bar = $('#resbar');
    bar.innerHTML = items.map(([k, icon, v]) => {
      const changed = lastRes && lastRes[k] !== r[k] ? (r[k] > lastRes[k] ? (k === 'notice' ? 'down' : 'up') : (k === 'notice' ? 'up' : 'down')) : '';
      const low = (k === 'hp' || k === 'heart') && r[k] <= 25 ? ' low' : (k === 'notice' && r[k] >= 70 ? ' low' : '');
      return `<button class="res ${changed}${low}" data-res="${k}" aria-label="${RESOURCES[k].name} ${v}"><span>${icon}</span><b>${v}</b></button>`;
    }).join('');
    lastRes = Object.assign({}, r);
    const meBtn = document.querySelector('#dock button[data-sheet="me"]');
    if (meBtn) meBtn.classList.toggle('badge', S.statPoints > 0);
  }

  /* ───────── 장면 ───────── */
  function stage() { return $('#stage'); }
  function scrollToEl(node) {
    if (!node) return;
    const smooth = Settings.get('reduceMotion') ? 'auto' : 'smooth';
    const top = node.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: smooth });
  }

  function chipRow(chips) {
    if (!chips || !chips.length) return null;
    const row = el('div', 'chips');
    for (const c of chips) row.appendChild(el('span', `chip ${c.good ? 'good' : 'bad'}${c.big ? ' big' : ''}`, esc(c.t)));
    return row;
  }

  function renderEvent(animate) {
    const S = Game.state();
    const sc = S.screen;
    const ev = EVENTS[sc.id];
    const st = stage();
    let art = st.querySelector(`article[data-id="${sc.id}"]`);
    const fresh = !art || sc.stage === 'intro';
    if (fresh) {
      st.innerHTML = '';
      art = el('article', 'scene');
      art.dataset.id = sc.id;
      const head = el('div', 'scene-head', `<span>${esc(T(ev.place) || '')}</span>${sc.date ? `<span>${esc(sc.date)}</span>` : ''}`);
      art.appendChild(head);
      art.appendChild(el('h2', 'scene-title', esc(T(ev.title))));
      if (ev.recall && S.memories.includes(ev.recall.memory)) {
        art.appendChild(el('div', 'recall', `<span>💭</span><div><b>${esc(MEMORIES[ev.recall.memory].name)}</b>${esc(ev.recall.text)}</div>`));
      }
      const prose = el('div', 'prose');
      art.appendChild(prose);
      st.appendChild(art);
      const choicesBox = el('div', 'choices');
      st.appendChild(choicesBox);
      window.scrollTo({ top: 0 });
      const after = () => {
        const cr = chipRow(sc.stage === 'intro' ? sc.chips : null);
        if (cr) prose.after(cr);
        if (sc.stage === 'intro') renderChoices(choicesBox, ev);
        else appendResult(art, ev, false);
      };
      if (sc.stage === 'intro' && animate) typeInto(prose, T(ev.text), null, after);
      else { typeInto(prose, T(ev.text), null, null); skipTyping(); after(); }
    } else {
      appendResult(art, ev, animate);
    }
  }

  function choiceTag(S, c) {
    const key = Rules.statOf(S, c);
    if (key) return `<span class="tag">${STATS[key].icon} ${STATS[key].name}</span>`;
    return '';
  }

  function renderChoices(box, ev) {
    const S = Game.state();
    box.innerHTML = '';
    const vis = Game.visibleChoices(ev);
    if (!vis.length) { box.appendChild(continueButton()); return; }
    for (const { c, i } of vis) {
      const key = Rules.statOf(S, c);
      const chance = key ? Rules.chance(S, c) : null;
      const b = el('button', 'choice');
      const bon = key ? Rules.bonuses(S, c) : [];
      const opened = Rules.thanksFor(c.needs);
      if (opened.length) b.classList.add('opened');
      const nums = Settings.get('showNumbers');
      const voice = key ? innerVoice(S, ev.id, i, key, chance, bon) : null;
      const st = Rules.stakes(S, c);
      const helpers = bon.filter(x => x.value > 0);
      const burdens = bon.filter(x => x.value < 0);
      b.innerHTML = `${opened.length ? `<div class="opened-by">🔓 ${esc(opened.join(' · '))} 덕분에 열린 길</div>` : ''}<div class="choice-top">${choiceTag(S, c)}${nums && chance != null ? `<span class="pct ${chance >= 70 ? 'hi' : chance < 40 ? 'lo' : ''}">${chance}%</span>` : ''}</div>
        <div class="choice-label">${esc(T(c.label))}</div>
        ${voice ? `<div class="voice v-${voice.tier}">${esc(voice.text)}</div>` : ''}
        ${helpers.length || burdens.length ? `<div class="bonus">${helpers.map(x => `<span>${esc(x.label)}${nums ? ' +' + x.value : ''}</span>`).join('')}${burdens.map(x => `<span class="neg">${esc(x.label)}${nums ? ' ' + x.value : ''}</span>`).join('')}</div>` : ''}
        ${st.gain.length || st.risk.length ? `<div class="stakes">${st.gain.length ? `<span class="g">얻을 수 있는 것 ${esc(st.gain.join(' · '))}</span>` : ''}${st.risk.length ? `<span class="r">위험 ${esc(st.risk.join(' · '))}</span>` : ''}</div>` : ''}`;
      b.addEventListener('click', () => {
        if (skipTyping()) return;
        box.querySelectorAll('button').forEach(x => { x.disabled = true; });
        Game.choose(i);
        render(true);
      });
      box.appendChild(b);
    }
    for (const { c, need } of Game.lockedChoices(ev)) {
      const b = el('div', 'choice locked');
      b.innerHTML = `<div class="choice-top"><span class="tag lock">🔒 아직 갈 수 없는 길</span></div>
        <div class="choice-label">${esc(T(c.label))}</div>
        <div class="need">필요: ${esc(need.join(' · '))}${c.lockHint ? `<br><small>${esc(T(c.lockHint))}</small>` : ''}</div>`;
      box.appendChild(b);
    }
    if (!Settings.get('reduceMotion')) box.classList.add('appear');
  }

  function appendResult(art, ev, animate) {
    const S = Game.state();
    const sc = S.screen;
    const box = stage().querySelector('.choices');
    if (box) box.innerHTML = '';
    const c = ev.choices[sc.choice];
    const res = el('div', 'result');
    res.appendChild(el('div', 'picked', `<span>›</span> ${esc(T(c.label))}`));
    if (sc.grade) res.appendChild(el('div', `grade g-${sc.grade}`, `${Game.GRADE_NAME[sc.grade]}${Settings.get('showNumbers') ? ` <small>${sc.chance}%</small>` : ''}`));
    if (sc.thanks && sc.thanks.length) {
      const failed = sc.grade === 'fail' || sc.grade === 'fumble';
      const head = failed ? '<div class="th-head">힘을 보탰지만, 이번엔 닿지 않았다</div>' : '';
      res.appendChild(el('div', `thanks${failed ? ' failed' : ''}`, head + sc.thanks.map(t => `<div>✨ ${esc(failed ? t.replace(' 덕분에', '') : t)}${failed || /덕분에/.test(t) ? '' : ' 덕분에'}</div>`).join('')));
    }
    const prose = el('div', 'prose');
    res.appendChild(prose);
    art.appendChild(res);
    if (animate) {
      scrollToEl(res);
      if (sc.grade && navigator.vibrate && !Settings.get('reduceMotion')) { try { navigator.vibrate(sc.grade === 'crit' ? [20, 40, 20] : sc.grade === 'fumble' ? 60 : 10); } catch (e) { /* 무시 */ } }
    }
    const after = () => {
      const cr = chipRow(sc.chips);
      if (cr) res.appendChild(cr);
      if (S.statPoints > 0) res.appendChild(levelPanel());
      if (box) {
        box.innerHTML = '';
        for (const o of Game.retryOptions()) {
          const rb = el('button', 'retry', `${esc(o.label)}<small>${esc(o.sub)}</small>`);
          rb.addEventListener('click', () => { if (skipTyping()) return; Game.retry(o.kind); render(true); });
          box.appendChild(rb);
        }
        box.appendChild(continueButton());
      }
      renderTop();
    };
    if (animate) typeInto(prose, sc.text, null, after);
    else { typeInto(prose, sc.text, null, null); skipTyping(); after(); }
  }

  /* 레벨업: 능력치를 직접 고른다 */
  function levelPanel(onDone) {
    const S = Game.state();
    const box = el('div', 'levelup');
    const draw = () => {
      box.innerHTML = '';
      if (!(S.statPoints > 0)) { box.appendChild(el('p', 'done', '성장을 마쳤다.')); onDone && onDone(); return; }
      box.appendChild(el('p', null, `<b>⬆️ 한 뼘 자랐다.</b> 어디에 힘을 줄까? <small>남은 점수 ${S.statPoints}</small>`));
      const row = el('div', 'stat-pick');
      for (const k of Object.keys(STATS)) {
        const b = el('button', null, `<span>${STATS[k].icon}</span><b>${S.stats[k]}</b><small>${STATS[k].name}</small>`);
        b.addEventListener('click', () => { Game.allocate(k); toast(`${STATS[k].icon} ${STATS[k].name} ${S.stats[k]}`); draw(); });
        row.appendChild(b);
      }
      box.appendChild(row);
    };
    draw();
    return box;
  }

  function continueButton() {
    const b = el('button', 'continue', '계속 <span>›</span>');
    b.addEventListener('click', () => { if (skipTyping()) return; Game.next(); render(true); });
    return b;
  }

  /* ───────── 행선지 ───────── */
  function season(turn) {
    if (turn <= 3) return '가을 학기가 깊어 간다. 성 안의 계단들은 여전히 제멋대로 움직인다.';
    if (turn <= 6) return '찬 바람이 분다. 호수는 회색으로 굳어 가고, 복도마다 횃불이 일찍 켜진다.';
    if (turn <= 9) return '성은 눈에 덮였다. 창문마다 성에가 끼고, 휴게실 벽난로가 하루 종일 탄다.';
    return '봄이 오고 시험이 다가온다. 잔디밭에 햇살이 쏟아지고, 도서관은 붐빈다.';
  }
  function renderTravel() {
    const S = Game.state();
    const sc = S.screen;
    const st = stage();
    st.innerHTML = '';
    window.scrollTo({ top: 0 });
    const wrap = el('section', 'travel');
    wrap.appendChild(el('div', 'travel-head', `<span>${S.turn} / ${TURNS_PER_YEAR}</span><div class="progress"><i style="width:${(S.turn / TURNS_PER_YEAR) * 100}%"></i></div>`));
    wrap.appendChild(el('h2', 'scene-title', '어디로 갈까?'));
    wrap.appendChild(el('p', 'travel-mood', esc(season(S.turn))));
    const list = el('div', 'cards');
    for (const c of sc.hand) {
      const p = PLACES[c.id];
      const b = el('button', `place${p.safe ? ' safe' : ''}${p.danger ? ' danger' : ''}`);
      b.innerHTML = `<span class="picon">${p.icon}</span><span class="pbody"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></span><span class="phint">${c.hints.join(' ')}</span>`;
      b.addEventListener('click', () => { Game.pickPlace(c.id); render(true); });
      list.appendChild(b);
    }
    wrap.appendChild(list);
    wrap.appendChild(el('p', 'legend', '⭐ 이어지는 이야기 · 💛 누군가 기다린다 · 🔁 연속 도전 · ⚠️ 들킬 수도 있다'));
    st.appendChild(wrap);
  }

  /* ───────── 학년말 ───────── */
  function renderYearEnd() {
    const S = Game.state();
    const st = stage();
    st.innerHTML = '';
    window.scrollTo({ top: 0 });
    const total = Object.values(EVENTS).filter(e => (e.year || 1) === 1 && e.type !== 'special').length;
    const seen = S.seen.filter(id => EVENTS[id] && EVENTS[id].type !== 'special').length;
    const rels = Object.entries(S.rel).filter(([k, v]) => v > 0 && k !== 'housemate').sort((a, b) => b[1] - a[1]).slice(0, 4);
    const h = HOUSES[S.house];
    const box = el('section', 'yearend');
    box.innerHTML = `
      <div class="crest" style="--house:${h.color}">${h.animal}</div>
      <h2>1학년 끝</h2>
      <p class="sub">${h.name} · ${esc(WANDS[S.wand] ? WANDS[S.wand].name.split(',')[0] + ' 지팡이' : '')}${S.pet ? ' · ' + PETS[S.pet].kind + ' ' + PETS[S.pet].name : ''}</p>
      <div class="stats-grid">${Object.keys(STATS).map(k => `<div><span>${STATS[k].icon}</span><b>${S.stats[k]}</b><small>${STATS[k].name}</small></div>`).join('')}</div>
      <ul class="summary">
        <li><span>🏆 기숙사에 보탠 점수</span><b>${S.res.points > 0 ? '+' : ''}${S.res.points}</b></li>
        <li><span>📖 만난 사건</span><b>${seen} / ${total}</b></li>
        <li><span>💭 남은 기억</span><b>${S.memories.length}</b></li>
        <li><span>🪄 익힌 주문</span><b>${S.spells.length}</b></li>
        <li><span>🃏 개구리 초콜릿 카드</span><b>${S.cards.length} / ${Object.keys(CARDS).length}</b></li>
      </ul>
      ${rels.length ? `<h3>가까워진 사람들</h3><ul class="rels">${rels.map(([k, v]) => `<li><span>${esc(PEOPLE[k].name)}</span><i style="width:${v}%"></i></li>`).join('')}</ul>` : ''}
      <h3>기억</h3>
      <ul class="mems">${S.memories.map(m => `<li><b>${esc(MEMORIES[m].name)}</b> ${esc(MEMORIES[m].desc)}</li>`).join('')}</ul>
      <p class="note">2학년 — 비밀의 방 — 은 아직 쓰이는 중입니다.<br>다른 기숙사, 다른 선택으로 1학년을 다시 걸어 보세요. 한 번에 만날 수 있는 사건은 절반쯤입니다.</p>`;
    const again = el('button', 'primary', '처음부터 다시');
    again.addEventListener('click', () => confirmNew());
    box.appendChild(again);
    st.appendChild(box);
  }

  /* ───────── 진입 ───────── */
  function render(animate) {
    const S = Game.state();
    if (!S) return renderTitle();
    renderTop();
    $('#dock').hidden = false;
    const k = S.screen.kind;
    if (k === 'event') renderEvent(animate);
    else if (k === 'travel') renderTravel();
    else if (k === 'yearEnd') renderYearEnd();
  }

  function renderTitle() {
    $('#topbar').hidden = true;
    $('#dock').hidden = true;
    const st = stage();
    st.innerHTML = '';
    const saved = loadGame();
    const box = el('section', 'title-screen');
    box.innerHTML = `
      <div class="owl" aria-hidden="true">🦉</div>
      <h1>호그와트 7년</h1>
      <p class="tag-line">1학년 · 마법사의 돌</p>
      <p class="opening">1991년 7월, 뉴몰든 하이 스트리트의 작은 식품점 차양 위에<br>커다란 갈색 부엉이 한 마리가 내려앉았다.</p>`;
    if (saved && saved.screen) {
      const c = el('button', 'primary', `이어하기 <small>${saved.year}학년 · ${esc((CALENDAR[saved.year] || {})[saved.turn] || '')}</small>`);
      c.addEventListener('click', () => { Game.start(saved); lastRes = null; render(false); });
      box.appendChild(c);
    }
    const n = el('button', saved ? 'secondary' : 'primary', '새로 시작');
    n.addEventListener('click', () => (saved ? confirmNew() : startNew()));
    box.appendChild(n);
    const s = el('button', 'ghost', '⚙️ 설정');
    s.addEventListener('click', () => openSheet('settings'));
    box.appendChild(s);
    box.appendChild(el('p', 'fine', '비상업 팬 프로젝트 · 원작의 인물과 배경은 J.K. 롤링의 『해리 포터』에서 빌려 왔습니다.'));
    st.appendChild(box);
  }

  function startNew() {
    clearSave();
    closeSheet();
    lastRes = null;
    Game.start(newState());
    render(true);
  }
  function confirmNew() {
    openSheet('confirm');
  }

  /* ───────── 바텀시트 ───────── */
  function openSheet(kind) {
    const body = $('#sheet-body');
    body.innerHTML = '';
    body.appendChild(SHEETS[kind]());
    $('#sheet').hidden = false;
    $('#sheet-backdrop').hidden = false;
    requestAnimationFrame(() => $('#sheet').classList.add('open'));
  }
  function closeSheet() {
    $('#sheet').classList.remove('open');
    $('#sheet').hidden = true;
    $('#sheet-backdrop').hidden = true;
  }

  const SHEETS = {
    log() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '📜 지나온 이야기'));
      const ul = el('ul', 'log');
      [...S.log].reverse().forEach(l => {
        ul.appendChild(el('li', null, `<small>${esc((CALENDAR[l.y] || {})[l.t] || '')}</small><b>${esc(l.title)}</b><span>› ${esc(l.choice)}${l.grade ? ` <em class="g">${l.grade}</em>` : ''}</span>`));
      });
      if (!S.log.length) ul.appendChild(el('li', 'empty', '아직 아무 일도 없었다.'));
      box.appendChild(ul);
      return box;
    },
    bag() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '🎒 소지품'));
      if (S.wand) box.appendChild(el('p', 'kv', `<span>지팡이</span><b>${esc(WANDS[S.wand].name)}</b>`));
      if (S.pet) box.appendChild(el('p', 'kv', `<span>${esc(PETS[S.pet].kind)}</span><b>${esc(PETS[S.pet].name)}</b>`));
      box.appendChild(el('p', 'kv', `<span>${RESOURCES.galleon.icon} 갈레온</span><b>${S.res.galleon}</b>`));
      const items = Object.entries(S.items).filter(([, n]) => n > 0);
      const ul = el('ul', 'items');
      for (const [id, n] of items) {
        const it = ITEMS[id];
        const li = el('li', null, `<span class="ic">${it.icon}</span><div><b>${esc(it.name)}${n > 1 ? ` ×${n}` : ''}</b><small>${esc(it.desc)}</small></div>`);
        if (it.use) {
          const b = el('button', 'use', '쓰기');
          b.addEventListener('click', () => {
            const chips = Game.useItem(id);
            if (chips) toast(`${it.icon} ${it.name} — ${chips.map(c => c.t).join(' · ')}`);
            renderTop();
            openSheet('bag');
          });
          li.appendChild(b);
        }
        ul.appendChild(li);
      }
      if (!items.length) ul.appendChild(el('li', 'empty', '주머니가 비어 있다.'));
      box.appendChild(ul);
      box.appendChild(el('h3', null, '🪄 익힌 주문'));
      const sp = el('ul', 'items');
      S.spells.forEach(id => sp.appendChild(el('li', null, `<span class="ic">✨</span><div><b>${esc(SPELLS[id].name)}</b><small>${esc(SPELLS[id].desc)}</small></div>`)));
      if (!S.spells.length) sp.appendChild(el('li', 'empty', '아직 제대로 쓸 줄 아는 주문이 없다.'));
      box.appendChild(sp);
      return box;
    },
    me() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, `🪄 윤영운${S.house ? ' · ' + HOUSES[S.house].name : ''}`));
      const grid = el('div', 'stats-grid');
      grid.innerHTML = Object.keys(STATS).map(k => `<div><span>${STATS[k].icon}</span><b>${S.stats[k]}</b><small>${STATS[k].name}</small></div>`).join('');
      box.appendChild(grid);
      box.appendChild(el('p', 'kv', `<span>성장 단계</span><b>${S.level}단계 · 다음까지 ${60 - (S.xp % 60)}</b>`));
      if (S.statPoints > 0) box.appendChild(levelPanel(() => openSheet('me')));
      box.appendChild(el('p', 'hint', '선택할 때마다 경험이 쌓이고(실패에서 더 많이 배운다), 단계가 오르면 능력치를 직접 고른다. 같은 방법만 거듭 쓰면 상대가 예상해 성공률이 떨어진다. 판정 성공률은 스탯이 높을수록, 기억·주문·소지품의 도움을 받을수록 올라갑니다. 마음이 무너지거나 몸이 지치면 내려갑니다.'));
      const res = el('ul', 'kvlist');
      res.innerHTML = Object.keys(RESOURCES).map(k => `<li><span>${RESOURCES[k].icon} ${RESOURCES[k].name}</span><b>${S.res[k]}${RESOURCES[k].max ? ' / ' + RESOURCES[k].max : ''}</b></li>`).join('');
      box.appendChild(res);
      const rels = Object.entries(S.rel).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      box.appendChild(el('h3', null, '💛 사람들'));
      const ru = el('ul', 'rels');
      rels.forEach(([k, v]) => ru.appendChild(el('li', null, `<span>${esc(PEOPLE[k].name)}<small>${Rules.relTier(v).name}</small></span><i style="width:${v}%"></i>`)));
      if (!rels.length) ru.appendChild(el('li', 'empty', '아직 아는 사람이 없다.'));
      box.appendChild(ru);
      box.appendChild(el('h3', null, '💭 기억'));
      const mu = el('ul', 'mems');
      S.memories.forEach(m => mu.appendChild(el('li', null, `<b>${esc(MEMORIES[m].name)}</b> ${esc(MEMORIES[m].desc)}`)));
      if (!S.memories.length) mu.appendChild(el('li', 'empty', '아직 남은 기억이 없다.'));
      box.appendChild(mu);
      return box;
    },
    dex() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      const total = Object.values(EVENTS).filter(e => e.type !== 'special').length;
      const seen = S.seen.filter(id => EVENTS[id] && EVENTS[id].type !== 'special').length;
      box.appendChild(el('h3', null, '📖 도감'));
      box.appendChild(el('p', 'kv', `<span>이번 회차에 만난 사건</span><b>${seen} / ${total}</b>`));
      box.appendChild(el('h3', null, `🃏 개구리 초콜릿 카드 ${S.cards.length} / ${Object.keys(CARDS).length}`));
      const ul = el('ul', 'cardlist');
      for (const [id, c] of Object.entries(CARDS)) {
        const has = S.cards.includes(id);
        ul.appendChild(el('li', has ? '' : 'locked', has ? `<b>${esc(c.name)}</b><small>${esc(c.text)}</small>` : '<b>???</b><small>아직 만나지 못한 마법사</small>'));
      }
      box.appendChild(ul);
      return box;
    },
    settings() {
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '⚙️ 설정'));
      const seg = (label, key, opts) => {
        const row = el('div', 'setting');
        row.appendChild(el('span', null, label));
        const g = el('div', 'seg');
        for (const [v, name] of opts) {
          const b = el('button', Settings.get(key) === v ? 'on' : '', name);
          b.addEventListener('click', () => { Settings.set(key, v); openSheet('settings'); });
          g.appendChild(b);
        }
        row.appendChild(g);
        box.appendChild(row);
      };
      seg('글자 나오는 속도', 'speed', [['slow', '느리게'], ['normal', '보통'], ['fast', '빠르게'], ['instant', '즉시']]);
      seg('글자 크기', 'fontSize', [['m', '보통'], ['l', '크게'], ['xl', '아주 크게']]);
      seg('화면', 'theme', [['auto', '자동'], ['light', '양피지'], ['dark', '밤']]);
      seg('연출 줄이기', 'reduceMotion', [[true, '켜기'], [false, '끄기']]);
      seg('성공률 숫자', 'showNumbers', [[false, '숨기기'], [true, '보이기']]);
      box.appendChild(el('p', 'hint', '연출 줄이기를 켜 두면 화면이 흔들리거나 번쩍이는 효과가 모두 꺼집니다. 글이 나오는 중에 화면을 누르면 바로 전부 보입니다.'));
      if (Game.state()) {
        const b = el('button', 'danger-btn', '처음부터 다시 시작');
        b.addEventListener('click', () => openSheet('confirm'));
        box.appendChild(b);
      }
      return box;
    },
    confirm() {
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '처음부터 다시 시작할까요?'));
      box.appendChild(el('p', 'hint', '지금까지의 진행이 지워집니다. 다시 뉴몰든의 7월, 부엉이가 날아오는 아침으로 돌아갑니다.'));
      const yes = el('button', 'danger-btn', '네, 다시 시작');
      yes.addEventListener('click', startNew);
      const no = el('button', 'secondary', '아니요');
      no.addEventListener('click', closeSheet);
      box.appendChild(yes);
      box.appendChild(no);
      return box;
    },
  };

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function boot() {
    Settings.apply();
    document.querySelectorAll('#dock button').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.sheet)));
    $('#sheet-backdrop').addEventListener('click', closeSheet);
    $('#resbar').addEventListener('click', e => {
      const b = e.target.closest('.res');
      if (b) toast(`${RESOURCES[b.dataset.res].icon} ${RESOURCES[b.dataset.res].name}: ${{ hp: '0이 되면 의무실 신세', heart: '낮으면 모든 판정이 불리해진다', galleon: '마법사 세계의 돈', notice: '높을수록 교수들과 필치가 주시한다', points: '1년 동안 기숙사에 보탠 점수' }[b.dataset.res]}`);
    });
    stage().addEventListener('click', e => { if (!e.target.closest('button')) skipTyping(); });
    renderTitle();
  }

  return { boot, render, toast };
})();
