import { ref, set, onValue } from "firebase/database";
import { database } from "./firebase";

const devicePath = "devices/aquasense_001";

export function saveLightStatus(status) {
  return set(ref(database, `${devicePath}/light/status`), status);
}

export function saveSchedule(schedule) {
  return set(ref(database, `${devicePath}/schedule`), schedule);
}

export function listenDevice(callback) {
  onValue(ref(database, devicePath), (snapshot) => {
    callback(snapshot.val());
  });
}