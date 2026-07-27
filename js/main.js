/* ===================== 부트스트랩 ===================== */

document.addEventListener('DOMContentLoaded', () => {
  showSetupScreen();

  $('btn-save').addEventListener('click', () => {
    if (!state) return;
    const ok = saveGame();
    addLog(ok ? '게임을 저장했다.' : '저장에 실패했다.', ok ? 'log-result' : 'log-warn');
  });

  $('btn-load').addEventListener('click', () => {
    if (loadGame()) {
      addLog('--- 불러오기 완료 ---', 'log-move');
      render();
    } else {
      alert('저장된 게임이 없습니다.');
    }
  });

  $('btn-reset').addEventListener('click', () => {
    if (!confirm('정말로 처음부터 다시 시작하시겠습니까? 저장 데이터가 삭제됩니다.')) return;
    deleteSave();
    state = null;
    $('game-screen').classList.add('hidden');
    showSetupScreen();
  });
});
