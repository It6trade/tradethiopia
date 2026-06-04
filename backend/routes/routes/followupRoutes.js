const express = require("express");
const followupController = require("../controllers/followupController.js");
const orderController = require("../controllers/orderController.js");
const { protect } = require('../middleware/auth.js');
const { authorizeRoles } = require('../middleware/roles.js');

const router = express.Router();

// Get customer report for customer service users
router.get("/report", followupController.getCustomerReport);

// Get all B2B customers that are not yet in follow-up system
router.get("/b2b-pending", followupController.getPendingB2BCustomers);

// Import B2B customers to follow-up system
router.post("/import-b2b", followupController.importB2BCustomers);

router.post("/bulk-email", followupController.sendBulkEmail);
router.get("/:id/messages", followupController.getMessages);
router.post("/:id/messages", followupController.addMessage);
router.patch("/:id/attempts", followupController.incrementAttempts);
router.post("/:id/communications", followupController.addCommunicationLog);
router.patch("/:id/priority", followupController.updatePriority);

// Get all follow-ups
router.get("/", followupController.getFollowups);
// Stats must come before any :id routes to avoid casting "stats" as an ID
router.get("/stats", followupController.getFollowupStats);
// Analytics endpoint must be defined explicitly before the catch-all :id route
router.get("/analytics", followupController.getFollowupAnalytics);

// Create a new follow-up
router.post("/", followupController.createFollowup);

// Update a follow-up
router.put("/:id", followupController.updateFollowup);

// Delete a follow-up
router.delete("/:id", followupController.deleteFollowup);
router.post('/:id/process-order', protect, authorizeRoles('sales','sales_manager','admin','customerservice'), followupController.processOrder);
// Reserve stock (allocate from on-hand then buffer) for a followup
router.post('/:id/reserve', protect, authorizeRoles('sales','sales_manager','admin','customerservice'), orderController.reserveForFollowup);
// Preview reservation (no DB changes)
router.post('/:id/reserve/preview', protect, authorizeRoles('sales','sales_manager','admin','customerservice'), orderController.simulateReserveForFollowup);
// Fulfill an order created for this followup (finance/admin only)
router.post('/:followupId/orders/:orderId/fulfill', protect, authorizeRoles('finance','admin'), orderController.fulfillOrder);

// Add a note to a follow-up
router.post("/:id/notes", followupController.addNote);

// Update lastCalled for a specific follow-up
router.patch("/:id/lastCalled", followupController.updateLastCalled);

// Update Service Provided and Service Not Provided
router.patch("/:id/services", followupController.updateServices);

// Edit customer information
router.patch("/:id/edit", followupController.editCustomer);

// Get a follow-up by ID (must come last)
router.get("/:id", followupController.getFollowupById);

module.exports = router;
