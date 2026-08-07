// src/components/ReviewList.jsx

import React, { useState, useEffect } from "react";
import { fetchAllUsers } from "../api/userApi";
import "../css/ProductDetails.css";

export default function ReviewList({ reviews }) {
  const [userMap, setUserMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  // If any review.userName === "Anonymous", fetch users and build a userId → name map
  useEffect(() => {
    const needsLookup = reviews.some(
      (r) =>
        typeof r.userName === "string" &&
        r.userName.trim().toLowerCase() === "anonymous"
    );
    if (!needsLookup) {
      console.log("DEBUG: No reviews with userName 'Anonymous'; skipping user fetch.");
      setLoadingUsers(false);
      return;
    }

    const loadUsers = async () => {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        console.error("Missing adminToken; cannot fetch user names.");
        setLoadingUsers(false);
        return;
      }

      try {
        // fetchAllUsers returns an array like:
        // [
        //   {
        //     _id: "683c219088bd91308221d740",
        //     name: "Antriksh Ranjan",
        //     ...
        //   },
        //   ...
        // ]
        const users = await fetchAllUsers(adminToken);
        console.log("DEBUG: fetched users array:", users);

        // Build a map: user _id → name
        const map = {};
        users.forEach((u) => {
          if (u._id) {
            map[u._id] = u.name;
          }
        });
        console.log("DEBUG: built userMap (userId → name):", map);

        setUserMap(map);
      } catch (err) {
        console.error("Failed to fetch user list:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [reviews]);

  // Log incoming reviews prop
  console.log("DEBUG: ReviewList received reviews prop:", reviews);
  console.log("DEBUG: userMap state:", userMap, "loadingUsers:", loadingUsers);

  if (!reviews || reviews.length === 0) {
    return <p className="no-reviews-text">No reviews available.</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review, index) => {
        console.log(`DEBUG: review[${index}]:`, review);

        // review.userId is the MongoDB user _id
        const { _id, userId, userName, rating, comment, createdAt } = review;
        const key = _id || index;

        // Decide which name to display:
        // a) If userName exists and is not literally "Anonymous", use that.
        // b) Otherwise (userName === "Anonymous"), look up userMap[userId].
        // c) If no match, fallback to "Anonymous".
        const isLiteralAnonymous =
          typeof userName === "string" &&
          userName.trim().toLowerCase() === "anonymous";

        let reviewerName;
        if (userName && !isLiteralAnonymous) {
          // Case (a)
          reviewerName = userName;
        } else if (!loadingUsers && userMap[userId]) {
          // Case (b): find real name via userId lookup
          reviewerName = userMap[userId];
        } else {
          // Case (c)
          reviewerName = "Anonymous";
        }
        console.log(
          `DEBUG: Chosen reviewerName for review[${index}]:`,
          reviewerName
        );

        // Format date (e.g., "03 Jun 2025")
        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "";

        return (
          <div className="review-item" key={key}>
            <div className="review-header">
              <span className="review-author">{reviewerName}</span>
              {typeof rating === "number" && (
                <span className="review-rating">Rating: {rating} / 5</span>
              )}
            </div>
            {formattedDate && (
              <div className="review-date">{formattedDate}</div>
            )}
            {comment && <p className="review-comment">{comment}</p>}
          </div>
        );
      })}
    </div>
  );
}
