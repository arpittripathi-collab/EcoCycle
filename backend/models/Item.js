import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { // Formerly ownerType
    type: String, 
    enum: ['donation', 'request'], // An item is either a donation or a request
    required: true 
  },
  itemName: { type: String, required: true },
  category: { type: String },
  images: {
    type: [String],
    validate: v => Array.isArray(v) && v.length === 2,
    required: true
  },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  // profession and age removed per requirements
  priority: { type: Boolean, default: false },
  isClaimed: { type: Boolean, default: false },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

ItemSchema.index({ location: '2dsphere' });

const Item = mongoose.model('Item', ItemSchema);
export default Item;