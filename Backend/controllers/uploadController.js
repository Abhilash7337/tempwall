const { saveUploadedFile } = require('../utils/fileUpload');
const multer = require('multer');
const Draft = require('../models/Draft');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// Handle file upload with per-design image upload limit enforcement
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Require draftId in body or query
    const draftId = req.body.draftId || req.query.draftId;
    if (!draftId) {
      return res.status(400).json({ error: 'Missing draftId for image upload' });
    }

    // Find the draft
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Only allow the owner to upload images
    if (draft.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's subscription and plan
    const subscription = await Subscription.findOne({ userId: req.userId });
    let imageUploadLimit = 3; // Default
    if (subscription && subscription.plan) {
      const plan = await Plan.findOne({ name: subscription.plan });
      if (plan && plan.limits && plan.limits.imageUploadsPerDesign !== undefined) {
        imageUploadLimit = plan.limits.imageUploadsPerDesign;
      }
    }

    // Count current images in the draft (assume wallData.images is an array of image URLs)
    const currentImageCount = Array.isArray(draft.wallData?.images) ? draft.wallData.images.length : 0;

    if (imageUploadLimit !== -1 && currentImageCount >= imageUploadLimit) {
      return res.status(403).json({
        error: 'Image upload limit reached',
        message: `You have reached your plan limit of ${imageUploadLimit} images per design. Please upgrade your plan or remove images to continue.`,
        currentCount: currentImageCount,
        limit: imageUploadLimit
      });
    }

    // Proceed with upload
    const fileBuffer = req.file.buffer;
    const result = saveUploadedFile(fileBuffer, req.file.originalname, 5001);

    if (result.isNew) {
      console.log('New image uploaded:', result.url);
    } else {
      console.log('Duplicate image detected, returning existing URL:', result.url);
    }

    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File size too large',
          limit: '30MB'
        });
      }
    }
    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
};

module.exports = {
  uploadImage
};
