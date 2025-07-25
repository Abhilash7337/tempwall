const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  features: [{
    type: String,
    trim: true
  }],
  limits: {
    designsPerMonth: {
      type: Number,
    
    },
    imageUploadsPerDesign: {
      type: Number,
     
    }
  },

  // Array of decor ObjectIds associated with this plan
  decors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Decor'
  }],
  exportDrafts: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
planSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for yearly savings
planSchema.virtual('yearlySavings').get(function() {
  if (this.yearlyPrice > 0 && this.monthlyPrice > 0) {
    return (this.monthlyPrice * 12) - this.yearlyPrice;
  }
  return 0;
});

// Virtual for yearly discount percentage
planSchema.virtual('yearlyDiscountPercent').get(function() {
  if (this.yearlyPrice > 0 && this.monthlyPrice > 0) {
    const savings = (this.monthlyPrice * 12) - this.yearlyPrice;
    return Math.round((savings / (this.monthlyPrice * 12)) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
planSchema.set('toJSON', { virtuals: true });
planSchema.set('toObject', { virtuals: true });

// Index for faster queries
// Removed to avoid duplicate index warning, unique: true already creates an index
planSchema.index({ isActive: 1 });
planSchema.index({ monthlyPrice: 1 });
planSchema.index({ createdAt: -1 });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
