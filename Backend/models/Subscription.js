const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    required: true,
    default: 'free'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired', 'trial'],
    default: 'active'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  nextBillingDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  paymentHistory: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    amount: Number,
    paymentDate: Date,
    status: String
  }],
  features: {
    maxDrafts: { type: Number, default: 5 },
    maxSharing: { type: Number, default: 2 },
    customWallSizes: { type: Boolean, default: false },
    premiumDecors: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    exportOptions: { type: Boolean, default: false },
    collaborativeEditing: { type: Boolean, default: false }
  },
  usage: {
    draftsCreated: { type: Number, default: 0 },
    draftsShared: { type: Number, default: 0 },
    lastAccess: { type: Date, default: Date.now },
    totalLogins: { type: Number, default: 0 }
  },
  discounts: [{
    code: String,
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    appliedDate: Date,
    description: String
  }],
  cancellation: {
    reason: String,
    feedback: String,
    cancelledAt: Date,
    effectiveDate: Date,
    refundEligible: { type: Boolean, default: false }
  },
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});