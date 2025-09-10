import { API_BASE_URL } from '../utils/api.js';

export const itemCardComponent = (item, matchResult = null) => {
    const { donor, combinedScore, breakdown } = matchResult || {};
    const displayItem = donor || item; // Use donor if it's a match result

    return `
      <div class="item-card">
          <div class="item-card-images">
              <img src="${API_BASE_URL.replace('/api', '')}${displayItem.images[0]}" alt="${displayItem.itemName}">
              <img src="${API_BASE_URL.replace('/api', '')}${displayItem.images[1]}" alt="${displayItem.itemName}">
          </div>
          <div class="item-card-content">
              <h3>${displayItem.itemName}</h3>
              <p><strong>Category:</strong> ${displayItem.category}</p>
              ${displayItem.priority ? '<p><strong>Urgent</strong></p>' : ''}
              ${matchResult ? `
                <p><strong>Distance:</strong> ${breakdown.distKm.toFixed(1)} km away</p>
                <p><span class="score-badge">${(combinedScore * 100).toFixed(0)}% Match</span></p>
              ` : ''}
          </div>
      </div>
    `;
};