
const express = require("express");
const app = express();
const mongoose = require("mongoose")

require("dotenv").config();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
    .connect(process.env.MONGODB_URI, {})
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });

//start server
const port = process.env.PORT || 5001;

require("./models/Destination");
require("./models/FoodSpot");
require("./models/LocalGem");
require("./models/Stay");
require("./models/User");
require("./models/Activity");
require("./models/Package");
require("./models/Itinerary");
require("./models/Booking");
require("./models/Moment");
require("./models/Review");

// Routes
app.use(require("./routes/destinationRoutes"));
app.use(require("./routes/userRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
require("./routes/authRoutes")(app);
app.use(require("./routes/packageRoutes"));
app.use(require("./routes/itineraryRoutes"));
app.use(require("./routes/bookingRoutes"));
// app.use(require("./routes/momentRoutes")); 
// app.use(require("./routes/recommendationRoutes"));
// reviewRoutes can be added later


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});