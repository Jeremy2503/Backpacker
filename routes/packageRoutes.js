// routes/packageRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Package = mongoose.model("packages");
const Destination = mongoose.model("destinations");
const Stay = mongoose.model("stays");
const FoodSpot = mongoose.model("foodspots");
const LocalGem = mongoose.model("localgems");
const Activity = mongoose.model("activities");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// -------------------------------
// GET all packages for a destination
// Query params: minBudget, maxBudget, sortBy (price-asc, price-desc, popularity, rating)
// -------------------------------
router.get("/api/v1/packages/destination/:destinationId", async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { minBudget, maxBudget, sortBy } = req.query;

    if (!isValidObjectId(destinationId)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const destination = await Destination.findById(destinationId).lean();
    if (!destination) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const filter = { destinationId, isActive: true };

    // Budget filtering
    if (minBudget || maxBudget) {
      filter.budgetPerDay = {};
      if (minBudget) filter.budgetPerDay.$gte = Number(minBudget);
      if (maxBudget) filter.budgetPerDay.$lte = Number(maxBudget);
    }

    // Sorting
    let sort = {};
    if (sortBy === "price-asc") sort = { budgetPerDay: 1 };
    else if (sortBy === "price-desc") sort = { budgetPerDay: -1 };
    else if (sortBy === "popularity") sort = { popularity: -1 };
    else if (sortBy === "rating") sort = { rating: -1 };
    else sort = { budgetPerDay: 1 }; // default: price ascending

    const packages = await Package.find(filter).sort(sort).lean();

    res.status(200).json({
      message: "OK",
      count: packages.length,
      response: packages
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET package details with all related items
// -------------------------------
router.get("/api/v1/packages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid package id" });
    }

    const packageData = await Package.findById(id).lean();
    if (!packageData) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Get all related items
    const [stay, foodSpots, localGems, activities] = await Promise.all([
      packageData.defaultStayId 
        ? Stay.findById(packageData.defaultStayId).lean() 
        : null,
      packageData.defaultFoodSpotIds.length > 0
        ? FoodSpot.find({ _id: { $in: packageData.defaultFoodSpotIds } }).lean()
        : [],
      packageData.defaultLocalGemIds.length > 0
        ? LocalGem.find({ _id: { $in: packageData.defaultLocalGemIds } }).lean()
        : [],
      packageData.defaultActivityIds.length > 0
        ? Activity.find({ _id: { $in: packageData.defaultActivityIds } }).lean()
        : []
    ]);

    res.status(200).json({
      message: "OK",
      response: {
        ...packageData,
        defaultStay: stay,
        defaultFoodSpots: foodSpots,
        defaultLocalGems: localGems,
        defaultActivities: activities
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;