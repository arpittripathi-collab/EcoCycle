import { handleLogin } from '../utils/auth.js';

export const loginFormComponent = () => {
  setTimeout(() => {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', handleLogin);
    }
  }, 0);

  return `
    <div class="auth-container">
        <h1>Login</h1>
        <form id="login-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" name="email" required>
            </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
            <p id="login-error-message" class="error"></p>
        </form>
    </div>
  `;
};