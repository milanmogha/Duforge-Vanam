// src/pages/ProductReview.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canUserReview, addReviewForProduct, getReviewsByProduct } from '../api/reviewApi';
import ReviewForm from './ReviewForm';

const ProductReview = ({ productId }) => {
    const auth = useAuth();
    const { user } = auth;
    const [eligibility, setEligibility] = useState({
        canReview: false,
        alreadyReviewed: false,
        isLoading: true,
        error: ''
    });
    const [submission, setSubmission] = useState({
        isLoading: false,
        error: '',
        success: ''
    });

    useEffect(() => {
        if (!user || !productId) {
            setEligibility(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const checkReviewStatus = async () => {
            try {
                const token = await auth.getToken();
                
                // 1. Check if user is eligible (has a delivered order)
                const canReviewRes = await canUserReview(productId, user.uid, token);
                
                if (!canReviewRes) {
                    setEligibility({ canReview: false, alreadyReviewed: false, isLoading: false, error: '' });
                    return;
                }

                // 2. Check if user has already reviewed this product
                const existingReviews = await getReviewsByProduct(productId, token);
                const hasReviewed = existingReviews.some(review => review.userId === user.uid);

                setEligibility({ canReview: true, alreadyReviewed: hasReviewed, isLoading: false, error: '' });

            } catch (err) {
                console.error("Error checking review eligibility:", err);
                setEligibility({ canReview: false, alreadyReviewed: false, isLoading: false, error: 'Could not check review status.' });
            }
        };

        checkReviewStatus();
    }, [user, productId]);

    const handleReviewSubmit = async ({ rating, comment }) => {
        if (!user) {
            setSubmission({ isLoading: false, error: 'You must be logged in.', success: '' });
            return;
        }

        setSubmission({ isLoading: true, error: '', success: '' });
        try {
            const token = await auth.getToken();
            const reviewData = {
                userId: user._id,
                userName: user.displayName || 'Anonymous',
                rating,
                comment,
            };

            await addReviewForProduct(productId, reviewData, token);
            setSubmission({ isLoading: false, error: '', success: 'Thank you for your review!' });
            // After successful submission, update eligibility to show they've reviewed it
            setEligibility(prev => ({ ...prev, alreadyReviewed: true }));

        } catch (err) {
            console.error("Error submitting review:", err);
            setSubmission({ isLoading: false, error: err.response?.data?.message || err.message || 'Failed to submit review.', success: '' });
        }
    };

    if (eligibility.isLoading) {
        return <p>Checking review status...</p>;
    }

    if (!eligibility.canReview) {
        // Don't show anything if they can't review
        return null;
    }

    if (eligibility.alreadyReviewed || submission.success) {
        return <p className="review-notice">✅ You have already reviewed this item. Thank you!</p>;
    }

    return (
        <div className="review-section">
            <ReviewForm onSubmit={handleReviewSubmit} loading={submission.isLoading} />
            {submission.error && <p className="error-message">{submission.error}</p>}
        </div>
    );
};

export default ProductReview;