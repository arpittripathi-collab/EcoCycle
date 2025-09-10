import { handleSignup } from '../utils/auth.js';

export const signupFormComponent = () => {
  setTimeout(() => {
    const form = document.getElementById('signup-form');
    if(form) {
      form.addEventListener('submit', handleSignup);
    }
  }, 0);

  return `
    <div class="auth-container">
      <h1>Create Account</h1>
      <form id="signup-form">
          <div class="form-group">
              <label for="name">Full Name</label>
              <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
              <label for="signup-email">Email</label>
              <input type="email" id="signup-email" name="email" required>
          </div>
          <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" required placeholder="10-digit number">
          </div>
          <div class="form-group">
              <label for="signup-password">Password</label>
              <input type="password" id="signup-password" name="password" required>
          </div>
          <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required>
          </div>
          <button type="submit" class="btn">Sign Up</button>
          <p id="signup-error-message" class="error"></p>
      </form>
    </div>
  `;
};