const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

//
// 🆔 FIX OLD DATA (IMPORTANT)
// convert old tasks into proper timestamps
//
tasks = tasks.map(t => {
  const timestamp =
    t.timestamp ??
    new Date(`${t.date}T${t.time}:00`).getTime();

  return {
    ...t,
    id: t.id || crypto.randomUUID(),
    timestamp,
    notified: t.notified ?? false,
    dueAlertPlayed: t.dueAlertPlayed ?? false
  };
});

//
// 💾 SAVE
//
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
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

    if (task.completed) span.classList.add("completed");

    //
    // ✔ TOGGLE COMPLETE
    //
    span.onclick = () => {
      task.completed = !task.completed;

      if (!task.completed) {
        task.notified = false;
        task.dueAlertPlayed = false;
      }

      saveTasks();
      renderTasks();
    };

    //
    // ❌ DELETE
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
// ➕ ADD TASK (FIXED)
// IMPORTANT: create timestamp here
//
function addTask() {
  const text = taskInput.value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;

  if (!text || !date || !time) return;

  const timestamp = new Date(`${date}T${time}:00`).getTime();

  tasks.push({
    id: crypto.randomUUID(),
    text,
    date,
    time,
    timestamp, // ✅ KEY FIX
    completed: false,
    notified: false,
    dueAlertPlayed: false
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
}

//
// 🔊 SOUND
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
    console.log(err);
  }
}

//
// 🔔 NOTIFICATION
//
function showNotification(title, message) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body: message
  });
}

//
// 🚨 MAIN REMINDER LOGIC (FIXED)
//
function checkReminders() {
  const now = Date.now();

  tasks.forEach(task => {
    if (!task.timestamp || task.completed) return;

    const diff = task.timestamp - now;

    //
    // ⏳ UPCOMING (1 hour before)
    //
    if (
      diff > 0 &&
      diff <= 60 * 60 * 1000 &&
      !task.notified
    ) {
      showNotification(
        "⏰ Upcoming Task",
        `${task.text} in ${Math.ceil(diff / 60000)} min`
      );

      playBeep();
      task.notified = true;
      saveTasks();
    }

    //
    // 🚨 DUE NOW
    //
    if (diff <= 0 && !task.dueAlertPlayed) {
      showNotification(
        "🚨 Task Due",
        task.text
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
  setInterval(checkReminders, 1000);
});