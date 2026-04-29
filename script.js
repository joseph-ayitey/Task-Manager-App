const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(task => task.completed);
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = `${task.text} - ${task.date} ${task.time}`;

    if (task.completed) {
      span.classList.add("completed");
    }

    span.onclick = () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";

    deleteBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    };

    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;

  if (!text || !date || !time) return;

  tasks.push({
    text,
    date,
    time,
    completed: false
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
}

function checkReminders() {
  const now = new Date();

  tasks.forEach(task => {
    if (!task.completed && !task.notified) {
      const taskDateTime = new Date(`${task.date}T${task.time}`);
      const diff = taskDateTime - now;

      // 1 hour = 3600000 ms
      if (diff > 0 && diff <= 3600000) {
        alert(`Reminder: "${task.text}" is due within 1 hour!`);
        task.notified = true; // prevent repeating alerts
        saveTasks();
      }
    }
  });
}

setInterval(checkReminders, 30000); // every 30 seconds

renderTasks();