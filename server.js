const express = require("express");
const cookieParser = require("cookie-parser");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
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
  const userId = req.cookies.userId;
  const ratingsCollection = db.collection("ratings");

  if (userId) {
    const existingRating = await ratingsCollection.findOne({ userId, teacherIndex });
    if (existingRating) {
      return res.status(400).json({ success: false, error: "User has already rated this teacher." });
    }
  } else {
    const newUserId = generateUserId();
    res.cookie("userId", newUserId, { httpOnly: true });
  }

  if (typeof teacherIndex !== "number" || typeof rating !== "number" || rating < 1 || rating > 10) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }

  try {
    const result = await ratingsCollection.updateOne(
      { teacherIndex },
      { 
        $push: { ratings: rating }, 
        $inc: { ratingCount: 1 },
      },
      { upsert: true }
    );

    const updatedEntry = await ratingsCollection.findOne({ teacherIndex });
    const averageRating = updatedEntry.ratings.reduce((acc, r) => acc + r, 0) / updatedEntry.ratingCount;

    await ratingsCollection.updateOne(
      { teacherIndex },
      { $set: { averageRating: averageRating } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to save rating" });
  }
});

// Fetch ratings endpoint
app.get("/api/get-ratings", async (req, res) => {
  try {
    const ratingsCollection = db.collection("ratings");
    const ratings = await ratingsCollection.find({}).toArray();

    const formattedRatings = {};
    ratings.forEach((doc) => {
      formattedRatings[doc.teacherIndex] = {
        ratings: doc.ratings,
        ratingCount: doc.ratingCount || 0,
        averageRating: doc.averageRating || 0,
      };
    });

    res.json(formattedRatings);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch ratings" });
  }
});

// Reset ratings endpoint
app.post("/api/reset-ratings", async (req, res) => {
  try {
    const ratingsCollection = db.collection("ratings");
    await ratingsCollection.deleteMany({});
    res.json({ success: true, message: "All ratings have been reset." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to reset ratings" });
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Resource not found" });
});

// Generate user ID function
function generateUserId() {
  return Date.now();
}

// Start server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
