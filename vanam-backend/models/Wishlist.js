import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Changed from String to ObjectId
    required: true,
    unique: true, // Each user has only one wishlist document
    ref: 'User'
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Helper to find-or-create a wishlist for a user
WishlistSchema.statics.forUser = async function(userId) {
  let wishlist = await this.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await this.create({ user: userId, items: [] });
  }
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;