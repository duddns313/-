'use strict';
/* 진입점 */
function start() {
  UI.boot();
  /* 클라우드 사본과 맞춘 뒤, 아직 타이틀 화면이면 다시 그린다 (이어하기 · 불러오기가 나타나도록) */
  Store.init(() => { if (!Game.state()) UI.render(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
