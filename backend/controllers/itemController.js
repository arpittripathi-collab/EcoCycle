import Item from '../models/Item.js';

export const createItem = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length !== 2) {
      return res.status(400).json({ message: 'Exactly 2 images are required' });
    }
    const images = files.map(f => `/uploads/${f.filename}`);
  const { itemName, itemType, category, gender, priority, location } = req.body;

    if (!itemType || !['donation', 'request'].includes(itemType)) {
        return res.status(400).json({ message: 'Item type must be either "donation" or "request".' });
    }

    const parsedLocation = JSON.parse(location);
    const lat = parseFloat(parsedLocation.lat);
    const lon = parseFloat(parsedLocation.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ message: 'Invalid location coordinates' });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ message: 'Location coordinates out of bounds' });
    }
    const loc = { type: 'Point', coordinates: [lon, lat] };

    const item = new Item({
      ownerId: req.userId,
      itemType, // Set from request body
  itemName, category, gender,
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
  const filter = { ownerId: req.userId }; // Fetch items for the logged-in user

  const skip = (page - 1) * limit;

  try {
    const items = await Item.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    const total = await Item.countDocuments(filter);
    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
  const item = await Item.findOne({ _id: id, ownerId: req.userId });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found or you do not have permission to delete it' });
    }
    
    // Prevent deletion if the item has already been claimed via a match
    if (item.isClaimed) {
      return res.status(400).json({ message: 'Cannot delete this item because it has already been claimed.' });
    }
    
    await Item.findByIdAndDelete(id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};