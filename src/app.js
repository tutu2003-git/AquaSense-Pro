import { saveLightStatus, saveSchedule, listenDevice } from "./firebase/database";
import "./styles/style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <section id="landing" class="landing-screen">
    <div class="bubble b1"></div>
    <div class="bubble b2"></div>
    <div class="bubble b3"></div>

    <div class="landing-card">
      <div class="logo">🌊</div>
      <p class="tag">SMART AQUARIUM</p>
      <h1>AquaSense Pro</h1>
      <p class="desc">Remote light control, scheduling, live sensors and Firebase cloud sync.</p>
      <button id="startBtn">Open Dashboard</button>
    </div>
  </section>

  <main id="dashboard" class="dashboard hidden">
    <header class="topbar">
      <div>
        <p class="tag">Good Morning</p>
        <h1>Janith 👋</h1>
      </div>
      <div class="status-dot">● Online</div>
    </header>

    <section class="light-card">
      <div>
        <p>Light Status</p>
        <h2 id="lightStatus">--</h2>
        <span id="liveClock">--:--</span>
        <span id="nextAction">Next action calculating...</span>
        <span id="remainingDays">Remaining days: --</span>
      </div>
      <button id="powerBtn" class="power-btn">⏻</button>
    </section>

    <section class="stats-grid">
      <div class="stat"><span>⚙️</span><p>Mode</p><h3 id="modeStatus">--</h3></div>
      <div class="stat"><span>☀️</span><p>ON</p><h3 id="onTimeDisplay">--</h3></div>
      <div class="stat"><span>🌙</span><p>OFF</p><h3 id="offTimeDisplay">--</h3></div>
      <div class="stat"><span>📅</span><p>Days</p><h3 id="daysDisplay">--</h3></div>
      <div class="stat"><span>🌡️</span><p>Temp</p><h3 id="tempDisplay">-- °C</h3></div>
      <div class="stat"><span>💧</span><p>Water</p><h3 id="waterDisplay">-- %</h3></div>
      <div class="stat"><span>📶</span><p>WiFi</p><h3 id="wifiDisplay">Offline</h3></div>
      <div class="stat"><span>🕒</span><p>RTC</p><h3 id="rtcDisplay">--</h3></div>
    </section>

    <section class="action-card">
      <h2>Quick Control</h2>
      <div class="two-btn">
        <button id="onBtn" class="on">ON</button>
        <button id="offBtn" class="off">OFF</button>
      </div>
    </section>

    <section class="schedule-card">
      <h2>Schedule Light</h2>
      <form id="scheduleForm">
        <label>ON Time</label>
        <input id="onTime" type="time" value="12:00" />

        <label>OFF Time</label>
        <input id="offTime" type="time" value="18:00" />

        <label>Mode</label>
        <select id="mode">
          <option value="continuous">Continuous Mode</option>
          <option value="limited">Limited Days Mode</option>
        </select>

        <label>Run For Days</label>
        <input id="days" type="number" min="1" value="7" />

        <button class="save" type="submit">Save Schedule</button>
      </form>
    </section>

    <section class="activity-card">
      <h2>Activity</h2>
      <ul id="logList">
        <li>System ready</li>
      </ul>
    </section>
  </main>
`;

const landing = document.querySelector("#landing");
const dashboard = document.querySelector("#dashboard");

document.querySelector("#startBtn").addEventListener("click", () => {
  landing.classList.add("hide-landing");

  setTimeout(() => {
    landing.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }, 450);
});

function addLog(message) {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const logList = document.querySelector("#logList");
  logList.innerHTML = `<li>${time} • ${message}</li>` + logList.innerHTML;
}

async function turnLight(status) {
  await saveLightStatus(status);
  addLog(`Light turned ${status}`);
}

document.querySelector("#onBtn").addEventListener("click", () => {
  turnLight("ON");
});

document.querySelector("#offBtn").addEventListener("click", () => {
  turnLight("OFF");
});

document.querySelector("#powerBtn").addEventListener("click", () => {
  const current = document.querySelector("#lightStatus").textContent;
  turnLight(current === "ON" ? "OFF" : "ON");
});

document.querySelector("#scheduleForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const schedule = {
    onTime: document.querySelector("#onTime").value,
    offTime: document.querySelector("#offTime").value,
    mode: document.querySelector("#mode").value,
    days: Number(document.querySelector("#days").value)
  };

  await saveSchedule(schedule);
  addLog("Schedule saved");
});

listenDevice((data) => {
  if (!data) return;

  const light = data.light?.status || "--";
  const schedule = data.schedule || {};

  document.querySelector("#lightStatus").textContent = light;
  document.querySelector("#powerBtn").classList.toggle("active", light === "ON");

  document.querySelector("#modeStatus").textContent = schedule.mode || "--";
  document.querySelector("#onTimeDisplay").textContent = schedule.onTime || "--";
  document.querySelector("#offTimeDisplay").textContent = schedule.offTime || "--";
  document.querySelector("#daysDisplay").textContent = schedule.days || "--";

  document.querySelector("#onTime").value = schedule.onTime || "12:00";
  document.querySelector("#offTime").value = schedule.offTime || "18:00";
  document.querySelector("#mode").value = schedule.mode || "continuous";
  document.querySelector("#days").value = schedule.days || 7;

  document.querySelector("#tempDisplay").textContent = data.sensors?.temperature
    ? `${data.sensors.temperature} °C`
    : "-- °C";

  document.querySelector("#waterDisplay").textContent = data.sensors?.waterLevel
    ? `${data.sensors.waterLevel} %`
    : "-- %";

  document.querySelector("#wifiDisplay").textContent = data.device?.wifi || "Offline";
  document.querySelector("#rtcDisplay").textContent = data.device?.rtc || "--";

  updateLiveStatus();
});

function getMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function updateLiveStatus() {
  const now = new Date();

  document.querySelector("#liveClock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const onTime = document.querySelector("#onTime").value;
  const offTime = document.querySelector("#offTime").value;
  const mode = document.querySelector("#mode").value;
  const days = Number(document.querySelector("#days").value);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const onMinutes = getMinutes(onTime);
  const offMinutes = getMinutes(offTime);

  const diffOn = (onMinutes - currentMinutes + 1440) % 1440;
  const diffOff = (offMinutes - currentMinutes + 1440) % 1440;

  if (diffOn < diffOff) {
    document.querySelector("#nextAction").textContent =
      `Next ON in ${Math.floor(diffOn / 60)}h ${diffOn % 60}m`;
  } else {
    document.querySelector("#nextAction").textContent =
      `Next OFF in ${Math.floor(diffOff / 60)}h ${diffOff % 60}m`;
  }

  if (mode === "continuous") {
    document.querySelector("#remainingDays").textContent = "Continuous mode";
  } else {
    document.querySelector("#remainingDays").textContent = `Remaining days: ${days}`;
  }
}

setInterval(updateLiveStatus, 1000);
updateLiveStatus();