import Item from '../models/Item.js';
import { Fuse, buildVector, euclidean, computeScores } from '../utils/matching.js';

export const findMatches = async (req, res) => {
  const receiverRequest = req.body;
  try {
    if (!receiverRequest.location || !receiverRequest.location.lat) {
      return res.status(400).json({ message: 'Location is required for matching' });
    }

    const normalizedReceiver = {
      ...receiverRequest,
      location: {
        coordinates: [receiverRequest.location.lon, receiverRequest.location.lat]
      }
    };

    const donors = await Item.find({
      itemType: 'donation', // Find items listed as donations
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [receiverRequest.location.lon, receiverRequest.location.lat] },
          $maxDistance: 50000
        }
      }
    });

    const fuse = new Fuse(donors, { keys: ['itemName'], threshold: 0.4, includeScore: true });
    const fuseResults = fuse.search(receiverRequest.itemName || '');
    const fuseScoreMap = new Map();
    donors.forEach(d => fuseScoreMap.set(d._id.toString(), 1));
    fuseResults.forEach(r => fuseScoreMap.set(r.item._id.toString(), r.score));

    const maps = { categoryMap: new Map(), professionMap: new Map(), genderMap: new Map() };
    const donorVectors = donors.map(d => ({ id: d._id.toString(), vec: buildVector(d, maps), item: d }));
    const receiverVec = buildVector(normalizedReceiver, maps);

    const knnDistances = {};
    donorVectors.forEach(dv => {
      knnDistances[dv.id] = euclidean(receiverVec, dv.vec);
    });

    const scoredResults = donorVectors.map(dv => {
      const donor = dv.item;
      const id = dv.id;
      const scores = computeScores(normalizedReceiver, donor, fuseScoreMap.get(id), knnDistances[id]);
      return { donor, ...scores };
    });

    scoredResults.sort((a, b) => b.combinedScore - a.combinedScore);

    res.json({
      query: receiverRequest,
      totalCandidates: scoredResults.length,
      results: scoredResults.slice(0, 50)
    });
  } catch (err) {
    console.error("Error in /api/match:", err); 
    res.status(500).json({ message: "An internal server error occurred.", error: err.message });
  }
};