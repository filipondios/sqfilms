import { getDb } from '../db/client'
import { NotFoundError, ValidationError } from '../errors'
import { 
    normalizeImdbLink,
    buildImdbUrl,
    normalizePosterUrl,
    buildPosterUrl,
    lookupTmdbInfo
} from './tmdb.service'

export interface ToseeItem {
    id: number
    title: string
    media_type: 'movie' | 'series'
    imdb_link: string | null
    seasons: number | null
    poster_url: string | null
}

export interface SerializedToseeItem extends ToseeItem {
    imdb_url: string | null
    poster_full_url: string | null
}

function serialize(row: ToseeItem): SerializedToseeItem {
    return {
        ...row,
        imdb_link: normalizeImdbLink(row.imdb_link),
        imdb_url: buildImdbUrl(row.imdb_link),
        poster_url: normalizePosterUrl(row.poster_url),
        poster_full_url: buildPosterUrl(row.poster_url),
    }
}

export function getToseeItems(opts: {title?: string | null,
    mediaFilter?: 'movies' | 'series' | null}): SerializedToseeItem[] {
    const db = getDb()
    const clauses: string[] = []
    const params: (string | number)[] = []

    if (opts.mediaFilter === 'movies') { 
        clauses.push('media_type = ?')
        params.push('movie') 
    
    } else if (opts.mediaFilter === 'series') {
        clauses.push('media_type = ?')
        params.push('series') 
    }

    if (opts.title) {
        clauses.push('title LIKE ? COLLATE NOCASE')
        params.push(`%${opts.title}%`) 
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = db.query(`SELECT * FROM tosee ${whereClause} ORDER BY id DESC`)
        .all(...params) as ToseeItem[]
    return rows.map(serialize)
}

export function getToseeItem(id: number): SerializedToseeItem | null {
    const row = getDb().query('SELECT * FROM tosee WHERE id = ?')
        .get(id) as ToseeItem | null
    return row ? serialize(row) : null
}

export async function createToseeItem(payload: {title: string, mediaType: 'movie' | 'series',
    imdbLink?: string | null, seasons?: number | null}): Promise<SerializedToseeItem> {
    const db = getDb()
    const compactImdbId = normalizeImdbLink(payload.imdbLink)
    const tmdbInfo = await lookupTmdbInfo(payload.imdbLink)
    const compactPosterUrl = normalizePosterUrl(tmdbInfo.posterUrl)

    const result = db.query(
        `INSERT INTO tosee (title, media_type, imdb_link, seasons, poster_url)
        VALUES (?, ?, ?, ?, ?) RETURNING *`
    ).get(payload.title, payload.mediaType, compactImdbId, 
        payload.seasons ?? null, compactPosterUrl) as ToseeItem
    return serialize(result)
}

export function deleteToseeItem(id: number): void {
    getDb().run('DELETE FROM tosee WHERE id = ?', [id])
}