import { navbarComponent } from '../components/navbar.js';
import { createItemFormComponent } from '../components/createItemForm.js';

export const createItemPage = () => {
  return `
    ${navbarComponent()}
    <main class="container">
      ${createItemFormComponent()}
    </main>
    <div id="loader" class="loader-overlay" style="display: none;"><div class="loader"></div></div>
  `;
};