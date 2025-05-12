// Goal Progress
new Chart(document.getElementById('goalChart'), {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [75, 25],
        backgroundColor: ['#28a745', '#ddd']
      }]
    }
  });
  
  // Weekly Comparison
  new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'This Week',
        backgroundColor: '#007bff',
        data: [3000, 5000, 4000, 6500, 7000, 8000, 7500]
      }, {
        label: 'Last Week',
        backgroundColor: '#6c757d',
        data: [2500, 4200, 3900, 6000, 6700, 7000, 7200]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
  
  // Weight Tracker
  new Chart(document.getElementById('weightChart'), {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Weight (kg)',
        borderColor: '#dc3545',
        data: [70, 69.5, 69, 68.7],
        fill: false,
        tension: 0.2
      }]
    }
  });
  