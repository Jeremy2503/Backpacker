// routes/destinationRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Destination = mongoose.model("destinations");
const FoodSpot = mongoose.model("foodspots");
const LocalGem = mongoose.model("localgems");
const Stay = mongoose.model("stays");

const VALID_CATEGORIES = ["Beach", "Mountains & Outdoors", "Culture & Heritage"];
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// -------------------------------
// GET all destinations (filters: state, category)
// -------------------------------
router.get("/api/v1/destination/all/get", async (req, res) => {
  try {
    const { state, category } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (category) filter.category = category;

    const items = await Destination.find(filter).lean();
    res.status(200).json({ message: "OK", count: items.length, response: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET by category (simple convenience route)
// -------------------------------
router.get("/api/v1/destination/category/:category/get", async (req, res) => {
  try {
    const { category } = req.params;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}` 
      });
    }
    const items = await Destination.find({ category }).lean();
    res.status(200).json({ 
      message: "OK", 
      category, 
      count: items.length, 
      response: items 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET destination details with related items
// -------------------------------
router.get("/api/v1/destination/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const destination = await Destination.findById(id).lean();
    if (!destination) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const [stays, foodSpots, localGems] = await Promise.all([
      Stay.find({ destinationId: id }).lean(),
      FoodSpot.find({ destinationId: id }).lean(),
      LocalGem.find({ destinationId: id }).lean()
    ]);

    res.status(200).json({
      message: "OK",
      response: { ...destination, stays, foodSpots, localGems }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET all stays for a destination (for customization)
// Query params: minPrice, maxPrice, sortBy (price-asc, price-desc, rating)
// -------------------------------
router.get("/api/v1/destination/:id/stays", async (req, res) => {
  try {
    const { id } = req.params;
    const { minPrice, maxPrice, sortBy } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const filter = { destinationId: id };
    
    // Price filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sort = {};
    if (sortBy === "price-asc") sort = { price: 1 };
    else if (sortBy === "price-desc") sort = { price: -1 };
    else if (sortBy === "rating") sort = { rating: -1 };
    else sort = { price: 1 }; // default: price ascending

    const stays = await Stay.find(filter).sort(sort).lean();

    res.status(200).json({
      message: "OK",
      count: stays.length,
      response: stays
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET all foodspots for a destination (for customization)
// Query params: minPrice, maxPrice, sortBy (price-asc, price-desc, rating)
// -------------------------------
router.get("/api/v1/destination/:id/foodspots", async (req, res) => {
  try {
    const { id } = req.params;
    const { minPrice, maxPrice, sortBy } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const filter = { destinationId: id };
    
    // Price filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sort = {};
    if (sortBy === "price-asc") sort = { price: 1 };
    else if (sortBy === "price-desc") sort = { price: -1 };
    else if (sortBy === "rating") sort = { rating: -1 };
    else sort = { price: 1 }; // default: price ascending

    const foodSpots = await FoodSpot.find(filter).sort(sort).lean();

    res.status(200).json({
      message: "OK",
      count: foodSpots.length,
      response: foodSpots
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET all localgems for a destination (for customization)
// Query params: sortBy (rating, name)
// -------------------------------
router.get("/api/v1/destination/:id/localgems", async (req, res) => {
  try {
    const { id } = req.params;
    const { sortBy } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const filter = { destinationId: id };

    // Sorting
    let sort = {};
    if (sortBy === "rating") sort = { rating: -1 };
    else if (sortBy === "name") sort = { name: 1 };
    else sort = { name: 1 }; // default: name ascending

    const localGems = await LocalGem.find(filter).sort(sort).lean();

    res.status(200).json({
      message: "OK",
      count: localGems.length,
      response: localGems
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// GET budget recommendations (Option A: split budget)
// Query: budgetPerDay [required], mealsPerDay [default 3]
// -------------------------------
router.get("/api/v1/destination/:id/recommendations", async (req, res) => {
  try {
    const { id } = req.params;
    const budgetPerDay = Number(req.query.budgetPerDay);
    const mealsPerDay = Number(req.query.mealsPerDay ?? 3);
    const stayFactor = Number(req.query.stayFactor ?? 0.6);
    const foodFactor = Number(req.query.foodFactor ?? 0.4);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }
    if (!budgetPerDay || budgetPerDay <= 0) {
      return res.status(400).json({ message: "budgetPerDay required" });
    }
    if (stayFactor + foodFactor !== 1) {
      return res.status(400).json({ 
        message: "stayFactor + foodFactor must equal 1" 
      });
    }

    const destination = await Destination.findById(id).lean();
    if (!destination) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const stayBudget = budgetPerDay * stayFactor;
    const foodBudget = budgetPerDay * foodFactor;

    const [stays, foodSpots] = await Promise.all([
      Stay.find({ destinationId: id, price: { $lte: stayBudget } })
        .sort({ price: 1 })
        .lean(),
      FoodSpot.find({ destinationId: id }).sort({ price: 1 }).lean()
    ]);

    const foodUnderBudget = foodSpots.filter(
      f => (f.price ?? 0) * mealsPerDay <= foodBudget
    );

    res.status(200).json({
      message: "Recommendations",
      summary: {
        budgetPerDay,
        stayBudget,
        foodBudget,
        stayFactor,
        foodFactor,
        mealsPerDay
      },
      stays,
      foodSpots: foodUnderBudget
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;