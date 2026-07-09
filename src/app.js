import { saveLightStatus, saveSchedule, listenDevice } from "./firebase/database";

const app = document.querySelector("#app");

let appData = {};
let activeTab = "home";
let lightState = "OFF";
let lightOnStart = Number(localStorage.getItem("lightOnStart")) || null;
let lastAutoMinute = "";

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
  <header class="header">
    <div>
      <p id="greeting" class="eyebrow">Good Morning</p>
      <h1>Janith 👋</h1>
      <p id="headerTime" class="small-muted">--</p>
    </div>
    <button id="themeBtn" class="icon-btn">🌙</button>
  </header>

  <div id="page"></div>

  <nav class="bottom-nav">
    <button class="nav-btn active" data-tab="home">🏠<span>Home</span></button>
    <button class="nav-btn" data-tab="schedule">⏰<span>Schedule</span></button>
    <button class="nav-btn" data-tab="alerts">🔔<span>Alerts</span></button>
    <button class="nav-btn" data-tab="control">⚡<span>Control</span></button>
  </nav>

  <div id="toast" class="toast">Ready</div>
</main>
`;

const $ = (id) => document.querySelector(id);

$("#openBtn").onclick = () => {
  $("#landing").classList.add("hide");
  setTimeout(() => {
    $("#landing").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    render();
  }, 350);
};

if (localStorage.getItem("theme") === "light") document.body.classList.add("light-mode");

$("#themeBtn").onclick = () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
};

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
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
  toast.textContent = msg;
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

function calculateEndDate(days) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + Number(days));
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
  const s = getSchedule();
  if (!s.onTime || !s.offTime) return;

  const now = new Date();
  const currentMinute = `${now.getHours()}:${now.getMinutes()}`;
  if (lastAutoMinute === currentMinute) return;

  const targetStatus = isLightTimeNow() ? "ON" : "OFF";

  if (lightState !== targetStatus) {
    lastAutoMinute = currentMinute;
    await turnLight(targetStatus, "Timer");
  }
}

function nextActionText() {
  const s = getSchedule();

  if (s.mode === "limited" && getRemainingDays() === "Expired") {
    return "Schedule expired • Light OFF";
  }

  const onTime = s.onTime || "12:00";
  const offTime = s.offTime || "18:00";

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

function renderHome() {
  const s = getSchedule();
  const sensor = getSensors();
  const device = getDevice();

  const temp = Number(sensor.temperature);
  const humidity = Number(sensor.humidity);
  const water = Number(sensor.waterLevel);
  const waterSafe = Number.isFinite(water) ? Math.max(0, Math.min(100, water)) : 0;
  const online = device.wifi === "Online";

  return `
    <section class="connection-card">
      <div class="live-left">
        <span class="${online ? "dot" : "dot offline"}"></span>
        <div>
          <strong>${online ? "Live Connection Active" : "Device Offline"}</strong>
          <p id="lastSyncText">Last sync: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
      <span class="cloud-pill">Firebase</span>
    </section>

    <section class="hero-card ${lightState === "ON" ? "hero-on" : "hero-off"}">
      <div>
        <p class="muted">Light Status</p>
        <h2 id="homeLightStatus" class="${lightState === "ON" ? "status-on" : "status-off"}">${lightState}</h2>
        <p id="homeClock">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <p id="homeNextAction">${nextActionText()}</p>
        <p id="homeModeText">${s.mode === "limited" ? getRemainingDays() : "Continuous mode"}</p>
      </div>
      <button id="powerBtn" class="power-btn ${lightState === "ON" ? "active" : ""}">⏻</button>
    </section>

    <section class="grid">
      <article class="stat-card"><span>⚙️</span><p>Mode</p><h3>${s.mode || "--"}</h3></article>
      <article class="stat-card"><span>☀️</span><p>ON Time</p><h3>${s.onTime ? formatTime(s.onTime) : "--"}</h3></article>
      <article class="stat-card"><span>🌙</span><p>OFF Time</p><h3>${s.offTime ? formatTime(s.offTime) : "--"}</h3></article>
      <article class="stat-card"><span>📅</span><p>End Date</p><h3>${getEndDate()}</h3><p class="card-sub">${getRemainingDays()}</p></article>
      <article class="stat-card ${tempClass(temp)}"><span>🌡️</span><p>Temperature</p><h3>${Number.isFinite(temp) ? temp.toFixed(1) + " °C" : "-- °C"}</h3></article>
      <article class="stat-card"><span>💧</span><p>Humidity</p><h3>${Number.isFinite(humidity) ? humidity.toFixed(0) + " %" : "-- %"}</h3></article>
      <article class="stat-card"><span>🌊</span><p>Water Level</p><h3>${waterSafe ? waterSafe + "%" : "-- %"}</h3><div class="progress"><div style="width:${waterSafe}%"></div></div></article>
      <article class="stat-card"><span>📶</span><p>WiFi</p><h3>${device.wifi || "Offline"}</h3></article>
      <article class="stat-card"><span>🕒</span><p>RTC</p><h3>${device.rtc || "--"}</h3></article>
      <article class="stat-card"><span>⏱️</span><p>Runtime</p><h3 id="runtimeDisplay">${runtimeText()}</h3></article>
    </section>
  `;
}

function renderSchedule() {
  const s = getSchedule();

  return `
    <section class="page-title">
      <h2>Schedule Timer</h2>
      <p>Set ON/OFF time for your aquarium light.</p>
    </section>

    <section class="panel">
      <form id="scheduleForm">
        <label>ON Time</label>
        <input id="onTime" type="time" value="${s.onTime || "12:00"}">

        <label>OFF Time</label>
        <input id="offTime" type="time" value="${s.offTime || "18:00"}">

        <label>Schedule Mode</label>
        <select id="mode">
          <option value="continuous" ${s.mode === "continuous" ? "selected" : ""}>Continuous Mode</option>
          <option value="limited" ${s.mode === "limited" ? "selected" : ""}>Limited Days Mode</option>
        </select>

        <label>Run For Days</label>
        <input id="days" type="number" min="1" value="${s.days || 7}">

        <button class="primary-btn" type="submit">Save Schedule</button>
      </form>
    </section>

    <section class="panel">
      <h2>Timer Preview</h2>
      <div class="timeline">
        <div><strong>☀️ ON</strong><span>${s.onTime ? formatTime(s.onTime) : "--"}</span></div>
        <div><strong>🌙 OFF</strong><span>${s.offTime ? formatTime(s.offTime) : "--"}</span></div>
        <div><strong>📅 End Date</strong><span>${getEndDate()}</span></div>
        <div><strong>⏳ Remaining</strong><span>${getRemainingDays()}</span></div>
        <div><strong>💡 Current</strong><span>${isLightTimeNow() ? "Light should be ON" : "Light should be OFF"}</span></div>
        <div><strong>⏳ Next</strong><span>${nextActionText()}</span></div>
      </div>
    </section>
  `;
}

function renderAlerts() {
  const sensor = getSensors();
  const device = getDevice();
  const temp = Number(sensor.temperature);

  const alerts = [];

  alerts.push([
    lightState === "ON" ? "💡" : "🌙",
    lightState === "ON" ? "Light turned ON" : "Light turned OFF",
    lightState === "ON" ? "Timer or manual control is active" : "Aquarium light is currently off"
  ]);

  if (Number.isFinite(temp) && temp >= 32) {
    alerts.push(["🌡️", "High Temperature Alert", `${temp.toFixed(1)} °C detected`]);
  }

  if (device.wifi !== "Online") {
    alerts.push(["📶", "WiFi Offline Alert", "Device is not reporting online status"]);
  }

  const logs = JSON.parse(localStorage.getItem("logs") || "[]");

  return `
    <section class="page-title">
      <h2>Alerts</h2>
      <p>Important system notifications and activity.</p>
    </section>

    <section class="alert-list">
      ${alerts.map(a => `
        <article class="alert-card">
          <span>${a[0]}</span>
          <div><h3>${a[1]}</h3><p>${a[2]}</p></div>
        </article>
      `).join("")}
    </section>

    <section class="panel">
      <h2>Recent Activity</h2>
      <ul class="logs">
        ${logs.length ? logs.map(l => `<li>${l.time} • ${l.msg}</li>`).join("") : "<li>No activity yet</li>"}
      </ul>
    </section>
  `;
}

function renderControl() {
  return `
    <section class="page-title">
      <h2>Light Control</h2>
      <p>Manual control for aquarium light.</p>
    </section>

    <section class="hero-card ${lightState === "ON" ? "hero-on" : "hero-off"}">
      <div>
        <p class="muted">Current Light</p>
        <h2 class="${lightState === "ON" ? "status-on" : "status-off"}">${lightState}</h2>
        <p>${nextActionText()}</p>
      </div>
      <button id="powerBtn" class="power-btn ${lightState === "ON" ? "active" : ""}">⏻</button>
    </section>

    <section class="panel">
      <h2>Manual Buttons</h2>
      <div class="split">
        <button id="onBtn" class="control-btn on">Turn ON</button>
        <button id="offBtn" class="control-btn off">Turn OFF</button>
      </div>
    </section>

    <section class="panel">
      <h2>Quick Info</h2>
      <div class="timeline">
        <div><strong>Status</strong><span>${lightState}</span></div>
        <div><strong>Runtime</strong><span>${runtimeText()}</span></div>
        <div><strong>Timer</strong><span>${isLightTimeNow() ? "Schedule says ON" : "Schedule says OFF"}</span></div>
        <div><strong>Next</strong><span>${nextActionText()}</span></div>
      </div>
    </section>
  `;
}

function bindPageEvents() {
  const power = $("#powerBtn");
  if (power) power.onclick = () => turnLight(lightState === "ON" ? "OFF" : "ON", "Manual");

  const on = $("#onBtn");
  if (on) on.onclick = () => turnLight("ON", "Manual");

  const off = $("#offBtn");
  if (off) off.onclick = () => turnLight("OFF", "Manual");

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
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelector('[data-tab="home"]').classList.add("active");

      render();
    };
  }
}

function updateOnlyDynamicHomeValues() {
  if (activeTab !== "home") return;

  const clock = $("#homeClock");
  const next = $("#homeNextAction");
  const runtime = $("#runtimeDisplay");
  const modeText = $("#homeModeText");
  const status = $("#homeLightStatus");

  if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (next) next.textContent = nextActionText();
  if (runtime) runtime.textContent = runtimeText();

  const s = getSchedule();
  if (modeText) modeText.textContent = s.mode === "limited" ? getRemainingDays() : "Continuous mode";

  if (status) {
    status.textContent = lightState;
    status.className = lightState === "ON" ? "status-on" : "status-off";
  }
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

  if (lightState === "ON" && !lightOnStart) {
    lightOnStart = Date.now();
    localStorage.setItem("lightOnStart", String(lightOnStart));
  }

  if (lightState === "OFF") {
    lightOnStart = null;
    localStorage.removeItem("lightOnStart");
  }

  checkScheduleAutoControl();
  render();
});

setInterval(() => {
  updateHeaderTime();

  if (!$("#dashboard").classList.contains("hidden")) {
    checkScheduleAutoControl();
    updateOnlyDynamicHomeValues();
  }
}, 1000);