import { loginFormComponent } from '../components/loginForm.js';
import { signupFormComponent } from '../components/signupForm.js';

export const homePage = () => {
  document.getElementById('app').innerHTML = `
    <div class="home-container">
      ${loginFormComponent()}
      <div class="divider"></div>
      ${signupFormComponent()}
    </div>
  `;
};