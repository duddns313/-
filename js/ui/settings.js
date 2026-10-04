'use strict';
/* 기기 단위 설정: 타자 속도 · 연출 줄이기 · 글자 크기 · 화면 테마 */
const Settings = (() => {
  const KEY = 'hp7_settings';
  const DEFAULTS = { speed: 'normal', reduceMotion: true, fontSize: 'm', theme: 'auto' };
  const SPEED_MS = { slow: 40, normal: 22, fast: 9, instant: 0 };
  let cur = Object.assign({}, DEFAULTS);
  try { Object.assign(cur, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 기본값 사용 */ }

  function apply() {
    const root = document.documentElement;
    root.dataset.font = cur.fontSize;
    root.dataset.motion = cur.reduceMotion ? 'reduce' : 'full';
    // 'auto'일 때는 바깥(뷰어·OS)이 정한 테마를 건드리지 않는다
    if (cur.theme !== 'auto') { root.dataset.theme = cur.theme; root.dataset.themeByGame = '1'; }
    else if (root.dataset.themeByGame) { delete root.dataset.theme; delete root.dataset.themeByGame; }
  }
  function set(k, v) {
    cur[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) { /* 저장 불가 */ }
    apply();
  }
  return { get: k => cur[k], set, apply, charDelay: () => SPEED_MS[cur.speed] ?? 22 };
})();
