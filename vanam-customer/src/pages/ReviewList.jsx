// src/components/ReviewList.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import "../css/ReviewList.css";

export default function ReviewList({ reviews = [] }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={i <= rating ? solidStar : regularStar}
          className={i <= rating ? "star filled" : "star"}
        />
      );
    }
    return stars;
  };

  if (!reviews.length) {
    return <p className="no-reviews">No reviews yet.</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((rev) => (
        <div key={rev._id} className="review-item">
          <div className="review-header">
            <span className="review-username">{rev.userName}</span>
            <span className="review-date">
              {new Date(rev.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="review-stars">{renderStars(rev.rating)}</div>
          {rev.comment && <p className="review-comment">{rev.comment}</p>}
        </div>
      ))}
    </div>
  );
}
