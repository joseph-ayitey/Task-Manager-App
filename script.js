const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentFilter = "all";

//
// 🔔 REQUEST NOTIFICATION PERMISSION
//
if ("Notification" in window) {

  Notification.requestPermission();

}

//
// 💾 SAVE TASKS
//
function saveTasks() {

  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );

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

  //
  // FILTER LOGIC
  //
  if (currentFilter === "active") {

    filteredTasks =
      tasks.filter(task => !task.completed);

  }

  else if (currentFilter === "completed") {

    filteredTasks =
      tasks.filter(task => task.completed);
  }

  //
  // DISPLAY TASKS
  //
  filteredTasks.forEach((task) => {

    const li =
      document.createElement("li");

    const span =
      document.createElement("span");

    span.textContent =
      `${task.text}
      ${task.date ? " - 📅 " + task.date : ""}
      ${task.time ? " ⏰ " + task.time : ""}`;

    //
    // ✅ COMPLETED STYLE
    //
    if (task.completed) {

      span.classList.add("completed");
    }

    //
    // ✅ TOGGLE COMPLETE
    //
    span.onclick = () => {

      task.completed = !task.completed;

      //
      // AUTO SWITCH FILTER
      //
      if (task.completed) {

        currentFilter = "completed";

      } else {

        currentFilter = "active";
      }

      saveTasks();

      renderTasks();
    };

    //
    // ❌ DELETE BUTTON
    //
    const deleteBtn =
      document.createElement("button");

    deleteBtn.textContent = "X";

    deleteBtn.onclick = () => {

      const realIndex =
        tasks.indexOf(task);

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

  const text =
    taskInput.value.trim();

  const date =
    document.getElementById("taskDate").value;

  const time =
    document.getElementById("taskTime").value;

  //
  // 🚫 EMPTY VALIDATION
  //
  if (!text || !date || !time) return;

  //
  // 📝 CREATE TASK
  //
  tasks.push({

    text,
    date,
    time,

    completed: false,

    //
    // 1 HOUR REMINDER
    //
    notified: false,

    //
    // EXACT DUE REMINDER
    //
    dueAlertPlayed: false
  });

  saveTasks();

  renderTasks();

  //
  // 🧹 CLEAR INPUT
  //
  taskInput.value = "";
}

//
// 🔊 BEEP SOUND
//
function playBeep() {

  try {

    const audioCtx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    const oscillator =
      audioCtx.createOscillator();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      1000,
      audioCtx.currentTime
    );

    oscillator.connect(
      audioCtx.destination
    );

    oscillator.start();

    setTimeout(() => {

      oscillator.stop();

    }, 300);

  } catch (err) {

    console.log(
      "Audio blocked until user interaction."
    );
  }
}

//
// 🔔 SHOW NOTIFICATION
//
function showNotification(
  title,
  message
) {

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {

    new Notification(title, {

      body: message,

      icon:
        "https://cdn-icons-png.flaticon.com/512/1827/1827392.png"
    });
  }
}

//
// ⏰ CHECK REMINDERS
//
function checkReminders() {

  const now = new Date();

  tasks.forEach(task => {

    //
    // SKIP COMPLETED TASKS
    //
    if (task.completed) return;

    //
    // CREATE TASK DATE
    //
    const taskDateTime =
      new Date(`${task.date}T${task.time}`);

    //
    // INVALID DATE CHECK
    //
    if (isNaN(taskDateTime)) return;

    const diff =
      taskDateTime - now;

    //
    // MINUTES LEFT
    //
    const minutesLeft =
      Math.ceil(diff / 60000);

    //
    // 🔔 UPCOMING REMINDER
    // between 1 and 60 minutes
    //
    if (

      minutesLeft > 0 &&
      minutesLeft <= 60 &&
      !task.notified

    ) {

      showNotification(

        "⏰ Upcoming Task",

        `"${task.text}" is due in ${minutesLeft} minute${
          minutesLeft !== 1 ? "s" : ""
        }!`
      );

      playBeep();

      //
      // PREVENT REPEAT
      //
      task.notified = true;

      saveTasks();
    }

    //
    // 🚨 EXACT DUE TIME
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

      //
      // PREVENT REPEAT
      //
      task.dueAlertPlayed = true;

      saveTasks();
    }

  });
}

//
// ⏱️ CHECK EVERY SECOND
//
setInterval(
  checkReminders,
  1000
);

//
// 🚀 INITIAL RENDER
//
renderTasks();