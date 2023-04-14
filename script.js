
const container = document.querySelector(".container");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let taskStats = JSON.parse(localStorage.getItem("taskStats")) || {};
let timer;

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveTaskStats() {
    localStorage.setItem("taskStats", JSON.stringify(taskStats));
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
            displayTaskStats();
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
        displayTaskStats();
        handleButtonClick();
    });
}

function displayTaskStats() {
    const taskStatsList = document.querySelector('.task-stats-list');
    if (taskStatsList) {
        container.removeChild(taskStatsList);
    }

    const maxHours = Math.max(
        ...Object.entries(taskStats).map(([_, count]) => count * 15 / 60),
        ...tasks.map(task => task.hours)
    );

    const newTaskStatsList = document.createElement("ul");
    newTaskStatsList.classList.add("task-stats-list");
    newTaskStatsList.innerHTML = Object.entries(taskStats)
        .map(([task, count]) => {
            const hours = count * 15 / 60;
            const taskObj = tasks.find(t => t.name === task);
            const estimatedHours = taskObj ? taskObj.hours : 0;
            const greenWidth = Math.min(hours, estimatedHours) / maxHours * 100;
            const redWidth = Math.max(0, hours - estimatedHours) / maxHours * 100;
            return `
                <li>
                    <span class="task-name">${task}:</span>
                    <span class="task-hours">${hours.toFixed(2)} hours</span>
                    <div class="bar-container">
                        <div class="bar green-bar" style="width: ${greenWidth}%;"></div>
                        <div class="bar red-bar" style="width: ${redWidth}%;"></div>
                    </div>
                </li>
            `;
        })
        .join("");
    container.appendChild(newTaskStatsList);
}


function createStartButton() {
    const startButton = document.createElement("button");
    startButton.textContent = "Start Timer";
    startButton.addEventListener("click", () => {
        startTimer();
        startButton.remove();
    });
    container.appendChild(startButton);
}

createTaskForm();
displayTasks();

document.addEventListener("DOMContentLoaded", () => {
    if (tasks.length > 0) {
        startTimer();
    } else {
      createStartButton();
    }
});
