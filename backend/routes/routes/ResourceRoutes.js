const { Router } = require("express");
const multer = require("multer");
const { memoryStorage } = require("multer");
const { uploadResource, getResourceCount, getAllResources, getPdfResources, deleteResource } = require("../controllers/resourceController.js");

const router = Router();

// DELETE route to delete a resource by ID
router.delete('/:id', deleteResource);

// Configure multer to store files in memory for Appwrite upload
const multerStorage = memoryStorage();
const upload = multer({ storage: multerStorage });

// POST route to upload resource
router.post('/upload', upload.single("file"), uploadResource);

// GET route to get count of resources
router.get('/count', getResourceCount);

// GET route to get all resources
router.get('/', getAllResources); // New route for fetching all resources

// GET route to get all PDF resources
router.get('/pdf', getPdfResources);

// Export the router
module.exports = router;