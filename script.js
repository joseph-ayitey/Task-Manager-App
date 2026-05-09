const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

//
// 🔔 NOTIFICATION STATE
//
let notificationEnabled = false;

if ("Notification" in window) {
  if (Notification.permission === "granted") {
    notificationEnabled = true;
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      notificationEnabled = permission === "granted";
    });
  }
}

//
// 🆔 ENSURE ALL TASKS HAVE IDs (important fix for old data)
//
tasks.forEach(t => {
  if (!t.id) t.id = crypto.randomUUID();
});

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

//
// ⏱️ DATE/TIME PARSER
//
function getTaskDateTime(task) {
  if (!task.date || !task.time) return null;

  const dateTime = new Date(`${task.date}T${task.time}:00`);

  if (isNaN(dateTime.getTime())) return null;

  return dateTime;
}

//
// 🔍 FILTER
//
function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
}

//
// 🖥️ RENDER
//
function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(t => t.completed);
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    const span = document.createElement("span");

    span.textContent =
      task.text +
      (task.date ? ` - 📅 ${task.date}` : "") +
      (task.time ? ` ⏰ ${task.time}` : "");

    if (task.completed) {
      span.classList.add("completed");
    }

    //
    // ✔ TOGGLE COMPLETE (UPDATED: auto move handling is natural via filter)
    //
    span.onclick = () => {
      task.completed = !task.completed;

      // reset reminders if reopened
      if (!task.completed) {
        task.notified = false;
        task.dueAlertPlayed = false;
      }

      saveTasks();
      renderTasks();
    };

    //
    // ❌ DELETE TASK (FIXED)
    //
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";

    deleteBtn.onclick = () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    };

    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

//
// ➕ ADD TASK
//
function addTask() {
  const text = taskInput.value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;

  if (!text || !date || !time) return;

  tasks.push({
    id: crypto.randomUUID(),
    text,
    date,
    time,
    completed: false,
    notified: false,
    dueAlertPlayed: false
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
}

//
// 🔊 BEEP SOUND (FIXED AUDIO CONTEXT)
//
let audioCtx;

function playBeep() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1000;

    osc.connect(audioCtx.destination);
    osc.start();

    setTimeout(() => osc.stop(), 300);

  } catch (err) {
    console.log("Audio error:", err);
  }
}

//
// 🔔 NOTIFICATION
//
function showNotification(title, message) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body: message });
  } catch (err) {
    console.error(err);
  }
}

//
// 🚀 CHECK REMINDERS (clean + safe version)
//
function checkReminders() {
  const now = Date.now();

  tasks.forEach((task) => {
    const diff = task.time - now;

    //
    // 🔄 Reset flags if task time was changed
    //
    if (task.lastCheckedTime !== task.time) {
      task.notified = false;
      task.dueAlertPlayed = false;
      task.lastCheckedTime = task.time;
    }

    //
    // ⏳ UPCOMING (1 hour → 1 minute before)
    //
    if (
      diff > 0 &&
      diff <= 60 * 60 * 1000 &&
      !task.notified
    ) {
      showNotification(
        "⏰ Upcoming Task",
        `${task.text} is coming in ${Math.ceil(diff / 60000)} min`
      );

      playBeep();
      task.notified = true;
      saveTasks();
    }

    //
    // 🚨 DUE NOW (no fragile time window)
    //
    if (diff <= 0 && !task.dueAlertPlayed) {
      showNotification(
        "🚨 Task Due",
        `${task.text} is due now`
      );

      playBeep();
      task.dueAlertPlayed = true;
      saveTasks();
    }
  });
}

//
// 🚀 INIT
//
window.addEventListener("DOMContentLoaded", () => {
  renderTasks();

  // still fine for UI updates, but logic is now safe
  setInterval(checkReminders, 1000);
});