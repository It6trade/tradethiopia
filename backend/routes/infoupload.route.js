const express = require('express');
const User = require('../models/user.model.js');
const upload = require('../multerConfig');
const { storage: appwriteStorage } = require('../config/appwriteClient');
const { File } = require('node-fetch-native-with-agent'); // Import File class like in document routes
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate Appwrite file URL
function generateAppwriteFileUrl(fileId) {
  if (!fileId) return null;
  return `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
}

// Define the upload route for photo and guarantor file
router.post(
  '/upload-info',
  protect,
  upload.fields([{ name: 'photo' }, { name: 'guarantorFile' }]),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { photo, guarantorFile } = req.files || {};

      if ((!photo || !photo[0]) && (!guarantorFile || !guarantorFile[0])) {
        return res.status(400).json({ success: false, message: 'Select at least one file to upload.' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found.' });
      }

      // Helper to upload a file buffer to Appwrite
      async function uploadToAppwrite(file, bucketId) {
        const { originalname, buffer, mimetype } = file;
        const fileName = `${Date.now()}-${originalname}`;
        
        // Create a File object from the buffer like in document routes
        const fileObj = new File([buffer], fileName, { type: mimetype });
        
        // Upload file using the correct Appwrite method
        const result = await appwriteStorage.createFile({
          bucketId: bucketId,
          fileId: 'unique()', // Let Appwrite generate unique ID
          file: fileObj
        });
        
        return result.$id;
      }

      // Set your Appwrite bucket ID here
      const BUCKET_ID = process.env.APPWRITE_BUCKET_ID;

      // Upload photo to Appwrite
      if (photo && photo[0]) {
        const appwritePhotoId = await uploadToAppwrite(photo[0], BUCKET_ID);
        user.photo = appwritePhotoId;
      }

      // Upload guarantor file to Appwrite
      if (guarantorFile && guarantorFile[0]) {
        const appwriteGuarantorId = await uploadToAppwrite(
          guarantorFile[0],
          BUCKET_ID
        );
        user.guarantorFile = appwriteGuarantorId;
      }

      // Uploading evidence does not complete or approve the employee record.
      // Only HR's personal-information decision may advance infoStatus.
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully.',
        user: {
          _id: user._id,
          photo: user.photo,
          photoUrl: generateAppwriteFileUrl(user.photo),
          guarantorFile: user.guarantorFile,
          guarantorFileUrl: generateAppwriteFileUrl(user.guarantorFile),
          infoStatus: user.infoStatus,
          personalInformationStatus: user.personalInformation?.status || 'draft',
        },
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// Get user with file URLs
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        photoUrl: generateAppwriteFileUrl(user.photo),
        guarantorFileUrl: generateAppwriteFileUrl(user.guarantorFile)
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
