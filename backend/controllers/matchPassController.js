import User from '../models/User.js';
import Item from '../models/Item.js';

export const passMatch = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'itemId required' });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Don't allow passing on your own item
    if (item.ownerId.toString() === userId) return res.status(400).json({ message: 'Cannot pass on your own item' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add to ignoredItems if not present
    if (!user.ignoredItems) user.ignoredItems = [];
    if (!user.ignoredItems.find(id => id.toString() === itemId)) {
      user.ignoredItems.push(itemId);
      await user.save();
    }

    return res.json({ message: 'Item passed' });
  } catch (err) {
    console.error('passMatch error', err);
    return res.status(500).json({ message: err.message });
  }
};
