/* ===================== 부트스트랩 ===================== */

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  showSetupScreen();

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('sheet-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'sheet-overlay') closeSheet();
  });

  /* 화면 아무 곳이나 눌러도 타이핑 중인 글이 즉시 끝까지 나온다 */
  $('game-shell').addEventListener('click', skipTypewriters);

  $('btn-settings').addEventListener('click', openSettingsSheet);

  $('btn-save').addEventListener('click', () => {
    if (!state) return;
    const ok = saveGame();
    toast(ok ? '게임을 저장했습니다.' : '저장에 실패했습니다.', { cls: ok ? '' : 'toast-warn' });
  });

  $('btn-reset').addEventListener('click', () => {
    if (!state) return;
    confirmSheet('정말로 처음부터 다시 시작하시겠습니까? 저장 데이터가 삭제됩니다.', () => {
      deleteSave();
      state = null;
      $('game-shell').classList.add('hidden');
      showSetupScreen();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state) saveGame();
  });
});
