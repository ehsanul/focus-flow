const container = document.querySelector(".container");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let taskStats = JSON.parse(localStorage.getItem("taskStats")) || {};
let timer;
let workSessionStart = new Date();

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
}

function createEndWorkButton() {
    const endWorkButton = document.createElement("button");
    endWorkButton.textContent = "End Work";
    endWorkButton.addEventListener("click", () => {
        clearInterval(timer);
        saveWorkSession();
        clearCurrentSession();
        location.reload();
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

function displayTasks() {
    const taskList = document.querySelector('.task-list');
    if (taskList) {
        container.removeChild(taskList);
    }

    const newTaskList = document.createElement("ul");
    newTaskList.classList.add("task-list");
    newTaskList.innerHTML = tasks
        .map(
            (task, index) => `
        <li>
            <input type="text" value="${task.name}" data-index="${index}" class="task-name">
            <input type="number" value="${task.hours}" data-index="${index}" class="task-hours" step="0.25" min="0">
            <button data-index="${index}" class="remove-task">Remove</button>
        </li>
    `
        )
        .join("");
    container.insertBefore(newTaskList, container.querySelector('form'));

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
}

function startTimer() {
    clearInterval(timer);
    let timeLeft = 15 * 60;
    const timerDisplay = document.createElement("div");

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function onTimerTick() {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timer);
            timerDisplay.remove();
            playBeep();
            askUserWhatTheyAreDoing();
        }
    }

    updateTimerDisplay();
    container.appendChild(timerDisplay);
    timer = setInterval(onTimerTick, 1000);
}

let beepAudio;
function playBeep() {
    beepAudio = new Audio(
        "https://freesound.org/data/previews/316/316847_4939433-lq.mp3"
    );
    beepAudio.volume = 0.5;
    beepAudio.loop = true;
    beepAudio.play();
}

function stopBeep() {
    if (beepAudio) {
        beepAudio.pause();
        beepAudio.currentTime = 0;
    }
}

function askUserWhatTheyAreDoing() {
    const additionalTasks = [
        { name: "Meeting" },
        { name: "Slack" },
    ];

    const uniqueTasks = tasks.concat(
        additionalTasks.filter(
            (additionalTask) =>
                !tasks.some(
                    (task) =>
                        task.name.toLowerCase() ===
                        additionalTask.name.toLowerCase()
                )
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
            taskStats[uniqueTasks[taskIndex].name] =
                (taskStats[uniqueTasks[taskIndex].name] || 0) + 1;
            saveTaskStats();
            displayTaskStats(taskStats, tasks);
            handleButtonClick();
        })
    );

    const otherButton = document.getElementById("other-button");
    const otherForm = document.getElementById("other-form");

    otherButton.addEventListener("click", () => {
        otherButton.style.display = "none";
        otherForm.style.display = "block";
        if (beepAudio) {
          beepAudio.volume = 0.25; // make it quieter while typing
        }
    });

    otherForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(otherForm);
        const otherTask = formData.get("otherTask");
        taskStats[otherTask] = (taskStats[otherTask] || 0) + 1;
        saveTaskStats();
        displayTaskStats(taskStats, tasks);
        handleButtonClick();
    });
}

function displayTaskStats(taskStatsToDisplay, tasksForDisplay) {
    const existingTaskStatsList = document.querySelector(".task-stats-list");
    if (existingTaskStatsList) {
        container.removeChild(existingTaskStatsList);
    }

    const taskStatsList = document.createElement("div");
    taskStatsList.classList.add("task-stats-list");

    const maxTaskEstimateOrStat = Math.max(
        ...tasksForDisplay.map((task) => task.hours),
        ...Object.values(taskStatsToDisplay).map((count) => (count * 15) / 60)
    );

    taskStatsList.innerHTML = Object.entries(taskStatsToDisplay)
        .map(
            ([task, count]) => {
                const taskHours = (count * 15) / 60;
                const taskEstimate = tasksForDisplay.find((t) => t.name === task)?.hours || 0;
                const greenWidth = Math.min(taskHours, taskEstimate) / maxTaskEstimateOrStat * 100;
                const redWidth = Math.max(0, taskHours - taskEstimate) / maxTaskEstimateOrStat * 100;
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
            }
        )
        .join("");
    container.appendChild(taskStatsList);
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
    const historyContainer = document.createElement("div");
    historyContainer.classList.add("history-container");
    historyContainer.innerHTML = `
        <h2>Work Session History</h2>
        <p>Session ${sessionIndex + 1} of ${workSessions.length}</p>
        <p>Start Time: ${new Date(session.start).toLocaleString()}</p>
        <p>Duration: ${sessionDuration.toFixed(2)} minutes</p>
        <button id="prev-session" ${sessionIndex === 0 ? "disabled" : ""}>Previous</button>
        <button id="next-session" ${
            sessionIndex === workSessions.length - 1 ? "disabled" : ""
        }>Next</button>
    `;

    container.appendChild(historyContainer);

    console.log(session)
    displayTaskStats(session.taskStats, session.tasks);

    document.getElementById("prev-session").addEventListener("click", () => {
        container.removeChild(historyContainer);
        displayHistory(sessionIndex - 1);
    });

    document.getElementById("next-session").addEventListener("click", () => {
        container.removeChild(historyContainer);
        displayHistory(sessionIndex + 1);
    });
}

createTaskForm();
displayTasks();
displayTaskStats(taskStats, tasks);

document.addEventListener("DOMContentLoaded", () => {
    if (tasks.length > 0) {
        startTimer();
    } else {
        createStartButton();
    }
    createEndWorkButton();
    createHistoryButton();
});