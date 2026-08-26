import { getDb } from '../db/client'
import {
    normalizeImdbLink, 
    buildImdbUrl,
    normalizePosterUrl,
    buildPosterUrl,
    fetchPosterUrl,
} from './tmdb.service'

export interface Review {
    id: number
    title: string
    note: number
    date: string
    season: number | null
    imdb_link: string | null
    poster_url: string | null
    tmdb_id: number | null
    media_type: string | null
}

export interface SerializedReview extends Review {
    imdb_url: string | null
    poster_full_url: string | null
}

export type SortBy = 'insert_oldest' | 'insert_newest'
export type TypeFilter = 'films' | 'series'

function serialize(row: Review): SerializedReview {
    return {
        ...row,
        imdb_link: normalizeImdbLink(row.imdb_link),
        imdb_url: buildImdbUrl(row.imdb_link),
        poster_url: normalizePosterUrl(row.poster_url),
        poster_full_url: buildPosterUrl(row.poster_url),
    }
}

export function getReviews(opts: {title?: string | null, sortBy?: SortBy | null, 
    typeFilter?: TypeFilter | null }): SerializedReview[] {
    const db = getDb()
    
    const orderClause = {
        oldest: 'ORDER BY date ASC',
        newest: 'ORDER BY date DESC',
        insert_oldest: 'ORDER BY id ASC',
        insert_newest: 'ORDER BY id DESC',
    }[opts.sortBy ?? 'insert_newest'] ?? 'ORDER BY id DESC'
    const clauses: string[] = []
    const params: (string | number)[] = []

    if (opts.typeFilter === 'films') clauses.push('season IS NULL')
    else if (opts.typeFilter === 'series') clauses.push('season IS NOT NULL')

    if (opts.title) {
        clauses.push('title LIKE ? COLLATE NOCASE')
        params.push(`%${opts.title}%`)
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const sql = `SELECT * FROM review ${whereClause} ${orderClause}`
    const rows = db.query(sql).all(...params) as Review[]
    return rows.map(serialize)
}

export async function createReview(payload: { title: string, note: number,
    imdbLink?: string | null, date?: string | null, season?: number | null
    }): Promise<SerializedReview> {
    
    const db = getDb()
    const dateStr = payload.date ?? new Date().toISOString().slice(0, 10)
    const compactImdbId = normalizeImdbLink(payload.imdbLink)
    const posterUrl = await fetchPosterUrl(payload.imdbLink)
    const compactPosterUrl = normalizePosterUrl(posterUrl)

    const result = db.query(
        `INSERT INTO review (title, note, date, season, imdb_link, poster_url)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).get(payload.title, payload.note, dateStr, payload.season ?? null, compactImdbId, compactPosterUrl) as Review
    return serialize(result)
}

export function deleteReview(id: number): void {
    getDb().run('DELETE FROM review WHERE id = ?', [id])
}