/**
 * Helper functions for handling ratings and stars
 */
class RatingHelper {
    /**
     * Generates HTML for star ratings with specified rating value
     * @param {number} rating - The rating value (0-5)
     * @param {boolean} showValue - Whether to show the numeric value
     * @return {string} HTML string for star ratings
     */
    static generateRatingStars(rating = 0) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return `
            <div class="vr-featured__stars">
                ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
                ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
                ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
                <span class="vr-featured__rating-value">${rating.toFixed(1)}</span>
            </div>
        `;
    }
    
    /**
     * Calculates average rating from array of review objects
     * @param {Array} reviews - Array of review objects with rating property
     * @return {number} Average rating or 0 if no reviews
     */
    static calculateAverageRating(reviews) {
        if (!reviews || !reviews.length) return 0;
        
        const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
        return sum / reviews.length;
    }
    
    /**
     * Generates statistics for ratings distribution
     * @param {Array} reviews - Array of review objects with rating property
     * @return {Object} Object containing rating stats
     */
    static generateRatingStats(reviews) {
        if (!reviews || !reviews.length) {
            return {
                average: 0,
                total: 0,
                distribution: [0, 0, 0, 0, 0],
                percentages: [0, 0, 0, 0, 0]
            };
        }
        
        const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
        
        reviews.forEach(review => {
            const rating = Math.floor(review.rating || 0);
            if (rating >= 1 && rating <= 5) {
                distribution[5 - rating]++;
            }
        });
        
        const total = reviews.length;
        const average = this.calculateAverageRating(reviews);
        const percentages = distribution.map(count => Math.round((count / total) * 100));
        
        return {
            average,
            total,
            distribution,
            percentages
        };
    }
}

export default RatingHelper;
