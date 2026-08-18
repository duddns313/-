/* ===================== 이름 조각 =====================
 * 라비니아 애슈는 완전히 지워져 있다. 명부에 ▓▓▓▓ ▓▓ 로만 남는다.
 *
 * 조각은 판이 아니라 「기록」에 쌓인다 — 회차를 넘어 남는 유일한 것.
 * 여섯 개가 모두 모여야 최종 대면에서 「이름을 부른다」가 열린다. */

const NAME_FRAGMENTS = [
  { n: 1, key: 'surname', label: '성(姓)',      hint: '기념비 세 번째 줄, 매끄러운 자리를 손으로 만져본다' },
  { n: 2, key: 'house',   label: '기숙사',      hint: '회색 여인은 그 아이가 어느 식탁에 앉았는지 안다' },
  { n: 3, key: 'initial', label: '첫 글자',     hint: '손으로 쓴 것은 남는다. 수첩을 해독한다' },
  { n: 4, key: 'face',    label: '얼굴',        hint: '아무도 없는 쪽을 보고 웃는 사진 속 사람들' },
  { n: 5, key: 'rest',    label: '나머지 글자', hint: '서고 안쪽, 잠기지 않은 서랍' },
  { n: 6, key: 'voice',   label: '목소리',      hint: '앞의 다섯을 모두 쥔 채 그 앞에 서면' },
];

/* 조각 보유 상태에 따른 라비니아의 표시 이름.
 * 이름이 조금씩 돌아오는 것을 플레이어가 눈으로 본다. */
function laviniaDisplayName() {
  const has = (n) => ledgerHasFragment(n);
  const given = has(3) && has(5) ? '라비니아'
    : has(3) ? '라▓▓▓'
    : '▓▓▓▓';
  const surname = has(1) ? '애슈' : '▓▓';
  const house = has(2) ? ' (레번클로)' : '';
  return given + ' ' + surname + house;
}

function fragmentCount() {
  return NAME_FRAGMENTS.filter((f) => ledgerHasFragment(f.n)).length;
}

function canCallTheName() {
  return fragmentCount() >= 6;
}
