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
  const pips = (v, max) => '●'.repeat(Math.max(0, v)) + '○'.repeat(Math.max(0, max - v));
  function renderTop() {
    const S = Game.state();
    $('#topbar').hidden = false;
    const h = HOUSES[S.house];
    const date = S.screen && S.screen.date ? S.screen.date : '';
    $('#dateline').innerHTML = `<span class="year">${S.year}학년</span><span class="date">${esc(date)}</span>${h ? `<span class="house" style="--house:${h.color}">${h.name}</span>` : ''}`;
    const r = S.res;
    const items = [
      ['hp', RESOURCES.hp.icon, `<i class="pips">${pips(r.hp, 5)}</i>`, r.hp <= 1],
      ['mind', RESOURCES.mind.icon, `<i class="pips">${pips(r.mind, 5)}</i>`, r.mind <= 1],
      ['rep', RESOURCES.rep.icon, Rules.REP_NAMES[r.rep], r.rep <= 2],
      ['galleon', RESOURCES.galleon.icon, r.galleon, false],
    ];
    const bar = $('#resbar');
    bar.innerHTML = items.map(([k, icon, v, low]) => {
      const changed = lastRes && lastRes[k] !== r[k] ? (r[k] > lastRes[k] ? 'up' : 'down') : '';
      return `<button class="res r-${k} ${changed}${low ? ' low' : ''}" data-res="${k}" aria-label="${RESOURCES[k].name} ${r[k]}"><span>${icon}</span><b>${v}</b></button>`;
    }).join('');
    lastRes = Object.assign({}, r);
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
    for (const c of chips) {
      row.appendChild(el('span', `chip ${c.good ? 'good' : 'bad'}${c.big ? ' big' : ''}`, esc(c.t)));
      if (c.note) row.appendChild(el('p', 'chip-note', `<em>${esc(c.note)}</em>`));
    }
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
      const head = el('div', 'scene-head', `<span>${esc(PLACES[ev.place] ? PLACES[ev.place].name : (T(ev.place) || ''))}</span>${sc.date ? `<span>${esc(sc.date)}</span>` : ''}`);
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
      const body = (sc.note && sc.stage === 'intro' ? sc.note + '\n\n' : '') + T(ev.text);
      if (sc.stage === 'intro' && animate) typeInto(prose, body, null, after);
      else { typeInto(prose, body, null, null); skipTyping(); after(); }
    } else {
      appendResult(art, ev, animate);
    }
  }

  /* 선택지 아래 한 줄: 필요한 열쇠와 ⭐·🪙 대가만. 얻는 것은 말하지 않는다 — 글만 보고 고른다 */
  function reqHtml(S, c) {
    const req = Rules.reqLine(S, c).filter(r => r.kind !== 'gain');
    if (!req.length) return '';
    return `<div class="req">${req.map(r => `<span class="rq ${r.kind}${r.ok ? '' : ' miss'}${r.danger ? ' danger' : ''}">${esc(r.t)}</span>`).join('')}</div>`;
  }

  function renderChoices(box, ev) {
    const S = Game.state();
    box.innerHTML = '';
    const { open, locked } = Game.choiceStates(ev);
    if (!open.length && !locked.length) { box.appendChild(continueButton()); return; }
    for (const { c, i, lethal, fallback } of open) {
      const b = el('button', `choice${lethal ? ' lethal' : ''}${fallback ? ' fallback' : ''}`);
      const opened = Rules.thanksFor(c.needs);
      if (opened.length) b.classList.add('opened');
      b.innerHTML = `${opened.length ? `<div class="opened-by">🔓 ${esc(opened.join(' · '))} 덕분에 열린 길</div>` : ''}<div class="choice-label">${esc(T(c.label))}</div>${reqHtml(S, c)}`;
      b.addEventListener('click', () => {
        if (skipTyping()) return;
        box.querySelectorAll('button').forEach(x => { x.disabled = true; });
        Game.choose(i);
        render(true);
      });
      box.appendChild(b);
    }
    for (const { c } of locked) {
      const b = el('div', 'choice locked');
      b.innerHTML = `<div class="choice-top"><span class="tag lock">🔒</span></div>
        <div class="choice-label">${esc(T(c.label))}</div>${reqHtml(S, c)}${c.lockHint ? `<div class="need"><small>${esc(T(c.lockHint))}</small></div>` : ''}`;
      box.appendChild(b);
    }
    if (!open.length) box.appendChild(continueButton());
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
    if (sc.thanks && sc.thanks.length) res.appendChild(el('div', 'thanks', sc.thanks.map(t => `<div>✨ ${esc(t)} 덕분에</div>`).join('')));
    const prose = el('div', 'prose');
    res.appendChild(prose);
    art.appendChild(res);
    if (animate) scrollToEl(res);
    const after = () => {
      const cr = chipRow(sc.chips);
      if (cr) res.appendChild(cr);
      if (box) {
        box.innerHTML = '';
        const rw = Game.rewindInfo();
        if (rw) {
          const tired = ['', '호현이 관자놀이를 누를 것이다', '호현의 코피가 날 것이다 · 💭-1', '호현이 버티지 못할 것이다'][rw.nth];
          const rb = el('button', 'retry rewind', `⏪ 호현이 세상을 되감는다<small>올해 남은 횟수 ${rw.left} · ${tired}</small>`);
          if (rw.cost && S.res.mind <= rw.cost.mind) rb.disabled = true;
          rb.addEventListener('click', () => { if (skipTyping()) return; Game.rewind(); render(true); });
          box.appendChild(rb);
        }
        box.appendChild(continueButton());
      }
      renderTop();
    };
    if (animate) typeInto(prose, sc.text, null, after);
    else { typeInto(prose, sc.text, null, null); skipTyping(); after(); }
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
    for (const id of sc.cutNotes || []) wrap.appendChild(el('p', 'cut-note', `✂️ 매듭이 끊어졌다 — ${esc(KNOTS[id].title)}`));
    const due = Object.values(KNOTS).filter(k => k.ready && !(S.knots || {})[k.id] && k.due >= S.turn && k.due <= S.turn + 1);
    if (due.length) wrap.appendChild(el('p', 'due-note', `📓 곧 묶어야 할 매듭 · ${due.map(k => esc(k.title)).join(' · ')}`));
    if (sc.weekNote) wrap.appendChild(el('p', 'week-note', sc.weekNote === 'hp' ? '❤️-1 · 수업과 숙제와 계단. 몸이 조금 무겁다.' : '💭-1 · 집 생각이 나는 한 주였다. 마음이 조금 가라앉았다.'));
    const list = el('div', 'cards');
    for (const c of sc.hand) {
      const p = PLACES[c.id];
      const b = el('button', `place${p.safe ? ' safe' : ''}${p.danger ? ' danger' : ''}`);
      b.innerHTML = `<span class="picon">${p.icon}</span><span class="pbody"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></span><span class="phint">${c.hints.join(' ')}</span>`;
      b.addEventListener('click', () => { Game.pickPlace(c.id); render(true); });
      list.appendChild(b);
    }
    wrap.appendChild(list);
    wrap.appendChild(el('p', 'legend', `⭐ 이어지는 이야기 · 💛 누군가 기다린다 · ⚠️ 위험할 수 있다 · 🛋️ 휴게실에서는 쉴 수 있다${sc.nightClosed ? '<br>👁️ 평판이 낮아 필치가 따라다닌다 — 밤에만 갈 수 있는 곳은 닫혔다' : ''}`));
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
      <ul class="summary">
        <li><span>❤️ 체력 · 💭 정신력</span><b>${S.res.hp} · ${S.res.mind}</b></li>
        <li><span>⭐ 평판</span><b>${S.res.rep} · ${Rules.REP_NAMES[S.res.rep]}</b></li>
        <li><span>⏪ 호현이 되감은 횟수</span><b>${S.rewinds || 0} / ${Game.REWINDS_PER_YEAR}</b></li>
        <li><span>🏆 기숙사에 보탠 점수</span><b>${S.res.points > 0 ? '+' : ''}${S.res.points}</b></li>
        <li><span>📖 만난 사건</span><b>${seen} / ${total}</b></li>
        <li><span>💭 남은 기억</span><b>${S.memories.length}</b></li>
        <li><span>🪄 되찾은 주문</span><b>${S.spells.length}</b></li>
        <li><span>🃏 개구리 초콜릿 카드</span><b>${S.cards.length} / ${Object.keys(CARDS).length}</b></li>
      </ul>
      ${rels.length ? `<h3>가까워진 사람들</h3><ul class="rels">${rels.map(([k, v]) => `<li><span>${esc(PEOPLE[k].name)}</span><i style="width:${v}%"></i></li>`).join('')}</ul>` : ''}
      <h3>기억</h3>
      <ul class="mems">${S.memories.map(m => `<li><b>${esc(MEMORIES[m].name)}</b> ${esc(MEMORIES[m].desc)}</li>`).join('')}</ul>
      <p class="note">2학년 — 비밀의 방 — 은 아직 쓰이는 중입니다.<br>다른 선택으로 1학년을 다시 걸어 보세요. 한 번에 만날 수 있는 사건은 절반쯤입니다.</p>`;
    box.appendChild(chronicleBox(S));
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
    else if (k === 'gameover') renderGameOver();
  }

  /* ───────── 게임 오버 ───────── */
  function renderGameOver() {
    const S = Game.state();
    const st = stage();
    st.innerHTML = '';
    window.scrollTo({ top: 0 });
    $('#dock').hidden = true;
    const hp = S.screen.cause === 'hp';
    const broken = S.screen.cause === 'broken';
    const box = el('section', 'gameover');
    box.innerHTML = broken ? `<div class="crest">🔥</div>
      <h2>무너진 길</h2>
      <p class="sub">${esc(S.screen.date || '')}</p>
      <div class="prose"><p class="shown">그 밤, 돌은 터번 아래의 손에 들어갔다. 매듭이 너무 많이 끊겨 있었다. 셋은 끝까지 가지 못했고, 덤블도어는 늦었다.</p>
      <p class="shown">나는 그 길 끝에 무엇이 오는지 안다. 첫 번째 삶보다 훨씬 이르게, 훨씬 어둡게. 그리고 이번엔 접을 시간이 없었다.</p></div>
      <p class="note">무거운 매듭과 6월을 위한 준비가 마지막 밤을 가릅니다. 📓 일기장에서 끊긴 매듭을 확인해 보세요.</p>` : `<div class="crest">${hp ? '🩹' : '🌧️'}</div>
      <h2>${hp ? '쓰러진 겨울' : '꺼진 촛불'}</h2>
      <p class="sub">${esc(S.screen.date || '')}</p>
      <div class="prose"><p class="shown">${hp
        ? '나는 다시 일어나지 못했다. 폼프리 부인은 나를 오래 붙잡아 두었고, 결국 부엉이 한 마리가 뉴몰든으로 날아갔다. 나는 호그와트 특급의 창가에 앉아, 멀어지는 성을 끝까지 보았다. 이 길 끝에 무엇이 오는지 아는 사람은 이제 아무도 없었다.'
        : '어느 아침, 나는 침대에서 일어나지 못했다. 몸이 아픈 게 아니었다. 그냥, 두 번 산 7년의 무게를 더는 들 수가 없었다. 커튼 너머에서 호현이 내 이름을 불렀다. 나는 대답하지 못했다.'}</p>
      <p class="shown">${esc(S.rewinds >= 3 ? '호현이 되감을 수 있는 세상은 이미 다 써 버린 뒤였다.' : '이번엔 접을 시간이 없었다.')}</p></div>
      <p class="note">❤️ 체력이나 💭 정신력이 0이 되면 호그와트를 떠나게 됩니다. 쉬고, 먹고, 친구와 웃는 것도 선택입니다.</p>`;
    const again = el('button', 'primary', loadPrologue() ? '처음부터 — 프롤로그 건너뛰기' : '처음부터 다시');
    again.addEventListener('click', () => { lastRes = null; if (loadPrologue()) Game.skipPrologue(); else Game.start(newState()); render(true); });
    box.appendChild(again);
    if (anySlot()) {
      const ls = el('button', 'secondary', '💾 저장한 곳에서 불러오기');
      ls.addEventListener('click', () => openSheet('saves'));
      box.appendChild(ls);
    }
    if (loadPrologue()) {
      const full = el('button', 'secondary', '프롤로그부터 다시 보기');
      full.addEventListener('click', () => { lastRes = null; Game.start(newState()); render(true); });
      box.appendChild(full);
    }
    st.appendChild(box);
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
      <p class="tag-line">마지막 접기</p>
      <p class="tag-line">1학년 · 마법사의 돌</p>
      <p class="opening">나는 이미 한 번 7년을 살았다.<br>마지막에 하나가 모자랐다.</p>`;
    if (saved && saved.screen) {
      const c = el('button', 'primary', `이어하기 <small>${saved.year}학년 · ${esc((CALENDAR[saved.year] || {})[saved.turn] || '')}</small>`);
      c.addEventListener('click', () => { Game.start(saved); lastRes = null; render(false); });
      box.appendChild(c);
    }
    const chron = latestChronicle();
    if (chron && yearReady(chron.y + 1)) {
      const ny = el('button', 'primary', `${chron.y + 1}학년 시작 <small>${chron.y}학년 기록 이어 받기</small>`);
      ny.addEventListener('click', () => { lastRes = null; Game.start(stateFromChronicle(chron)); render(true); });
      box.appendChild(ny);
    } else if (chron) {
      box.appendChild(el('p', 'fine', `📜 ${chron.y}학년 기록이 보관되어 있다. ${chron.y + 1}학년이 열리면 여기서 이어서 시작한다.`));
    }
    if (anySlot() || Object.keys(readChronicles()).length) {
      const l = el('button', 'secondary', '💾 불러오기 · 📜 기록');
      l.addEventListener('click', () => openSheet('saves'));
      box.appendChild(l);
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

  /* 새로 시작 — 프롤로그를 이미 본 적이 있으면 건너뛸 수 있다 */
  function startNew() {
    clearSave();
    closeSheet();
    lastRes = null;
    if (loadPrologue()) return openSheet('startMode');
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

  /* 🦉 부엉이 주문서 — 갈레온으로 물건을 산다 */
  function shopPanel() {
    const S = Game.state();
    const wrap = el('div', 'shop');
    wrap.appendChild(el('h3', null, '🦉 부엉이 주문서'));
    wrap.appendChild(el('p', 'hint', `가진 돈 ${RESOURCES.galleon.icon} ${S.res.galleon}갈레온. 주문하면 다음 날 아침 부엉이가 가져다준다. 물건은 선택지의 열쇠나 도움이 된다.`));
    for (const sid of Object.keys(SHOPS)) {
      const sh = SHOPS[sid];
      const open = Game.shopOpen(sid);
      wrap.appendChild(el('h4', null, `${sh.icon} ${esc(sh.name)}`));
      if (!open) { wrap.appendChild(el('p', 'hint locked-shop', '🔒 아직 모르는 곳. 프레드와 조지와 친해지거나, 성의 비밀 하나를 알아내면 열린다.')); continue; }
      const ul = el('ul', 'items');
      for (const [id, it] of Object.entries(ITEMS)) {
        if (it.shop !== sid) continue;
        const have = S.items[id] || 0;
        const li = el('li', null, `<span class="ic">${it.icon}</span><div><b>${esc(it.name)}${have ? ` <em class="have">가진 것 ${have}</em>` : ''}</b><small>${esc(it.hint || it.desc)}</small></div>`);
        const price = Game.priceOf(id);
        const b = el('button', 'use buy', `${RESOURCES.galleon.icon} ${price}${price < it.price ? ' <s>' + it.price + '</s>' : ''}`);
        if (S.res.galleon < price) b.disabled = true;
        b.addEventListener('click', () => {
          const chips = Game.buy(id);
          if (chips) toast(`${it.icon} ${it.name} — 주문 완료. 다음 날 아침, 부엉이가 꾸러미를 떨어뜨렸다.`);
          renderTop();
          openSheet('bag');
        });
        li.appendChild(b);
        ul.appendChild(li);
      }
      wrap.appendChild(ul);
    }
    return wrap;
  }

  /* 📜 학년 기록 — 학년이 끝나면 자동 보관 + 코드로 옮기기 */
  function chronicleBox(S) {
    const c = makeChronicle(S);
    const saved = saveChronicle(c);
    const code = encodeChronicle(c);
    const wrap = el('div', 'chronicle');
    wrap.innerHTML = `<h3>📜 ${c.y}학년의 기록</h3>
      <p class="hint">${saved ? '이 기기에 보관해 두었다. ' : ''}${c.y + 1}학년이 열리면, 게임이 업데이트되어도 이 기록 — 묶은 매듭, 기억, 주문, 친밀도, 결말 — 을 이어 받아 시작한다. 다른 기기로 옮기거나 혹시 몰라 남겨 두려면 아래 코드를 복사해 두면 된다.</p>`;
    const ta = el('textarea', 'chronicle-code');
    ta.readOnly = true;
    ta.value = code;
    wrap.appendChild(ta);
    const cp = el('button', 'secondary', '📋 기록 코드 복사');
    cp.addEventListener('click', () => {
      const done = () => toast('📜 기록 코드를 복사했다. 메모장 같은 곳에 붙여 두자.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, () => { ta.select(); document.execCommand('copy'); done(); });
      else { ta.select(); document.execCommand('copy'); done(); }
    });
    wrap.appendChild(cp);
    return wrap;
  }
  /* 다음 학년이 준비되어 있는가 */
  const yearReady = y => Object.values(EVENTS).some(e => (e.year || 1) === y);

  /* 저장 칸에 붙일 한 줄 */
  function slotLabel(S) {
    const when = S.turn > 0 ? `${S.year}학년 · ${(CALENDAR[S.year] || {})[S.turn] || ''}` : '프롤로그';
    const sc = S.screen || {};
    const where = sc.kind === 'event' && EVENTS[sc.id] ? Rules.text(S, EVENTS[sc.id].title) : sc.kind === 'travel' ? '행선지를 고르는 중' : '';
    return { when, where };
  }
  function loadFrom(n) {
    const S = loadSlot(n);
    if (!S) return;
    closeSheet();
    lastRes = null;
    Game.start(S);
    saveGame(S);
    render(false);
    toast(`💾 ${n}번 칸에서 불러왔다.`);
  }

  const SHEETS = {
    saves() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '💾 저장 · 불러오기'));
      box.appendChild(el('p', 'hint', '세 칸까지 남겨 둘 수 있다. 저장 칸은 게임 오버가 되어도 지워지지 않는다. (호현의 되감기와는 다르다 — 이건 나만 아는 책갈피다.)'));
      const canSave = S && S.screen && S.screen.kind !== 'gameover' && S.screen.kind !== 'yearEnd';
      const ul = el('ul', 'slots');
      for (let n = 1; n <= SLOT_COUNT; n++) {
        const d = readSlot(n);
        const li = el('li', `slot${d ? '' : ' empty'}`);
        if (d) {
          const L = slotLabel(d.state);
          const t = new Date(d.at);
          const stamp = `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
          li.innerHTML = `<div class="slot-head"><b>${n}번 칸 · ${esc(L.when)}</b><small>${stamp}</small></div><div class="slot-info">${esc(L.where)}${L.where ? ' · ' : ''}❤️ ${d.state.res.hp} · 💭 ${d.state.res.mind} · ⭐ ${esc(Rules.REP_NAMES[d.state.res.rep])}</div>`;
        } else {
          li.innerHTML = `<div class="slot-head"><b>${n}번 칸</b></div><div class="slot-info">비어 있다</div>`;
        }
        const btns = el('div', 'slot-btns');
        const sv = el('button', 'save', d ? '여기에 저장' : '저장');
        sv.disabled = !canSave;
        sv.addEventListener('click', () => {
          if (d && !sv.dataset.sure) { sv.dataset.sure = '1'; sv.textContent = '덮어쓸까? 한 번 더'; return; }
          if (saveSlot(n, JSON.parse(JSON.stringify(S)))) { toast(`💾 ${n}번 칸에 저장했다.`); openSheet('saves'); }
          else toast('저장할 수 없는 환경이다.');
        });
        const ld = el('button', 'load', '불러오기');
        ld.disabled = !d;
        ld.addEventListener('click', () => loadFrom(n));
        btns.appendChild(sv);
        btns.appendChild(ld);
        li.appendChild(btns);
        ul.appendChild(li);
      }
      box.appendChild(ul);
      /* 학년 기록 */
      box.appendChild(el('h3', null, '📜 학년 기록'));
      const all = readChronicles();
      const ys = Object.keys(all).sort();
      box.appendChild(el('p', 'hint', ys.length
        ? ys.map(y => `${y}학년 기록 보관됨 — ${({ true: '참된 길', bent: '휘어진 길' })[all[y].ending] || '끝까지 걸었다'}`).join('<br>') + '<br>다음 학년이 열리면 이 기록으로 이어서 시작한다.'
        : '학년을 끝까지 마치면 기록이 여기에 보관된다. 다른 기기에서 받은 기록 코드는 아래에 붙여 넣는다.'));
      const ta = el('textarea', 'chronicle-code');
      ta.placeholder = 'HP7-… 로 시작하는 기록 코드';
      box.appendChild(ta);
      const imp = el('button', 'secondary', '📜 코드로 기록 불러오기');
      imp.addEventListener('click', () => {
        const c = decodeChronicle(ta.value);
        if (!c) { toast('코드를 읽을 수 없다. 끝까지 빠짐없이 붙여 넣었는지 확인해 보자.'); return; }
        saveChronicle(c);
        toast(`📜 ${c.y}학년 기록을 보관했다.`);
        openSheet('saves');
      });
      box.appendChild(imp);
      const last = latestChronicle();
      if (last && yearReady(last.y + 1)) {
        const go = el('button', 'primary', `${last.y + 1}학년 시작 — 기록 이어 받기`);
        go.addEventListener('click', () => { closeSheet(); lastRes = null; Game.start(stateFromChronicle(last)); render(true); });
        box.appendChild(go);
      }
      return box;
    },
    log() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '📓 일기장 — 내가 기억하는 길'));
      box.appendChild(el('p', 'hint', '첫 번째 삶에서 호현과 내가 뒤에서 만들어 낸 원작의 우연들. 기한까지 아무것도 하지 않으면 끊긴다. 🌱는 네빌 — 우리가 놓쳤던 마지막 열쇠.'));
      const st = { tied: ['🪢', '묶음'], loose: ['〰️', '겨우'], cut: ['✂️', '끊김'] };
      const ul = el('ul', 'knots');
      for (const k of Object.values(KNOTS).filter(k => (k.year || 1) === S.year)) {
        const v = (S.knots || {})[k.id];
        const now = !v && k.due >= S.turn && k.due <= S.turn + 1;
        const li = el('li', `knot ${v || (now ? 'now' : 'todo')} ${k.weight}`);
        li.innerHTML = `<span class="ks">${v ? st[v][0] : now ? '❗' : '·'}</span><div><small>${esc(k.month)} · ${k.weight === 'heavy' ? '무거운 매듭' : '가벼운 매듭'}${k.neville ? ' · 🌱' : ''}${v ? ' · ' + st[v][1] : now ? ' · 이번에' : ''}</small><b>${esc(k.title)}</b>${v || now ? `<em>→ ${esc(k.feeds)}</em>` : ''}${now && k.life ? `<i>${esc(k.life)}</i>` : ''}</div>`;
        ul.appendChild(li);
      }
      box.appendChild(ul);
      const nev = Object.values(KNOTS).filter(k => k.neville && ['tied', 'loose'].includes((S.knots || {})[k.id])).length;
      box.appendChild(el('p', 'kv', `<span>🌱 네빌에게 심은 씨앗</span><b>${nev} / ${Object.values(KNOTS).filter(k => k.neville).length}</b>`));
      if (typeof PREPS !== 'undefined') {
        box.appendChild(el('h3', null, '🗝️ 6월을 위한 준비'));
        box.appendChild(el('p', 'hint', '마지막 밤, 셋은 스스로 함정을 지나가야 한다. 내가 미리 심어 두지 않으면, 그날 밤 어둠 속에서 내가 직접 손을 써야 한다. 흔적이 남는다.'));
        const pu = el('ul', 'preps');
        for (const [id, p] of Object.entries(PREPS)) {
          const done = !!S.flags[id];
          pu.appendChild(el('li', done ? 'done' : '', `<span class="ic">${done ? '✔️' : '·'}</span><div><b>${esc(p.trap)} — ${esc(p.title)}</b><small>${esc(done ? p.who + '에게 심어 두었다' : p.how)}</small></div>`));
        }
        box.appendChild(pu);
      }
      box.appendChild(el('h3', null, '📜 지나온 이야기'));
      const lg = el('ul', 'log');
      [...S.log].reverse().forEach(l => {
        lg.appendChild(el('li', null, `<small>${esc((CALENDAR[l.y] || {})[l.t] || '')}</small><b>${esc(l.title)}</b><span>› ${esc(l.choice)}</span>`));
      });
      if (!S.log.length) lg.appendChild(el('li', 'empty', '아직 아무 일도 없었다.'));
      box.appendChild(lg);
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
      box.appendChild(el('p', 'hint', `🪙 ${S.res.galleon}갈레온. 성 안에 장이 서거나 쌍둥이가 다가올 때 쓸 수 있다.`));
      box.appendChild(el('h3', null, '🪄 되찾은 주문'));
      const sp = el('ul', 'items');
      S.spells.forEach(id => sp.appendChild(el('li', null, `<span class="ic">✨</span><div><b>${esc(SPELLS[id].name)}</b><small>${esc(SPELLS[id].desc)}</small></div>`)));
      if (!S.spells.length) sp.appendChild(el('li', 'empty', '머리는 일곱 해 동안 쓴 주문을 기억한다. 이 지팡이로 되찾은 건 아직 없다.'));
      box.appendChild(sp);
      return box;
    },
    me() {
      const S = Game.state();
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, `🪄 윤영운${S.house ? ' · ' + HOUSES[S.house].name : ''}`));
      const res = el('ul', 'kvlist');
      res.innerHTML = `<li><span>❤️ 체력</span><b>${S.res.hp} / 5</b></li><li><span>💭 정신력</span><b>${S.res.mind} / 5</b></li><li><span>⭐ 평판</span><b>${Rules.REP_NAMES[S.res.rep]}</b></li><li><span>🪙 갈레온</span><b>${S.res.galleon}</b></li>${S.flags.rewind_known ? `<li><span>⏪ 호현의 되감기</span><b>올해 ${Game.REWINDS_PER_YEAR - (S.rewinds || 0)}번 남음</b></li>` : ''}`;
      box.appendChild(res);
      box.appendChild(el('p', 'hint', '선택지에는 필요한 열쇠(물건·주문·기억·친밀도·평판)와 ⭐·🪙 대가, 얻는 것이 적혀 있다. ❤️·💭가 얼마나 드는지는 해 봐야 안다. 0이 되면 호그와트를 떠나야 한다. 휴게실에서 쉬고, 먹고, 친구와 웃고, 매듭을 제대로 묶으면 채워진다. 평판은 교수님과 친구들이 나를 얼마나 믿는지 — 높으면 열리는 길이, 낮으면 말썽꾼들만 아는 길이 있다.'));
      const rels = Object.entries(S.rel).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      box.appendChild(el('h3', null, '💛 사람들'));
      const ru = el('ul', 'rels');
      rels.forEach(([k, v]) => ru.appendChild(el('li', null, `<span>${esc(PEOPLE[k].name)}<small>친밀도 ${v}</small></span><i style="width:${v}%"></i>`)));
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
      box.appendChild(el('p', 'hint', '연출 줄이기를 켜 두면 화면이 흔들리거나 번쩍이는 효과가 모두 꺼집니다. 글이 나오는 중에 화면을 누르면 바로 전부 보입니다.'));
      const sb = el('button', 'secondary', '💾 저장 · 불러오기');
      sb.addEventListener('click', () => openSheet('saves'));
      box.appendChild(sb);
      if (Game.state()) {
        const b = el('button', 'danger-btn', '처음부터 다시 시작');
        b.addEventListener('click', () => openSheet('confirm'));
        box.appendChild(b);
      }
      return box;
    },
    startMode() {
      const box = el('div', 'sheet-content');
      box.appendChild(el('h3', null, '어디서부터 시작할까요?'));
      box.appendChild(el('p', 'hint', '프롤로그(편지 · 다이애건 앨리 · 기차 · 기숙사 배정)를 건너뛰면, 지난번에 프롤로그에서 고른 지팡이 · 동물 · 물건 그대로 첫 주부터 시작합니다.'));
      const skip = el('button', 'primary', '프롤로그 건너뛰기');
      skip.addEventListener('click', () => { closeSheet(); Game.skipPrologue(); render(true); });
      const full = el('button', 'secondary', '프롤로그부터');
      full.addEventListener('click', () => { closeSheet(); Game.start(newState()); render(true); });
      box.appendChild(skip);
      box.appendChild(full);
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

  const RES_HELP = {
    hp: '몸을 쓰는 선택에 든다. 0이 되면 호그와트를 떠나야 한다. 휴게실에서 자거나 먹으면 찬다.',
    mind: '무섭고 슬프고 맞서는 선택에 든다. 0이 되면 호그와트를 떠나야 한다. 친구와 웃거나 집에서 편지가 오면 찬다.',
    rep: '교수와 학교가 나를 얼마나 믿는가. 높으면 좋은 일이, 낮으면 필치와 스네이프가 찾아온다. 거짓말·규칙 위반으로 깎아 위기를 넘길 수 있다.',
    galleon: '부엉이 주문서(🎒 소지품)에서 물건을 산다. 집에서 오는 소포, 장사, 내기로 모인다.',
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
      if (b) toast(`${RESOURCES[b.dataset.res].icon} ${RESOURCES[b.dataset.res].name}: ${RES_HELP[b.dataset.res]}`);
    });
    stage().addEventListener('click', e => { if (!e.target.closest('button')) skipTyping(); });
    renderTitle();
  }

  return { boot, render, toast };
})();
