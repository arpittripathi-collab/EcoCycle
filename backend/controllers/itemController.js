import Item from '../models/Item.js';

export const createItem = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length !== 2) {
      return res.status(400).json({ message: 'Exactly 2 images are required' });
    }
    const images = files.map(f => `/uploads/${f.filename}`);
    const { itemName, itemType, category, gender, profession, age, priority, location } = req.body;

    if (!itemType || !['donation', 'request'].includes(itemType)) {
        return res.status(400).json({ message: 'Item type must be either "donation" or "request".' });
    }

    const parsedLocation = JSON.parse(location);
    const loc = { type: 'Point', coordinates: [parseFloat(parsedLocation.lon), parseFloat(parsedLocation.lat)] };

    const item = new Item({
      ownerId: req.user.userId,
      itemType, // Set from request body
      itemName, category, gender, profession,
      age: age ? Number(age) : undefined,
      priority: priority === 'true',
      location: loc,
      images
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getItems = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { ownerId: req.user.userId }; // Fetch items for the logged-in user

  const skip = (page - 1) * limit;

  try {
    const items = await Item.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    const total = await Item.countDocuments(filter);
    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};