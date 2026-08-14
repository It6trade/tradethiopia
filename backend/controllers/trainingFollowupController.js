const TrainingFollowup = require("../models/TrainingFollowup");
const SalesCustomer = require("../sales/models/SalesCustomer");

// Create Training follow-up
const createTrainingFollowup = async (req, res) => {
  try {
    const doc = await TrainingFollowup.create(req.body);
    
    // Update the follow-up status in SalesCustomer collection
    // We'll look for a customer with matching email or customerName
    const { email, customerName } = req.body;
    
    if (email || customerName) {
      const filter = {};
      if (email) {
        filter.email = email;
      } else if (customerName) {
        filter.customerName = customerName;
      }
      
      // Update the followupStatus to "Imported" for matching customers
      await SalesCustomer.updateMany(filter, {
        followupStatus: "Imported"
      });
    }
    
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get Training follow-ups with basic filtering/sorting
const getTrainingFollowups = async (req, res) => {
  try {
    const { q, progress, sort = "asc", batch } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { customerName: regex },
        { agentName: regex },
        { email: regex },
        { batch: regex },
      ];
    }

    if (progress && progress !== "all") {
      filter.progress = progress;
    }

    if (batch) {
      filter.batch = new RegExp(batch, "i");
    }

    const sortDir = sort === "desc" ? -1 : 1;

    const followups = await TrainingFollowup.find(filter)
      .sort({ customerName: sortDir })
      .lean();

    res.json(followups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get count of training customers whose progress is not 'Completed'
const getIncompleteTrainingCount = async (req, res) => {
  try {
    const count = await TrainingFollowup.countDocuments({
      progress: { $ne: "Completed" }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get training programs that are not completed properly (not equal to 'Completed')
const getWeeklyPopularTrainings = async (req, res) => {
  try {
    // Aggregate to get training program counts where progress is not 'Completed'
    const popularTrainings = await TrainingFollowup.aggregate([
      {
        $match: {
          progress: { $ne: "Completed" }  // Only include trainings that are not completed
        }
      },
      {
        $group: {
          _id: "$trainingType",  // Group by training program (trainingType)
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5 // Get top 5 most popular training programs
      },
      {
        $project: {
          _id: 0,
          trainingProgram: "$_id",  // Rename _id to trainingProgram for clarity
          count: 1
        }
      }
    ]);

    res.json(popularTrainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Training follow-up
const updateTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await TrainingFollowup.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Training follow-up not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Training follow-up
const deleteTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TrainingFollowup.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Training follow-up not found" });
    res.json({ message: "Training follow-up deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTrainingFollowup,
  getTrainingFollowups,
  getIncompleteTrainingCount,
  getWeeklyPopularTrainings,
  updateTrainingFollowup,
  deleteTrainingFollowup,
};
