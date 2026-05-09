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
  }

  else if (Notification.permission !== "denied") {

    Notification.requestPermission().then(permission => {
      notificationEnabled = permission === "granted";
    });
  }
}

function getTaskDateTime(task) {

  if (!task.date || !task.time) return null;

  const dateTimeString = `${task.date}T${task.time}:00`;
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    console.warn("❌ Invalid date:", dateTimeString);
    return null;
  }

  return date;
}

//
// 💾 SAVE TASKS
//
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

//
// 🔍 FILTER TASKS
//
function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
}

//
// 🖥️ RENDER TASKS
//
function renderTasks() {

  taskList.innerHTML = "";

  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = tasks.filter(task => !task.completed);
  }

  else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(task => task.completed);
  }

  filteredTasks.forEach((task) => {

    const li = document.createElement("li");
    const span = document.createElement("span");

    span.textContent =
      `${task.text}` +
      (task.date ? " - 📅 " + task.date : "") +
      (task.time ? " ⏰ " + task.time : "");

    if (task.completed) {
      span.classList.add("completed");
    }

    //
    // TOGGLE COMPLETE (FIXED)
    //
    span.onclick = () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    };

    //
    // DELETE TASK
    //
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";

    deleteBtn.onclick = () => {
      const realIndex = tasks.indexOf(task);
      tasks.splice(realIndex, 1);
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
// 🔊 BEEP SOUND
//
function playBeep() {

  try {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);

    oscillator.connect(audioCtx.destination);
    oscillator.start();

    setTimeout(() => oscillator.stop(), 300);

  } catch (err) {
    console.log("Audio blocked until user interaction.");
  }
}

//
// 🔔 NOTIFICATION
//
function showNotification(title, message) {

  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notifications not granted");
    return;
  }

  try {
    new Notification(title, {
      body: message
    });
  } catch (e) {
    console.error("Notification failed:", e);
  }
}

//
// ⏰ REMINDER CHECKER
//
function checkReminders() {

  const now = new Date();

  tasks.forEach(task => {

    if (task.completed) return;

    const taskDateTime = getTaskDateTime(task);
    if (!taskDateTime) return;

    const diff = taskDateTime - now;
    const minutesLeft = Math.floor(diff / 60000);

    console.log("Checking:", task.text, "minutesLeft:", minutesLeft);

    //
    // ⏰ UPCOMING (1–60 min)
    //
    if (
      minutesLeft > 0 &&
      minutesLeft <= 60 &&
      !task.notified
    ) {

      console.log("🔔 Upcoming alert triggered");

      showNotification(
        "⏰ Upcoming Task",
        `"${task.text}" in ${minutesLeft} min`
      );

      playBeep();

      task.notified = true;
      saveTasks();
    }

    //
    // 🚨 DUE NOW
    //
    if (
      diff <= 0 &&
      !task.dueAlertPlayed
    ) {

      console.log("🚨 Due alert triggered");

      showNotification(
        "🚨 Task Due",
        `"${task.text}" is due NOW`
      );

      playBeep();

      task.dueAlertPlayed = true;
      saveTasks();
    }

  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  setInterval(checkReminders, 1000);
});