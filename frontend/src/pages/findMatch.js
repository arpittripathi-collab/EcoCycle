import { navbarComponent } from '../components/navbar.js';
import { findMatchFormComponent } from '../components/findMatchForm.js';

export const findMatchPage = () => {
  document.getElementById('app').innerHTML = `
    ${navbarComponent()}
    <main class="container">
      ${findMatchFormComponent()}
    </main>
    <div id="loader" class="loader-overlay" style="display: none;"><div class="loader"></div></div>
  `;
};