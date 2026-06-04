const express = require('express');
const User = require('../models/user.model.js');
const upload = require('../multerConfig');
const { storage: appwriteStorage } = require('../config/appwriteClient');
const { File } = require('node-fetch-native-with-agent'); // Import File class like in document routes

const router = express.Router();

// Helper function to generate Appwrite file URL
function generateAppwriteFileUrl(fileId) {
  if (!fileId) return null;
  return `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
}

// Define the upload route for photo and guarantor file
router.post(
  '/upload-info',
  upload.fields([{ name: 'photo' }, { name: 'guarantorFile' }]),
  async (req, res) => {
    try {
      const userId = req.body.userId;
      const { photo, guarantorFile } = req.files;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required.' });
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

      if ((photo && photo[0]) || (guarantorFile && guarantorFile[0])) {
        user.infoStatus = 'completed';
      }

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