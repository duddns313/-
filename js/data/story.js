/* ===================== 메인 스토리 (교장실에서 진행) ===================== */

const STORY = {
  chapters: [
    {
      id: 'ch1',
      requiresFlags: [],
      setFlag: 'ch1_started',
      title: '1장. 이상한 소문',
      text: '덤블도어 교수가 근심 어린 얼굴로 말한다.\n"영운 양, 최근 학생들이 하나둘 실종되고 있다네. 복도와 도서관에서 단서를 찾아주겠나?"\n(도서관과 복도를 탐험하여 단서를 모아보세요)',
      choices: [
        { label: '곧바로 나서겠습니다', effect: { courage: 1, memory: 'approach_direct' }, resultText: '덤블도어가 흡족한 듯 고개를 끄덕인다. "역시 그리핀도르답구먼." 영운은 망설임 없이 조사에 나서기로 했다.' },
        { label: '신중하게 접근하겠습니다', effect: { intelligence: 1, memory: 'approach_careful' }, resultText: '"성급함은 화를 부르는 법이지." 덤블도어가 안경 너머로 웃는다. 영운은 단서 하나하나를 꼼꼼히 살피기로 마음먹었다.' },
        { label: '왜 하필 저입니까?', effect: { charm: 1, alignment: 1, memory: 'approach_questioning' }, resultText: '덤블도어의 눈이 잠시 반짝인다. "자네라면 눈에 띄지 않게 움직일 수 있을 테니까." 어딘가 석연치 않지만, 일단 조사를 시작하기로 했다.' },
      ],
    },
    {
      id: 'ch1_report',
      requiresFlags: ['ch1_started', 'has_diary'],
      setFlag: 'ch1_done',
      title: '단서 보고',
      text: '영운은 낡은 일기장을 덤블도어 교수에게 보여준다.\n그는 눈을 가늘게 뜨며 말한다.\n"이건... 예전에 이 학교를 다녔던 누군가의 일기로군. 필체가 낯이 익어. 영운 양, 금지된 숲에 무언가 더 있을지도 모르겠네."',
      choices: [
        { label: '이 일기의 주인이 누구인지 알아내겠습니다', effect: { intelligence: 1, exp: 20, memory: 'curious_about_diary' }, resultText: '덤블도어의 표정이 살짝 어두워진다. "…그건 나중에 이야기하지." 그는 말을 아끼며 숲으로 향하는 길을 알려준다.' },
        { label: '지금은 숲의 위협이 급선무입니다', effect: { courage: 1, exp: 20, memory: 'pragmatic_ch1' }, resultText: '"실용적인 판단이군." 덤블도어가 동의하며 금지된 숲으로 향하기로 결심했다.' },
        { label: '이 일기, 어쩐지 불길합니다…', effect: { exp: 20, alignment: 1, memory: 'wary_of_diary' }, resultText: '덤블도어가 잠시 침묵하더니 조용히 답한다. "그 직감, 틀리지 않았을 걸세." 영운은 찜찜함을 안고 금지된 숲으로 향하기로 했다.' },
      ],
    },
    {
      id: 'ch2',
      requiresFlags: ['ch1_done', 'has_key'],
      setFlag: 'ch2_done',
      title: '2장. 금지된 숲의 흔적',
      text: '금지된 숲에서 찾은 녹슨 열쇠를 교수에게 보여주자, 그의 표정이 굳는다.\n"이 열쇠는... 오래전 봉인되었던 방으로 통하는 것일세. \'비밀의 방\'이라 불리던 곳이지. 영운 양, 자네가 가려는가?"',
      choices: [
        { label: '제가 가겠습니다. 두렵지 않습니다', effect: { courage: 2, flag: 'chamber_unlocked', exp: 25, memory: 'brave_resolve' }, resultText: '단호한 대답에 덤블도어의 눈빛이 깊어진다. "그 용기, 잊지 않겠네." 비밀의 방으로 가는 길이 열렸다.' },
        { label: '무섭지만… 가야만 합니다', effect: { charm: 1, flag: 'chamber_unlocked', exp: 25, memory: 'honest_fear' }, resultText: '"두려움을 인정하는 것도 용기일세." 덤블도어가 나지막이 말한다. 떨리는 손으로, 비밀의 방으로 가는 길을 받아든다.' },
        { label: '혼자는 위험합니다. 친구들에게 부탁하겠습니다', effect: { companionAffinityAll: 3, flag: 'chamber_unlocked', exp: 25, memory: 'asked_for_help' }, resultText: '"혼자 짊어지지 않으려는 것도 지혜로군." 덤블도어가 고개를 끄덕인다. 친구들에게 사정을 알리자, 다들 걱정 어린 얼굴로 힘을 보태겠다 했다. 비밀의 방으로 가는 길이 열렸다.' },
      ],
    },
    {
      id: 'ch3',
      requiresFlags: ['ch2_done', 'riddle_defeated'],
      setFlag: 'ch3_done',
      title: '3장. 그림자의 정체',
      text: '톰 리들의 환영을 물리친 뒤, 영운은 그 안에서 흘러나온 검은 안개가 무언가의 "잔영"임을 느낀다.\n덤블도어가 침통하게 말한다.\n"그것은... 볼드모트가 남긴 어둠의 파편일세. 영운 양, 완전히 소멸시켜야만 학생들이 안전해질 걸세."',
      choices: [
        { label: '끝까지 가겠습니다', effect: { courage: 1, exp: 30, memory: 'solo_resolve' }, resultText: '덤블도어가 어깨에 손을 얹는다. "자네라면 해낼 걸세." 영운은 홀로 마지막 결전을 준비한다.' },
        { label: '제 힘만으로는 부족할 것 같습니다. 함께해 주세요', effect: { companionAffinityAll: 5, exp: 30, memory: 'asked_companions_final' }, resultText: '"혼자가 아니라는 걸 아는 것, 그것도 강함일세." 덤블도어가 미소 짓는다. 친구들이 곁에 서겠다고 약속했다. 함께 마지막 결전을 준비한다.' },
        { label: '두렵지만, 물러설 수 없습니다', effect: { exp: 30, alignment: 1, memory: 'afraid_but_resolute' }, resultText: '"두려움 앞에서도 나아가는 것, 그것이 진짜 용기일세." 덤블도어의 말에 힘을 얻어, 영운은 떨리는 마음을 다잡고 마지막 결전을 준비한다.' },
      ],
    },
  ],
};
