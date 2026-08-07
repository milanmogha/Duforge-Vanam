import mongoose from 'mongoose';

const addressBookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Changed from String to ObjectId
    ref: 'User', // Reference to the User model
    required: true,
    index: true
  },
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  flat:      { type: String, default: '' },
  area:      { type: String, default: '' },
  landmark:  { type: String, default: '' },
  pincode:   { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model('AddressBook', addressBookSchema);
