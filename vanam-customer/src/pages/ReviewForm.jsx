// src/components/ReviewForm.jsx

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar } from "@fortawesome/free-solid-svg-icons";
import "../css/ReviewForm.css";

export default function ReviewForm({ onSubmit, loading = false }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={solidStar}
          className={i <= rating ? "star selected" : "star"}
          onClick={() => setRating(i)}
        />
      );
    }
    return stars;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) {
      alert("Please select a rating (1–5 stars).");
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Leave a Review</h3>
      <div className="form-stars">{renderStars()}</div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your thoughts..."
        rows="4"
        className="review-textarea"
      />
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
