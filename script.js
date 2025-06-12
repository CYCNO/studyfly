let fullTime = 25 * 60;
let seconds = fullTime;
let isRunning = false;
let isBreak = false;
let timerInterval;

if ("Notification" in window) {
  // Request permission from the user
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    } else {
      console.log("Notification permission denied.");
    }
  });
} else {
  console.log("This browser does not support notifications.");
}

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

function alert() {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      // Create and show the notification
      new Notification("Session Completed", {
        body: "Your session has ended, you can take a break now.",
        icon: "logo/logo.png", // Optional: Add an icon
      });
    } else {
      alert("Permission denied. Unable to send notification.");
    }
  });
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
        alert();
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
  const tasks = Array.from(document.querySelectorAll("#tasks li")).map(
    (li) => li.firstChild.textContent.trim()
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
  // Load existing Spotify URL into the input field
  document.getElementById("spotifyUrlInput").value =
    localStorage.getItem("spotifyEmbedUrl") || "";
}

function closeModal() {
  document.getElementById("customizeModal").style.display = "none";
}

function applySettings() {
  const time = parseInt(document.getElementById("timeInput").value);
  const bgUrl = document.getElementById("bgInput").value.trim();
  let spotifyUrl = document.getElementById("spotifyUrlInput").value.trim();

  if (!isNaN(time) && time > 0) {
    localStorage.setItem("studyflyTime", time);
    fullTime = time * 60;
    seconds = fullTime;
    updateTimerDisplay();
  }

  if (bgUrl !== "") {
    document.body.style.backgroundImage = `url("${bgUrl}")`;
    localStorage.setItem("studyflyBg", bgUrl);
  } else {
    document.body.style.backgroundImage = ""; // Clear if empty
    localStorage.removeItem("studyflyBg");
  }

  // Process Spotify URL
  if (spotifyUrl !== "") {
    // Ensure it's an embed URL
    if (spotifyUrl.includes("spotify.com/track/")) {
      spotifyUrl = spotifyUrl.replace(
        "spotify.com/track/",
        "spotify.com/embed/track/"
      );
    } else if (spotifyUrl.includes("spotify.com/playlist/")) {
      spotifyUrl = spotifyUrl.replace(
        "spotify.com/playlist/",
        "spotify.com/embed/playlist/"
      );
    } else if (spotifyUrl.includes("spotify.com/album/")) {
      spotifyUrl = spotifyUrl.replace(
        "spotify.com/album/",
        "spotify.com/embed/album/"
      );
    }
    // Add a default if it's just a general spotify.com URL without /embed/
    else if (spotifyUrl.includes("spotify.com/") && !spotifyUrl.includes("/embed/")) {
      // This case handles URLs like spotify.com/user/xyz or just spotify.com,
      // which might not directly map to an embed.
      // For a robust solution, you might want to guide the user to input
      // a track, playlist, or album URL specifically.
      // For now, if it's just spotify.com and no embed path, we'll try to convert.
      // This is a bit of a guess, as Spotify's embed URLs are quite specific.
      // A better approach would be to check for common Spotify URL patterns.
      if (!spotifyUrl.includes("/embed/")) {
        const parts = spotifyUrl.split("/");
        if (parts.length >= 5) { // e.g., https://open.spotify.com/track/xyz
          const type = parts[3]; // 'track', 'playlist', 'album'
          const id = parts[4].split("?")[0];
          spotifyUrl = `https://open.spotify.com/embed/${type}/${id}`;
        }
      }
    }
    
    document.getElementById("spotifyIframe").src = spotifyUrl;
    localStorage.setItem("spotifyEmbedUrl", spotifyUrl);
  } else {
    document.getElementById("spotifyIframe").src = ""; // Clear iframe if input is empty
    localStorage.removeItem("spotifyEmbedUrl");
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

  const savedSpotifyEmbedUrl = localStorage.getItem("spotifyEmbedUrl");
  if (savedSpotifyEmbedUrl) {
    document.getElementById("spotifyIframe").src = savedSpotifyEmbedUrl;
  }
})();

loadTasks();
updateTimerDisplay();
renderChart();