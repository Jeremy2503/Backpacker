const mongoose = require("mongoose");
const { Schema } = mongoose;

const destinationsSchema = new Schema({
    name: { type: String, required: true },
    state: { type: String },
    category: {
        type: String,
        enum: ["Beach", "Mountains & Outdoors", "Culture & Heritage"],
        required: true
    },
    images: [{ type: String }],
    description: { type: String },
    price: { type: Number },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        timezone: { type: String }
    },
    // rating: {
    //     type: Number,
    //     min: 0,
    //     max: 5,
    //     default: 0
    // },
    // totalReviews: { type: Number, default: 0 },
    // totalStays: { type: Number, default: 0 },
    // totalFoodSpots: { type: Number, default: 0 },
    // totalLocalGems: { type: Number, default: 0 },
})

mongoose.model("destinations", destinationsSchema);