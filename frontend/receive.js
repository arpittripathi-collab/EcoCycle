// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let currentUser = null;
let userLocation = null;
let map = null;
let userMarker = null;
let pinnedLocation = null;

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
        0% { opacity: 0; transform: rotate(-45deg) translate(0, -20px); }
        60% { opacity: 1; transform: rotate(-45deg) translate(0, 4px); }
        80% { transform: rotate(-45deg) translate(0, -2px); }
        100% { transform: rotate(-45deg) translate(0, 0); }
    }
    @keyframes pulsate {
        0% { transform: scale(0.1); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
    }
`;
document.head.appendChild(customStyle);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEventListeners();
    setTimeout(initializeMap, 1000);
});

// Load items the user has received (items where claimedBy == currentUser._id)
async function loadReceivedItems() {
    if (!currentUser || !currentUser._id) return;
    try {
        const resp = await axios.get(`${API_BASE_URL}/items?claimedBy=${currentUser._id}`, { withCredentials: true });
        const items = resp.data.items || [];
        displayReceivedItems(items);
    } catch (err) {
        console.error('Failed to load received items:', err);
    }
}

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
            await getCurrentLocation();
        } else {
            window.location.href = 'login-form/login-form.html';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = 'login-form/login-form.html';
    }
}

// Initialize map
function initializeMap() {
    console.log('Initializing map...');
    
    // Use userLocation if available, otherwise use a default location (e.g., New Delhi)
    const defaultLocation = { latitude: 28.6139, longitude: 77.2090 };
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
          .bindPopup('Your location<br>Drag to adjust')
          .openPopup();

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
}

// Get current location
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                resolve(userLocation);
            },
            (error) => {
                console.error('Geolocation error:', error);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

// Pin location on map
async function pinLocationOnMap(lat, lng) {
    console.log('pinLocationOnMap called with:', lat, lng);
    try {
        const address = await reverseGeocode(lat, lng);
        
        pinnedLocation = {
            latitude: lat,
            longitude: lng,
            address: address
        };
        
        if (map) {
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            userMarker = L.marker([lat, lng], {
                icon: customIcon,
                draggable: true,
                autoPan: true
            }).addTo(map)
              .bindPopup('Your location<br>Drag to adjust')
              .openPopup();
            
            userMarker.on('dragend', async function(event) {
                const marker = event.target;
                const newPosition = marker.getLatLng();
                await pinLocationOnMap(newPosition.lat, newPosition.lng);
            });
            
            map.setView([lat, lng], 15);
        }
        
        // Store the location for form submission
        document.getElementById('searchForm').dataset.lat = lat;
        document.getElementById('searchForm').dataset.lon = lng;
        
    } catch (error) {
        console.error('Error pinning location:', error);
        alert('Failed to set location. Please try again.');
    }
}

// Reverse geocoding
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        if (data.city && data.principalSubdivision && data.countryName) {
            return `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
        } else if (data.locality && data.principalSubdivision) {
            return `${data.locality}, ${data.principalSubdivision}`;
        }
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Handle form submission
async function handleSearch(event) {
    event.preventDefault();
    
    const form = event.target;
    const lat = form.dataset.lat || (userLocation ? userLocation.latitude : null);
    const lon = form.dataset.lon || (userLocation ? userLocation.longitude : null);
    
    if (!lat || !lon) {
        alert('Please set your location first');
        return;
    }
    
    const formData = new FormData(form);
    const searchData = {
        itemName: formData.get('itemName'),
        category: formData.get('category'),
        gender: formData.get('gender'),
        location: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
        }
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/match`, searchData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        displayResults(response.data.results);
    } catch (error) {
        console.error('Search error:', error);
        alert('Error searching for items. Please try again.');
    }
}

// Display search results
function displayResults(results) {
    const matchedContainer = document.getElementById('matchedItems');
    const recommendedContainer = document.getElementById('recommendedItems');
    
    // Separate items based on distance
    const matchedItems = results.filter(result => result.breakdown.distKm <= 5);
    const recommendedItems = results.filter(result => result.breakdown.distKm > 5);
    
    // Display matched items
    if (matchedItems.length > 0) {
        matchedContainer.innerHTML = matchedItems.map(result => createItemCard(result)).join('');
    } else {
        matchedContainer.innerHTML = '<div class="no-items">No nearby matches found</div>';
    }
    
    // Display recommended items
    if (recommendedItems.length > 0) {
        recommendedContainer.innerHTML = recommendedItems.map(result => createItemCard(result)).join('');
    } else {
        recommendedContainer.innerHTML = '<div class="no-items">No recommendations found</div>';
    }

    // Refresh received items whenever we display new results
    loadReceivedItems();
}

// Create item card HTML
function createItemCard(result, options = {}) {
    const { donor, combinedScore, breakdown } = result;
    // Try to show a readable location if available
    let locationStr = '';
    if (donor.location && donor.location.address) {
        locationStr = donor.location.address;
    } else if (donor.location && Array.isArray(donor.location.coordinates)) {
        locationStr = `${donor.location.coordinates[1]?.toFixed(4) || ''}, ${donor.location.coordinates[0]?.toFixed(4) || ''}`;
    }
    return `
        <div class="card">
            <img src="${API_BASE_URL.replace('/api', '')}${donor.images[0]}" 
                 alt="${donor.itemName}" 
                 class="product-img">
            <h3>${donor.itemName}${locationStr ? ` <span class='location-in-name'>(${locationStr})</span>` : ''}</h3>
            <p><strong>Category:</strong> ${donor.category}</p>
            <p><strong>Distance:</strong> ${breakdown.distKm.toFixed(1)} km away</p>
            <p><span class="score-badge">${(combinedScore * 100).toFixed(0)}% Match</span></p>
            ${donor.priority ? '<p class="urgent-badge">🚨 URGENT</p>' : ''}
            <div class="card-actions">
                ${options.hideActions ? '' : `<button class="accept-btn" data-item-id="${donor._id}">Accept</button>
                <button class="pass-btn" data-item-id="${donor._id}">Pass</button>`}
            </div>
        </div>
    `;
}

// Render received items (simple cards, no accept/pass and show received badge)
function displayReceivedItems(items) {
    const container = document.getElementById('receivedItems');
    if (!container) return;
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="no-items">You have not received any items yet.</div>';
        return;
    }

    container.innerHTML = items.map(donor => {
        let locationStr = '';
        if (donor.location && donor.location.address) {
            locationStr = donor.location.address;
        } else if (donor.location && Array.isArray(donor.location.coordinates)) {
            locationStr = `${donor.location.coordinates[1]?.toFixed(4) || ''}, ${donor.location.coordinates[0]?.toFixed(4) || ''}`;
        }
        const imageUrl = donor.images && donor.images.length ? `${API_BASE_URL.replace('/api', '')}${donor.images[0]}` : '';
        return `
            <div class="card">
                ${imageUrl ? `<img src="${imageUrl}" alt="${donor.itemName}" class="product-img">` : ''}
                <h3>${donor.itemName}${locationStr ? ` <span class='location-in-name'>(${locationStr})</span>` : ''} <span class="received-badge">✅ Received</span></h3>
                <p><strong>Category:</strong> ${donor.category}</p>
                <p>Donor: ${donor.ownerName || donor.ownerId || 'Unknown'}</p>
            </div>
        `;
    }).join('');
}

// Initialize event listeners
function initializeEventListeners() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Refresh location button
    const refreshLocationBtn = document.getElementById('refreshLocationBtn');
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', async () => {
            try {
                await getCurrentLocation();
                if (userLocation) {
                    pinLocationOnMap(userLocation.latitude, userLocation.longitude);
                }
            } catch (error) {
                console.error('Error refreshing location:', error);
                alert('Failed to refresh location. Please try again.');
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = 'index.html';
            }
        });
    }

    // Accept match (event delegation for dynamic cards)
    document.addEventListener('click', async (e) => {
        const acceptBtn = e.target.closest('.accept-btn');
        if (!acceptBtn) return;

        const itemId = acceptBtn.dataset.itemId;
        if (!itemId) return;

        if (!confirm('Accept this item and notify donor? This will mark the item as claimed and reward the donor.')) return;

        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Processing...';

        try {
            const resp = await axios.post(`${API_BASE_URL}/match/accept`, { itemId }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            // Update UI: mark card as claimed
            const card = acceptBtn.closest('.card');
            if (card) {
                card.querySelector('.card-actions').innerHTML = '<span class="claimed-badge">✅ Claimed</span>';
            }

            // Show donor/receiver contact details returned from server
            const { donor, receiver } = resp.data;
            let msg = 'Match accepted. Donor rewarded.';
            if (donor) msg += `\nDonor: ${donor.name} ${donor.phone ? `(${donor.phone})` : ''} ${donor.email ? `<${donor.email}>` : ''}`;
            if (receiver) msg += `\nYour contact shared with donor: ${receiver.name} ${receiver.phone ? `(${receiver.phone})` : ''} ${receiver.email ? `<${receiver.email}>` : ''}`;
            // Use alert for now
            alert(msg.replace(/<|>/g, ''));

            // Update auth info
            try { await axios.get(`${API_BASE_URL}/auth/verify`, { withCredentials: true }); } catch (err) {}
        } catch (err) {
            console.error('Error accepting match:', err);
            alert(err?.response?.data?.message || 'Failed to accept match');
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept';
        }
    });

    // Pass match (event delegation)
    document.addEventListener('click', async (e) => {
        const passBtn = e.target.closest('.pass-btn');
        if (!passBtn) return;
        const itemId = passBtn.dataset.itemId;
        if (!itemId) return;

        passBtn.disabled = true;
        passBtn.textContent = 'Passing...';

        try {
            await axios.post(`${API_BASE_URL}/match/pass`, { itemId }, { withCredentials: true, headers: { 'Content-Type': 'application/json' } });
            // Remove card from UI
            const card = passBtn.closest('.card');
            if (card) card.remove();
        } catch (err) {
            console.error('Error passing item:', err);
            alert(err?.response?.data?.message || 'Failed to pass item');
            passBtn.disabled = false;
            passBtn.textContent = 'Pass';
        }
    });
}
