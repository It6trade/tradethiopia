const Buyer = require('../models/Buyer');

// Create a new buyer
const createBuyer = async (req, res) => {
  try {
    const { companyName, contactPerson, email, phoneNumber, country, industry, products, requirements, packageType, packageScope, agentId, kpiPoint } = req.body;

    // Check if the email already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(400).json({ error: 'A buyer with this email already exists.' });
    }

    const buyer = new Buyer({
      companyName,
      contactPerson,
      email,
      phoneNumber,
      country,
      industry,
      products,
      requirements,
      packageType,
      packageScope,
      agentId,
      kpiPoint: Number.isFinite(Number(kpiPoint)) ? Number(kpiPoint) : 1,
    });

    await buyer.save();
    res.status(201).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all buyers
const getAllBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find();
    res.status(200).json(buyers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a buyer by ID
const getBuyerById = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer = await Buyer.findById(id);
    
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    res.status(200).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a buyer
const updateBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactPerson, email, phoneNumber, country, industry, products, requirements, packageType, packageScope, agentId, kpiPoint } = req.body;

    // Check if the email is being changed and if it already exists
    const existingBuyer = await Buyer.findOne({ email, _id: { $ne: id } });
    if (existingBuyer) {
      return res.status(400).json({ error: 'A buyer with this email already exists.' });
    }

    const buyer = await Buyer.findByIdAndUpdate(
      id,
      {
        companyName,
        contactPerson,
        email,
        phoneNumber,
        country,
        industry,
        products,
        requirements,
        packageType,
        packageScope,
        agentId,
        kpiPoint: Number.isFinite(Number(kpiPoint)) ? Number(kpiPoint) : 1,
      },
      { new: true, runValidators: true }
    );

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    res.status(200).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a buyer
const deleteBuyer = async (req, res) => {
  try {
    const { id } = req.params;

    const buyer = await Buyer.findByIdAndDelete(id);

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    res.status(200).json({ message: 'Buyer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get buyers by industry
const getBuyersByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const buyers = await Buyer.find({ industry: new RegExp(industry, 'i') });
    res.status(200).json(buyers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a package to a buyer
const addPackageToBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageName, packageType, purchaseDate, expiryDate, status } = req.body;

    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const newPackage = {
      packageName,
      packageType,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: status || 'Active'
    };

    buyer.packages.push(newPackage);
    await buyer.save();

    res.status(200).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a package for a buyer
const updateBuyerPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;
    const { packageName, packageType, purchaseDate, expiryDate, status } = req.body;

    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const packageIndex = buyer.packages.findIndex(pkg => pkg._id.toString() === packageId);
    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Update package fields if provided
    if (packageName) buyer.packages[packageIndex].packageName = packageName;
    if (packageType) buyer.packages[packageIndex].packageType = packageType;
    if (purchaseDate) buyer.packages[packageIndex].purchaseDate = new Date(purchaseDate);
    if (expiryDate) buyer.packages[packageIndex].expiryDate = new Date(expiryDate);
    if (status) buyer.packages[packageIndex].status = status;

    await buyer.save();

    res.status(200).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove a package from a buyer
const removeBuyerPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;

    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    buyer.packages = buyer.packages.filter(pkg => pkg._id.toString() !== packageId);
    await buyer.save();

    res.status(200).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  getBuyersByIndustry,
  addPackageToBuyer,
  updateBuyerPackage,
  removeBuyerPackage
};
