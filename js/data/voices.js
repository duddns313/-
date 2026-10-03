'use strict';
/* 영운의 속마음 — 성공률 숫자 대신 선택지에 보여 준다.
   능력치 × 자신감 단계마다 여러 줄을 두고, 사건·선택지마다 다른 줄이 나오게 고른다.
   단계: sure(75%↑) · good(55~74) · shaky(35~54) · scared(35 미만) */

const VOICES = {
  courage: {
    sure:   ['겁나긴 하는데, 발이 먼저 나가겠다.', '이건 내가 할 일이야.', '심장이 뛴다. 좋은 쪽으로.', '망설일 이유가 없어.'],
    good:   ['무섭지만… 가자.', '숨 한 번만 크게 쉬고.', '부딪히면 그때 생각하자.', '다리가 떨려도 걸을 수는 있어.'],
    shaky:  ['잘못되면 어떡하지. 그래도.', '손에 땀이 난다.', '최악을 세 번 상상했어. 그래도 간다.', '지금 물러서면 밤새 후회할 거야.'],
    scared: ['이건… 정말 무서운데.', '무릎이 말을 안 들어.', '병뚜껑을 꽉 쥐었다.', '누가 옆에 있었으면.'],
  },
  wisdom: {
    sure:   ['답이 보인다.', '이건 책에서 읽은 거야.', '앞뒤가 딱 맞아.', '머릿속이 맑다.'],
    good:   ['거의 알 것 같아.', '조각이 하나만 더 있으면.', '천천히 생각하면 돼.', '일기장 뒷장에 비슷한 걸 적었었는데.'],
    shaky:  ['어디서 봤더라…', '헷갈린다. 둘 중 하나인데.', '확신은 없는데, 아마도.', '헤르미온느라면 바로 알 텐데.'],
    scared: ['하나도 모르겠어.', '머릿속이 하얘.', '이건 찍는 거나 마찬가지야.', '아는 척하면 안 되는데.'],
  },
  diligence: {
    sure:   ['천천히, 하던 대로.', '이건 꾸준히 하면 돼.', '엄마가 김장할 때처럼. 하나씩.', '서두를 필요 없어.'],
    good:   ['끝까지 하면 될 거야.', '손은 느려도 정확하게.', '포기만 안 하면 돼.', '한 번 더 확인하자.'],
    shaky:  ['시간이 부족한데…', '집중이 자꾸 흩어져.', '이걸 다 할 수 있을까.', '손이 마음을 못 따라가.'],
    scared: ['너무 지쳤어.', '끝이 안 보여.', '눈꺼풀이 무겁다.', '버틸 수 있을까.'],
  },
  cunning: {
    sure:   ['이건 내 쪽이 한 수 위야.', '표정만 잘 지키면 돼.', '저 사람이 뭘 원하는지 보여.', '빠져나갈 길이 보인다.'],
    good:   ['그럴듯하게만 말하면.', '눈 피하지 말고.', '반쯤은 진짜니까 괜찮아.', '타이밍만 맞추자.'],
    shaky:  ['들키면 어떡하지.', '목소리가 떨리면 끝이야.', '저 사람, 눈치가 빠른데.', '나 거짓말 잘 못하는데.'],
    scared: ['이건 안 통할 것 같아.', '얼굴에 다 쓰여 있을 거야.', '맥고나걸 교수님 눈이 떠오른다.', '차라리 솔직한 게 나을지도.'],
  },
  magic: {
    sure:   ['손끝이 따뜻하다. 될 거야.', '지팡이가 먼저 알고 있어.', '휘두르고, 튕기고. 쉬워.', '이번엔 확실해.'],
    good:   ['손목 힘을 빼고.', '발음만 정확하게.', '연습한 대로만.', '지팡이를 믿자.'],
    shaky:  ['어제는 연기만 났는데.', '주문이 입에서 꼬일 것 같아.', '플리트윅 교수님 말씀이 뭐였더라.', '반쯤은 될 것 같은데…'],
    scared: ['아직 한 번도 성공 못 했어.', '지팡이가 차갑다.', '이건 너무 어려운 마법이야.', '터지기만 안 하면 다행이야.'],
  },
};

/* 상황에 따라 앞에 붙는 속마음 */
const VOICE_CONTEXT = {
  lowHeart: ['요즘 너무 지쳤어. 그래도…', '자꾸 집 생각이 난다.', '오늘은 커튼 치고 울고 싶은데.', '마음이 무거워.'],
  fresh:    ['이런 식으론 안 해 봤는데, 해 볼까.', '늘 하던 방식 말고.', '처음 해 보는 거라 오히려 설렌다.', '호현이라면 이렇게 했을 거야.'],
  helped:   ['{name}… 그때도 해냈잖아.', '{name}. 그걸 기억하면 할 수 있어.', '{name} 덕분에 조금 덜 무서워.', '{name}이 떠오른다.'],
};

/* 같은 사건·같은 선택지에서는 늘 같은 줄이 나오도록 문자열로 고르는 해시 */
function voiceHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function voiceTier(c) {
  return c >= 75 ? 'sure' : c >= 55 ? 'good' : c >= 35 ? 'shaky' : 'scared';
}

/* 선택지의 속마음 한 줄 */
function innerVoice(S, evId, index, key, chance, bonuses) {
  const seed = voiceHash(`${evId}#${index}#${S.turn}`);
  const pick = arr => arr[seed % arr.length];
  const tier = voiceTier(chance);
  const base = pick(VOICES[key][tier]);
  const helper = bonuses.find(b => b.value > 0 && b.kind !== 'fresh');
  if (helper && seed % 3 !== 0) {
    const name = helper.label.replace(/^[^\s]+\s/, '');
    return { tier, text: pick(VOICE_CONTEXT.helped).replace('{name}', `「${name}」`) + ' ' + base };
  }
  if (S.res.heart <= 30 && seed % 2 === 0) return { tier, text: pick(VOICE_CONTEXT.lowHeart) + ' ' + base };
  if (bonuses.some(b => b.kind === 'fresh') && seed % 2 === 1) return { tier, text: pick(VOICE_CONTEXT.fresh) };
  return { tier, text: base };
}
