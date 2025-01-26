const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser()); // Middleware to parse cookies
app.use(express.static(path.join(__dirname, "."))); // Serve static files

// MongoDB connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("teacherRatingsDB");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Save rating endpoint
app.post("/api/save-rating", async (req, res) => {
  const { teacherIndex, rating } = req.body;
  const userId = req.cookies.userId; // Get user ID from cookies
  const ratingsCollection = db.collection("ratings"); // Define ratingsCollection here

  // Check if the user has already rated
  if (userId) {
    const existingRating = await ratingsCollection.findOne({ userId, teacherIndex });
    if (existingRating) {
      return res.status(400).json({ success: false, error: "User has already rated this teacher." });
    }
  } else {
    // Generate a new user ID and set it in cookies
    const newUserId = generateUserId(); // Generate a unique ID
    res.cookie("userId", newUserId, { httpOnly: true });
  }

  console.log("Received request to save rating:", { teacherIndex, rating });

  // Validate input
  if (typeof teacherIndex !== "number" || typeof rating !== "number" || rating < 1 || rating > 10) {
    console.error("Invalid input:", { teacherIndex, rating });
    return res.status(400).json({ success: false, error: "Invalid input" });
  }

  try {
    // Update or insert the rating
    await ratingsCollection.updateOne(
      { teacherIndex },
      { $push: { ratings: rating } },
      { upsert: true }
    );

    console.log("Rating saved successfully:", { teacherIndex, rating });
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ success: false, error: "Failed to save rating" });
  }
});

// Fetch ratings endpoint
app.get("/api/get-ratings", async (req, res) => {
  try {
    const ratingsCollection = db.collection("ratings");
    const ratings = await ratingsCollection.find({}).toArray();

    // Format ratings as { teacherIndex: [ratings] }
    const formattedRatings = {};
    ratings.forEach((doc) => {
      formattedRatings[doc.teacherIndex] = doc.ratings;
    });

    res.json(formattedRatings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch ratings" });
  }
});

// Reset ratings endpoint
app.post("/api/reset-ratings", async (req, res) => {
  try {
    const ratingsCollection = db.collection("ratings");
    await ratingsCollection.deleteMany({}); // Clear all ratings
    console.log("All ratings have been reset.");
    res.json({ success: true, message: "All ratings have been reset." });
  } catch (error) {
    console.error("Error resetting ratings:", error);
    res.status(500).json({ success: false, error: "Failed to reset ratings" });
  }
});

// Generate user ID function
function generateUserId() {
  return Date.now(); // Use the current timestamp as a unique ID
}

// Start server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
