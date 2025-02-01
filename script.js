const teachers = [
  { name: "Ms Anuradha Singh", subject: "Operating System", ratings: [], ratingCount: 0 },
  { name: "Ms Priya Chaturvedi", subject: "Data Structures", ratings: [], ratingCount: 0 },
  { name: "Ms Kanchan Yadav", subject: "COA", ratings: [], ratingCount: 0 },
  { name: "Mr Yogendra Yadav", subject: "Mathematics", ratings: [], ratingCount: 0 },
];

// Save rating to the server
async function saveRatingToServer(teacherIndex, rating) {
  try {
    const response = await fetch("http://localhost:3000/api/save-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherIndex, rating }),
    });

    if (!response.ok) {
      throw new Error("Failed to save rating");
    }

    const data = await response.json();
    console.log("Rating saved:", data);
    return data;
  } catch (error) {
    console.error("Error saving rating:", error);
    alert("Failed to save rating. Please try again.");
    throw error;
  }
}

// Fetch ratings from the server
async function fetchRatingsFromServer() {
  try {
    const response = await fetch("http://localhost:3000/api/get-ratings");

    if (!response.ok) {
      throw new Error("Failed to fetch ratings");
    }

    const data = await response.json();
    console.log("Ratings fetched:", data);
    return data;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    alert("Failed to fetch ratings. Please try again.");
    throw error;
  }
}

// Render teachers with their ratings
function renderTeachers() {
  const container = document.getElementById("teachers-container");
  container.innerHTML = ""; // Clear previous content

  teachers.forEach((teacher, index) => {
    const teacherDiv = document.createElement("div");
    teacherDiv.className = "teacher";

    // Display teacher name, subject, average rating, and rating count
    teacherDiv.innerHTML = `
      <h3>${teacher.name}</h3>
      <p>Subject: ${teacher.subject}</p>
      <p>Average Rating: ${calculateAverageRating(teacher.ratings)}</p>
      <p>Number of Ratings: ${teacher.ratingCount}</p>
      <div class="rating-input" id="rating-input-${index}">
        <input type="number" id="rating-${index}" min="1" max="10" placeholder="Rate (1-10)" />
        <button onclick="submitRating(${index})">Submit Rating</button>
      </div>
    `;

    container.appendChild(teacherDiv);
  });
}

// Calculate average rating
function calculateAverageRating(ratings) {
  if (ratings.length === 0) return "No ratings yet";
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return (sum / ratings.length).toFixed(2);
}

// Submit rating for a teacher
async function submitRating(teacherIndex) {
  const ratingInput = document.getElementById(`rating-${teacherIndex}`);
  const rating = parseInt(ratingInput.value, 10);

  if (isNaN(rating) || rating < 1 || rating > 10) {
    alert("Please enter a valid rating between 1 and 10.");
    return;
  }

  try {
    // Save rating to the server
    await saveRatingToServer(teacherIndex, rating);

    // Increment the rating count
    teachers[teacherIndex].ratingCount++;

    // Remove the input and button, and show a thank you message
    const ratingInputDiv = document.getElementById(`rating-input-${teacherIndex}`);
    ratingInputDiv.innerHTML = "<p>Rating submitted, Thank you!</p>";

    // Fetch updated ratings from the server
    const updatedRatings = await fetchRatingsFromServer();

    // Update the teachers array with the new ratings
    teachers.forEach((teacher, index) => {
      if (updatedRatings[index]) {
        teacher.ratings = updatedRatings[index];
      }
    });

    // Re-render the teachers
    renderTeachers();
  } catch (error) {
    console.error("Error submitting rating:", error);
  }
}

// Reset ratings function
async function resetRatings() {
  try {
    const response = await fetch("http://localhost:3000/api/reset-ratings", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to reset ratings");
    }

    const data = await response.json();
    console.log("Ratings reset:", data);
    alert("All ratings have been reset.");
  } catch (error) {
    console.error("Error resetting ratings:", error);
    alert("Failed to reset ratings. Please try again.");
  }
}

// Initialize the app
async function init() {
  try {
    // Fetch ratings from the server
    const ratings = await fetchRatingsFromServer();

    // Update the teachers array with the fetched ratings
    teachers.forEach((teacher, index) => {
      if (ratings[index]) {
        teacher.ratings = ratings[index];
        teacher.ratingCount = ratings[index].length; // Set the rating count
      }
    });

    // Render the teachers
    renderTeachers();
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// Start the app
init();
