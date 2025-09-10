import Navigo from 'navigo';
import { homePage } from './pages/home.js';
import { dashboardPage } from './pages/dashboard.js';
import { createItemPage } from './pages/createItem.js';
import { findMatchPage } from './pages/findMatch.js';
import { notFoundPage } from './pages/notFound.js';
import { getAuth } from './utils/auth.js';

// --- Single, correct declarations ---
const app = document.getElementById('app');
export const router = new Navigo('/');

// --- Route Definitions ---
// The router now calls the page function directly for every route.
// Each page function is responsible for rendering itself.
router
  .on({
    '/': () => {
      const { user } = getAuth();
      if (user) {
        router.navigate('/dashboard'); // Redirect if logged in
      } else {
        homePage();
      }
    },
    '/dashboard': () => dashboardPage(),
    '/create-item': () => createItemPage(),
    '/find-match': () => findMatchPage(),
  })
  .notFound(() => notFoundPage()) // Corrected method chaining
  .resolve();

// --- Route Guards (Unchanged) ---
// This logic remains the same.
router.hooks({
  before: (done, match) => {
    const protectedRoutes = ['/dashboard', '/create-item', '/find-match'];
    const { user } = getAuth();

    if (protectedRoutes.includes(match.route.path) && !user) {
      router.navigate('/'); // Redirect to home/login
      done(false); // Abort the current navigation
    } else {
      done(); // Proceed with navigation
    }
  },
});