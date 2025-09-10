export const showLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
  };
  
  export const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  };
  
  export const handleLocationButton = () => {
      const btn = document.getElementById('get-location-btn');
      if (!btn) return;
  
      btn.addEventListener('click', () => {
          const statusEl = document.getElementById('location-status');
          const latInput = document.getElementById('lat');
          const lonInput = document.getElementById('lon');
  
          if (navigator.geolocation) {
              statusEl.textContent = "Fetching location...";
              navigator.geolocation.getCurrentPosition(
                  (pos) => {
                      latInput.value = pos.coords.latitude;
                      lonInput.value = pos.coords.longitude;
                      statusEl.textContent = "✅ Location captured!";
                      statusEl.className = 'success';
                  },
                  () => {
                      statusEl.textContent = "Unable to retrieve location.";
                      statusEl.className = 'error';
                  }
              );
          } else {
              statusEl.textContent = "Geolocation is not supported.";
              statusEl.className = 'error';
          }
      });
  };    