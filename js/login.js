document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('message').innerText = data.message;
      // Optionally: redirect to a dashboard page
      //Store user's email for later use
      localStorage.setItem('userEmail', data.user.email);
      window.location.href = '/index.html';
    } else {
      document.getElementById('message').innerText = data.message;
    }
  } catch (err) {
    document.getElementById('message').innerText = 'Error logging in';
    console.error(err);
  }
});