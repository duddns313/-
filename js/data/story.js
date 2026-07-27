/* ===================== 메인 스토리 (교장실에서 진행) ===================== */

const STORY = {
  chapters: [
    {
      id: 'ch1',
      requiresFlags: [],
      setFlag: 'ch1_started',
      title: '1장. 이상한 소문',
      text: '덤블도어 교수가 근심 어린 얼굴로 말한다.\n"최근 학생들이 하나둘 실종되고 있다네. 복도와 도서관에서 단서를 찾아주겠나?"\n(도서관과 복도를 탐험하여 단서를 모아보세요)',
      choices: [{ label: '알겠습니다', effect: {}, resultText: '조사를 시작하기로 했다.' }],
    },
    {
      id: 'ch1_report',
      requiresFlags: ['ch1_started', 'has_diary'],
      setFlag: 'ch1_done',
      title: '단서 보고',
      text: '당신은 낡은 일기장을 덤블도어 교수에게 보여준다.\n그는 눈을 가늘게 뜨며 말한다.\n"이건... 예전에 이 학교를 다녔던 누군가의 일기로군. 필체가 낯이 익어. 금지된 숲에 무언가 더 있을지도 모르겠네."',
      choices: [{ label: '금지된 숲을 조사하겠습니다', effect: { exp: 20 }, resultText: '금지된 숲으로 향하기로 결심했다.' }],
    },
    {
      id: 'ch2',
      requiresFlags: ['ch1_done', 'has_key'],
      setFlag: 'ch2_done',
      title: '2장. 금지된 숲의 흔적',
      text: '금지된 숲에서 찾은 녹슨 열쇠를 교수에게 보여주자, 그의 표정이 굳는다.\n"이 열쇠는... 오래전 봉인되었던 방으로 통하는 것일세. \'비밀의 방\'이라 불리던 곳이지. 자네가 가려는가?"',
      choices: [{ label: '제가 가겠습니다', effect: { flag: 'chamber_unlocked', exp: 25 }, resultText: '비밀의 방으로 가는 길이 열렸다.' }],
    },
    {
      id: 'ch3',
      requiresFlags: ['ch2_done', 'riddle_defeated'],
      setFlag: 'ch3_done',
      title: '3장. 그림자의 정체',
      text: '톰 리들의 환영을 물리친 뒤, 당신은 그 안에서 흘러나온 검은 안개가 무언가의 "잔영"임을 느낀다.\n덤블도어가 침통하게 말한다.\n"그것은... 볼드모트가 남긴 어둠의 파편일세. 완전히 소멸시켜야만 학생들이 안전해질 걸세."',
      choices: [{ label: '끝까지 가겠습니다', effect: { exp: 30 }, resultText: '마지막 결전을 준비한다.' }],
    },
  ],
};
