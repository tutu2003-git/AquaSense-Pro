import { saveLightStatus, saveSchedule, listenDevice } from "./firebase/database";

const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  schedule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  alerts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  control: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  temp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
  humidity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  water: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M7 12c1.5 0 2.5-1 3.5-1s2 1 3.5 1 2.5-1 3.5-1"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.94 0M12 20h.01"/></svg>`,
  rtc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 15"/></svg>`,
  runtime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 12l3.5 3.5"/></svg>`,
  power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`,
  mode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
};

const app = document.querySelector("#app");

const PRESETS = {
  tropical: { onTime: "08:00", offTime: "18:00", mode: "limited", days: 7 },
  marine: { onTime: "09:00", offTime: "21:00", mode: "continuous", days: 7 },
  planted: { onTime: "07:00", offTime: "17:00", mode: "continuous", days: 7 }
};

let appData = {};
let activeTab = "home";
let lightState = "OFF";
let lightOnStart = Number(localStorage.getItem("lightOnStart")) || null;

// Advanced Features State
let feedActive = false;
let feedTimeRemaining = 600;
let feedTimerInterval = null;
let quickTimerEnd = Number(localStorage.getItem("quickTimerEnd")) || null;

// Professional Upgrades State
let activeChartMetric = "temp"; // "temp" or "humidity"
let filterResetTime = Number(localStorage.getItem("filterResetTime")) || (Date.now() - 480000000); // Defaults to ~5 days ago
let waterChangeTime = Number(localStorage.getItem("waterChangeTime")) || (Date.now() - 250000000); // Defaults to ~3 days ago

app.innerHTML = `
<section id="landing" class="landing">
  <div class="landing-card">
    <div class="logo">🌊</div>
    <p class="eyebrow">SMART AQUARIUM</p>
    <h1>AquaSense Pro</h1>
    <p class="desc">Remote light control, live sensors, scheduling and Firebase cloud sync.</p>
    <button id="openBtn" class="primary-btn">Open Dashboard</button>
  </div>
</section>

<main id="dashboard" class="dashboard hidden">
  <!-- Desktop Sidebar Navigation -->
  <aside class="sidebar-nav">
    <div class="nav-logo"><span>🌊</span>AquaSense</div>
    <ul class="sidebar-menu">
      <li><button class="nav-btn active" data-tab="home">${ICONS.home}<span>Home</span></button></li>
      <li><button class="nav-btn" data-tab="schedule">${ICONS.schedule}<span>Schedule</span></button></li>
      <li><button class="nav-btn" data-tab="alerts">${ICONS.alerts}<span>Alerts</span></button></li>
      <li><button class="nav-btn" data-tab="control">${ICONS.control}<span>Control</span></button></li>
    </ul>
    <div class="nav-footer">v1.3.0 Pro</div>
  </aside>

  <!-- Dashboard Header -->
  <header class="header">
    <div>
      <p id="greeting" class="eyebrow">Good Morning</p>
      <h1>Janith 👋</h1>
      <p id="headerTime" class="headerTime">--</p>
    </div>
    <button id="themeBtn" class="icon-btn">${ICONS.moon}</button>
  </header>

  <!-- Main View Container -->
  <div id="page"></div>

  <!-- Mobile Floating Bottom Navigation -->
  <nav class="bottom-nav">
    <button class="nav-btn active" data-tab="home">${ICONS.home}<span>Home</span></button>
    <button class="nav-btn" data-tab="schedule">${ICONS.schedule}<span>Schedule</span></button>
    <button class="nav-btn" data-tab="alerts">${ICONS.alerts}<span>Alerts</span></button>
    <button class="nav-btn" data-tab="control">${ICONS.control}<span>Control</span></button>
  </nav>

  <div id="toast" class="toast">Ready</div>
</main>
`;

const $ = (id) => document.querySelector(id);
const $$ = (selector) => document.querySelectorAll(selector);

$("#openBtn").onclick = () => {
  $("#landing").classList.add("hide");
  setTimeout(() => {
    $("#landing").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    render();
  }, 350);
};

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

const themeBtn = $("#themeBtn");
if (themeBtn) {
  themeBtn.innerHTML = document.body.classList.contains("light-mode") ? ICONS.sun : ICONS.moon;
}

$("#themeBtn").onclick = () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  $("#themeBtn").innerHTML = isLight ? ICONS.sun : ICONS.moon;
  if (activeTab === "home") {
    updateSvgChartPath();
  }
};

$$(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    activeTab = btn.dataset.tab;
    $$(".nav-btn").forEach((b) => b.classList.remove("active"));
    $$(`.nav-btn[data-tab="${activeTab}"]`).forEach(b => b.classList.add("active"));
    render();
  };
});

function getSchedule() {
  return appData.schedule || {};
}

function getSensors() {
  return appData.sensors || {};
}

function getDevice() {
  return appData.device || {};
}

function showToast(msg) {
  const toast = $("#toast");
  toast.innerHTML = `${ICONS.alerts} <span>${msg}</span>`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function addLocalLog(msg) {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.unshift({
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    msg
  });
  localStorage.setItem("logs", JSON.stringify(logs.slice(0, 20)));
}

async function notify(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission === "granted") new Notification(title, { body });
}

async function turnLight(status, reason = "Manual") {
  await saveLightStatus(status);
  lightState = status;

  if (status === "ON") {
    lightOnStart = Date.now();
    localStorage.setItem("lightOnStart", String(lightOnStart));
  } else {
    lightOnStart = null;
    localStorage.removeItem("lightOnStart");
  }

  addLocalLog(`${reason}: Light turned ${status}`);
  showToast(`Light turned ${status}`);
  notify("AquaSense Pro", `${reason}: Light turned ${status}`);
  render();
}

function mins(time) {
  if (!time || !time.includes(":")) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time) {
  if (!time || !time.includes(":")) return "--";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateText) {
  if (!dateText) return "--";
  return new Date(dateText).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ----------------------------------------------------
// Maintenance Action Handlers
// ----------------------------------------------------
function resetFilterLife() {
  filterResetTime = Date.now();
  localStorage.setItem("filterResetTime", String(filterResetTime));
  addLocalLog("Maintenance: Cleaned water filter");
  showToast("Filter life reset to 100%");
  updateMaintenanceMetrics();
}

void function updateMaintenanceMetrics() {
  const filterSecs = 2592000000; // 30 days
  const filterElapsed = Date.now() - filterResetTime;
  const filterLifePercent = Math.max(0, Math.min(100, Math.round(((filterSecs - filterElapsed) / filterSecs) * 100)));
  const filterDaysLeft = Math.ceil(Math.max(0, filterSecs - filterElapsed) / (86400 * 1000));

  const mFilterText = $("#maintFilterText");
  if (mFilterText) mFilterText.textContent = `${filterLifePercent}% (${filterDaysLeft} day${filterDaysLeft === 1 ? "" : "s"} left)`;

  const mFilterProgress = $("#maintFilterProgress");
  if (mFilterProgress) mFilterProgress.style.width = `${filterLifePercent}%`;

  const waterSecs = 1209600000; // 14 days
  const waterElapsed = Date.now() - waterChangeTime;
  const waterLifePercent = Math.max(0, Math.min(100, Math.round(((waterSecs - waterElapsed) / waterSecs) * 100)));
  const waterDaysLeft = Math.ceil(Math.max(0, waterSecs - waterElapsed) / (86400 * 1000));

  const mWaterText = $("#maintWaterText");
  if (mWaterText) mWaterText.textContent = `${waterLifePercent}% (${waterDaysLeft} day${waterDaysLeft === 1 ? "" : "s"} left)`;

  const mWaterProgress = $("#maintWaterProgress");
  if (mWaterProgress) mWaterProgress.style.width = `${waterLifePercent}%`;
}

function logWaterChange() {
  waterChangeTime = Date.now();
  localStorage.setItem("waterChangeTime", String(waterChangeTime));
  addLocalLog("Maintenance: Logged water change");
  showToast("Water change tracked");
  updateMaintenanceMetrics();
}

function calculateEndDate(days) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + Number(days) - 1);
  return date.toISOString();
}

function getEndDate() {
  const s = getSchedule();

  if (!s.mode) return "--";
  if (s.mode === "continuous") return "Always";

  if (s.endDate) return formatDate(s.endDate);

  const days = Number(s.days || 0);
  if (days <= 0) return "--";

  return formatDate(calculateEndDate(days));
}

function getRemainingDays() {
  const s = getSchedule();

  if (s.mode === "continuous") return "Always";
  if (!s.endDate) return "--";

  const now = new Date();
  const end = new Date(s.endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? "" : "s"} left`;
}

function isLightTimeNow() {
  const s = getSchedule();
  const onTime = s.onTime || "12:00";
  const offTime = s.offTime || "18:00";

  if (s.mode === "limited" && getRemainingDays() === "Expired") return false;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const on = mins(onTime);
  const off = mins(offTime);

  if (on < off) return current >= on && current < off;
  return current >= on || current < off;
}

async function checkScheduleAutoControl() {
  if (quickTimerEnd) return;

  const s = getSchedule();
  if (!s.onTime || !s.offTime) return;

  const targetStatus = isLightTimeNow() ? "ON" : "OFF";
  const lastScheduledStatus = localStorage.getItem("lastScheduledStatus");

  if (lastScheduledStatus !== targetStatus) {
    if (lightState !== targetStatus) {
      await turnLight(targetStatus, "Timer");
    }
    localStorage.setItem("lastScheduledStatus", targetStatus);
  }
}

function nextActionText() {
  if (quickTimerEnd) {
    const diff = Math.max(0, Math.floor((quickTimerEnd - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `Quick Timer Active • OFF in ${m}h ${s}m`;
  }

  const s = getSchedule();

  if (!s.onTime || !s.offTime) {
    return "No schedule configured";
  }

  if (s.mode === "limited" && getRemainingDays() === "Expired") {
    return "Schedule expired • Light OFF";
  }

  const onTime = s.onTime;
  const offTime = s.offTime;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const on = mins(onTime);
  const off = mins(offTime);

  const diffOn = (on - current + 1440) % 1440;
  const diffOff = (off - current + 1440) % 1440;

  if (lightState === "ON") {
    return `Light ON now • OFF at ${formatTime(offTime)} • in ${Math.floor(diffOff / 60)}h ${diffOff % 60}m`;
  }

  return `Light OFF now • ON at ${formatTime(onTime)} • in ${Math.floor(diffOn / 60)}h ${diffOn % 60}m`;
}

function runtimeText() {
  if (lightState !== "ON" || !lightOnStart) return "0h 0m";
  const diff = Math.floor((Date.now() - Number(lightOnStart)) / 60000);
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

function greetingText() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning ☀️";
  if (h >= 12 && h < 17) return "Good Afternoon 🌤️";
  if (h >= 17 && h < 21) return "Good Evening 🌇";
  return "Good Night 🌙";
}

function updateHeaderTime() {
  const greeting = $("#greeting");
  const headerTime = $("#headerTime");

  if (greeting) greeting.textContent = greetingText();

  if (headerTime) {
    headerTime.textContent = new Date().toLocaleString([], {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}

function tempClass(temp) {
  if (!Number.isFinite(temp)) return "";
  if (temp < 25) return "cool";
  if (temp <= 31) return "warm";
  return "hot";
}

// ----------------------------------------------------
// Advanced Features State Setters
// ----------------------------------------------------

function startFeedMode() {
  if (feedActive) return;
  feedActive = true;
  feedTimeRemaining = 600;
  addLocalLog("Feed Mode: Started (Filter paused)");
  showToast("Feed Mode: Filter pump paused");
  render();

  feedTimerInterval = setInterval(() => {
    feedTimeRemaining--;
    if (feedTimeRemaining <= 0) {
      stopFeedMode("Timeout");
    } else {
      updateFeedCountdown();
    }
  }, 1000);
}

function stopFeedMode(reason = "Manual") {
  if (!feedActive) return;
  clearInterval(feedTimerInterval);
  feedActive = false;
  addLocalLog(`Feed Mode: Stopped (${reason})`);
  showToast("Pump restarted");
  render();
}

function updateFeedCountdown() {
  const text = $("#feedTimerText");
  const ring = $("#feedTimerRing");

  if (text) {
    const m = Math.floor(feedTimeRemaining / 60);
    const s = feedTimeRemaining % 60;
    text.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (ring) {
    const percent = (feedTimeRemaining / 600) * 100;
    const offset = 163.3 - (163.3 * percent) / 100;
    ring.style.setProperty("--feed-offset", offset);
  }
}

function startQuickTimer(mins) {
  const now = Date.now();
  const targetEnd = now + mins * 60 * 1000;

  if (quickTimerEnd && Math.abs(quickTimerEnd - targetEnd) < 120 * 1000) {
    clearQuickTimer();
    return;
  }

  quickTimerEnd = targetEnd;
  localStorage.setItem("quickTimerEnd", String(quickTimerEnd));

  if (lightState !== "ON") {
    turnLight("ON", "Quick Timer");
  } else {
    addLocalLog(`Quick Timer: Set for ${mins} mins`);
    showToast(`Timer set: ${mins} mins`);
    render();
  }
}

function clearQuickTimer() {
  if (!quickTimerEnd) return;
  quickTimerEnd = null;
  localStorage.removeItem("quickTimerEnd");
  addLocalLog("Quick Timer cleared");
  showToast("Quick Timer cleared");
  render();
}

function getTempHistory() {
  const h = JSON.parse(localStorage.getItem("tempHistory") || "[]");
  if (h.length === 0) {
    const baseline = [25.8, 26.1, 26.3, 26.5, 26.4, 26.2, 26.3, 26.4];
    localStorage.setItem("tempHistory", JSON.stringify(baseline));
    return baseline;
  }
  return h;
}

function pushTempHistory(val) {
  if (!Number.isFinite(val)) return;
  const h = getTempHistory();
  h.push(Number(val.toFixed(1)));
  if (h.length > 8) h.shift();
  localStorage.setItem("tempHistory", JSON.stringify(h));
}

function getHumidityHistory() {
  const h = JSON.parse(localStorage.getItem("humidityHistory") || "[]");
  if (h.length === 0) {
    const baseline = [92.0, 93.5, 94.0, 94.5, 94.2, 93.8, 94.0, 94.2];
    localStorage.setItem("humidityHistory", JSON.stringify(baseline));
    return baseline;
  }
  return h;
}

function pushHumidityHistory(val) {
  if (!Number.isFinite(val)) return;
  const h = getHumidityHistory();
  h.push(Number(val.toFixed(1)));
  if (h.length > 8) h.shift();
  localStorage.setItem("humidityHistory", JSON.stringify(h));
}

function generateSvgPath(history, metric) {
  if (history.length === 0) return { path: "", area: "", points: [] };
  const points = history.map((val, i) => {
    const x = i * (340 / (history.length - 1));
    let y = 60;
    if (metric === "temp") {
      y = 110 - Math.max(0, Math.min(10, val - 22)) * 10; // Temp scale Y mapping
    } else {
      y = 110 - Math.max(0, Math.min(20, val - 80)) * 5;  // Humidity scale Y mapping
    }
    return { x, y, val };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  const dArea = `${d} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;
  return { path: d, area: dArea, points };
}

function getActivePreset() {
  const s = getSchedule();
  for (const key in PRESETS) {
    const p = PRESETS[key];
    if (s.onTime === p.onTime && s.offTime === p.offTime && s.mode === p.mode) {
      if (s.mode !== "limited" || Number(s.days) === Number(p.days)) {
        return key;
      }
    }
  }
  return "";
}

async function applyPreset(type) {
  const p = PRESETS[type];
  if (!p) return;

  const schedule = {
    onTime: p.onTime,
    offTime: p.offTime,
    mode: p.mode,
    days: p.days,
    startDate: new Date().toISOString(),
    endDate: p.mode === "limited" ? calculateEndDate(p.days) : null
  };

  await saveSchedule(schedule);
  addLocalLog(`Preset applied: ${type.toUpperCase()}`);
  showToast(`Preset ${type.toUpperCase()} saved`);

  localStorage.setItem("lastScheduleConfig", JSON.stringify(schedule));
  localStorage.removeItem("lastScheduledStatus");
  render();
}

// ----------------------------------------------------
// UI Templates Rendering
// ----------------------------------------------------

function renderHome() {
  const s = getSchedule();
  const sensor = getSensors();
  const device = getDevice();

  const temp = Number(sensor.temperature);
  const humidity = Number(sensor.humidity);
  const water = Number(sensor.waterLevel);
  const waterSafe = Number.isFinite(water) ? Math.max(0, Math.min(100, water)) : 0;
  const online = device.wifi === "Online";

  const tempPercent = Number.isFinite(temp) ? Math.max(0, Math.min(100, (temp / 45) * 100)) : 0;
  const tempOffset = 188.4 - (188.4 * tempPercent) / 100;

  let gaugeColor = "var(--blue)";
  if (Number.isFinite(temp)) {
    if (temp >= 32) gaugeColor = "var(--red)";
    else if (temp >= 25) gaugeColor = "var(--green)";
  }

  const history = activeChartMetric === "temp" ? getTempHistory() : getHumidityHistory();
  const { path, area, points } = generateSvgPath(history, activeChartMetric);

  // Simulated metrics for professional layout
  const phVal = Number(sensor.ph) || (7.3 + Math.sin(Date.now() / 600000) * 0.12);
  const phPercent = Math.max(0, Math.min(100, ((phVal - 6.0) / 2.0) * 100)); // pH range 6-8 mapped to 0-100%

  const tdsVal = Math.round(Number(sensor.tds) || (238 + Math.cos(Date.now() / 600000) * 6));
  const tdsPercent = Math.max(0, Math.min(100, (tdsVal / 400) * 100)); // TDS range 0-400 mapped to 0-100%

  // If feed mode is active, display a golden countdown overlay card
  if (feedActive) {
    const feedPercent = (feedTimeRemaining / 600) * 100;
    const feedOffset = 163.3 - (163.3 * feedPercent) / 100;

    return `
      <section class="connection-card">
        <div class="live-left">
          <span class="dot" style="background: var(--orange); box-shadow: 0 0 16px var(--orange);"></span>
          <div>
            <strong>Feed Fish Mode Active</strong>
            <p>Filter pump temporarily paused</p>
          </div>
        </div>
        <button id="cancelFeedBtn" class="primary-btn" style="width: auto; margin-top: 0; padding: 10px 16px; border-radius: 12px; font-size: 13px; background: var(--red); box-shadow: 0 4px 15px var(--red-glow);">Stop</button>
      </section>

      <section id="homeHeroCard" class="hero-card feed-active-card">
        <div class="feed-overlay">
          <div id="feedTimerRing" class="feed-countdown-ring" style="--feed-offset: ${feedOffset};">
            <svg>
              <circle class="bg-ring" cx="28" cy="28" r="26"></circle>
              <circle class="value-ring" cx="28" cy="28" r="26"></circle>
            </svg>
          </div>
          <div>
            <p style="color: var(--orange); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px;">Fish Feed Timer</p>
            <h2 id="feedTimerText" style="font-size: 38px; margin: 0;">${Math.floor(feedTimeRemaining / 60)}:${(feedTimeRemaining % 60).toString().padStart(2, "0")}</h2>
            <p class="muted" style="margin: 4px 0 0;">Filter pump will resume automatically</p>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Quick Override Timers</h2>
        <div class="quick-timers">
          <button id="quickPill30" class="quick-pill">30 Mins</button>
          <button id="quickPill60" class="quick-pill">1 Hour</button>
          <button id="quickPill120" class="quick-pill">2 Hours</button>
        </div>
      </section>

      <section class="grid">
        <article class="stat-card">
          ${ICONS.mode}
          <p>Mode</p>
          <h3 id="homeModeVal">${s.mode || "--"}</h3>
        </article>
        <article class="stat-card">
          ${ICONS.schedule}
          <p>ON Time</p>
          <h3 id="homeOnTimeVal">${s.onTime ? formatTime(s.onTime) : "--"}</h3>
        </article>
        <article class="stat-card">
          ${ICONS.schedule}
          <p>OFF Time</p>
          <h3 id="homeOffTimeVal">${s.offTime ? formatTime(s.offTime) : "--"}</h3>
        </article>
        <article class="stat-card">
          ${ICONS.schedule}
          <p>End Date</p>
          <h3 id="homeEndDateVal">${getEndDate()}</h3>
          <p id="homeRemainingDaysVal" class="card-sub">${getRemainingDays()}</p>
        </article>
        <article id="homeTempCard" class="stat-card ${tempClass(temp)}">
          ${ICONS.temp}
          <p>Temperature</p>
          <div class="temp-gauge-container">
            <div class="circular-gauge">
              <svg>
                <circle class="bg-circle" cx="32" cy="32" r="30"></circle>
                <circle id="homeTempCircle" class="value-circle" cx="32" cy="32" r="30" style="stroke-dashoffset: ${tempOffset}; stroke: ${gaugeColor};"></circle>
              </svg>
            </div>
            <h3 id="homeTempText">${Number.isFinite(temp) ? temp.toFixed(1) + " °C" : "-- °C"}</h3>
          </div>
        </article>
        <article class="stat-card">
          ${ICONS.humidity}
          <p>Humidity</p>
          <h3 id="homeHumidityText">${Number.isFinite(humidity) ? humidity.toFixed(0) + " %" : "-- %"}</h3>
        </article>
        <article id="homeWaterCard" class="stat-card water-card" style="--wave-height: ${waterSafe}%;">
          <div id="homeWaterWave1" class="wave-bg-1" style="bottom: ${waterSafe}%;"></div>
          <div id="homeWaterWave2" class="wave-bg-2" style="bottom: ${waterSafe}%;"></div>
          ${ICONS.water}
          <p>Water Level</p>
          <h3 id="homeWaterText">${Number.isFinite(water) ? waterSafe + "%" : "-- %"}</h3>
          <div class="progress"><div id="homeWaterProgress" style="width:${waterSafe}%"></div></div>
        </article>
        <article class="stat-card">
          ${ICONS.water}
          <p>pH Level</p>
          <h3 id="homePhText">${phVal.toFixed(2)} pH</h3>
          <div class="ph-gauge-container">
            <div class="ph-spectrum-bar">
              <div id="homePhPointer" class="ph-pointer" style="left: ${phPercent}%;"></div>
            </div>
            <div class="ph-scale-labels">
              <span>ACID</span>
              <span>NEUT</span>
              <span>ALKA</span>
            </div>
          </div>
        </article>
        <article class="stat-card">
          ${ICONS.water}
          <p>TDS Purity</p>
          <h3 id="homeTdsText">${tdsVal} ppm</h3>
          <div class="progress"><div id="homeTdsProgress" style="width:${tdsPercent}%"></div></div>
          <p class="card-sub">Optimal Purity Zone</p>
        </article>
        <article class="stat-card">
          ${ICONS.wifi}
          <p>WiFi</p>
          <h3 id="homeWifiVal">${device.wifi || "Offline"}</h3>
        </article>
        <article class="stat-card">
          ${ICONS.rtc}
          <p>RTC</p>
          <h3 id="homeRtcVal">${device.rtc || "--"}</h3>
        </article>
        <article class="stat-card">
          ${ICONS.runtime}
          <p>Runtime</p>
          <h3 id="runtimeDisplay">${runtimeText()}</h3>
        </article>
      </section>
    `;
  }

  // Standard Home Layout
  return `
    <section class="connection-card">
      <div class="live-left">
        <span id="homeConnectionDot" class="${online ? "dot" : "dot offline"}"></span>
        <div>
          <strong id="homeConnectionText">${online ? "Live Connection Active" : "Device Offline"}</strong>
          <p id="homeConnectionSync">Last sync: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
      <button id="feedFishBtn" class="primary-btn" style="width: auto; margin-top: 0; padding: 10px 16px; border-radius: 12px; font-size: 13px; background: var(--orange); box-shadow: 0 4px 15px var(--orange-glow);">🍲 Feed Fish</button>
    </section>

    <section id="homeHeroCard" class="hero-card ${lightState === "ON" ? "hero-on" : "hero-off"}">
      <div>
        <p class="muted">Light Status</p>
        <h2 id="homeLightStatus">${lightState}</h2>
        <p id="homeClock">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <p id="homeNextAction">${nextActionText()}</p>
        <p id="homeModeText">${s.mode === "limited" ? getRemainingDays() : "Continuous mode"}</p>
      </div>
      <button id="powerBtn" class="power-btn ${lightState === "ON" ? "active" : ""}">${ICONS.power}</button>
    </section>

    <section class="panel">
      <h2>Quick Override Timers</h2>
      <div class="quick-timers">
        <button id="quickPill30" class="quick-pill">30 Mins</button>
        <button id="quickPill60" class="quick-pill">1 Hour</button>
        <button id="quickPill120" class="quick-pill">2 Hours</button>
      </div>
    </section>

    <!-- Glowing Dynamic SVG Line Chart -->
    <section class="panel chart-card">
      <div class="chart-header">
        <h3>Analytics</h3>
        <div class="chart-tabs">
          <button class="chart-tab ${activeChartMetric === "temp" ? "active" : ""}" data-metric="temp">Temperature</button>
          <button class="chart-tab ${activeChartMetric === "humidity" ? "active" : ""}" data-metric="humidity">Humidity</button>
        </div>
      </div>
      <div class="chart-container">
        <svg class="chart-svg" viewBox="0 0 340 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--blue)" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="var(--blue)" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <line class="chart-grid" x1="0" y1="10" x2="340" y2="10" />
          <line class="chart-grid" x1="0" y1="60" x2="340" y2="60" />
          <line class="chart-grid" x1="0" y1="110" x2="340" y2="110" />
          <path id="chartAreaPath" class="chart-area" d="${area}" />
          <path id="chartPath" class="chart-line" d="${path}" />
          <g id="chartDots">
            ${points.map(p => `<circle class="chart-dot" cx="${p.x}" cy="${p.y}"><title>Value: ${p.val}</title></circle>`).join("")}
          </g>
        </svg>
      </div>
    </section>

    <!-- Maintenance Checklist -->
    <section class="panel">
      <h2>Maintenance Checklist</h2>
      <div class="maintenance-panel">
        <div class="maintenance-item">
          <div class="maintenance-header">
            <strong>Water Filter Health</strong>
            <span id="maintFilterText">Calculating...</span>
          </div>
          <div class="maintenance-bar-container">
            <div class="progress"><div id="maintFilterProgress" style="width: 0%"></div></div>
            <button id="btnResetFilter" class="maintenance-btn-action">Clean Filter</button>
          </div>
        </div>
        
        <div class="maintenance-item">
          <div class="maintenance-header">
            <strong>Water Freshness Tracker</strong>
            <span id="maintWaterText">Calculating...</span>
          </div>
          <div class="maintenance-bar-container">
            <div class="progress"><div id="maintWaterProgress" style="width: 0%"></div></div>
            <button id="btnLogWaterChange" class="maintenance-btn-action">Log Change</button>
          </div>
        </div>
      </div>
    </section>

    <section class="grid">
      <article class="stat-card">
        ${ICONS.mode}
        <p>Mode</p>
        <h3 id="homeModeVal">${s.mode || "--"}</h3>
      </article>
      <article class="stat-card">
        ${ICONS.schedule}
        <p>ON Time</p>
        <h3 id="homeOnTimeVal">${s.onTime ? formatTime(s.onTime) : "--"}</h3>
      </article>
      <article class="stat-card">
        ${ICONS.schedule}
        <p>OFF Time</p>
        <h3 id="homeOffTimeVal">${s.offTime ? formatTime(s.offTime) : "--"}</h3>
      </article>
      <article class="stat-card">
        ${ICONS.schedule}
        <p>End Date</p>
        <h3 id="homeEndDateVal">${getEndDate()}</h3>
        <p id="homeRemainingDaysVal" class="card-sub">${getRemainingDays()}</p>
      </article>
      <article id="homeTempCard" class="stat-card ${tempClass(temp)}">
        ${ICONS.temp}
        <p>Temperature</p>
        <div class="temp-gauge-container">
          <div class="circular-gauge">
            <svg>
              <circle class="bg-circle" cx="32" cy="32" r="30"></circle>
              <circle id="homeTempCircle" class="value-circle" cx="32" cy="32" r="30" style="stroke-dashoffset: ${tempOffset}; stroke: ${gaugeColor};"></circle>
            </svg>
          </div>
          <h3 id="homeTempText">${Number.isFinite(temp) ? temp.toFixed(1) + " °C" : "-- °C"}</h3>
        </div>
      </article>
      <article class="stat-card">
        ${ICONS.humidity}
        <p>Humidity</p>
        <h3 id="homeHumidityText">${Number.isFinite(humidity) ? humidity.toFixed(0) + " %" : "-- %"}</h3>
      </article>
      <article id="homeWaterCard" class="stat-card water-card" style="--wave-height: ${waterSafe}%;">
        <div id="homeWaterWave1" class="wave-bg-1" style="bottom: ${waterSafe}%;"></div>
        <div id="homeWaterWave2" class="wave-bg-2" style="bottom: ${waterSafe}%;"></div>
        ${ICONS.water}
        <p>Water Level</p>
        <h3 id="homeWaterText">${Number.isFinite(water) ? waterSafe + "%" : "-- %"}</h3>
        <div class="progress"><div id="homeWaterProgress" style="width:${waterSafe}%"></div></div>
      </article>
      <article class="stat-card">
        ${ICONS.water}
        <p>pH Level</p>
        <h3 id="homePhText">${phVal.toFixed(2)} pH</h3>
        <div class="ph-gauge-container">
          <div class="ph-spectrum-bar">
            <div id="homePhPointer" class="ph-pointer" style="left: ${phPercent}%;"></div>
          </div>
          <div class="ph-scale-labels">
              <span>ACID</span>
              <span>NEUT</span>
              <span>ALKA</span>
          </div>
        </div>
      </article>
      <article class="stat-card">
        ${ICONS.water}
        <p>TDS Purity</p>
        <h3 id="homeTdsText">${tdsVal} ppm</h3>
        <div class="progress"><div id="homeTdsProgress" style="width:${tdsPercent}%"></div></div>
        <p class="card-sub">Optimal Purity Zone</p>
      </article>
      <article class="stat-card">
        ${ICONS.wifi}
        <p>WiFi</p>
        <h3 id="homeWifiVal">${device.wifi || "Offline"}</h3>
      </article>
      <article class="stat-card">
        ${ICONS.rtc}
        <p>RTC</p>
        <h3 id="homeRtcVal">${device.rtc || "--"}</h3>
      </article>
      <article class="stat-card">
        ${ICONS.runtime}
        <p>Runtime</p>
        <h3 id="runtimeDisplay">${runtimeText()}</h3>
      </article>
    </section>
  `;
}

function renderSchedule() {
  const s = getSchedule();
  const activePreset = getActivePreset();

  return `
    <section class="page-title">
      <h2>Schedule Timer</h2>
      <p>Configure automatic lighting hours for your aquarium.</p>
    </section>

    <!-- Aquarium Presets Selectors -->
    <section class="panel">
      <h2>Aquarium Presets</h2>
      <p class="desc" style="margin-bottom: 16px; font-size: 14px;">Select a profile to load configuration values instantly.</p>
      <div class="preset-group">
        <button class="preset-btn ${activePreset === "tropical" ? "active" : ""}" data-preset="tropical">Tropical Fish</button>
        <button class="preset-btn ${activePreset === "marine" ? "active" : ""}" data-preset="marine">Marine Reef</button>
        <button class="preset-btn ${activePreset === "planted" ? "active" : ""}" data-preset="planted">Planted Tank</button>
      </div>
    </section>

    <section class="panel">
      <h2>Schedule Form</h2>
      <form id="scheduleForm">
        <div class="form-row">
          <div>
            <label>ON Time</label>
            <input id="onTime" type="time" value="${s.onTime || "12:00"}">
          </div>
          <div>
            <label>OFF Time</label>
            <input id="offTime" type="time" value="${s.offTime || "18:00"}">
          </div>
        </div>

        <label>Schedule Mode</label>
        <select id="mode">
          <option value="continuous" ${s.mode === "continuous" ? "selected" : ""}>Continuous Mode</option>
          <option value="limited" ${s.mode === "limited" ? "selected" : ""}>Limited Days Mode</option>
        </select>

        <label>Run For Days</label>
        <input id="days" type="number" min="1" value="${s.days || 7}">

        <button class="primary-btn" type="submit">${ICONS.save} Save Schedule</button>
      </form>
    </section>

    <section class="panel">
      <h2>Timer Preview & Info</h2>
      <div class="timeline">
        <div class="timeline-item">
          <strong>☀️ ON TIME</strong>
          <span id="previewOnTime">${s.onTime ? formatTime(s.onTime) : "--"}</span>
        </div>
        <div class="timeline-item">
          <strong>🌙 OFF TIME</strong>
          <span id="previewOffTime">${s.offTime ? formatTime(s.offTime) : "--"}</span>
        </div>
        <div class="timeline-item">
          <strong>📅 END DATE</strong>
          <span id="previewEndDate">${getEndDate()}</span>
        </div>
        <div class="timeline-item">
          <strong>⏳ REMAINING TIME</strong>
          <span id="previewRemaining">${getRemainingDays()}</span>
        </div>
        <div class="timeline-item">
          <strong>💡 CURRENT MODE</strong>
          <span id="previewCurrentMode">${isLightTimeNow() ? "Light should be ON" : "Light should be OFF"}</span>
        </div>
        <div class="timeline-item">
          <strong>⏳ TRANSITION PREVIEW</strong>
          <span id="previewNext">${nextActionText()}</span>
        </div>
      </div>
    </section>
  `;
}

function renderAlerts() {
  const sensor = getSensors();
  const device = getDevice();
  const temp = Number(sensor.temperature);

  const alerts = [];

  alerts.push({
    active: lightState === "ON",
    title: lightState === "ON" ? "Light Turned ON" : "Light Turned OFF",
    text: lightState === "ON" ? "Timer or manual override is active" : "Aquarium light is currently off",
    success: lightState === "OFF"
  });

  if (Number.isFinite(temp) && temp >= 32) {
    alerts.push({
      active: true,
      title: "High Temperature Alert",
      text: `${temp.toFixed(1)} °C detected - Please check cooler systems`,
      success: false
    });
  }

  if (device.wifi !== "Online") {
    alerts.push({
      active: true,
      title: "WiFi Disconnected",
      text: "AquaSense controller is not reporting online status",
      success: false
    });
  } else {
    alerts.push({
      active: false,
      title: "WiFi Connected",
      text: "Signal strength is strong and sync is live",
      success: true
    });
  }

  const logs = JSON.parse(localStorage.getItem("logs") || "[]");

  return `
    <section class="page-title">
      <h2>Alerts & Activity</h2>
      <p>Important system notifications, warnings, and log activity.</p>
    </section>

    <section id="alertListContainer" class="alert-list">
      ${alerts.map(a => `
        <article class="alert-card ${a.active ? "alert-active" : "alert-success"}">
          ${a.success ? ICONS.alerts : ICONS.temp}
          <div>
            <h3>${a.title}</h3>
            <p>${a.text}</p>
          </div>
        </article>
      `).join("")}
    </section>

    <section class="panel">
      <h2>Recent Logs</h2>
      <ul id="logsContainer" class="logs">
        ${logs.length ? logs.map(l => `<li>${l.msg} <span>${l.time}</span></li>`).join("") : "<li>No activity yet</li>"}
      </ul>
    </section>
  `;
}

function renderControl() {
  return `
    <section class="page-title">
      <h2>Manual Control</h2>
      <p>Instantly override scheduler and toggle aquarium lights manually.</p>
    </section>

    <section id="controlHeroCard" class="hero-card ${lightState === "ON" ? "hero-on" : "hero-off"}">
      <div>
        <p class="muted">Light Status</p>
        <h2 id="controlStatusText">${lightState}</h2>
        <p id="controlNextAction">${nextActionText()}</p>
      </div>
      <button id="controlPowerBtn" class="power-btn ${lightState === "ON" ? "active" : ""}">${ICONS.power}</button>
    </section>

    <section class="panel">
      <h2>Manual Overrides</h2>
      <div class="split">
        <button id="onBtn" class="control-btn on">${ICONS.sun} Force ON</button>
        <button id="offBtn" class="control-btn off">${ICONS.moon} Force OFF</button>
      </div>
    </section>

    <section class="panel">
      <h2>Quick Override Timers</h2>
      <div class="quick-timers">
        <button id="quickPill30" class="quick-pill">30 Mins</button>
        <button id="quickPill60" class="quick-pill">1 Hour</button>
        <button id="quickPill120" class="quick-pill">2 Hours</button>
      </div>
    </section>

    <section class="panel">
      <h2>Status Checklist</h2>
      <div class="timeline">
        <div class="timeline-item">
          <strong>System Status</strong>
          <span id="controlStatusTextChecked">${lightState === "ON" ? "Active (ON)" : "Standby (OFF)"}</span>
        </div>
        <div class="timeline-item">
          <strong>Elapsed Runtime</strong>
          <span id="controlRuntimeText">${runtimeText()}</span>
        </div>
        <div class="timeline-item">
          <strong>Active Schedule status</strong>
          <span id="controlScheduleState">${isLightTimeNow() ? "Schedule says ON" : "Schedule says OFF"}</span>
        </div>
      </div>
    </section>
  `;
}

function bindPageEvents() {
  const power = $("#powerBtn");
  if (power) power.onclick = () => turnLight(lightState === "ON" ? "OFF" : "ON", "Manual");

  const cPower = $("#controlPowerBtn");
  if (cPower) cPower.onclick = () => turnLight(lightState === "ON" ? "OFF" : "ON", "Manual");

  const on = $("#onBtn");
  if (on) on.onclick = () => turnLight("ON", "Manual");

  const off = $("#offBtn");
  if (off) off.onclick = () => turnLight("OFF", "Manual");

  const feedBtn = $("#feedFishBtn");
  if (feedBtn) feedBtn.onclick = () => startFeedMode();

  const cancelFeedBtn = $("#cancelFeedBtn");
  if (cancelFeedBtn) cancelFeedBtn.onclick = () => stopFeedMode("Manual");

  // Presets selector binding
  $$(".preset-btn").forEach(btn => {
    btn.onclick = () => {
      applyPreset(btn.dataset.preset);
    };
  });

  // Quick timer pills binding
  const qPill30 = $("#quickPill30");
  const qPill60 = $("#quickPill60");
  const qPill120 = $("#quickPill120");

  if (qPill30) qPill30.onclick = () => startQuickTimer(30);
  if (qPill60) qPill60.onclick = () => startQuickTimer(60);
  if (qPill120) qPill120.onclick = () => startQuickTimer(120);

  // Maintenance action buttons binding
  const filterBtn = $("#btnResetFilter");
  if (filterBtn) filterBtn.onclick = () => resetFilterLife();

  const waterBtn = $("#btnLogWaterChange");
  if (waterBtn) waterBtn.onclick = () => logWaterChange();

  // Chart toggle metric buttons binding
  $$(".chart-tab").forEach(tab => {
    tab.onclick = () => {
      activeChartMetric = tab.dataset.metric;
      $$(".chart-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      updateSvgChartPath();
    };
  });

  const form = $("#scheduleForm");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const mode = $("#mode").value;
      const days = Number($("#days").value);

      const schedule = {
        onTime: $("#onTime").value,
        offTime: $("#offTime").value,
        mode,
        days,
        startDate: new Date().toISOString(),
        endDate: mode === "limited" ? calculateEndDate(days) : null
      };

      await saveSchedule(schedule);
      addLocalLog("Schedule saved");
      showToast("Schedule saved");

      activeTab = "home";
      $$(".nav-btn").forEach(b => b.classList.remove("active"));
      $$('[data-tab="home"]').forEach(b => b.classList.add("active"));

      render();
    };
  }
}

// ----------------------------------------------------
// Dynamic DOM In-place updates
// ----------------------------------------------------

function updateSvgChartPath() {
  const chartPath = $("#chartPath");
  const chartAreaPath = $("#chartAreaPath");
  const chartDots = $("#chartDots");
  
  if (!chartPath || !chartAreaPath || !chartDots) return;
  
  const history = activeChartMetric === "temp" ? getTempHistory() : getHumidityHistory();
  const { path, area, points } = generateSvgPath(history, activeChartMetric);
  
  chartPath.setAttribute("d", path);
  chartAreaPath.setAttribute("d", area);
  
  const unit = activeChartMetric === "temp" ? " °C" : " %";
  chartDots.innerHTML = points.map(p => `
    <circle class="chart-dot" cx="${p.x}" cy="${p.y}">
      <title>${activeChartMetric === "temp" ? "Temp" : "Humidity"}: ${p.val}${unit}</title>
    </circle>
  `).join("");
}

function updateAllDynamicElements() {
  const s = getSchedule();
  const sensor = getSensors();
  const device = getDevice();

  const temp = Number(sensor.temperature);
  const humidity = Number(sensor.humidity);
  const water = Number(sensor.waterLevel);
  const waterSafe = Number.isFinite(water) ? Math.max(0, Math.min(100, water)) : 0;
  const online = device.wifi === "Online";

  // Dynamic simulated metrics for professional layout
  const phVal = Number(sensor.ph) || (7.3 + Math.sin(Date.now() / 600000) * 0.15);
  const tdsVal = Math.round(Number(sensor.tds) || (238 + Math.cos(Date.now() / 600000) * 6));

  let quickTimerRemainingText = "";
  if (quickTimerEnd) {
    const diff = Math.max(0, Math.floor((quickTimerEnd - Date.now()) / 1000));
    if (diff > 0) {
      const m = Math.floor(diff / 60);
      const sec = diff % 60;
      quickTimerRemainingText = ` (Override: ${m}m ${sec}s)`;
    }
  }

  // Update clock & runtime
  const clock = $("#homeClock");
  if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const runtime = $("#runtimeDisplay");
  if (runtime) runtime.textContent = runtimeText();

  // Update light status text
  const statusText = $("#homeLightStatus");
  if (statusText) {
    statusText.textContent = lightState + quickTimerRemainingText;
  }

  // Update connection indicator
  const dot = $("#homeConnectionDot");
  if (dot) {
    dot.className = online ? "dot" : "dot offline";
  }
  const connText = $("#homeConnectionText");
  if (connText) {
    connText.textContent = online ? "Live Connection Active" : "Device Offline";
  }
  const syncText = $("#homeConnectionSync");
  if (syncText) {
    syncText.textContent = `Last sync: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  // Update hero card class
  const hero = $("#homeHeroCard");
  if (hero) {
    hero.className = `hero-card ${feedActive ? "feed-active-card" : (lightState === "ON" ? "hero-on" : "hero-off")}`;
  }

  // Update power button class
  const power = $("#powerBtn");
  if (power) {
    if (lightState === "ON" || feedActive) power.classList.add("active");
    else power.classList.remove("active");
  }

  // Update main Home grid values
  const modeVal = $("#homeModeVal");
  if (modeVal) modeVal.textContent = s.mode || "--";

  const onTimeVal = $("#homeOnTimeVal");
  if (onTimeVal) onTimeVal.textContent = s.onTime ? formatTime(s.onTime) : "--";

  const offTimeVal = $("#homeOffTimeVal");
  if (offTimeVal) offTimeVal.textContent = s.offTime ? formatTime(s.offTime) : "--";

  const endDateVal = $("#homeEndDateVal");
  if (endDateVal) endDateVal.textContent = getEndDate();

  const remDaysVal = $("#homeRemainingDaysVal");
  if (remDaysVal) remDaysVal.textContent = getRemainingDays();

  // Temperature circular progress ring
  const tempText = $("#homeTempText");
  if (tempText) tempText.textContent = Number.isFinite(temp) ? temp.toFixed(1) + " °C" : "-- °C";

  const tempCard = $("#homeTempCard");
  if (tempCard) {
    tempCard.className = `stat-card ${tempClass(temp)}`;
  }

  const tempCircle = $("#homeTempCircle");
  if (tempCircle) {
    const tempPercent = Number.isFinite(temp) ? Math.max(0, Math.min(100, (temp / 45) * 100)) : 0;
    const tempOffset = 188.4 - (188.4 * tempPercent) / 100;
    tempCircle.style.strokeDashoffset = tempOffset;
    
    let gaugeColor = "var(--blue)";
    if (Number.isFinite(temp)) {
      if (temp >= 32) gaugeColor = "var(--red)";
      else if (temp >= 25) gaugeColor = "var(--green)";
    }
    tempCircle.style.stroke = gaugeColor;
  }

  // Humidity
  const humText = $("#homeHumidityText");
  if (humText) humText.textContent = Number.isFinite(humidity) ? humidity.toFixed(0) + " %" : "-- %";

  // Water level wave animated card
  const waterText = $("#homeWaterText");
  if (waterText) waterText.textContent = Number.isFinite(water) ? waterSafe + "%" : "-- %";

  const waterCard = $("#homeWaterCard");
  if (waterCard) {
    waterCard.style.setProperty("--wave-height", `${waterSafe}%`);
  }
  const waterWave1 = $("#homeWaterWave1");
  if (waterWave1) {
    waterWave1.style.bottom = `${waterSafe}%`;
  }
  const waterWave2 = $("#homeWaterWave2");
  if (waterWave2) {
    waterWave2.style.bottom = `${waterSafe}%`;
  }
  const waterProgress = $("#homeWaterProgress");
  if (waterProgress) {
    waterProgress.style.width = `${waterSafe}%`;
  }

  // Professional pH and TDS cards
  const phText = $("#homePhText");
  if (phText) phText.textContent = `${phVal.toFixed(2)} pH`;

  const phPointer = $("#homePhPointer");
  if (phPointer) {
    const phPercent = Math.max(0, Math.min(100, ((phVal - 6.0) / 2.0) * 100));
    phPointer.style.left = `${phPercent}%`;
  }

  const tdsText = $("#homeTdsText");
  if (tdsText) tdsText.textContent = `${tdsVal} ppm`;

  const tdsProgress = $("#homeTdsProgress");
  if (tdsProgress) {
    const tdsPercent = Math.max(0, Math.min(100, (tdsVal / 400) * 100));
    tdsProgress.style.width = `${tdsPercent}%`;
  }

  // Update Maintenance metrics
  updateMaintenanceMetrics();

  const wifiVal = $("#homeWifiVal");
  if (wifiVal) wifiVal.textContent = device.wifi || "Offline";

  const rtcVal = $("#homeRtcVal");
  if (rtcVal) rtcVal.textContent = device.rtc || "--";

  const nextAction = $("#homeNextAction");
  if (nextAction) nextAction.textContent = nextActionText();

  const modeText = $("#homeModeText");
  if (modeText) modeText.textContent = s.mode === "limited" ? getRemainingDays() : "Continuous mode";

  // Update schedule preview page timeline if rendered
  const pOnTime = $("#previewOnTime");
  if (pOnTime) pOnTime.textContent = s.onTime ? formatTime(s.onTime) : "--";

  const pOffTime = $("#previewOffTime");
  if (pOffTime) pOffTime.textContent = s.offTime ? formatTime(s.offTime) : "--";

  const pEndDate = $("#previewEndDate");
  if (pEndDate) pEndDate.textContent = getEndDate();

  const pRemaining = $("#previewRemaining");
  if (pRemaining) pRemaining.textContent = getRemainingDays();

  const pCurrent = $("#previewCurrentMode");
  if (pCurrent) pCurrent.textContent = isLightTimeNow() ? "Light should be ON" : "Light should be OFF";

  const pNext = $("#previewNext");
  if (pNext) pNext.textContent = nextActionText();

  // Update manual control page status elements if rendered
  const cStatus = $("#controlStatusText");
  if (cStatus) cStatus.textContent = lightState + quickTimerRemainingText;

  const cStatusChecked = $("#controlStatusTextChecked");
  if (cStatusChecked) cStatusChecked.textContent = lightState === "ON" ? "Active (ON)" : "Standby (OFF)";

  const cRuntime = $("#controlRuntimeText");
  if (cRuntime) cRuntime.textContent = runtimeText();

  const cSchedule = $("#controlScheduleState");
  if (cSchedule) cSchedule.textContent = isLightTimeNow() ? "Schedule says ON" : "Schedule says OFF";

  const cNext = $("#controlNextAction");
  if (cNext) cNext.textContent = nextActionText();

  const cHero = $("#controlHeroCard");
  if (cHero) {
    cHero.className = `hero-card ${lightState === "ON" ? "hero-on" : "hero-off"}`;
  }

  const cPower = $("#controlPowerBtn");
  if (cPower) {
    if (lightState === "ON") cPower.classList.add("active");
    else cPower.classList.remove("active");
  }

  // Update Quick Timer pills active states
  const nowTime = Date.now();
  const qPill30 = $("#quickPill30");
  const qPill60 = $("#quickPill60");
  const qPill120 = $("#quickPill120");
  
  if (qPill30) qPill30.className = `quick-pill ${quickTimerEnd && Math.ceil((quickTimerEnd - nowTime) / 60000) <= 30 ? "active" : ""}`;
  if (qPill60) qPill60.className = `quick-pill ${quickTimerEnd && Math.ceil((quickTimerEnd - nowTime) / 60000) > 30 && Math.ceil((quickTimerEnd - nowTime) / 60000) <= 60 ? "active" : ""}`;
  if (qPill120) qPill120.className = `quick-pill ${quickTimerEnd && Math.ceil((quickTimerEnd - nowTime) / 60000) > 60 ? "active" : ""}`;

  // Update SVG History chart paths
  updateSvgChartPath();
}

function render() {
  updateHeaderTime();

  const page = $("#page");
  if (!page) return;

  if (activeTab === "home") page.innerHTML = renderHome();
  if (activeTab === "schedule") page.innerHTML = renderSchedule();
  if (activeTab === "alerts") page.innerHTML = renderAlerts();
  if (activeTab === "control") page.innerHTML = renderControl();

  bindPageEvents();
}

listenDevice((data) => {
  appData = data || {};
  lightState = appData.light?.status || "OFF";

  const s = appData.schedule || {};
  const sString = JSON.stringify(s);
  if (localStorage.getItem("lastScheduleConfig") !== sString) {
    localStorage.setItem("lastScheduleConfig", sString);
    localStorage.removeItem("lastScheduledStatus");
  }

  if (lightState === "ON" && !lightOnStart) {
    lightOnStart = Date.now();
    localStorage.setItem("lightOnStart", String(lightOnStart));
  }

  if (lightState === "OFF") {
    lightOnStart = null;
    localStorage.removeItem("lightOnStart");
  }

  // Push temp & humidity updates to history
  const temp = Number(appData.sensors?.temperature);
  if (Number.isFinite(temp)) {
    pushTempHistory(temp);
  }

  const hum = Number(appData.sensors?.humidity);
  if (Number.isFinite(hum)) {
    pushHumidityHistory(hum);
  }

  checkScheduleAutoControl();
  
  if ($("#page").innerHTML === "") {
    render();
  } else {
    updateAllDynamicElements();
  }
});

setInterval(() => {
  updateHeaderTime();

  if (quickTimerEnd) {
    const now = Date.now();
    if (now >= quickTimerEnd) {
      quickTimerEnd = null;
      localStorage.removeItem("quickTimerEnd");
      turnLight("OFF", "Quick Timer");
    }
  }

  if (!$("#dashboard").classList.contains("hidden")) {
    checkScheduleAutoControl();
    updateAllDynamicElements();
  }
}, 1000);