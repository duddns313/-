# 소설형(비주얼노벨) 개편 계획서 — v4

> 이 문서는 **실행용 지시서**입니다. 위에서부터 순서대로 따라가면 됩니다.
> 이전 계획서(`UPGRADE_PLAN.md`, `DEPTH_PLAN.md`)의 시스템 설계는 대부분 유효하며,
> 이 문서는 그 위에 **구조와 화면만 갈아끼우는** 작업을 규정합니다.

---

## 0. 배경 — 사용자 지적 3건과 실측 진단

| # | 지적 | 실측 결과 |
|:-:|---|---|
| 1 | "화면 UI가 안 이뻐. 한 페이지에 모험창이 다 보이는 게 좋아" | 본문이 `#log-recent`(max-height **180px**, overflow-scroll, **최근 6줄만 유지**)에 갇혀 있음. 소설을 읽는 화면이 아니라 콘솔 로그 화면 |
| 2 | "선택지에 같은 능력을 테스트하면 안 돼. 여러 능력으로 고를 수 있어야" | 전체 55개 이벤트 중 **28개가 선택지 1개뿐**. 판정 포함 25개 중 `boggart_encounter`는 **선택지 4개 전부 용기 판정** |
| 3 | "이동하는 재미 구현이 어려우면 차라리 선형구조. 소설형 스토리텔링, 책 읽는 비주얼노벨처럼" | 본문 길이 **중앙값 36자**, 40자 미만이 55개 중 31개. 텍스트 게임인데 읽을 텍스트가 없음 |

**세 지적의 뿌리는 하나입니다.** 지금 게임은 "맵을 배회하며 짧은 로그를 뽑는 기계"이고,
사용자가 원하는 건 "읽는 소설"입니다. 구조·화면·문장을 함께 바꿔야 합니다.

### 판단

이동의 재미를 살리는 방향(§DEPTH_PLAN §11)은 미니맵·목적지 힌트·구역 비용까지 구현했으나
**플레이 결과 재미가 없다는 판정을 받았습니다.** 텍스트 게임에서 맵 배회를 재미있게 만드는 건
난이도가 높고, 무엇보다 **이 게임의 수용자는 해리포터 "소설"을 좋아하는 분**입니다.
선형 비주얼노벨 구조가 강점과 정확히 맞습니다. **선형 전환을 채택합니다.**

---

## 1. 목표 형태 (한 문장)

> **장면(Scene)이 한 페이지 가득 소설처럼 흐르고, 문단 끝에서 서로 다른 능력으로 접근하는
> 3개의 선택지를 고르면, 결과가 이어 붙고 [계속]으로 다음 장면으로 넘어간다.**

---

## 2. 유지 / 폐기 목록

### 유지 (건드리지 말 것)
- `js/systems/check.js` — 판정 시스템 (기억 보정 포함)
- `js/systems/item.js`, `loot.js` — 희귀도·감정·강화
- `js/systems/spell.js` — 주문 습득·숙련도
- `js/systems/achievement.js` — 업적·칭호·도감
- `js/systems/settings.js` — 타자 속도·연출 줄이기 (**접근성은 타협 불가**)
- `js/data/` — houses, rarity, spells, enemies, endings, achievements, companions, memories
- `engine.js`의 전투 일체 (`startCombat`, `combatCastSpell`, `enemyTurn`, `winCombat`, `loseCombat`, `companionAssist`)
- 기억(memory)·연속도전(streak)·동료 호감도·성향·엔딩 판정 로직

### 폐기 (코드 삭제)
| 대상 | 파일 | 사유 |
|---|---|---|
| `travelTo()`, `hasMarauderMap()` 이동 비용 | engine.js | 맵 폐기 |
| `explore()`, `eligibleEventsFor()`, `getLocationHint()` | engine.js | 랜덤 탐험 폐기 |
| `renderTravel()`, `openMinimapSheet()`, `renderLocationBanner()` | ui.js | 맵 UI 폐기 |
| `renderQuestLog()`, `getActiveQuestLog()` | ui.js, engine.js | 챕터 배너가 대체 |
| `#travel-row`, `#quest-log`, `#location-banner`, `#log-recent` | index.html | 아래 §4로 대체 |
| `.btn-travel-card`, `.minimap-*`, `.quest-log-*`, `#log-recent` | style.css | 위와 동일 |
| `LOCATIONS.connections`, `zone`, `ZONE_LABELS` | data/locations.js | 좌표 개념 폐기. `name`/`desc`만 남겨 장면 배경 문구로 사용 |
| `EVENTS` 전체 | data/events.js | **문장을 수확한 뒤** 파일 삭제 (§7 참조) |

### 용도 변경
- **도둑 지도(`marauderMap`)**: 이동 비용 할인 → **야간 잠입 장면 해금 키**로 변경
- **마감(deadline)**: 탐험 횟수 압박 → **허브에서 여유 활동을 몇 번 할 수 있는지의 압박** (§6)

---

## 3. 장면(Scene) 데이터 규격 ⭐

**신규 파일 `js/data/scenes.js`** — 게임의 모든 내용이 여기 들어갑니다.

```js
const SCENES = {
  ch1_summon: {
    id: 'ch1_summon',

    /* ── 표시 ── */
    chapter: '1장 · 이상한 소문',   // 값이 바뀔 때만 화면에 챕터 배너를 띄운다
    place: '교장실',                // 본문 위 작은 배경 표기 (없으면 생략)
    time: 'evening',               // 'morning'|'noon'|'evening'|null → 🌅☀️🌙 아이콘

    /* ── 본문: 빈 줄로 문단 구분. §8 문체 사양 준수 ── */
    text: `문단 1.\n\n문단 2.\n\n문단 3.`,

    /* ── 회상 (선택) ── */
    recall: 'saved_hermione',
    recallText: '트롤에게서 헤르미온느를 구했던 그날 밤이 스친다.',
    // 또는 기억별로 다른 문구:
    recallOptions: { fear_spider: '...', fear_darkness: '...' },

    /* ── 진입 시 처리 (선택) ── */
    onEnterEffect: { flag: 'ch1_started', exp: 5 },

    /* ── 전투 (선택): 본문 출력 후 전투 진입, 승리 시 next로 ── */
    combat: 'riddleShade',
    combatWinNext: 'ch3_report',
    combatLoseNext: 'hub3',        // 생략 시 기존 loseCombat 처리

    /* ── 선택지: §5 규칙 필수 준수 ── */
    choices: [
      {
        label: '정면으로 부딪친다',
        check: { stat: 'courage', dc: 7, bonusPercent: 0 },
        requiresMemory: 'saved_hermione',   // 선택 (없으면 선택지 자체가 숨겨짐)
        requiresItem: 'marauderMap',        // 선택
        requiresGold: 20,                   // 선택
        outcomes: {
          critical: { text: '2~3문장', effect: { courage: 1, exp: 12 }, next: 'ch1_a' },
          success:  { text: '2~3문장', effect: { exp: 8 },              next: 'ch1_a' },
          fail:     { text: '2~3문장', effect: {},                      next: 'ch1_b' },
          fumble:   { text: '2~3문장', effect: { hp: -6 },              next: 'ch1_b' },
        },
        /* 연속 도전형 (선택) — 기존 streak 메커니즘 재사용 */
        streakId: 'patronusTrial', streakTarget: 3,
        streakReward: { ... }, streakRewardText: '...',
      },
      {
        label: '책에서 답을 찾는다',
        check: { stat: 'intelligence', dc: 6 },
        outcomes: { /* ... */ },
      },
      /* 판정 없는 안전 선택지는 1개까지 허용 */
      { label: '오늘은 물러난다', effect: {}, resultText: '2~3문장', next: 'hub1' },
    ],

    /* ── 선택지가 없을 때: 본문만 보여주고 [계속]으로 진행 ── */
    next: 'hub1',

    /* ── 허브 활동 장면 표시용 ── */
    costDay: true,                 // 진입 시 하루 소모
    hubLabel: '도서관에서 공부한다', // 허브 메뉴에 뜨는 이름
    hubDesc: '지식이 오른다',        // 허브 메뉴 부연
    repeatable: true,              // 여러 번 고를 수 있는가 (기본 false)
    requiresFlag / notFlag / requiresFn,  // 허브 노출 조건
  },
};
```

### 라우팅 규칙
1. `choices`가 있으면 선택 → 결과 텍스트가 **같은 페이지에 이어 붙고** 선택지는 사라짐 → `[계속 ▸]`
2. `[계속]`을 누르면 `outcome.next` (없으면 `choice.next`, 없으면 `scene.next`)로 이동
3. `choices`가 없으면 본문 뒤에 바로 `[계속 ▸]` → `scene.next`
4. `next`가 `'HUB'` 문자열이면 현재 챕터의 허브로 복귀 (`state.currentHub`)
5. `next`가 없고 `choices`도 없으면 → 엔딩 트리거

---

## 4. 화면 설계 — 읽는 페이지 ⭐

### 4-1. 구조 (index.html · 모험 탭)

```html
<section id="panel-adventure" class="tab-panel">
  <div id="scene-page">
    <div id="scene-chapter"></div>   <!-- 챕터가 바뀔 때만 표시 -->
    <div id="scene-place"></div>     <!-- 교장실 · 🌙 저녁 -->
    <div id="scene-body"></div>      <!-- 문단들이 여기 쌓인다 -->
    <div id="scene-choices"></div>   <!-- 선택지 또는 [계속] -->
  </div>
</section>
```

- `#log-recent`, `#stage-area`, `#travel-row`, `#location-banner`, `#quest-log` **전부 삭제**
- 상단바는 **슬림하게**: `11월 3일 · 🌙` / `D-12` / `⚙` 만. HP·MP 미니바는 **전투 중에만** 표시
  (읽는 동안 게이지가 위에서 계속 보이면 소설 화면이 아니게 됨. 캐릭터 탭에 항상 있음)

### 4-2. 타이포그래피 (핵심 — "안 이뻐"의 직접 해결)

```css
#scene-page {
  max-width: 42em;
  margin: 0 auto;
  padding: 18px 20px calc(100px + var(--safe-bottom));
}

#scene-chapter {
  text-align: center;
  color: var(--gold);
  font-size: 1.05rem;
  letter-spacing: 0.08em;
  margin: 10px 0 22px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

#scene-place {
  color: var(--text-dim);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  margin-bottom: 18px;
}

.scene-para {
  font-family: 'Noto Serif KR', 'Apple SD Gothic Neo', 'Nanum Myeongjo', Georgia, serif;
  font-size: 1.05rem;
  line-height: 1.95;          /* ← 소설 느낌의 핵심 */
  margin: 0 0 1.15em;
  color: var(--text);
  word-break: keep-all;        /* ← 한국어 어절 단위 줄바꿈 (매우 중요) */
  overflow-wrap: break-word;
}

.scene-para.dialogue { color: #f0e6c8; }        /* "따옴표" 로 시작하는 문단 */
.scene-para.result   { color: var(--green); }   /* 선택 결과 문단 */
.scene-para.result.bad { color: #d98a8a; }      /* 실패/대실패 결과 */

#scene-choices { margin-top: 26px; padding-top: 18px; border-top: 1px solid var(--border); }
```

- **`word-break: keep-all`** 을 반드시 넣을 것. 없으면 한국어가 글자 단위로 끊겨 지저분해집니다.
- 폰트는 전부 시스템 폰트 폴백입니다. **외부 폰트 다운로드 금지** (오프라인·PWA 유지)

### 4-3. 선택지 카드

```
─────────────────────────────
  정면으로 부딪친다
  용기 · 성공률 72%
─────────────────────────────
  책에서 답을 찾는다
  지식 · 성공률 45%
─────────────────────────────
  루나에게 물어본다
  매력 · 성공률 60%   💭 기억 보정 +15%
─────────────────────────────
```

```css
.choice-card {
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  width: 100%; text-align: left;
  padding: 14px 16px; margin-bottom: 8px;
  background: var(--bg-panel-alt); border: 1px solid var(--border); border-radius: 10px;
}
.choice-label { font-size: 1rem; line-height: 1.5; }
.choice-meta  { font-size: 0.78rem; color: var(--text-dim); }
.choice-meta .rate-high { color: var(--green); }   /* ≥65% */
.choice-meta .rate-mid  { color: var(--gold); }    /* 40~64% */
.choice-meta .rate-low  { color: var(--red); }     /* <40% */
```

성공률에 색을 입혀 **한눈에 자기 강점을 고를 수 있게** 하는 게 이번 개편의 요점입니다.

### 4-4. 페이지 흐름 (VN 페이싱)

1. 장면 진입 → `#scene-body` **비우고** 본문 문단을 §8 타자 효과로 하나씩 출력
2. 출력 끝나면 `#scene-choices`에 선택지 카드
3. 선택 → 판정 연출 → **결과 문단이 `#scene-body`에 이어 붙음** + 효과 칩
4. 선택지 영역이 `[계속 ▸]` 버튼으로 교체
5. `[계속]` → 다음 장면 (1번으로)

> 화면을 지우는 시점은 **`[계속]`을 누른 뒤**입니다. 결과를 못 읽고 넘어가는 일이 없어야 합니다.

- 화면 아무 곳이나 탭하면 타자 즉시 완료 (기존 `skipTypewriters` 유지)
- 이전 장면 텍스트는 **기록 탭**에 계속 누적 (이미 `#log-full`이 함), 되돌아 읽기 가능
- ⚠ 장면 전환에 **슬라이드·흔들림 금지**. 허용: opacity 페이드 200ms, 그리고 `연출 줄이기` 시 즉시 전환

---

## 5. 선택지 설계 규칙 ⭐ (지적 #2의 해결)

### 규칙 (예외 없음)

1. **판정이 붙은 선택지는 장면당 최소 2개, 서로 다른 스탯이어야 한다.** 같은 스탯 중복 금지.
2. 권장 형태: **판정 3개(서로 다른 스탯) + 판정 없는 안전 선택지 1개**
3. 판정 없는 선택지는 장면당 최대 1개. (전부 무판정이면 그건 선택이 아니라 분기 없는 확인)
4. 선택지 1개짜리 장면은 **`choices`를 쓰지 말고 `next`로 처리**한다. (버튼 하나 누르게 하지 말 것)

### 5스탯의 접근 방식 사전

각 장면은 아래 5가지 중 **3가지를 골라** 같은 상황을 다르게 풀게 만듭니다.

| 스탯 | 접근 | 문장 톤 |
|---|---|---|
| **지식** | 분석·추론·지식 인용 | 관찰하고 따져본다 |
| **용기** | 정면 돌파·맞선다 | 물러서지 않는다 |
| **매력** | 설득·부탁·달랜다 | 상대의 마음을 움직인다 |
| **민첩** | 몰래·재빠르게·회피 | 들키지 않고 움직인다 |
| **행운** | 직감·도박·요행 | 근거는 없지만 끌린다 |

### 즉시 고쳐야 할 위반 사례

- `boggart_encounter` — 4선택 전부 `courage`.
  → **두려움 선택(무엇으로 변하는가)과 대처 방법(어떤 능력으로 이기는가)을 분리**할 것.
  장면 A에서 두려움 4종 중 선택(판정 없음, memory만 기록) → 장면 B에서
  `용기(맞선다)/지식(보가트의 본질을 떠올린다)/매력(웃음으로 바꾼다)` 3판정.

### DC 가이드

| 상황 | DC |
|---|:-:|
| 초반(1장) 일상 | 5~6 |
| 중반(2~3장) | 7~9 |
| 대형 이벤트·체인 | 9~11 |
| 시련 | 12~14 |

---

## 6. 시간·마감의 새 역할 — 허브 ⭐

선형이라고 시간 압박을 버리면 §DEPTH_PLAN §1·§18의 작업이 통째로 죽습니다. **허브로 살립니다.**

```
        ┌──────────── 메인 라인 (선형) ────────────┐
ch1_summon → hub1 → ch1_library → ch1_diary → ch1_report → ch2_open → hub2 → …
                ↕
        허브: "이번 주를 어떻게 보낼까"
          · 수업을 듣는다            (1일)
          · 도서관에서 공부한다       (1일)
          · 헤르미온느와 시간을 보낸다 (1일)
          · 호그스미드에 다녀온다     (1일)
          · 금지된 숲에 들어간다      (1일, 전투)
          · ▶ 조사를 진행한다         (메인 라인으로 — 하루 소모 없음)
```

- 허브 활동 = **1일 소모**. 마감(D-day)이 있으므로 "몇 번이나 여유를 부릴 수 있는가"가 결정이 됨
- 메인 라인 진행은 무료 → **"급하면 바로 진행, 여유되면 성장"** 이라는 명확한 트레이드오프
- `state.timeSlot`(하루 3시간대)는 **폐기**하고 **하루 단위**로 단순화.
  선형에서는 시간대까지 쪼갤 이유가 없고, 오히려 계산 부담만 늘어남
- 페퍼업 포션 / 아침 식사 = **하루를 소모하지 않고 활동 1회** 로 의미 변경 (골드↔시간 교환은 유지)
- 마감 초과 페널티(보스 강화 · 엔딩 강등)는 **그대로 유지**

### 허브 화면
허브도 하나의 장면입니다. 본문(그 주의 분위기를 묘사하는 짧은 프롤로그)을 쓰고,
선택지 자리에 활동 목록을 냅니다. 각 활동 카드에는 `(하루 소모)` 표기와 `hubDesc`를 붙입니다.
메인 라인 항목은 `▶` 를 붙이고 **맨 위**에 고정합니다.

---

## 7. 콘텐츠 매니페스트 (약 45장면)

> 기존 `js/data/events.js`의 **문장은 재료로 수확**하되, §8 사양에 맞춰 다시 씁니다.
> 잡 이벤트(갈레온 줍기 등)는 **되살리지 말고 폐기**합니다. 개수보다 밀도입니다.

### 프롤로그
| ID | 내용 |
|---|---|
| `p_arrival` | 호그와트 도착, 분류 모자 (기숙사 선택 결과를 받아 텍스트 분기) |

### 1장 · 이상한 소문 (마감 30일)
| ID | 선택지 스탯 | 내용 |
|---|---|---|
| `ch1_summon` | 용기/지식/매력 | 덤블도어의 의뢰 |
| `hub1` | — | 허브 |
| `ch1_library` | 지식/민첩/행운 | 도서관 금서 구역 조사 |
| `ch1_corridor` | 민첩/용기/매력 | 심야 복도, 반장·피브스 |
| `ch1_diary` | 지식/행운/용기 | 낡은 일기장 발견 |
| `ch1_report` | 지식/용기/매력 | 덤블도어에게 보고 |

### 2장 · 금지된 숲의 흔적 (마감 40일)
| ID | 선택지 스탯 | 내용 |
|---|---|---|
| `ch2_open` | — | 숲으로 향한다 |
| `hub2` | — | 허브 |
| `ch2_forest_edge` | 용기/민첩/지식 | 숲 입구, 이상한 기척 |
| `ch2_centaur` | 매력/지식/용기 | 켄타우로스 조우 (별점 대화) |
| `ch2_key` | 행운/지식/민첩 | 녹슨 열쇠 발견 |
| `ch2_report` | 용기/매력/지식 | 보고 |

### 3장 · 그림자의 정체 (마감 50일)
| ID | 선택지 스탯 | 내용 |
|---|---|---|
| `ch3_open` | — | 비밀의 방 입구 |
| `hub3` | — | 허브 (마지막 준비) |
| `ch3_descent` | 용기/민첩/지식 | 하강, 뱀 조각상 |
| `ch3_riddle` | — | **전투: `riddleShade`** |
| `ch3_report` | 지식/매력/용기 | 잔영의 정체를 듣는다 |

### 4장 · 최후 (마감 없음)
| ID | 내용 |
|---|---|
| `ch4_open` | 결전 전야 (동료가 있으면 텍스트 분기) |
| `hub4` | 마지막 준비 허브 |
| `ch4_final` | **전투: `voldemortShadow`** |
| `ch4_ending` | 엔딩 분기 → `triggerEnding()` |

### 허브 활동 (반복 가능, 1일)
| ID | 내용 |
|---|---|
| `act_class` | 수업 — 4과목 중 선택 → 진도/주문 습득 |
| `act_study` | 도서관 공부 — 지식 판정 |
| `act_hogsmeade` | 호그스미드 — 상점 시트 열기 |
| `act_forest_hunt` | 숲 사냥 — 랜덤 전투 + 파밍 |
| `act_rest` | 휴식 — 체력·마력 회복 |
| `act_friend_hermione` / `_ron` / `_luna` / `_neville` | 동료와 시간 (호감도, 서로 다른 스탯 판정) |

### 원작 대형 이벤트 (조건부로 허브에 등장, 1회성)
| ID | 조건 | 내용 |
|---|---|---|
| `big_halloween_troll` | 1장 진행 후 | 트롤 — 구하러 간다(용기)/주문으로 막는다(지식)/사람을 부른다(매력) · `memory: saved_hermione` |
| `big_quidditch` | 2장 후 | 퀴디치 — 출전(민첩)/응원(매력)/관찰(지식) |
| `big_yule_ball` | 3장 후 | 무도회 — 함께 가기 |

### 체인 ① 보가트 → 패트로누스
| ID | 내용 |
|---|---|
| `chain_boggart_a` | 두려움 4종 선택 (**판정 없음**, memory만) |
| `chain_boggart_b` | 대처 — 용기/지식/매력 3판정 |
| `chain_dementor` | 숲에서 디멘터 조우 (회상 배너) — **전투: `dementor`** |
| `chain_patronus_train` | 루핀의 수련 — **연속 3회** (streak) |
| `chain_trial_patronus` | 시련 — 연속 3회, DC 12 → **성물 `patronusCharm` + 디멘터 무효** |

### 사이드 (허브 조건부)
| ID | 내용 |
|---|---|
| `side_neville_ask` / `_find` / `_return` | 네빌의 교과서 |
| `side_hagrid_ask` / `_herb` / `_return` | 해그리드의 부탁 |

### 따뜻한 장면 (실패 페널티 없음 — 쉼표 역할)
| ID | 내용 |
|---|---|
| `warm_crookshanks` | 도서관, 무릎 위의 크룩섕스 |
| `warm_hedwig` | 부엉이장 |
| `warm_dobby` | 도비와 양말 |
| `warm_mirror` | **소망의 거울** — 무엇이 보이는가 4선택 → memory → **엔딩 텍스트에 반영** |

> `warm_mirror`는 선물용 게임에서 가장 감정적으로 남을 장면입니다. 제일 정성껏 쓸 것.

---

## 8. 문체 사양 (DEPTH_PLAN §15 승계 — 요약)

**3박자: 감각 → 인지 → 반응**
1. 소리·빛·냄새·촉감으로 시작. *무엇인지 모른 채* 먼저 느낀다
2. 정체가 드러난다. **고유명사는 여기서 처음** 등장
3. 영운의 신체 반응이나 짧은 내면

**분량**
| 종류 | 문단 |
|---|---|
| 챕터 도입·전투 진입·대형 이벤트 | **5~8문단** |
| 일반 장면 | 4~6문단 |
| 허브 프롤로그 | 2~3문단 |
| 판정 결과(각 tier) | **2~3문장** |

**금지**
- ❌ `갑자기`, `~가 나타났다!`, `~가 소란을 피운다` 같은 요약형 서술
- ❌ 첫 문장에 고유명사 노출
- ❌ 느낌표 남발 (장면당 1개 이하)
- ❌ **본문 안에 수치 표기** — `logResultWithEffect()`가 칩으로 자동 생성 (이미 구현됨)

**호칭**: 주인공은 **윤영운**, 부를 때 **"영운 양"** / "영운아". (아내분께 드리는 선물 — `영운 군` 절대 금지)

**참고**: `DEPTH_PLAN.md` §15-4에 콘월 픽시·갈레온 줍기·피브스·크룩섕스 개작 예시가 있으니 톤 기준으로 삼을 것.

---

## 9. 세이브 처리

- `CURRENT_SAVE_VERSION` → **9**, `MIN_COMPATIBLE_VERSION` → **9** (구조가 근본적으로 달라 이관 불가)
- 기존 세이브는 "호환되지 않아 정리했습니다" 토스트 후 삭제 (이미 `hasIncompatibleSave()` 구현됨)
- **아직 아내분이 플레이하지 않았으므로 깨뜨려도 무방**
- state 필드 변경:
  - 추가: `sceneId`(현재 장면), `currentHub`(복귀 지점), `seenScenes:{}`, `visitedChapter`
  - 삭제: `location`, `visitedLocations`, `timeSlot`, `bonusSlotsToday`, `pendingEvent`, `mode:'explore'`
  - `mode`: `'scene' | 'combat' | 'shop' | 'ending'` 로 축소

---

## 10. 구현 순서 + 커밋 지점

> 각 단계 끝에서 **`node --check` → Playwright 스모크 → 커밋 → 푸시**.
> 브랜치: `claude/harry-potter-text-game-9g5ffz`

| # | 작업 | 커밋 메시지(안) |
|:-:|---|---|
| **1** | `js/systems/scene.js` 신규 — `goToScene()`, `resolveSceneChoice()`, `continueScene()`, `enterHub()`, `hubOptionsFor()`. 라우팅(§3)만 먼저, 콘텐츠는 더미 3장면 | 장면 엔진 도입 (선형 구조 기반) |
| **2** | 화면 개편 — index.html/style.css/ui.js. §4 전부. 폐기 목록(§2)의 UI 코드 삭제 | 읽는 페이지로 화면 개편 — 소설형 레이아웃 |
| **3** | state/세이브 v9 (§9), 마감을 하루 단위로 단순화 (§6) | 상태 구조를 장면 기반으로 전환 (세이브 v9) |
| **4** | **1장 전체 + hub1 + 허브 활동 6종** 집필. 여기서 사용자에게 한 번 보여주고 방향 확인 | 1장 및 허브 콘텐츠 집필 |
| **5** | 2·3·4장 + 엔딩 연결 | 2~4장 메인 라인 집필 |
| **6** | 대형 이벤트 3 + 체인① 5 + 시련 | 대형 이벤트·체인·시련 집필 |
| **7** | 사이드 4 + 따뜻한 장면 4 (`warm_mirror` 포함) | 사이드 퀘스트 및 따뜻한 장면 집필 |
| **8** | `events.js` 삭제, `locations.js` 정리, 죽은 코드 제거, README 갱신 | 구 탐험 시스템 제거 및 문서 갱신 |
| **9** | 시뮬레이터를 장면 그래프용으로 개작 — **도달 불가 장면 / 끊긴 next / 같은 스탯 위반** 검출 | 시나리오 검증 도구 추가 |

> **4번 이후 반드시 사용자에게 확인받을 것.** 방향이 어긋난 채로 45장면을 쓰면 전부 낭비됩니다.

---

## 11. 테스트 계획

### 자동 검증 (9번 도구에 포함시킬 것)
```
□ 모든 scene.next / outcome.next 가 실재하는 SCENES 키를 가리키는가
□ 시작(p_arrival)에서 도달 불가능한 장면이 있는가
□ 판정 선택지가 2개 이상인 장면에서 스탯이 중복되는가   ← §5 위반 검출
□ 판정 없는 선택지가 장면당 2개 이상인가
□ 본문 문단 수가 §8 최소치 미만인가
□ 본문에 수치 표기 정규식 /[+-]\d/ 가 남아있는가
□ '영운 군' 이 존재하는가
```

### Playwright 회귀 (기존 스크립트 유지·개작)
```
□ 시작 → 1장 → 허브 → 활동 → 메인 복귀 가 클릭만으로 완주되는가
□ [계속] 누르기 전에는 결과 텍스트가 사라지지 않는가
□ 설정: 타자 속도 4단계 · 연출 줄이기 토글 동작
□ 화면 탭으로 타자 스킵
□ 전투 진입 → 승리 → combatWinNext 로 복귀
□ 기억 보정이 붙은 선택지의 성공률 표기
□ 마감 초과 시 페널티 스택 · 엔딩 강등
□ 기록 탭에 이전 장면 텍스트가 누적되는가
□ 콘솔 에러 0
```

### 수동 확인 (실기기)
```
□ 아이폰/안드로이드 세로에서 본문이 어절 단위로 예쁘게 끊기는가 (word-break: keep-all)
□ 한 화면에 본문이 잘리지 않고 자연스럽게 스크롤되는가
□ 어지러움 유발 요소 없는가 — 슬라이드·흔들림·빠른 점멸 전무
```

---

## 12. 실행 체크리스트 (소넷용 요약)

```
[ ] 1. js/systems/scene.js 작성 (라우팅) + index.html 스크립트 태그 추가
[ ] 2. index.html 모험 탭을 #scene-page 구조로 교체
[ ] 3. style.css — §4-2 타이포 + §4-3 선택지 카드. word-break: keep-all 필수
[ ] 4. ui.js — renderScene() 작성, renderTravel/renderQuestLog/renderLocationBanner 삭제
[ ] 5. engine.js — explore/travelTo/eligibleEventsFor/getLocationHint 삭제,
       전투 종료 시 combatWinNext 로 복귀하도록 winCombat/loseCombat 수정
[ ] 6. state.js — v9, 필드 교체 (§9)
[ ] 7. js/data/scenes.js — §7 매니페스트 순서대로 집필 (§5 선택지 규칙, §8 문체 준수)
[ ] 8. events.js 삭제 · locations.js 축소 · README 갱신
[ ] 9. scripts/validate_scenes.js 작성 (§11 자동 검증)
[ ] 매 단계: node --check → playwright → 커밋 → git push -u origin claude/harry-potter-text-game-9g5ffz
```

### 절대 지켜야 할 것 (재확인)
1. **접근성** — 흔들림·슬라이드·빠른 점멸 금지. `연출 줄이기` 기본 켜짐 유지. (실제 멀미 이력)
2. **호칭** — "영운 양". 절대 "영운 군" 아님
3. **선택지** — 판정 스탯 중복 금지, 선택지 1개짜리 장면 금지
4. **문장** — 본문에 수치 직접 표기 금지 (칩이 자동 생성)
5. **오프라인** — 외부 폰트·CDN 금지. `sw.js` ASSETS 목록에 신규 파일 추가 잊지 말 것
