import { handleLogout, getAuth } from '../utils/auth.js';

export const navbarComponent = () => {
    const { user } = getAuth();
    
    setTimeout(() => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }, 0);

    return `
      <header class="navbar">
          <a href="/dashboard" data-navigo class="logo">Marketplace</a>
          <nav>
              <span id="user-name">Welcome, ${user ? user.name : ''}!</span>
              <button id="logout-btn" class="btn btn-secondary">Logout</button>
          </nav>
      </header>
    `;
};