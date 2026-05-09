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

  if (!notificationEnabled) return;

  try {
    new Notification(title, {
      body: message,
      icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png"
    });
  } catch (e) {
    console.log("Notification error:", e);
  }
}

//
// ⏰ REMINDER CHECKER
//
function checkReminders() {

  const now = new Date();

  tasks.forEach(task => {

    if (task.completed) return;

    const taskDateTime = new Date(`${task.date}T${task.time}:00`);

    if (!(taskDateTime instanceof Date) || isNaN(taskDateTime.getTime())) return;

    const diff = taskDateTime.getTime() - now.getTime();
    const minutesLeft = Math.floor(diff / 60000);

    //
    // 🔔 UPCOMING (1–60 min)
    //
    if (
      minutesLeft > 0 &&
      minutesLeft <= 60 &&
      !task.notified
    ) {

      showNotification(
        "⏰ Upcoming Task",
        `"${task.text}" is due in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}!`
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

      showNotification(
        "🚨 Task Due",
        `"${task.text}" is due NOW!`
      );

      playBeep();

      task.dueAlertPlayed = true;
      saveTasks();
    }
  });
}

//
// ⏱️ RUN EVERY SECOND
//
setInterval(checkReminders, 1000);

//
// 🚀 INITIAL RENDER
//
renderTasks();