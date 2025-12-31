const mongoose = require("mongoose");
const { Schema } = mongoose;

const localGemSchema = new Schema({

    name: { type: String, required: true },
    image: [{ type: String }],
    description: {type: String},
    destinationId: { type: Schema.Types.ObjectId, ref:'destinations'}
});

mongoose.model("localgems", localGemSchema);