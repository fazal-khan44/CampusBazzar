const mongoose = require('mongoose');
const { ALL_CAMPUSES } = require('../utils/nitpLocations');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide product title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      min: [0, 'Price must be 0 or higher'],
    },
    category: {
      type: String,
      required: [true, 'Please select or provide a category'],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Please specify condition of item'],
      enum: ['Brand New', 'Like New', 'Gently Used', 'Heavily Used'],
      default: 'Gently Used',
    },
    images: {
      type: [String],
      default: [],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      enum: ALL_CAMPUSES,
      default: 'Patna Campus',
    },
    hostel: {
      type: String,
      required: [true, 'Hostel is required'],
      trim: true,
      default: 'Brahmaputra Hostel',
    },
    // Keep hostelName for backward compatibility with existing queries/views
    hostelName: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Sold'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function () {
  if (this.hostel && !this.hostelName) {
    this.hostelName = this.hostel;
  } else if (this.hostelName && !this.hostel) {
    this.hostel = this.hostelName;
  }
});

// Index for search capabilities and location filtering
productSchema.index({ title: 'text', description: 'text', category: 'text' });
productSchema.index({ campus: 1, hostel: 1 });

module.exports = mongoose.model('Product', productSchema);
