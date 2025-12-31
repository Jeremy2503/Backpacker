const mongoose = require("mongoose");
const { Schema } = mongoose;

const staySchema = new Schema({
    name: { type: String, required: true },
    type: { type: String },
    image: [{ type: String }],
    description: { type: String },
    price: { type: Number }, // Starting price
    rating: { 
        type: Number, 
        min: 0, 
        max: 5, 
        default: 0 
    },
    destinationId: { type: Schema.Types.ObjectId, ref: 'destinations'},
});
mongoose.model("stays",staySchema);