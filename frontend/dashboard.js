// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let currentUser = null;
let donations = [];
let userLocation = null;
let map = null;
let userMarker = null;
let pinMode = false;
let pinnedLocation = null;

// DOM Elements
const userName = document.getElementById('userName');
const userLocationElement = document.getElementById('userLocation');
const userEmail = document.getElementById('userEmail');
const userPhone = document.getElementById('userPhone');
const userRank = document.getElementById('userRank');
const userPoints = document.getElementById('userPoints');
const donationCount = document.getElementById('donationCount');
const receivedCount = document.getElementById('receivedCount');
const donationsGrid = document.getElementById('donationsGrid');
const logoutBtn = document.getElementById('logoutBtn');
const refreshLocationBtn = document.getElementById('refreshLocationBtn');
const pinLocationBtn = document.getElementById('pinLocationBtn');

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEventListeners();
    
    // Initialize map with default location immediately
    setTimeout(() => {
        if (!map) {
            initializeMap();
        }
    }, 1000); // Wait 1 second for other initialization
});

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.isAuthenticated) {
            currentUser = response.data.user;
            await loadDashboardData();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login-form/login-form.html';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = 'login-form/login-form.html';
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadUserProfile(),
            loadUserStats(),
            loadDonations(),
            getCurrentLocation()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    } finally {
        // Always initialize map, even if location failed
        if (!map) {
            initializeMap();
        }
    }
}

// Load user profile data
async function loadUserProfile() {
    if (!currentUser) return;

    // Update user profile information
    userName.textContent = currentUser.name || 'Not provided';
    userEmail.textContent = currentUser.email || 'Not provided';
    userPhone.textContent = currentUser.phone || 'Not provided';
    // Show donation count and points if available
    const donationEl = document.getElementById('donationCount');
    const pointsEl = document.getElementById('userPoints');
    if (donationEl && typeof currentUser.donationCount !== 'undefined') {
        donationEl.textContent = currentUser.donationCount;
    }
    if (pointsEl && typeof currentUser.points !== 'undefined') {
        pointsEl.textContent = currentUser.points;
    }
    
    // Set default values for fields not in user object
    userLocationElement.textContent = 'Getting location...';
    userRank.textContent = '🏆 Rank #- (Local)';
}

// Refresh current user profile from backend and update UI
async function refreshUserProfile() {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.isAuthenticated) {
            currentUser = response.data.user;
            await loadUserProfile();
        }
    } catch (err) {
        console.error('Failed to refresh user profile:', err);
    }
}

// Refresh profile when window regains focus (useful after actions on other pages)
window.addEventListener('focus', () => {
    if (currentUser) refreshUserProfile();
});

// Expose for other pages
window.refreshUserProfile = refreshUserProfile;

// Load user statistics
async function loadUserStats() {
    try {
        // This would typically come from a stats endpoint
        // For now, we'll set default values
        donationCount.textContent = '0';
        receivedCount.textContent = '0';
        userPoints.textContent = '0';
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Load donations from backend
async function loadDonations() {
    try {
        const response = await axios.get(`${API_BASE_URL}/items`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        donations = response.data.items || [];
        displayDonations(donations);
    } catch (error) {
        console.error('Error loading donations:', error);
        donationsGrid.innerHTML = '<div class="error-message">Failed to load donations. Please try again.</div>';
    }
}

// Display donations in the grid
function displayDonations(donations) {
    if (!donations || donations.length === 0) {
        donationsGrid.innerHTML = '<div class="no-items">No donations available at the moment.</div>';
        return;
    }

    console.log('Donations data:', donations); // Debug log

    donationsGrid.innerHTML = donations.map(donation => {
        // Format location properly
        let locationText = 'Location not specified';
        if (donation.location) {
            if (typeof donation.location === 'string') {
                locationText = donation.location;
            } else if (donation.location.coordinates) {
                // If it's a GeoJSON Point object
                locationText = `Lat: ${donation.location.coordinates[1].toFixed(4)}, Lon: ${donation.location.coordinates[0].toFixed(4)}`;
            }
        }

        // Format priority/urgent status
        const isUrgent = donation.priority === true || donation.priority === 'true' || donation.urgent === true;

        // Get the first image URL
        let imageUrl = '';
        if (donation.images && donation.images.length > 0) {
            const firstImage = donation.images[0];
            
            if (firstImage.startsWith('http')) {
                imageUrl = firstImage;
            } else if (firstImage.startsWith('/')) {
                imageUrl = `http://localhost:5000${firstImage}`;
            } else {
                imageUrl = `http://localhost:5000/uploads/${firstImage}`;
            }
        }

        return `
            <div class="card" data-item-id="${donation._id}">
                ${imageUrl ? `<img src="${imageUrl}" 
                     alt="${donation.itemName || donation.name || 'Item'}" 
                     class="product-img">` : ''}
                <h3>${donation.itemName || donation.name || 'Unnamed Item'}</h3>
                <p>📍 ${locationText}</p>
                <p class="item-category">${donation.category || 'Uncategorized'}</p>
                ${isUrgent ? '<p class="urgent-badge">🚨 URGENT</p>' : ''}
                <div class="card-actions">
                    ${donation.isClaimed || donation.claimedBy ? '<span class="claimed-badge">✅ Claimed</span>' : `<button class="delete" onclick="deleteDonation('${donation._id}')">Delete</button>`}
                </div>
            </div>
        `;
    }).join('');
}

// Delete a donation
async function deleteDonation(donationId) {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this donation? This action cannot be undone.');
    
    if (!confirmed) {
        return; // User cancelled deletion
    }
    
    try {
        const response = await axios.delete(`${API_BASE_URL}/items/${donationId}`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        alert('Donation deleted successfully!');
        
        // Remove the donation from the grid
        const donationCard = document.querySelector(`[data-item-id="${donationId}"]`);
        if (donationCard) {
            donationCard.remove();
        }
        
        // Reload donations to refresh the list
        await loadDonations();
        
    } catch (error) {
        console.error('Error deleting donation:', error);
        if (error.response && error.response.data && error.response.data.message) {
            alert(`Error: ${error.response.data.message}`);
        } else {
            alert('Failed to delete donation. Please try again.');
        }
    }
}

// Get current location using geolocation API
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            userLocationElement.textContent = 'Geolocation not supported';
            reject('Geolocation not supported');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };

                    // Get address from coordinates using reverse geocoding
                    const address = await reverseGeocode(userLocation.latitude, userLocation.longitude);
                    userLocationElement.textContent = address;
                    
                    // Initialize map
                    initializeMap();
                    
                    resolve(userLocation);
                } catch (error) {
                    console.error('Error getting address:', error);
                    userLocationElement.textContent = `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`;
                    initializeMap();
                    resolve(userLocation);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to get location';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                
                userLocationElement.textContent = errorMessage;
                reject(error);
            },
            options
        );
    });
}

// Format location to display city, state, country
async function formatLocationDisplay(lat, lng) {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        // Extract location components
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';
        
        // Build formatted address
        const parts = [city, state, country].filter(part => part.length > 0);
        if (parts.length > 0) {
            return parts.join(', ');
        }
        
        return 'Location information not available';
    } catch (error) {
        console.error('Location formatting error:', error);
        return 'Location information not available';
    }
}

// Reverse geocoding to get address from coordinates and store full data
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        // Store the full address for backend use
        const fullAddress = await formatLocationDisplay(lat, lng);
        
        // Return the full formatted address
        return fullAddress;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Location information not available';
    }
}

// Custom pointer icon for the map
const customIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div class="pin"></div>
           <div class="pin-effect"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

// Add custom CSS for the pointer
const customStyle = document.createElement('style');
customStyle.textContent = `
    .custom-pin {
        position: relative;
    }
    .pin {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: #00a1ff;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%;
        top: 50%;
        margin: -15px 0 0 -15px;
        animation-name: bounce;
        animation-duration: 1s;
        animation-fill-mode: both;
    }
    .pin::after {
        content: '';
        width: 14px;
        height: 14px;
        margin: 8px 0 0 8px;
        background: #fff;
        position: absolute;
        border-radius: 50%;
    }
    .pin-effect {
        width: 14px;
        height: 14px;
        position: absolute;
        bottom: -7px;
        left: 8px;
        background: rgba(0, 161, 255, 0.2);
        border-radius: 50%;
        animation: pulsate 1s ease-out infinite;
    }
    @keyframes bounce {
        0% {
            opacity: 0;
            transform: rotate(-45deg) translate(0, -20px);
        }
        60% {
            opacity: 1;
            transform: rotate(-45deg) translate(0, 4px);
        }
        80% {
            transform: rotate(-45deg) translate(0, -2px);
        }
        100% {
            transform: rotate(-45deg) translate(0, 0);
        }
    }
    @keyframes pulsate {
        0% {
            transform: scale(0.1);
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            transform: scale(1.2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(customStyle);

// Initialize Leaflet map
function initializeMap() {
    console.log('Initializing map...');
    
    // Use userLocation if available, otherwise use a default location (e.g., New Delhi)
    const defaultLocation = { latitude: 28.6139, longitude: 77.2090 }; // New Delhi
    const mapLocation = userLocation || defaultLocation;

    // Initialize map with zoom controls
    map = L.map('map', {
        center: [mapLocation.latitude, mapLocation.longitude],
        zoom: 13,
        zoomControl: true,
        doubleClickZoom: true
    });

    // Add OpenStreetMap tiles with better zoom handling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        minZoom: 3,
        maxZoom: 19
    }).addTo(map);

    // Add scale control
    L.control.scale().addTo(map);

    // Add user marker if we have GPS location
    if (userLocation) {
        userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            icon: customIcon,
            draggable: true,
            autoPan: true
        }).addTo(map)
          .bindPopup('Your current location<br>Drag to adjust')
          .openPopup();

        // Add circle to show accuracy
        L.circle([userLocation.latitude, userLocation.longitude], {
            color: '#4a90e2',
            fillColor: '#4a90e2',
            fillOpacity: 0.1,
            radius: userLocation.accuracy || 200
        }).addTo(map);

        // Handle marker drag
        userMarker.on('dragend', async function(event) {
            const marker = event.target;
            const newPosition = marker.getLatLng();
            await pinLocationOnMap(newPosition.lat, newPosition.lng);
        });
    }

    // Add click event listener for pinning location
    map.on('click', function(e) {
        console.log('Map clicked, Coordinates:', e.latlng.lat, e.latlng.lng);
        pinLocationOnMap(e.latlng.lat, e.latlng.lng);
    });

    // Add hover effect to show location info
    const locationInfo = L.control({position: 'bottomleft'});
    locationInfo.onAdd = function () {
        const div = L.DomUtil.create('div', 'location-info');
        div.style.background = 'rgba(255,255,255,0.9)';
        div.style.padding = '8px';
        div.style.fontSize = '12px';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        div.innerHTML = 'Move mouse over map to see location';
        return div;
    };
    locationInfo.addTo(map);

    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Update location info with debouncing
    const updateLocationInfo = debounce(async function(latlng) {
        try {
            const address = await formatLocationDisplay(latlng.lat, latlng.lng);
            locationInfo.getContainer().innerHTML = `📍 ${address}`;
        } catch (error) {
            console.error('Error getting location info:', error);
            locationInfo.getContainer().innerHTML = 'Location info not available';
        }
    }, 500);

    map.on('mousemove', function(e) {
        updateLocationInfo(e.latlng);
    });
}

// Refresh location
async function refreshLocation() {
    try {
        userLocationElement.textContent = 'Getting location...';
        await getCurrentLocation();
        // Send lat/lon to backend so server has exact coordinates
        try {
            if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
                await axios.post(`${API_BASE_URL}/auth/location`, { latitude: userLocation.latitude, longitude: userLocation.longitude }, { withCredentials: true, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (err) {
            console.warn('Failed to send coordinates to server:', err?.response?.data || err?.message || err);
        }

        alert('Location refreshed successfully!');
    } catch (error) {
        console.error('Error refreshing location:', error);
        alert('Failed to refresh location. Please try again.');
    }
}

// Function to update map cursor on hover
function updateMapCursor() {
    if (map) {
        map.getContainer().style.cursor = 'pointer';
    }
}

// Pin location on map click
async function pinLocationOnMap(lat, lng) {
    console.log('pinLocationOnMap called with:', lat, lng);
    try {
        // Get formatted address for confirmation
        const formattedAddress = await formatLocationDisplay(lat, lng);
        const confirmPin = confirm(`Do you want to set your location to:\n${formattedAddress}\n\nClick OK to confirm this location.`);
        
        if (!confirmPin) {
            return;
        }
        
        // Get address from coordinates
        const address = await reverseGeocode(lat, lng);
        console.log('Reverse geocoded address:', address);
        
        // Update pinned location
        pinnedLocation = {
            latitude: lat,
            longitude: lng,
            address: address
        };
        
        // Update location display
        userLocationElement.textContent = address;
        
        // Update map marker with draggable option
        if (map) {
            // Remove existing marker
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            // Add new pinned marker that can be dragged
            userMarker = L.marker([lat, lng], {
                icon: customIcon,
                draggable: true,
                autoPan: true
            }).addTo(map)
              .bindPopup('Your pinned location<br>Drag to adjust')
              .openPopup();
            
            // Handle marker drag end
            userMarker.on('dragend', async function(event) {
                const marker = event.target;
                const newPosition = marker.getLatLng();
                console.log('Marker dragged to:', newPosition);
                
                // Update location with new coordinates
                await pinLocationOnMap(newPosition.lat, newPosition.lng);
            });
            
            // Update map view
            map.setView([lat, lng], 15);
            
            // Add circle to show approximate area
            L.circle([lat, lng], {
                color: '#4a90e2',
                fillColor: '#4a90e2',
                fillOpacity: 0.1,
                radius: 200 // 200m radius for pinned location
            }).addTo(map);
        }
        
        // Keep pointer cursor
        map.getContainer().style.cursor = 'pointer';
        
        // Show success message with the address
        const locationStatus = document.getElementById('location-status');
        if (locationStatus) {
            // Format the address to show only city, state, country
            const formattedAddress = await formatLocationDisplay(lat, lng);
            locationStatus.innerHTML = `📍 Selected location: <br>${formattedAddress}`;
            locationStatus.style.color = '#28a745';
        }
        
    } catch (error) {
        console.error('Error pinning location:', error);
        alert('Failed to pin location. Please try again.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Donate button
    const donateBtn = document.getElementById('donateBtn');
    if (donateBtn) {
        donateBtn.addEventListener('click', openOverlay);
    }

    // Receive button
    const receiveBtn = document.getElementById('receiveBtn');
    if (receiveBtn) {
        receiveBtn.addEventListener('click', () => {
            window.location.href = 'receive.html';
        });
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Refresh location button
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', refreshLocation);
    }

    // Update map cursor when initialized
    if (map) {
        updateMapCursor();
    }

    // Form submissions
    const donateForm = document.getElementById('donateForm');
    if (donateForm) {
        donateForm.addEventListener('submit', handleDonateSubmit);
    }

    const receiveForm = document.getElementById('receiveForm');
    if (receiveForm) {
        receiveForm.addEventListener('submit', handleReceiveSubmit);
    }

    // Overlay close events
    window.addEventListener('click', function(e) {
        const donateOverlay = document.getElementById('donateOverlay');
        const receiveOverlay = document.getElementById('receiveOverlay');

  if (e.target === donateOverlay) closeOverlay();
});

    // ESC key to close overlays
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
    closeOverlay();
  }
});
}

// Handle donate form submission
async function handleDonateSubmit(event) {
    event.preventDefault();
    
    const donateBtn = document.getElementById('donateBtn');
    
    try {
        setLoading(donateBtn, true);
        
        // Get current location if not available
        if (!userLocation && !pinnedLocation) {
            await getCurrentLocation();
        }
        
        // Validate required fields
        const itemName = document.getElementById('itemName').value;
        const category = document.getElementById('category').value;
    const gender = document.getElementById('gender').value;
        const urgent = document.getElementById('urgent').checked;
        const images = document.getElementById('images').files;
        
        if (!itemName || !category || !gender) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (!images || images.length !== 2) {
            alert('Please select exactly 2 images');
            return;
        }
        
        if (!userLocation && !pinnedLocation) {
            alert('Unable to get your location. Please try again or pin a location on the map.');
            return;
        }
        
        // Create form data with correct field names
        const formData = new FormData();
        formData.append('itemName', itemName);
        formData.append('itemType', 'donation'); // Required by backend
        formData.append('category', category);
    formData.append('gender', gender);
        formData.append('priority', urgent.toString()); // Backend expects 'priority' not 'urgent'
        
        // Add location as JSON string (backend expects this format)
        const currentLocation = pinnedLocation || userLocation;
        const locationData = {
            lat: currentLocation.latitude,
            lon: currentLocation.longitude
        };
        formData.append('location', JSON.stringify(locationData));
        
        // Add images
        for (let i = 0; i < images.length; i++) {
            formData.append('images', images[i]);
        }
        
        const response = await axios.post(`${API_BASE_URL}/items`, formData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        alert('Item donated successfully!');
        closeOverlay();
        event.target.reset();
        
        // Reload donations to show the new donation
        await loadDonations();
        
    } catch (error) {
        console.error('Error donating item:', error);
        if (error.response && error.response.data && error.response.data.message) {
            alert(`Error: ${error.response.data.message}`);
        } else {
            alert('Failed to donate item. Please try again.');
        }
    } finally {
        setLoading(donateBtn, false);
    }
}



// Handle logout
async function handleLogout() {
    try {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        alert('Logged out successfully!');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error logging out:', error);
        // Even if logout fails, redirect to home
        window.location.href = 'index.html';
    }
}

// Overlay functions
function openOverlay() {
    document.getElementById('donateOverlay').style.display = 'flex';
    populateLocationField();
}

function closeOverlay() {
    document.getElementById('donateOverlay').style.display = 'none';
}

// Populate location field with current location
function populateLocationField() {
    const locationInput = document.getElementById('location');
    if (locationInput && userLocationElement) {
        locationInput.value = userLocationElement.textContent;
    }
}

// Utility functions
function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.id === 'donateBtn' ? 'Donate' : 'Receive';
    }
}

function showError(message) {
    // You can implement a proper error display system here
    console.error(message);
    alert(message);
}

// Add some CSS for loading and error states
const style = document.createElement('style');
style.textContent = `
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .dashboard-top {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
        margin-bottom: 20px;
    }

    .profile-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .user-info {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
    }

    .user-details {
        flex: 1;
    }

    .user-details p {
        margin: 8px 0;
        color: #333;
    }

    .stats {
        display: flex;
        gap: 20px;
    }

    .stat-item {
        text-align: center;
        background: #f8f9fa;
        padding: 10px 20px;
        border-radius: 8px;
    }

    .stat-item h3 {
        font-size: 24px;
        color: #2e7d32;
        margin: 0;
    }

    .stat-item p {
        margin: 5px 0 0;
        color: #666;
        font-size: 14px;
    }

    .action-buttons {
        display: flex;
        gap: 15px;
        margin-top: 20px;
    }

    .action-buttons button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .donate {
        background: #2e7d32;
        color: white;
    }

    .donate:hover {
        background: #1b5e20;
    }

    .receive {
        background: #1976d2;
        color: white;
    }

    .receive:hover {
        background: #1565c0;
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .location-section, .donations-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .location-section h2, .donations-section h2 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
    }

    .map-controls {
        margin-top: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .location-text {
        margin: 0;
        font-size: 14px;
        color: #666;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .loading-message, .no-items, .error-message {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
    
    .error-message {
        color: #ff4444;
        background-color: #ffe6e6;
        border: 1px solid #ffcccc;
        border-radius: 4px;
    }

    @media (max-width: 768px) {
        .user-info {
            flex-direction: column;
            align-items: stretch;
        }

        .stats {
            margin-top: 20px;
        }

        .action-buttons {
            flex-direction: column;
        }
    }
    
    .logout-btn {
        background-color: #ff4444;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
    }
    
    .logout-btn:hover {
        background-color: #cc0000;
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .urgent-badge {
        background-color: #ff4444;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        display: inline-block;
        margin: 5px 0;
    }
    
    .item-category {
        background-color: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        display: inline-block;
        margin: 5px 0;
    }
    
    .card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        margin: 10px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .product-img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    
    .card-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .card-actions button {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .card-actions .receive {
        background-color: #4caf50;
        color: white;
    }
    
    .card-actions .receive:hover {
        background-color: #45a049;
    }
    
    .card-actions .reject {
        background-color: #f44336;
        color: white;
    }
    
    .card-actions .reject:hover {
        background-color: #da190b;
    }
    
    .card-actions .delete {
        background-color: #dc3545;
        color: white;
        width: 100%;
    }
    
    .card-actions .delete:hover {
        background-color: #c82333;
    }
    
    .location-map {
        margin-top: 20px;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    }
    
    .location-map h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
    }
    
    .map-controls {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    .refresh-location-btn, .pin-location-btn {
        flex: 1;
        padding: 8px 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
    }
    
    .refresh-location-btn:hover, .pin-location-btn:hover {
        background-color: #0056b3;
    }
    
    .refresh-location-btn:disabled, .pin-location-btn:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }
    
    .pin-note {
        display: block;
        color: #666;
        font-size: 11px;
        margin-top: 5px;
        font-style: italic;
        text-align: center;
    }
    
    #map {
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .location-note, .image-note {
        display: block;
        color: #666;
        font-size: 12px;
        margin-top: 5px;
        font-style: italic;
    }
    
    input[readonly] {
        background-color: #f8f9fa;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Test function for debugging pin functionality
window.testPinLocation = function() {
    console.log('Testing pin location functionality...');
    console.log('Map available:', !!map);
    console.log('Pin mode:', pinMode);
    console.log('Pin button element:', pinLocationBtn);
    
    if (map) {
        console.log('Map center:', map.getCenter());
        console.log('Map zoom:', map.getZoom());
    }
    
    // Test pinning a location
    if (map) {
        const testLat = 40.7128;
        const testLng = -74.0060;
        console.log('Testing pin at:', testLat, testLng);
        pinLocationOnMap(testLat, testLng);
    }
};