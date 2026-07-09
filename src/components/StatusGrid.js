export function StatusGrid() {

return `

<section class="grid">

<div class="mini-card">
<span>⚙️</span>
<p>Mode</p>
<h3 id="modeStatus">--</h3>
</div>

<div class="mini-card">
<span>🌡️</span>
<p>Temperature</p>
<h3 id="tempStatus">-- °C</h3>
</div>

<div class="mini-card">
<span>💧</span>
<p>Water Level</p>
<h3 id="waterStatus">-- %</h3>
</div>

<div class="mini-card">
<span>📶</span>
<p>WiFi</p>
<h3 id="wifiStatus">Offline</h3>
</div>

<div class="mini-card">
<span>🕒</span>
<p>RTC</p>
<h3 id="rtcStatus">Not Connected</h3>
</div>

<div class="mini-card">
<span>📅</span>
<p>Days</p>
<h3 id="daysDisplay">--</h3>
</div>

<div class="mini-card">
<span>☀️</span>
<p>ON Time</p>
<h3 id="onTimeDisplay">--</h3>
</div>

<div class="mini-card">
<span>🌙</span>
<p>OFF Time</p>
<h3 id="offTimeDisplay">--</h3>
</div>

</section>

`;

}