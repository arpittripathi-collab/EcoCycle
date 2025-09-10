import { findMatches } from '../utils/api.js';
import { showLoader, hideLoader, handleLocationButton } from '../utils/helpers.js';
import { itemCardComponent } from './itemCard.js';

export const findMatchFormComponent = () => {
    setTimeout(() => {
        const form = document.getElementById('find-match-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorEl = document.getElementById('error-message');
                const resultsContainer = document.getElementById('results-container');
                errorEl.textContent = '';
                resultsContainer.innerHTML = '';
                
                const formData = new FormData(form);
                if (!formData.get('lat') || !formData.get('lon')) {
                    errorEl.textContent = 'Please provide your location.';
                    return;
                }

                showLoader();
                try {
                    const requestData = {
                        itemName: formData.get('itemName'),
                        category: formData.get('category'),
                        age: formData.get('age'),
                        gender: formData.get('gender'),
                        profession: formData.get('profession'),
                        location: {
                            lat: parseFloat(formData.get('lat')),
                            lon: parseFloat(formData.get('lon')),
                        }
                    };
                    const data = await findMatches(requestData);
                    if (data.results.length === 0) {
                        resultsContainer.innerHTML = '<p>No matching donors found.</p>';
                    } else {
                        resultsContainer.innerHTML = data.results.map(result => itemCardComponent(result.donor, result)).join('');
                    }
                } catch (error) {
                    errorEl.textContent = error.message;
                } finally {
                    hideLoader();
                }
            });
            handleLocationButton();
        }
    }, 0);

    return `
        <h2>Find an Item You Need</h2>
        <form id="find-match-form" class="item-form">
            <!-- Form fields from previous response -->
            <div class="form-group">
                <label for="itemName">Item Name</label>
                <input type="text" id="itemName" name="itemName" required>
            </div>
            <div class="form-group">
                <label for="category">Category</label>
                <input type="text" id="category" name="category" required>
            </div>
            <div class="form-group">
                <label for="age">Your Age</label>
                <input type="number" id="age" name="age">
            </div>
            <div class="form-group">
                <label for="gender">Your Gender</label>
                <select id="gender" name="gender">
                    <option value="other">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div class="form-group">
                <label for="profession">Your Profession</label>
                <input type="text" id="profession" name="profession">
            </div>
            <button type="button" id="get-location-btn" class="btn btn-secondary">Get My Location</button>
            <p id="location-status"></p>
            <input type="hidden" id="lat" name="lat">
            <input type="hidden" id="lon" name="lon">

            <button type="submit" class="btn">Find Matches</button>
            <p id="error-message" class="error"></p>
        </form>
        <hr>
        <h2>Matching Donors</h2>
        <div id="results-container" class="items-grid">
            <p>Your results will appear here...</p>
        </div>
    `;
};