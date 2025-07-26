const container = document.querySelector(".container");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let taskStats = JSON.parse(localStorage.getItem("taskStats")) || {};
let timer;
let workSessionStart;
let beepAudio;
let volume = 0;
let increaseVolumeInterval;

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveTaskStats() {
  localStorage.setItem("taskStats", JSON.stringify(taskStats));
}

function saveWorkSession() {
  const workSessions = JSON.parse(localStorage.getItem("workSessions")) || [];
  workSessions.push({
    start: workSessionStart,
    end: new Date(),
    tasks,
    taskStats,
  });
  localStorage.setItem("workSessions", JSON.stringify(workSessions));
}

function clearCurrentSession() {
  tasks = [];
  taskStats = {};
  saveTasks();
  saveTaskStats();
  localStorage.removeItem("workSessionStart");
  localStorage.removeItem("timeLeft");
}

function createEndWorkButton() {
  const endWorkButton = document.createElement("button");
  endWorkButton.textContent = "End Work";
  endWorkButton.id = "end-work";
  if (Object.keys(taskStats).length === 0) {
    endWorkButton.disabled = true;
  }
  endWorkButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to end this work session?")) {
      clearInterval(timer);
      saveWorkSession();
      clearCurrentSession();
      location.reload();
    }
  });
  container.appendChild(endWorkButton);
}

function createTaskForm() {
  const form = document.createElement("form");
  form.innerHTML = `
        <input type="text" name="taskName" placeholder="Task Name" required>
        <input type="number" name="taskHours" placeholder="Hours" step="0.25" min="0" required>
        <button type="submit">Add Task</button>
    `;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    tasks.push({
      name: formData.get("taskName"),
      hours: parseFloat(formData.get("taskHours")),
    });
    saveTasks();
    displayTasks();
    form.reset();
    form.querySelector('input[name="taskName"]').focus();
  });
  container.appendChild(form);
  displayTasks();
}

// Keep track of the item being dragged
let draggedItem = null;
let draggedIndex = -1;

function displayTasks() {
  const taskList = document.querySelector(".task-list");
  if (taskList) {
    container.removeChild(taskList);
  }

  const newTaskList = document.createElement("ul");
  newTaskList.classList.add("task-list");
  newTaskList.innerHTML = tasks
    .map(
      (task, index) => `
        <li data-list-index="${index}">
            <span class="grab-handle" draggable="true">::</span>
            <input type="text" value="${task.name}" data-index="${index}" class="task-name">
            <input type="number" value="${task.hours}" data-index="${index}" class="task-hours" step="0.25" min="0">
            <button data-index="${index}" class="remove-task">Remove</button>
        </li>
    `
    )
    .join("");
  container.insertBefore(newTaskList, container.querySelector("form"));

  newTaskList.querySelectorAll(".task-name").forEach((input) =>
    input.addEventListener("input", (e) => {
      tasks[e.target.dataset.index].name = e.target.value;
      saveTasks();
    })
  );

  newTaskList.querySelectorAll(".task-hours").forEach((input) =>
    input.addEventListener("input", (e) => {
      tasks[e.target.dataset.index].hours = parseFloat(e.target.value);
      saveTasks();
    })
  );

  newTaskList.querySelectorAll(".remove-task").forEach((button) =>
    button.addEventListener("click", (e) => {
      tasks.splice(e.target.dataset.index, 1);
      saveTasks();
      displayTasks();
    })
  );

  const listItems = newTaskList.querySelectorAll("li");
  const grabHandles = newTaskList.querySelectorAll(".grab-handle"); // Select all handles

  grabHandles.forEach((handle) => { // Attach listeners to handles

    handle.addEventListener("dragstart", (e) => {
      draggedItem = handle.parentNode; // The parent is the LI
      draggedIndex = parseInt(draggedItem.dataset.listIndex);
      setTimeout(() => draggedItem.classList.add("dragging"), 0);
    });

    handle.addEventListener("dragend", () => {
      if (draggedItem) {
        draggedItem.classList.remove("dragging");
      }
      draggedItem = null;
      draggedIndex = -1;
      newTaskList.classList.remove('drag-over');
    });
  });

  listItems.forEach(item => { // Add listeners for visual state
    item.addEventListener('mouseenter', () => {
      item.classList.add('hovered'); // Add "hovered" class to li
    });
    item.addEventListener('mouseleave', () => {
      item.classList.remove('hovered'); // Remove "hovered" class when mouse leaves
    });
  });

  newTaskList.addEventListener("dragover", (e) => {
    e.preventDefault();
    newTaskList.classList.add('drag-over');
    const afterElement = getDragAfterElement(newTaskList, e.clientY);
    const currentDragging = document.querySelector(".dragging");
    if (currentDragging) {
      if (afterElement == null) {
        newTaskList.appendChild(currentDragging);
      } else {
        newTaskList.insertBefore(currentDragging, afterElement);
      }
    }
  });

   newTaskList.addEventListener('dragenter', (e) => {
        e.preventDefault();
        newTaskList.classList.add('drag-over');
   });

   newTaskList.addEventListener('dragleave', (e) => {
       if (e.target === newTaskList && !newTaskList.contains(e.relatedTarget)) {
            newTaskList.classList.remove('drag-over');
       }
   });


  newTaskList.addEventListener("drop", (e) => {
    e.preventDefault();
    newTaskList.classList.remove('drag-over');

    if (draggedItem) {
      const afterElement = getDragAfterElement(newTaskList, e.clientY);
      const newIndex = afterElement
        ? parseInt(afterElement.dataset.listIndex)
        : tasks.length;

      const itemToMove = tasks[draggedIndex];
      tasks.splice(draggedIndex, 1);

      const actualNewIndex = (newIndex > draggedIndex) ? newIndex -1 : newIndex;

      tasks.splice(actualNewIndex, 0, itemToMove);

      saveTasks();
      displayTasks();
    }

     if (draggedItem) draggedItem.classList.remove('dragging');
     draggedItem = null;
     draggedIndex = -1;
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll("li:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function findOrStartWorkSession() {
  const storedWorkSessionStart = localStorage.getItem("workSessionStart");
  workSessionStart = storedWorkSessionStart ? new Date(storedWorkSessionStart) : new Date();
  localStorage.setItem("workSessionStart", workSessionStart.toISOString());
}

function startTimer() {
  findOrStartWorkSession();

  clearInterval(timer);

  const storedTimeLeft = localStorage.getItem("timeLeft");
  let timeLeft = storedTimeLeft ? parseInt(storedTimeLeft) : 15 * 60;

  const timerDisplay = document.createElement("div");
  const pauseButton = document.createElement("button");
  pauseButton.innerHTML = "⏸️";

  let timerPaused = false;

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function onTimerTick() {
    if (!timerPaused) {
      timeLeft--;
      localStorage.setItem("timeLeft", timeLeft);
      updateTimerDisplay();
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      timerDisplay.remove();
      pauseButton.remove();
      localStorage.removeItem("timeLeft");
      playBeep();
      askUserWhatTheyAreDoing();
    }
  }

  pauseButton.addEventListener("click", () => {
    timerPaused = !timerPaused;
    pauseButton.innerHTML = timerPaused ? "▶️" : "⏸️";
  });

  updateTimerDisplay();
  container.appendChild(timerDisplay);
  container.appendChild(pauseButton);
  timer = setInterval(onTimerTick, 1000);
}

function playBeep() {
  beepAudio = new Audio("https://freesound.org/data/previews/316/316847_4939433-lq.mp3");
  volume = 0;
  beepAudio.volume = 0;
  beepAudio.loop = true;
  beepAudio.play();

  increaseVolumeInterval = setInterval(() => {
    volume += 0.001;
    beepAudio.volume = Math.min(1, volume);
    if (volume >= 1) {
      clearInterval(increaseVolumeInterval);
    }
  }, 1000);
}

function stopBeep() {
  if (beepAudio) {
    beepAudio.pause();
    beepAudio.currentTime = 0;
  }
  clearInterval(increaseVolumeInterval);
}

function askUserWhatTheyAreDoing() {
  const additionalTasks = [{ name: "Meeting" }, { name: "Slack" }];

  const uniqueTasks = tasks
    .concat(
      Object.keys(taskStats)
        .filter((task) => !tasks.some((t) => t.name.toLowerCase() === task.toLowerCase()))
        .map((task) => ({ name: task }))
    )
    .concat(
      additionalTasks.filter(
        (additionalTask) => !tasks.some((task) => task.name.toLowerCase() === additionalTask.name.toLowerCase())
      )
    );

  const prompt = document.createElement("div");
  prompt.innerHTML = `
        <h2>What are you doing?</h2>
        ${uniqueTasks
          .map(
            (task, index) => `
            <button data-index="${index}" class="task-button">${task.name}</button>
        `
          )
          .join("")}
        <button id="other-button">Other</button>
        <form id="other-form" style="display:none;">
            <input type="text" name="otherTask" placeholder="Other task" required>
            <button type="submit">Submit</button>
        </form>
    `;
  container.appendChild(prompt);

  const handleButtonClick = () => {
    stopBeep();
    container.removeChild(prompt);
    startTimer();
  };

  prompt.querySelectorAll(".task-button").forEach((button) =>
    button.addEventListener("click", (e) => {
      const taskIndex = e.target.dataset.index;
      taskStats[uniqueTasks[taskIndex].name] = (taskStats[uniqueTasks[taskIndex].name] || 0) + 1;
      saveTaskStats();
      displayTaskStats(container, taskStats, tasks);
      handleButtonClick();
    })
  );

  const otherButton = document.getElementById("other-button");
  const otherForm = document.getElementById("other-form");

  otherButton.addEventListener("click", () => {
    otherButton.style.display = "none";
    otherForm.style.display = "block";
    // make it quieter while typing temporarily
    volume = 0;
    beepAudio.volume = 0;
  });

  otherForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(otherForm);
    const otherTask = formData.get("otherTask");
    taskStats[otherTask] = (taskStats[otherTask] || 0) + 1;
    saveTaskStats();
    displayTaskStats(container, taskStats, tasks);
    handleButtonClick();
  });
}

function displayTaskStats(container, taskStats, tasks) {
  const existingTaskStatsList = container.querySelector(".task-stats-list");
  if (existingTaskStatsList) {
    container.removeChild(existingTaskStatsList);
  }

  const taskStatsList = document.createElement("div");
  taskStatsList.classList.add("task-stats-list");

  const maxTaskEstimateOrStat = Math.max(
    ...tasks.map((task) => task.hours),
    ...Object.values(taskStats).map((count) => (count * 15) / 60)
  );

  taskStatsList.innerHTML = Object.entries(taskStats)
    .map(([task, count]) => {
      const taskHours = (count * 15) / 60;
      const taskEstimate = tasks.find((t) => t.name === task)?.hours || 0;
      const greenWidth = (Math.min(taskHours, taskEstimate) / maxTaskEstimateOrStat) * 100;
      const redWidth = (Math.max(0, taskHours - taskEstimate) / maxTaskEstimateOrStat) * 100;
      return `
        <div class="bar-container">
            <span>${task}</span>
            <div class="bar">
                <div class="green" style="width: ${greenWidth}%;"></div>
                <div class="red" style="width: ${redWidth}%;"></div>
            </div>
            <span>${taskHours.toFixed(2)} hours</span>
        </div>
    `;
    })
    .join("");
  container.appendChild(taskStatsList);
}

function closeHistory() {
  const overlay = document.getElementById("visualization-overlay");
  if (overlay) {
    overlay.remove();
  }
}

function createStartButton() {
  const startButton = document.createElement("button");
  startButton.textContent = "Start Timer";
  startButton.addEventListener("click", () => {
    workSessionStart = new Date();
    startTimer();
    startButton.remove();
  });
  container.appendChild(startButton);
}

function createHistoryButton() {
  const historyButton = document.createElement("button");
  historyButton.textContent = "View History";
  historyButton.addEventListener("click", () => {
    const workSessions = JSON.parse(localStorage.getItem("workSessions")) || [];
    displayHistory(workSessions.length - 1); // show last session by default
  });
  container.appendChild(historyButton);
}

function displayHistory(sessionIndex) {
  const workSessions = JSON.parse(localStorage.getItem("workSessions")) || [];

  if (workSessions.length === 0) {
    alert("No work session history found.");
    return;
  }

  const session = workSessions[sessionIndex];
  const sessionDuration = (new Date(session.end) - new Date(session.start)) / 1000 / 60;

  const overlay = document.createElement("div");
  overlay.setAttribute("id", "visualization-overlay");
  const historyContainer = document.createElement("div");
  historyContainer.classList.add("history-container");
  historyContainer.id = "visualization-overlay";
  historyContainer.innerHTML = `
        <h2>Work Session History</h2>
        <p>Session ${sessionIndex + 1} of ${workSessions.length}</p>
        <p>Start Time: ${new Date(session.start).toLocaleString()}</p>
        <p>Duration: ${sessionDuration.toFixed(2)} minutes</p>
        <button id="prev-session" ${sessionIndex === 0 ? "disabled" : ""}>Previous</button>
        <button id="next-session" ${sessionIndex === workSessions.length - 1 ? "disabled" : ""}>Next</button>
        <button id="close-overlay">Close Overlay</button>
    `;

  displayTaskStats(historyContainer, session.taskStats, session.tasks);
  overlay.appendChild(historyContainer);
  container.appendChild(overlay);

  document.getElementById("prev-session").addEventListener("click", () => {
    container.removeChild(overlay);
    displayHistory(sessionIndex - 1);
  });

  document.getElementById("next-session").addEventListener("click", () => {
    container.removeChild(overlay);
    displayHistory(sessionIndex + 1);
  });

  document.getElementById("close-overlay").addEventListener("click", closeHistory);
}

function closeHistory() {
  const visualizationOverlay = document.getElementById("visualization-overlay");
  if (visualizationOverlay) {
    container.removeChild(visualizationOverlay);
  }
}

createTaskForm();
displayTasks();
displayTaskStats(container, taskStats, tasks);

document.addEventListener("DOMContentLoaded", () => {
  if (tasks.length > 0) {
    startTimer();
  } else {
    createStartButton();
  }
  createEndWorkButton();
  createHistoryButton();
});
