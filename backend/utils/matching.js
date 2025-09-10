import Fuse from 'fuse.js';
export { Fuse };

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildVector(item, maps = {}) {
  const { categoryMap = new Map(), professionMap = new Map(), genderMap = new Map() } = maps;
  const mapIndex = (map, key) => {
    if (!key) return 0;
    if (!map.has(key)) map.set(key, map.size + 1);
    return map.get(key);
  };
  return [
    mapIndex(categoryMap, (item.category || '').toLowerCase()),
    mapIndex(professionMap, (item.profession || '').toLowerCase()),
    mapIndex(genderMap, (item.gender || 'other').toLowerCase()),
    (item.age || 0) / 100,
    item.location.coordinates[1] || 0,
    item.location.coordinates[0] || 0
  ];
}

export function euclidean(a, b) {
  let sumOfSquares = 0;
  for (let i = 0; i < a.length; i++) {
    sumOfSquares += ((a[i] || 0) - (b[i] || 0)) ** 2;
  }
  return Math.sqrt(sumOfSquares);
}

export function computeScores(receiver, candidate, fuseNameScore, knnDistance, options = {}) {
  const { wRule = 0.55, wName = 0.25, wKnn = 0.2 } = options;
  let rulePoints = 0;
  const ruleMax = 5;

  if (receiver.category && candidate.category && receiver.category.toLowerCase() === candidate.category.toLowerCase()) rulePoints++;
  if (receiver.gender === 'other' || candidate.gender === 'other' || candidate.gender === receiver.gender) rulePoints++;
  if (receiver.profession && candidate.profession && receiver.profession.toLowerCase() === candidate.profession.toLowerCase()) rulePoints++;
  if (receiver.age && candidate.age) {
    const diff = Math.abs(receiver.age - candidate.age);
    if (diff <= 3) rulePoints += 1;
    else if (diff <= 8) rulePoints += 0.6;
    else if (diff <= 20) rulePoints += 0.2;
  }
  const distKm = haversineDistance(
    receiver.location.coordinates[1], receiver.location.coordinates[0],
    candidate.location.coordinates[1], candidate.location.coordinates[0]
  );
  if (distKm <= 5) rulePoints += 1;
  else if (distKm <= 25) rulePoints += 0.7;
  else if (distKm <= 100) rulePoints += 0.3;

  let ruleScore = Math.min(1, rulePoints / ruleMax);
  let nameScore = 1 - (fuseNameScore || 1);
  let knnScore = 1 / (1 + (knnDistance || 0));
  let combinedScore = wRule * ruleScore + wName * nameScore + wKnn * knnScore;
  if (candidate.priority) combinedScore += 0.05;

  return { combinedScore: Math.min(1, combinedScore), breakdown: { ruleScore, nameScore, knnScore, distKm } };
}