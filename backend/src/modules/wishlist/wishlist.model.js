import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  // User identifier stored as string to support guest or authenticated session mapping
  user: {
    type: String,
    required: true,
    unique: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, { timestamps: true });

export default mongoose.model('Wishlist', wishlistSchema);