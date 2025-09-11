// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Check authentication status when page loads
async function checkAuthStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.isAuthenticated) {
            // If user is already authenticated, redirect to dashboard
            window.location.href = '../dashboard.html';
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
    }
}

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// DOM Elements
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Form Elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

// Error Elements
const signupError = document.getElementById('signupError');
const loginError = document.getElementById('loginError');

// Button Elements
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');

// Panel Toggle Functionality
signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
    clearErrors();
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
    clearErrors();
});

// Clear Error Messages
function clearErrors() {
    signupError.style.display = 'none';
    loginError.style.display = 'none';
    signupError.textContent = '';
    loginError.textContent = '';
}

// Show Error Message
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Show Loading State
function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.id === 'signupBtn' ? 'Sign Up' : 'Sign In';
    }
}

// Form Validation
function validateSignupForm(formData) {
    const { name, email, phone, password, confirmPassword } = formData;
    
    if (!name.trim()) {
        return 'Name is required';
    }
    
    if (!email.trim()) {
        return 'Email is required';
    }
    
    if (!phone.trim()) {
        return 'Phone number is required';
    }
    
    if (!password) {
        return 'Password is required';
    }
    
    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    
    return null; // No errors
}

function validateLoginForm(formData) {
    const { email, password } = formData;
    
    if (!email.trim()) {
        return 'Email is required';
    }
    
    if (!password) {
        return 'Password is required';
    }
    
    return null; // No errors
}

// Signup Function
async function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    
    const formData = {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        phone: document.getElementById('signupPhone').value,
        password: document.getElementById('signupPassword').value,
        confirmPassword: document.getElementById('signupConfirmPassword').value
    };
    
    // Validate form
    const validationError = validateSignupForm(formData);
    if (validationError) {
        showError(signupError, validationError);
        return;
    }
    
    setLoading(signupBtn, true);
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Success
        console.log('Signup successful:', response.data);
        alert('Account created successfully! Redirecting to dashboard...');
        window.location.href = '../dashboard.html';
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'An error occurred during signup';
        
        if (error.response) {
            // Server responded with error status
            errorMessage = error.response.data.message || errorMessage;
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'Unable to connect to server. Please try again.';
        }
        
        showError(signupError, errorMessage);
    } finally {
        setLoading(signupBtn, false);
    }
}

// Login Function
async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    
    const formData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    // Validate form
    const validationError = validateLoginForm(formData);
    if (validationError) {
        showError(loginError, validationError);
        return;
    }
    
    setLoading(loginBtn, true);
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: formData.email,
            password: formData.password
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Success
        console.log('Login successful:', response.data);
        alert('Login successful! Redirecting to dashboard...');
        window.location.href = '../dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'An error occurred during login';
        
        if (error.response) {
            // Server responded with error status
            errorMessage = error.response.data.message || errorMessage;
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'Unable to connect to server. Please try again.';
        }
        
        showError(loginError, errorMessage);
    } finally {
        setLoading(loginBtn, false);
    }
}

// Event Listeners
signupForm.addEventListener('submit', handleSignup);
loginForm.addEventListener('submit', handleLogin);

// Add some basic CSS for error messages
const style = document.createElement('style');
style.textContent = `
    .error-message {
        color: #ff4444;
        font-size: 14px;
        margin-top: 5px;
        margin-bottom: 10px;
        text-align: center;
        background-color: #ffe6e6;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ffcccc;
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);