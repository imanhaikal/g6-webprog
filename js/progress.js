let goalChartInstance = null;
let weightChartInstance = null;
let loggedInUserId = null;

// Get logged-in user's ID from session
fetch('/api/session-user')
  .then(res => res.json())
  .then(data => {
    loggedInUserId = data.userId;
    loadWeeklyActivityChart(loggedInUserId);
    loadWeightChart();
  })
  .catch(err => console.error("Failed to fetch user session:", err));

// Goal Progress form handling
document.getElementById('goalForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const goalWeight = parseFloat(document.getElementById('goalWeightInput').value);

  fetch('/api/profile')
    .then(res => res.json())
    .then(profile => {
      const currentWeight = parseFloat(profile.weight);
      const difference = Math.abs(currentWeight - goalWeight);
      const completed = goalWeight === currentWeight ? 100 : Math.min((1 - (difference / Math.max(currentWeight, goalWeight))) * 100, 100);
      const remaining = 100 - completed;

      if (goalChartInstance) goalChartInstance.destroy();

      goalChartInstance = new Chart(document.getElementById('goalChart'), {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{
            data: [completed, remaining],
            backgroundColor: ['#28a745', '#ddd']
          }]
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.label}: ${context.parsed.toFixed(1)}%`;
                }
              }
            }
          }
        }
      });

      // Save updated goal weight to MongoDB
      fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalWeight })
      })
        .then(res => res.json())
        .then(data => {
          console.log("Goal weight updated:", data);
        })
        .catch(err => {
          console.error("Failed to update goal weight:", err);
        });

    }).catch(err => {
      console.error("Failed to fetch current weight:", err);
    });
});

// Weekly Activity Comparison
function loadWeeklyActivityChart(userId) {
  console.log("Weekly Chart: Fetching activity for user", userId);

  fetch(`/api/progress/activity-compare/${userId}`)
    .then(res => res.json())
    .then(data => {
      console.log("Weekly data:", data);

      const thisWeek = [0, 0, 0, 0, 0, 0, 0];
      const lastWeek = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();

      data.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayIndex = entryDate.getDay();
        const daysAgo = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));

        if (daysAgo <= 6) {
          thisWeek[dayIndex] += entry.calories;
        } else if (daysAgo <= 13) {
          lastWeek[dayIndex] += entry.calories;
        }
      });

      const chartCanvas = document.getElementById('weeklyChart');
      const existingChart = Chart.getChart(chartCanvas);
      if (existingChart) existingChart.destroy();

      new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          datasets: [
            {
              label: 'This Week',
              data: thisWeek,
              backgroundColor: '#007bff'
            },
            {
              label: 'Last Week',
              data: lastWeek,
              backgroundColor: '#6c757d'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    })
    .catch(err => {
      console.error("Failed to load weekly chart:", err);
    });
}

// Weight Tracker

document.getElementById('weightLogForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const weight = parseFloat(document.getElementById('weightInput').value);
  if (!weight || weight <= 0) return;

  fetch('/api/weight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ weight })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Weight logged:", data);
      document.getElementById('weightInput').value = '';
      loadWeightChart(); // refresh chart after logging
    })
    .catch(err => {
      console.error("Failed to log weight:", err);
    });
});

function loadWeightChart() {
  fetch('/api/weight')
    .then(res => res.json())
    .then(data => {
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      const labels = sorted.map(entry => new Date(entry.date).toLocaleDateString());
      const weights = sorted.map(entry => entry.weight);

      const canvas = document.getElementById('weightChart');
      if (weightChartInstance) weightChartInstance.destroy();

      weightChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Weight (kg)',
            borderColor: '#dc3545',
            data: weights,
            fill: false,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
    })
    .catch(err => {
      console.error("Failed to load weight chart:", err);
    });
}
