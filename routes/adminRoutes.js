
// routes/admin.routes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Destination = mongoose.model("destinations");
const FoodSpot   = mongoose.model("foodspots");
const LocalGem   = mongoose.model("localgems");
const Stay       = mongoose.model("stays");

const VALID_CATEGORIES = ["Beach", "Mountains & Outdoors", "Culture & Heritage"];
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ------------------------------------------
   DESTINATION (CRUD)
   ------------------------------------------ */

// CREATE Destination
router.post("/destination", async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}` });
    }
    const existing = await Destination.findOne({ name }).lean();
    if (existing) return res.status(409).json({ message: "Destination already exists" });

    const created = await Destination.create({
      ...req.body,
      country: req.body.country || "India",
      rating: req.body.rating ?? 0
    });

    res.status(201).json({ message: "Destination created", response: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE Destination
router.put("/destination/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid destination id" });
    if (req.body.category && !VALID_CATEGORIES.includes(req.body.category)) {
      return res.status(400).json({ message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}` });
    }

    const updated = await Destination.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Destination not found" });

    res.status(200).json({ message: "Destination updated", response: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Destination (optional: cascade children)
router.delete("/destination/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid destination id" });

    const deleted = await Destination.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Destination not found" });

    // Optional cascade:
    // await Promise.all([
    //   FoodSpot.deleteMany({ destinationId: id }),
    //   LocalGem.deleteMany({ destinationId: id }),
    //   Stay.deleteMany({ destinationId: id }),
    // ]);

    res.status(200).json({ message: "Destination deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------
   FOODSPOT (CRUD)
   ------------------------------------------ */

// CREATE FoodSpot
router.post("/foodspot", async (req, res) => {
  try {
    const { name, destinationId, price } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!destinationId || !isValidObjectId(destinationId)) {
      return res.status(400).json({ message: "Valid destinationId is required" });
    }

    const created = await FoodSpot.create({
      ...req.body,
      price: price ?? 0 // avg per meal per person
    });

    res.status(201).json({ message: "Food spot created", response: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE FoodSpot
router.put("/foodspot/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid foodspot id" });
    if (req.body.destinationId && !isValidObjectId(req.body.destinationId)) {
      return res.status(400).json({ message: "Invalid destinationId" });
    }

    const updated = await FoodSpot.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Food spot not found" });

    res.status(200).json({ message: "Food spot updated", response: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE FoodSpot
router.delete("/foodspot/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid foodspot id" });

    const deleted = await FoodSpot.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Food spot not found" });

    res.status(200).json({ message: "Food spot deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------
   STAY (CRUD)
   ------------------------------------------ */

// CREATE Stay
router.post("/stay", async (req, res) => {
  try {
    const { name, destinationId, price } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!destinationId || !isValidObjectId(destinationId)) {
      return res.status(400).json({ message: "Valid destinationId is required" });
    }

    const created = await Stay.create({
      ...req.body,
      price: price ?? 0 // per person per night (adjust if per room)
    });

    res.status(201).json({ message: "Stay created", response: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE Stay
router.put("/stay/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid stay id" });
    if (req.body.destinationId && !isValidObjectId(req.body.destinationId)) {
      return res.status(400).json({ message: "Invalid destinationId" });
    }

    const updated = await Stay.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Stay not found" });

    res.status(200).json({ message: "Stay updated", response: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Stay
router.delete("/stay/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid stay id" });

    const deleted = await Stay.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Stay not found" });

    res.status(200).json({ message: "Stay deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------
   LOCAL GEM (CRUD)
   ------------------------------------------ */

// CREATE LocalGem
router.post("/localgem", async (req, res) => {
  try {
    const { name, destinationId, price } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!destinationId || !isValidObjectId(destinationId)) {
      return res.status(400).json({ message: "Valid destinationId is required" });
    }

    const created = await LocalGem.create({
      ...req.body,
      price: price ?? 0 // optional activity price
    });

    res.status(201).json({ message: "Local gem created", response: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE LocalGem
router.put("/localgem/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid local gem id" });
    if (req.body.destinationId && !isValidObjectId(req.body.destinationId)) {
      return res.status(400).json({ message: "Invalid destinationId" });
    }

    const updated = await LocalGem.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Local gem not found" });

    res.status(200).json({ message: "Local gem updated", response: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE LocalGem
router.delete("/localgem/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid local gem id" });

    const deleted = await LocalGem.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Local gem not found" });

    res.status(200).json({ message: "Local gem deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
