document.addEventListener('DOMContentLoaded', () => {
            // Load default page (dashboard)
            loadPage('dashboard');

            // Handle navigation clicks
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.target.closest('.nav-link').dataset.page;
                    const section = e.target.closest('.nav-link').dataset.section;
                    
                    // Update active states
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    e.target.closest('.nav-link').classList.add('active');
                    
                    // Load the page
                    loadPage(page, section);
                });
            });
        });

        function loadPage(page, section = null) {
            // Update page title
            const pageTitle = document.getElementById('pageTitle');
            const navLink = document.querySelector(`.nav-link[data-page="${page}"]:not(.sub-nav-link)`);
            if (pageTitle && navLink) {
                pageTitle.textContent = navLink.textContent.trim();
            }

            // Load the page content
            fetch(`${page}.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.querySelector('.page-content');
                    
                    if (content) {
                        const mainContent = document.getElementById('mainContent');
                        mainContent.innerHTML = content.innerHTML;
                        
                        // If there's a section to scroll to
                        if (section) {
                            const sectionElement = document.getElementById(section);
                            if (sectionElement) {
                                sectionElement.scrollIntoView({ behavior: 'smooth' });
                            }
                        }

                        // Reinitialize any Bootstrap components in the new content
                        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                        tooltipTriggerList.map(function (tooltipTriggerEl) {
                            return new bootstrap.Tooltip(tooltipTriggerEl);
                        });
                        
                        // Initialize charts if we're on the progress page
                        if (page === 'progress') {
                            initializeCharts();
                        }
                    } else {
                        throw new Error('Content element not found in the loaded page');
                    }
                })
                .catch(error => {
                    console.error('Error loading page:', error);
                    document.getElementById('mainContent').innerHTML = `
                        <div class="alert alert-danger m-3">
                            <h4 class="alert-heading">Error Loading Content</h4>
                            <p>There was an error loading the page content. Please try again later.</p>
                            <hr>
                            <p class="mb-0">Error details: ${error.message}</p>
                        </div>`;
                });
        }

        // Function to initialize charts
        function initializeCharts() {
            // Goal Progress
            if (document.getElementById('goalChart')) {
                new Chart(document.getElementById('goalChart'), {
                    type: 'doughnut',
                    data: {
                      labels: ['Completed', 'Remaining'],
                      datasets: [{
                        data: [75, 25],
                        backgroundColor: ['#28a745', '#ddd']
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        }
                      }
                    }
                });
            }
            
            // Weekly Comparison
            if (document.getElementById('weeklyChart')) {
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
                      maintainAspectRatio: false,
                      scales: {
                        y: { 
                          beginAtZero: true,
                          grid: {
                            display: true
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          align: 'center'
                        }
                      }
                    }
                });
            }
            
            // Weight Tracker
            if (document.getElementById('weightChart')) {
                new Chart(document.getElementById('weightChart'), {
                    type: 'line',
                    data: {
                      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                      datasets: [{
                        label: 'Weight (kg)',
                        borderColor: '#dc3545',
                        data: [70, 69.5, 69, 68.7],
                        fill: false,
                        tension: 0.2,
                        pointBackgroundColor: '#dc3545'
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: false,
                          grid: {
                            display: true
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      }
                    }
                });
            }
        }

        // Handle login/register/logout
        document.getElementById('loginForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Login successful (mock)!');
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
        });

        document.getElementById('registerForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Registration successful (mock)! Please login.');
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
        });

        document.getElementById('logoutButton')?.addEventListener('click', function() {
            window.location.href = "login.html";
            alert('Logged out (mock)!');
        });