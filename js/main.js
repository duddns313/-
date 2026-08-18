/* ===================== 부트스트랩 ===================== */

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadLedger();          /* 「기록」은 판보다 먼저 읽는다 — 시작 화면이 이미 이걸 쓴다 */
  showSetupScreen();

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('sheet-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'sheet-overlay') closeSheet();
  });

  /* 본문 영역을 누르면 타이핑이 즉시 끝까지 나온다 (버튼 클릭은 방해하지 않는다) */
  $('scene-page').addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    skipTypewriters();
  });

  $('btn-settings').addEventListener('click', openSettingsSheet);

  $('btn-reset').addEventListener('click', () => {
    if (!state) return;
    confirmSheet('이 판을 포기하고 처음부터 다시 시작할까요?\n(「기록」에 남은 이름과 조각은 사라지지 않습니다)', () => {
      deleteSave();
      state = null;
      $('game-shell').classList.add('hidden');
      showSetupScreen();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state && state.mode !== 'ending') saveGame();
  });
});
