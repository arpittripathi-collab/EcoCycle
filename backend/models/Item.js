import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerType: { type: String, enum: ['donor', 'receiver'], required: true },
  itemName: { type: String, required: true },
  category: { type: String },
  images: {
    type: [String],
    validate: v => Array.isArray(v) && v.length === 2,
    required: true
  },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  profession: { type: String },
  age: { type: Number },
  priority: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now }
});

ItemSchema.index({ location: '2dsphere' });

const Item = mongoose.model('Item', ItemSchema);
export default Item;