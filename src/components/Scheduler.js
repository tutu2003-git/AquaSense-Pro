export function Scheduler() {
  return `
    <section class="panel">

      <h2>Light Schedule</h2>

      <form id="scheduleForm">

        <label>ON Time</label>
        <input type="time" id="onTime" value="12:00">

        <label>OFF Time</label>
        <input type="time" id="offTime" value="18:00">

        <label>Schedule Mode</label>

        <select id="mode">
          <option value="continuous">Continuous Mode</option>
          <option value="limited">Limited Days Mode</option>
        </select>

        <label>Run For Days</label>

        <input
          type="number"
          id="days"
          min="1"
          value="7"
        >

        <button class="primary" type="submit">
          Save Schedule
        </button>

      </form>

    </section>
  `;
}