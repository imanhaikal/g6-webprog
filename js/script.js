// Load the template content
    fetch('index.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
                
            // Get the template structure (without head/body tags)
            const templateContent = doc.querySelector('.d-flex');
            document.getElementById('templateContent').appendChild(templateContent);

            

            // Initialize Bootstrap components
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            initializeCharts();
        });

// The following event handlers were moved to index.js for proper delegation
// Handle quick log buttons functionality is now in index.js

    function initializeCharts() {
  const goalChartCanvas = document.getElementById('goalChart');
  const weeklyChartCanvas = document.getElementById('weeklyChart');
  const weightChartCanvas = document.getElementById('weightChart');

  if (goalChartCanvas) {
    new Chart(goalChartCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [75, 25],
          backgroundColor: ['#28a745', '#ddd']
        }]
      }
    });
  }

  if (weeklyChartCanvas) {
    new Chart(weeklyChartCanvas, {
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
  }

  if (weightChartCanvas) {
    new Chart(weightChartCanvas, {
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
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem('userEmail'); //stored during login
  if (!email) return alert("User not logged in");

  fetch(`http://localhost:3000/api/user/${email}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('profileName').value = data.name || '';
      document.getElementById('profileEmail').value = data.email || '';
      document.getElementById('profileAge').value = data.age || '';
      document.getElementById('profileWeight').value = data.weight || '';
      document.getElementById('profileHeight').value = data.height || '';
      // You can add fitnessGoals if it exists in schema
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load profile");
    });

  // Submit profile update
  document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {
      name: document.getElementById('profileName').value,
      age: document.getElementById('profileAge').value,
      weight: document.getElementById('profileWeight').value,
      height: document.getElementById('profileHeight').value,
    };

    try {
      const res = await fetch(`http://localhost:3000/api/user/${email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      const result = await res.json();
      alert(result.message);
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  });
});

