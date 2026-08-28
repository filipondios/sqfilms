import { Layout } from './layout'
import { ReviewCard } from './review-card'
import type { SerializedReview } from '../services/reviews.service'

export function IndexPage(props: {reviews: SerializedReview[], films: number,
    series: number, total: number, titleFilter: string, sortBy?: string | null,
    typeFilter?: string | null}) {
    const { reviews, films, series, total, titleFilter, sortBy, typeFilter } = props

    return (
        <Layout title="Film & Series Reviews">
            <div class="top-bar-shell">
            <header class="page-header">
                <div class="header-nav-left">
                    <a href="/tosee" class="header-nav-btn" title="Open to-see list">
                    <img src="/static/img/checklist.svg" alt="" class="nav-icon" />
                    <span>To See</span></a>
                </div>
                <div class="header-top"><h1>Film & Series Reviews</h1></div>
                <div class="search-bar">
                    <input type="text" name="title" 
                        placeholder="Filter by title" value={titleFilter} 
                        hx-get="/reviews-fragment" hx-trigger="input changed delay:500ms"
                        hx-target="#reviews-list" hx-include="#type-select,#sort-select"/>
                    <a href="/new" class="add-button" title="Add new review">+</a>
                </div>
            </header>
            <div id="sort-container" class={`sort-container ${reviews.length === 0 ? 'hidden' : ''}`}>
                <div class="filters-wrapper">
                    <select id="type-select" name="type_filter" hx-get="/reviews-fragment"
                        hx-target="#reviews-list" hx-include="[name='title'],#sort-select" class="filter-select">
                        <option value="all" selected={typeFilter !== 'films' 
                            && typeFilter !== 'series'}>All</option>
                        <option value="films" selected={typeFilter === 'films'}>Only Films</option>
                        <option value="series" selected={typeFilter === 'series'}>Only Series</option>
                    </select>
                    <select id="sort-select" name="sort_by" hx-get="/reviews-fragment" 
                        hx-target="#reviews-list" hx-include="[name='title'],#type-select" class="filter-select">
                        <option value="insert_oldest" 
                            selected={sortBy === 'insert_oldest'}>By insertion (oldest)</option>
                        <option value="insert_newest" 
                            selected={sortBy !== 'insert_oldest'}>By insertion (newest)</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="main-content">
            <ol class="reviews-grid" id="reviews-list">
                {reviews.length === 0 ? (
                <div class="empty-state">
                    <img src="/static/img/warning.svg" aria-hidden="true" class="empty-icon" />
                    <p class="no-results">No reviews found</p>
                </div>
                ) : (reviews.map((r) => <ReviewCard r={r} />))}
            </ol>
        </div>
        <footer class="results-summary">
            <p>{films} Films, {series} Series - {total} Reviews total</p>
        </footer>
    </Layout>
    )
}