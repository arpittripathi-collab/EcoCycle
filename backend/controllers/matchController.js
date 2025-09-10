import Item from '../models/Item.js';
import { Fuse, buildVector, euclidean, computeScores } from '../utils/matching.js';

export const findMatches = async (req, res) => {
  const receiverRequest = req.body;
  try {
    if (!receiverRequest.location || !receiverRequest.location.lat) {
      return res.status(400).json({ message: 'Location is required for matching' });
    }

    // --- FIX STARTS HERE ---
    // Normalize the incoming request to match the database/utility function structure.
    // We create a new object that has the .location.coordinates array.
    const normalizedReceiver = {
      ...receiverRequest,
      location: {
        coordinates: [receiverRequest.location.lon, receiverRequest.location.lat]
      }
    };
    // --- FIX ENDS HERE ---

    // The database query still uses the original lon/lat from the request body.
    const donors = await Item.find({
      ownerType: 'donor',
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
    
    // We now use the NORMALIZED receiver object for all utility functions.
    const receiverVec = buildVector(normalizedReceiver, maps);

    const knnDistances = {};
    donorVectors.forEach(dv => {
      knnDistances[dv.id] = euclidean(receiverVec, dv.vec);
    });

    const scoredResults = donorVectors.map(dv => {
      const donor = dv.item;
      const id = dv.id;
      // Pass the NORMALIZED receiver object to computeScores.
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
    // Add more detailed error logging for debugging
    console.error("Error in /api/match:", err); 
    res.status(500).json({ message: "An internal server error occurred.", error: err.message });
  }
};