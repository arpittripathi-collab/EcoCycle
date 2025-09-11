import Item from '../models/Item.js';
import User from '../models/User.js';

/**
 * Accept a match for an item. Marks item as claimed and rewards the donor.
 * Request body: { itemId }
 */
export const acceptMatch = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.isClaimed) {
      return res.status(400).json({ message: 'Item already claimed' });
    }

  // Mark item as claimed and record who claimed it
  item.isClaimed = true;
  item.claimedBy = req.userId;
  await item.save();

    // Reward donor (owner of the item)
    const donor = await User.findById(item.ownerId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor user not found' });
    }

    donor.donationCount = (donor.donationCount || 0) + 1;
    donor.points = (donor.points || 0) + 50;
    await donor.save();

    // Provide contact details for both parties so they can coordinate
    const receiver = await User.findById(req.userId).select('name email phone');
    res.json({
      message: 'Match accepted, donor rewarded',
      donor: { id: donor._id, name: donor.name, email: donor.email, phone: donor.phone, donationCount: donor.donationCount, points: donor.points },
      receiver
    });
  } catch (err) {
    console.error('Error accepting match:', err);
    res.status(500).json({ message: err.message });
  }
};
