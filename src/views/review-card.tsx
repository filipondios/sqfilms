// src/views/review-card.tsx
import type { SerializedReview } from '../services/reviews.service'

export function ReviewCard({ r }: { r: SerializedReview }) {
  const posterSrc = r.poster_full_url ?? r.poster_url ?? '/static/img/poster-placeholder.svg'

  return (
    <li class="review-card">
      <div class="poster-wrap">
        {r.imdb_link ? (
          <a class="poster-link" href={r.imdb_url ?? undefined} target="_blank" rel="noopener noreferrer"
             aria-label={`Open IMDb for ${r.title}`}>
            <img class="poster" src={posterSrc} alt={`Poster of ${r.title}`} loading="lazy" />
          </a>
        ) : (
          <img class="poster" src={posterSrc} alt={`Poster of ${r.title}`} loading="lazy" />
        )}
        <div class="poster-top-left">
          {r.season === null ? (
            <span class="tag film overlay-tag">Film</span>
          ) : (
            <div class="overlay-group series-stack">
              <span class="tag series overlay-tag">Series</span>
              <span class="tag season overlay-tag season-inline">Season {r.season}</span>
            </div>
          )}
        </div>
        <span class="rating-badge">
          {r.note}
          <img src="/static/img/star.svg" alt="" class="star" />
        </span>
      </div>
      <div class="card-body">
        <h3 class="review-title">{r.title}</h3>
        <div class="review-meta">
          <span class="date">
            <img src="/static/img/calendar.svg" alt="Date icon" class="icon-date" />
            {r.date ?? '-/-/-'}
          </span>
        </div>
        <div class="review-actions">
          <a href={`/edit/${r.id}`} class="btn-action edit-btn" title="Edit">Edit</a>
          <button
            class="btn-action delete-btn"
            title="Delete"
            hx-post={`/reviews/${r.id}/delete`}
            hx-confirm="¿Estás seguro de que deseas eliminar esta reseña?"
            hx-target="closest li"
            hx-swap="outerHTML"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}