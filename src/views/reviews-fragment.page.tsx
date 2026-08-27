import type { SerializedReview } from '../services/reviews.service'
import { ReviewCard } from './review-card'

export function ReviewsFragment({ reviews }: { reviews: SerializedReview[] }) {
    if (reviews.length === 0) {
        return (
            <div class="empty-state">
            <img src="/static/img/warning.svg" aria-hidden="true" class="empty-icon"/>
            <p class="no-results">No reviews found</p>
            </div>
        )
    }
    return <>{reviews.map((r) => <ReviewCard r={r} />)}</>
}