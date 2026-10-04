'use strict';
/* 브라우저 없이 게임 데이터·코어를 불러온다 (검증기·시뮬레이터 공용). index.html의 스크립트 순서를 그대로 따른다. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadGame() {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(src => !src.startsWith('js/ui/') && !src.includes('main.js') && !src.includes('pwa.js'));
  const store = {};
  const ctx = vm.createContext({
    console, Math, JSON, Object, Array, String, Number, Date, Error,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  });
  for (const src of scripts) vm.runInContext(fs.readFileSync(path.join(root, src), 'utf8'), ctx, { filename: src });
  const expose = ['EVENTS', 'STATS', 'RESOURCES', 'HOUSES', 'PLACES', 'SPELLS', 'ITEMS', 'PETS', 'WANDS', 'PEOPLE', 'CARDS', 'MEMORIES', 'SHOPS', 'STAT_STORIES', 'CALENDAR', 'TURNS_PER_YEAR', 'Rules', 'Game', 'newState'];
  const g = {};
  for (const k of expose) g[k] = vm.runInContext(k, ctx);
  g.sources = scripts.map(src => ({ src, code: fs.readFileSync(path.join(root, src), 'utf8') }));
  return g;
}

module.exports = { loadGame };
