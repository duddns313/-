/* ===================== 기억 — 과거의 선택이 나중을 바꾼다 ===================== */
/* effect.memory로 심고, event.recall / choice.requiresMemory로 나중에 참조한다. */

const MEMORIES = {
  saved_hermione: { label: '헤르미온느를 구했다', desc: '핼러윈 밤, 트롤에게서 헤르미온느를 구하러 달려갔다.' },
  read_dark_book: { label: '금서를 읽었다', desc: '도서관 금서 구역에서 위험한 지식을 옮겨 적었다.' },
  kept_promise_neville: { label: '네빌과의 약속을 지켰다', desc: '잃어버린 약초학 교과서를 찾아 돌려주었다.' },
  approach_direct: { label: '망설임 없이 나섰다', desc: '1장, 덤블도어의 부탁에 곧바로 나서겠다고 답했다.' },
  approach_careful: { label: '신중하게 접근했다', desc: '1장, 서두르지 않고 단서를 꼼꼼히 살피기로 했다.' },
  approach_questioning: { label: '이유를 물었다', desc: '1장, 왜 하필 자신인지 덤블도어에게 되물었다.' },
  curious_about_diary: { label: '일기의 정체가 궁금했다', desc: '일기장의 주인이 누구인지 알아내려 했다.' },
  pragmatic_ch1: { label: '실용을 택했다', desc: '일기의 정체보다 숲의 위협을 먼저 해결하기로 했다.' },
  wary_of_diary: { label: '불길함을 느꼈다', desc: '낡은 일기장에서 불길한 예감을 느꼈다.' },
  brave_resolve: { label: '두렵지 않다고 답했다', desc: '비밀의 방으로 가겠다며 흔들림 없이 답했다.' },
  honest_fear: { label: '두려움을 인정했다', desc: '무섭다는 걸 숨기지 않고도 나아가기로 했다.' },
  asked_for_help: { label: '친구들에게 도움을 청했다', desc: '비밀의 방에 가기 전, 혼자 짊어지지 않기로 했다.' },
  solo_resolve: { label: '홀로 맞서기로 했다', desc: '마지막 결전을 혼자 준비하기로 했다.' },
  asked_companions_final: { label: '친구들과 함께하기로 했다', desc: '마지막 결전을 앞두고 친구들에게 함께해 달라 청했다.' },
  afraid_but_resolute: { label: '두려움 속에서도 나아갔다', desc: '두렵지만 물러서지 않겠다고 다짐했다.' },
};
