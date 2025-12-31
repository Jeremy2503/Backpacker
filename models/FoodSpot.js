const mongoose = require("mongoose");
const { Schema } = mongoose;

const foodSpotSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String },
  image: [{ type: String }],
  description: { type: String },
  price: { type: Number },
  destinationId: { type: Schema.Types.ObjectId, ref: 'destinations' },
  //   rating: { 
  //     type: Number, 
  //     min: 0, 
  //     max: 5, 
  //     default: 0 
  //   },
  //   totalReviews: { type: Number, default: 0 },
});
mongoose.model("foodspots", foodSpotSchema);