let fullTime = 25 * 60;
let seconds = fullTime;
let isRunning = false;
let isBreak = false;
let timerInterval;

const bar = new ProgressBar.SemiCircle("#progress-container", {
  strokeWidth: 8,
  color: "#00ff88",
  trailColor: "#333",
  trailWidth: 8,
  easing: "linear",
  duration: 200,
  svgStyle: null,
});
bar.set(1);

function updateTimerDisplay() {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  document.getElementById("modeLabel").textContent = isBreak
    ? "Break"
    : "Study";
  document.getElementById("timer").textContent = `${minutes}:${secs}`;

  const total = isBreak ? 300 : fullTime;
  bar.set(seconds / total);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    if (seconds > 0) {
      seconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isRunning = false;

      if (!isBreak) {
        markTodayComplete();
        alert("Time for a break!");
        isBreak = true;
        seconds = 300;
      } else {
        alert("Back to work!");
        isBreak = false;
        seconds = fullTime;
      }

      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
}

function resetTimer() {
  stopTimer();
  isBreak = false;
  seconds = fullTime;
  updateTimerDisplay();
}

function addTask(e) {
  if (e.key === "Enter") {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
      const li = document.createElement("li");
      li.innerHTML = `${taskText} <span class="remove" onclick="removeTask(this)">✅</span>`;
      document.getElementById("tasks").appendChild(li);
      taskInput.value = "";
      saveTasks();
    }
  }
}

function removeTask(el) {
  el.parentElement.remove();
  saveTasks();
}

function saveTasks() {
  const tasks = Array.from(document.querySelectorAll("#tasks li")).map((li) =>
    li.firstChild.textContent.trim()
  );
  localStorage.setItem("studyflyTasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("studyflyTasks")) || [];
  tasks.forEach((taskText) => {
    const li = document.createElement("li");
    li.innerHTML = `${taskText} <span class="remove" onclick="removeTask(this)">✅</span>`;
    document.getElementById("tasks").appendChild(li);
  });
}

function markTodayComplete() {
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("studyflyTracker")) || {};
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem("studyflyTracker", JSON.stringify(data));
  renderChart();
}

function renderChart() {
  const data = JSON.parse(localStorage.getItem("studyflyTracker")) || {};
  const labels = [];
  const values = [];

  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().split("T")[0];
    labels.push(key.slice(5));
    values.push(data[key] || 0);
  }

  const ctx = document.getElementById("dailyChart").getContext("2d");
  if (window.dailyChartInstance) {
    window.dailyChartInstance.destroy();
  }

  const maxVal = Math.max(...values, 5);

  window.dailyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Sessions",
          data: values,
          backgroundColor: "#00ff88",
          borderRadius: 6,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: maxVal < 5 ? 5 : Math.ceil(maxVal),
          ticks: { stepSize: 1, color: "#fff" },
          grid: { color: "#333" },
          title: {
            display: true,
            text: "Sessions",
            color: "#fff",
          },
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "#333" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              return `${value} Session${value === 1 ? "" : "s"}`;
            },
          },
        },
      },
    },
  });
}

// Customization Logic
function setting() {
  document.getElementById("customizeModal").style.display = "flex";
  document.getElementById("timeInput").value = fullTime / 60;
  document.getElementById("bgInput").value =
    localStorage.getItem("studyflyBg") || "";
}

function closeModal() {
  document.getElementById("customizeModal").style.display = "none";
}

function applySettings() {
  const time = parseInt(document.getElementById("timeInput").value);
  const bgUrl = document.getElementById("bgInput").value.trim();

  if (!isNaN(time) && time > 0) {
    localStorage.setItem("studyflyTime", time);
    fullTime = time * 60;
    seconds = fullTime;
    updateTimerDisplay();
  }

  if (bgUrl !== "") {
    document.body.style.backgroundImage = `url("${bgUrl}")`;
    localStorage.setItem("studyflyBg", bgUrl);
  }

  closeModal();
}

(function loadCustomization() {
  const savedTime = parseInt(localStorage.getItem("studyflyTime"));
  if (!isNaN(savedTime)) {
    fullTime = savedTime * 60;
    seconds = fullTime;
  }

  const savedBg = localStorage.getItem("studyflyBg");
  if (savedBg) {
    document.body.style.backgroundImage = `url("${savedBg}")`;
  }
})();

loadTasks();
updateTimerDisplay();
renderChart();
