import { router } from '../router.js';
import { login, signup } from './api.js';

// --- ADDED BACK ---
// This function reads authentication data from local storage
export const getAuth = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  return { token, user };
};

// --- ADDED BACK ---
// This function handles the login form submission
export const handleLogin = async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error-message');
  errorEl.textContent = '';
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    const data = await login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.navigate('/dashboard');
  } catch (error) {
    errorEl.textContent = error.message;
  }
};
// --- END ADDED BACK ---


export const handleSignup = async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('signup-error-message');
    errorEl.textContent = '';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
        errorEl.textContent = "Passwords do not match";
        return;
    }

    try {
        const { confirmPassword, ...signupData } = data;
        const result = await signup(signupData);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.navigate('/dashboard');
    } catch (error) {
        errorEl.textContent = error.message;
    }
};

export const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.navigate('/');
};