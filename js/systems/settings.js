/* ===================== 사용자 설정 (캐릭터와 무관, 기기에 저장) ===================== */

const SETTINGS_KEY = 'hp_text_game_settings_v1';
const TYPE_SPEED_MS = { slow: 40, normal: 22, fast: 10, off: 0 };

let settings = { typeSpeed: 'normal', reduceMotion: true };

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = { ...settings, ...JSON.parse(raw) };
  } catch (e) { /* 무시 */ }
  applySettingsToDom();
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* 무시 */ }
}

function applySettingsToDom() {
  document.documentElement.classList.toggle('reduce-motion', !!settings.reduceMotion);
}

function setTypeSpeed(v) { settings.typeSpeed = v; saveSettings(); }
function setReduceMotion(v) { settings.reduceMotion = v; saveSettings(); applySettingsToDom(); }
function getTypeSpeedMs() { return TYPE_SPEED_MS[settings.typeSpeed] != null ? TYPE_SPEED_MS[settings.typeSpeed] : 22; }
