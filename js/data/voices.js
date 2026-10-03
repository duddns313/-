'use strict';
/* 영운의 속마음 — 성공률 숫자 대신 선택지에 보여 준다.
   평범한 장면(calm)과 위험한 장면(tense)의 말을 나눈다. 영운은 걱정이 많지만, 걱정을 작전으로 바꾸는 아이다.
   단계: sure(75%↑) · good(55~74) · shaky(35~54) · scared(35 미만)
   중요한 장면은 선택지에 voice: '…'를 직접 적는다. */

const VOICES = {
  calm: {
    courage: {
      sure:   ['어려울 거 없어. 먼저 말 걸면 돼.', '이 정도는 할 수 있어.', '망설일 이유가 없잖아.'],
      good:   ['조금 떨리지만, 해 보자.', '틀려도 큰일 나진 않아.', '먼저 나서는 쪽이 낫지.'],
      shaky:  ['괜히 나섰다가 이상해 보이면 어떡하지.', '목소리가 작게 나오면 어떡하지.', '사람들이 다 쳐다볼 텐데.'],
      scared: ['이건 좀… 자신이 없어.', '얼굴이 벌써 화끈거린다.', '하고 싶은데, 몸이 안 움직여.'],
    },
    wisdom: {
      sure:   ['이건 아는 거야.', '앞뒤가 딱 맞아.', '책에서 읽은 그대로야.'],
      good:   ['조금만 더 생각하면 알 것 같아.', '차근차근 따져 보자.', '비슷한 걸 어디서 봤는데.'],
      shaky:  ['헷갈린다. 둘 중 하나인데.', '확신은 없는데, 아마도.', '아는 척하다 틀리면 창피할 텐데.'],
      scared: ['이건 처음 보는 거야.', '머릿속이 하얘.', '하나도 모르겠어.'],
    },
    diligence: {
      sure:   ['천천히, 하던 대로.', '엄마가 김장할 때처럼. 하나씩.', '이런 건 꾸준히 하면 돼.'],
      good:   ['손은 느려도 정확하게.', '끝까지만 하면 돼.', '한 번 더 확인하자.'],
      shaky:  ['시간 안에 다 할 수 있을까.', '집중이 자꾸 흩어져.', '손이 마음을 못 따라가.'],
      scared: ['너무 많아. 끝이 안 보여.', '눈꺼풀이 무겁다.', '이걸 다 하려면 밤새야 해.'],
    },
    cunning: {
      sure:   ['표정만 잘 지키면 돼.', '저 사람이 뭘 원하는지 보여.', '이건 내 쪽이 한 수 위야.'],
      good:   ['반쯤은 진짜니까 괜찮아.', '타이밍만 맞추자.', '그럴듯하게만 말하면.'],
      shaky:  ['나 거짓말 잘 못하는데.', '눈을 피하면 끝이야.', '저 사람, 눈치가 빠른데.'],
      scared: ['얼굴에 다 쓰여 있을 거야.', '차라리 솔직한 게 나을지도.', '이건 안 통할 것 같아.'],
    },
    magic: {
      sure:   ['손끝이 따뜻하다. 될 거야.', '휘두르고, 튕기고. 쉬워.', '지팡이가 먼저 알고 있어.'],
      good:   ['손목 힘을 빼고.', '발음만 정확하게.', '연습한 대로만.'],
      shaky:  ['어제는 연기만 났는데.', '주문이 입에서 꼬일 것 같아.', '반쯤은 될 것 같은데…'],
      scared: ['아직 한 번도 성공 못 했어.', '이건 너무 어려운 마법이야.', '터지기만 안 하면 다행이야.'],
    },
  },
  tense: {
    courage: {
      sure:   ['무섭다. 그래도 발이 먼저 나간다.', '지금 물러서면 안 돼.', '심장이 뛴다. 좋은 쪽으로.'],
      good:   ['최악을 세 번 상상했어. 그래도 간다.', '다리가 떨려도 걸을 수는 있어.', '숨 한 번만 크게 쉬고.'],
      shaky:  ['잘못되면 어떡하지. 그래도.', '손에 땀이 난다.', '지금 안 가면 밤새 후회할 거야.'],
      scared: ['무릎이 말을 안 들어.', '이건… 정말 무서운데.', '도망치고 싶어. 그래도.'],
    },
    wisdom: {
      sure:   ['보인다. 빠져나갈 방법이.', '침착하게. 답은 있어.', '이건 계산이 돼.'],
      good:   ['생각할 시간이 몇 초밖에 없어.', '당황하지 말고, 순서대로.', '어딘가 틈이 있을 거야.'],
      shaky:  ['머리가 안 돌아가.', '생각이 자꾸 엉킨다.', '틀리면 되돌릴 수 없어.'],
      scared: ['아무것도 생각이 안 나.', '머릿속에 비명밖에 없어.', '이건 생각으로 해결될 일이 아니야.'],
    },
    diligence: {
      sure:   ['버티면 돼. 버티는 건 자신 있어.', '손을 놓지만 않으면 돼.', '조금만 더. 조금만.'],
      good:   ['숨 고르고, 끝까지.', '포기하는 게 더 무서워.', '이를 악물자.'],
      shaky:  ['힘이 빠진다.', '얼마나 더 버틸 수 있을까.', '손이 미끄러질 것 같아.'],
      scared: ['더는 못 버틸 것 같아.', '팔이 떨린다.', '눈앞이 흐려진다.'],
    },
    cunning: {
      sure:   ['저쪽은 아직 내 생각을 몰라.', '한 번만 속이면 돼.', '틈이 보인다.'],
      good:   ['떨리는 거 들키지 말자.', '침착한 척. 침착한 척.', '시선을 다른 데로 돌리면 돼.'],
      shaky:  ['들키면 끝이야.', '저 눈이 다 꿰뚫어 보는 것 같아.', '목소리가 떨리면 안 되는데.'],
      scared: ['이건 안 통해. 알고 있어.', '거짓말이 얼굴에 다 쓰였을 거야.', '다리가 먼저 도망치려고 해.'],
    },
    magic: {
      sure:   ['지팡이가 손에 꼭 맞는다.', '이 주문은 내 거야.', '손끝이 뜨겁다. 될 거야.'],
      good:   ['떨지 마. 손목만.', '연습한 대로. 연습한 대로.', '한 번이면 돼.'],
      shaky:  ['손이 떨려서 조준이 안 돼.', '이 상황에서 될까.', '주문이 목에 걸린다.'],
      scared: ['지팡이가 무겁다.', '실패하면 진짜 끝이야.', '손에 힘이 안 들어가.'],
    },
  },
};

/* 상황에 따라 바뀌는 속마음 */
const VOICE_CONTEXT = {
  tired:    ['너무 지쳤어. 그래도 한 번만 더.', '머리가 멍하다. 집중하자.', '눈꺼풀이 무거워. 정신 차려.'],
  memory:   ['「{name}」… 그때를 떠올리자.', '「{name}」. 한 번 해 봤잖아.', '「{name}」 생각이 난다. 할 수 있어.'],
  fresh:    ['늘 하던 방식 말고, 이번엔 다르게.', '이런 식으론 안 해 봤는데. 해 볼까.', '처음 해 보는 거라 오히려 설렌다.'],
  watched:  ['누가 보고 있는 것 같아.', '요즘 필치가 나만 쳐다보는 것 같은데.', '또 걸리면 정말 큰일인데.'],
};

/* 같은 사건·같은 선택지에서는 늘 같은 줄이 나오도록 문자열로 고르는 해시 */
function voiceHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function voiceTier(c) { return c >= 75 ? 'sure' : c >= 55 ? 'good' : c >= 35 ? 'shaky' : 'scared'; }

/* 선택지의 속마음 한 줄 */
function innerVoice(S, ev, index, choice, key, chance, bonuses) {
  const tier = voiceTier(chance);
  if (choice.voice) return { tier, text: Rules.text(S, choice.voice) };
  const seed = voiceHash(`${ev.id}#${index}#${S.turn}`);
  const pick = arr => arr[seed % arr.length];
  const st = Rules.stakes(S, choice);
  const tense = !!ev.tense || st.risk.some(r => /다칠|들킬/.test(r));
  const base = pick(VOICES[tense ? 'tense' : 'calm'][key][tier]);
  const mem = bonuses.find(b => b.value > 0 && /^💭/.test(b.label));
  if (mem && seed % 2 === 0) return { tier, text: pick(VOICE_CONTEXT.memory).replace('{name}', mem.label.replace(/^💭\s*/, '')) };
  if (bonuses.some(b => b.kind === 'watched') && seed % 2 === 1) return { tier, text: pick(VOICE_CONTEXT.watched) };
  if (S.res.heart <= 25 && seed % 3 === 0) return { tier, text: pick(VOICE_CONTEXT.tired) };
  if (bonuses.some(b => b.kind === 'fresh') && seed % 3 === 1) return { tier, text: pick(VOICE_CONTEXT.fresh) };
  return { tier, text: base };
}
