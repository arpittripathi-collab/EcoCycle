import { navbarComponent } from '../components/navbar.js';
import { getItems } from '../utils/api.js';
import { itemCardComponent } from '../components/itemCard.js';
import { showLoader, hideLoader } from '../utils/helpers.js';

const loadDashboardData = async () => {
  const itemsList = document.getElementById('items-list');
  showLoader();
  try {
    // The API call no longer needs the user role
    const data = await getItems(); 
    if (data.items.length === 0) {
      itemsList.innerHTML = `<p>You have not created any listings (donations or requests) yet.</p>`;
    } else {
      itemsList.innerHTML = data.items.map(item => itemCardComponent(item)).join('');
    }
  } catch (error) {
    itemsList.innerHTML = `<p class="error">Could not fetch your listings.</p>`;
  } finally {
    hideLoader();
  }
};

export const dashboardPage = () => {
  document.getElementById('app').innerHTML = `
    ${navbarComponent()}
    <main class="container">
      <div id="dashboard-actions">
        <h2>Dashboard</h2>
        <p>Manage your items or find something you need.</p>
        <div class="dashboard-buttons">
            <a href="/create-item" data-navigo class="btn">Create a New Listing</a>
            <a href="/find-match" data-navigo class="btn btn-secondary">Find a Donation</a>
        </div>
      </div>
      <hr style="margin: 2rem 0;">
      <h3>Your Active Listings</h3>
      <div id="items-list" class="items-grid">
        <p>Loading your listings...</p>
      </div>
    </main>
    <div id="loader" class="loader-overlay" style="display: none;"><div class="loader"></div></div>
  `;
  loadDashboardData();
};