
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