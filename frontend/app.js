// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener("DOMContentLoaded", function() {
  // Check authentication status when page loads
  checkAuthStatus();

  // --- Typewriter Effect for the Tagline ---
  const text = '"Sustainability starts with you"';
  const tagline = document.getElementById("tagline");
  let i = 0;
  let isDeleting = false;
  let speed = 100; // Typing speed in ms

  function typeWriter() {
    // Check if the tagline element exists before proceeding
    if (tagline) {
      if (!isDeleting && i <= text.length) {
        tagline.textContent = text.substring(0, i);
        i++;
        speed = 100; // Typing speed
      } else if (isDeleting && i >= 0) {
        tagline.textContent = text.substring(0, i);
        i--;
        speed = 50; // Deleting speed
      }

      if (i === text.length + 1) {
        isDeleting = true;
        speed = 1500; // Pause before deleting
      } else if (i === 0 && isDeleting) {
        isDeleting = false;
        speed = 500; // Pause before typing again
      }

      setTimeout(typeWriter, speed);
    }
  }

  typeWriter();


  // --- Authentication Check Functions ---
  async function checkAuthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // We intentionally do NOT auto-redirect authenticated users from the landing page.
      // Returning auth state allows buttons (Dashboard/Join) to decide when to redirect.
      return response.data.isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async function checkAuthAndRedirect() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.isAuthenticated) {
        // User is logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        // User is not logged in, redirect to login page
        window.location.href = 'login-form/login-form.html';
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On error, redirect to login page as fallback
      window.location.href = 'login-form/login-form.html';
    }
  }

  // --- Dashboard Button Redirect Logic ---
  const dashboardButton = document.getElementById('dashboardBtn');
  if (dashboardButton) {
    dashboardButton.addEventListener('click', checkAuthAndRedirect);
  }

  // --- Join Our Mission Button Redirect Logic ---
  const joinMissionButton = document.getElementById('joinMissionBtn');
  if (joinMissionButton) {
    joinMissionButton.addEventListener('click', checkAuthAndRedirect);
  }

});