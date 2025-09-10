import { createItem } from '../utils/api.js';
import { router } from '../router.js';
import { showLoader, hideLoader, handleLocationButton } from '../utils/helpers.js';

export const createItemFormComponent = () => {
    setTimeout(() => {
        const form = document.getElementById('create-item-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorEl = document.getElementById('error-message');
                errorEl.textContent = '';
                const formData = new FormData(form);
                // ... (file and location validation)

                showLoader();
                try {
                    const locationObj = { lat: formData.get('lat'), lon: formData.get('lon') };
                    formData.set('location', JSON.stringify(locationObj));
                    await createItem(formData);
                    router.navigate('/dashboard');
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
      <h2>Create a Listing</h2>
      <form id="create-item-form" class="item-form">
          <div class="form-group">
              <label>This listing is a:</label>
              <div class="radio-group">
                  <input type="radio" id="donation" name="itemType" value="donation" checked>
                  <label for="donation">Donation (I want to give this)</label>
                  <input type="radio" id="request" name="itemType" value="request">
                  <label for="request">Request (I need this)</label>
              </div>
          </div>
          <hr style="margin: 1.5rem 0;">
          <div class="form-group">
              <label for="itemName">Item Name</label>
              <input type="text" id="itemName" name="itemName" required>
          </div>
          <div class="form-group">
              <label for="category">Category</label>
              <input type="text" id="category" name="category" required>
          </div>
          <div class="form-group">
              <label for="images">Upload 2 Images (max 1MB each)</label>
              <input type="file" id="images" name="images" accept="image/*" multiple required>
          </div>
          <div class="form-group">
              <label for="age">Relevant Age (optional)</label>
              <input type="number" id="age" name="age">
          </div>
          <div class="form-group">
              <label for="gender">Gender (optional)</label>
              <select id="gender" name="gender">
                  <option value="other">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
              </select>
          </div>
          <div class="form-group">
              <label for="profession">Relevant Profession (optional)</label>
              <input type="text" id="profession" name="profession">
          </div>
          <div class="form-group checkbox-group">
              <input type="checkbox" id="priority" name="priority">
              <label for="priority">This is an urgent listing</label>
          </div>
          <button type="button" id="get-location-btn" class="btn btn-secondary">Get My Location</button>
          <p id="location-status"></p>
          <input type="hidden" id="lat" name="lat">
          <input type="hidden" id="lon" name="lon">
          <button type="submit" class="btn">Submit Listing</button>
          <p id="error-message" class="error"></p>
      </form>
    `;
};