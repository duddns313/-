/* ===================== 업적 · 칭호 · 일일 과제 · 도감 완성도 시스템 ===================== */

function unlockAchievement(id) {
  const ach = ACHIEVEMENTS.find((a) => a.id === id);
  if (!ach || state.achievements[id]) return;
  state.achievements[id] = true;
  if (ach.bonus) {
    Object.keys(ach.bonus).forEach((k) => {
      if (['intelligence', 'courage', 'charm', 'agility', 'luck'].includes(k)) state.stats[k] += ach.bonus[k];
      else if (k === 'atk') state.baseAtk += ach.bonus[k];
      else if (k === 'def') state.baseDef += ach.bonus[k];
    });
  }
  addLog(`업적 달성: [${ach.name}] - ${ach.desc}`, 'log-win');
  if (typeof toast === 'function') toast(`🏆 업적 달성: ${ach.name}`, { duration: 3200 });

  Object.values(TITLES).forEach((t) => {
    if (t.requiresAchievement === id && !state.titles[t.id]) {
      state.titles[t.id] = true;
      addLog(`새 칭호를 얻었다: [${t.name}]`, 'log-spell');
    }
  });
}

function checkAchievements() {
  ACHIEVEMENTS.forEach((a) => { if (!state.achievements[a.id] && a.check(state)) unlockAchievement(a.id); });
}

function equipTitle(titleId) {
  if (titleId && !state.titles[titleId]) return;
  state.equippedTitle = titleId || null;
}

/* ---------------- 일일 과제 ---------------- */
function refreshDailyQuestsIfNeeded() {
  if (state.dailyQuestDay === state.day) return;
  state.dailyQuestDay = state.day;
  state.dailyCounters = { explore: 0, classAttend: 0, combatWin: 0, shopBuy: 0, spellCast: 0 };
  const pool = DAILY_QUEST_TEMPLATES.slice();
  const picks = [];
  while (picks.length < 3 && pool.length) {
    const idx = randInt(0, pool.length - 1);
    picks.push(pool.splice(idx, 1)[0]);
  }
  state.dailyQuests = picks.map((p) => ({ ...p, claimed: false }));
}

function trackDaily(key, amount) {
  state.dailyCounters[key] = (state.dailyCounters[key] || 0) + (amount || 1);
  checkDailyQuestCompletion();
}

function checkDailyQuestCompletion() {
  (state.dailyQuests || []).forEach((q) => {
    if (!q.claimed && (state.dailyCounters[q.track] || 0) >= q.target) {
      q.claimed = true;
      applyEffect(q.reward);
      addLog(`일일 과제 완료: [${q.label}] (+${q.reward.gold || 0}G, +${q.reward.exp || 0}EXP)`, 'log-win');
      if (typeof toast === 'function') toast(`✅ 일일 과제 완료: ${q.label}`);
    }
  });
}

/* ---------------- 도감 완성도 ---------------- */
function getCodexCompletion() {
  const spellTotal = Object.keys(SPELLS).length;
  const spellKnown = Object.keys(state.spells).length;
  const enemyTotal = Object.keys(ENEMIES).length;
  const enemySeen = Object.keys(state.seenEnemies || {}).length;
  const itemTemplates = Object.values(EQUIP_TEMPLATES).filter((t) => !t.starter);
  const itemSeen = Object.keys(state.seenItemBases || {}).filter((id) => EQUIP_TEMPLATES[id] && !EQUIP_TEMPLATES[id].starter).length;
  return {
    spell: Math.round((spellKnown / spellTotal) * 100),
    enemy: Math.round((enemySeen / enemyTotal) * 100),
    item: itemTemplates.length ? Math.round((itemSeen / itemTemplates.length) * 100) : 100,
  };
}
