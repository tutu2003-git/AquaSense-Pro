import { Header } from "./Header.js";

export function Dashboard() {
  return `
    <main id="dashboard" class="screen hidden fade">

      ${Header()}

      <section class="top-card">
        <div class="status-row">

          <div>
            <p>Light Status</p>
            <div id="lightStatus" class="light-title">--</div>
            <p id="nextText">Remote control ready</p>
          </div>

          <div class="power-circle">
            💡
          </div>

        </div>
      </section>

      <div id="statusGrid"></div>

      <div id="manualControl"></div>

      <div id="scheduler"></div>

      <div id="activityLog"></div>

    </main>
  `;
}