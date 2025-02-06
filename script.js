const teachers = [
  { name: "Ms Anuradha Singh", subject: "DBMS", ratings: [], ratingCount: 0 },
  { name: "Mr Krishna", subject: "Software Engineering", ratings: [], ratingCount: 0 },
  { name: "Mr Anurag Tripathi", subject: "Computer Graphic", ratings: [], ratingCount: 0 },
  { name: "Mr Ramu padey", subject: "Operation Research", ratings: [], ratingCount: 0 },
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
      const errorData = await response.json();
      if (errorData.error) {
        console.error(errorData.error); // Log the error message from the server
      }
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

    console.log("Response Status:", response.status); // Log response status

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
        <button id="submit-${index}" onclick="submitRating(${index})">Submit Rating</button>
      </div>
    `;

    container.appendChild(teacherDiv);
  });
}

// Calculate average rating
function calculateAverageRating(ratings) {
  console.log("Calculating average for ratings:", ratings); // Log ratings being calculated
  if (!Array.isArray(ratings) || ratings.length === 0) return "No ratings yet";
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);

  return (sum / ratings.length).toFixed(2);
}

// Submit rating for a teacher
async function submitRating(teacherIndex) {
  const ratingInput = document.getElementById(`rating-${teacherIndex}`);
  const rating = parseInt(ratingInput.value, 10);
  const submitButton = document.getElementById(`submit-${teacherIndex}`);

  if (isNaN(rating) || rating < 1 || rating > 10) {
    alert("Please enter a valid rating between 1 and 10.");
    return;
  }

  try {
    // Check if the user has already rated this teacher
    const existingRatings = await fetchRatingsFromServer();
    if (existingRatings[teacherIndex] && existingRatings[teacherIndex].ratings.includes(rating)) {
      submitButton.disabled = true; // Disable the submit button
      return;
    }

    // Save rating to the server
    await saveRatingToServer(teacherIndex, rating);

    // Increment the rating count
    teachers[teacherIndex].ratingCount++;

    // Add the new rating to the teacher's ratings
    teachers[teacherIndex].ratings.push(rating); // Update the ratings array

    // Fetch updated ratings from the server
    const updatedRatings = await fetchRatingsFromServer();
    teachers.forEach((teacher, index) => {
      if (updatedRatings[index]) {
        teacher.ratings = updatedRatings[index].ratings;
        teacher.ratingCount = updatedRatings[index].ratingCount;
      }
    });

    // Re-render the teachers to show updated average rating
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
    const fetchedRatings = await fetchRatingsFromServer();

    // Update the teachers array with the fetched ratings
    teachers.forEach((teacher, index) => {
      if (fetchedRatings[index] && Array.isArray(fetchedRatings[index].ratings)) {
        teacher.ratings = fetchedRatings[index].ratings;
        teacher.ratingCount = fetchedRatings[index].ratingCount; // Set the rating count
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
