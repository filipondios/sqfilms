import { getTmdbApiKey } from '../config'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'
const TMDB_FIND_URL = 'https://api.themoviedb.org/3/find'
const REQUEST_TIMEOUT_MS = 5000

export interface TmdbLookupResult {
  posterUrl: string | null
  tmdbId: number | null
  mediaType: 'movie' | 'tv' | null
}

const EMPTY_LOOKUP: TmdbLookupResult = { 
    posterUrl: null, tmdbId: null, mediaType: null }

export function normalizeImdbLink(imdbLink: string | null | undefined): string | null {
    if (!imdbLink) return null
    const value = imdbLink.trim()
    if (!value) return null

    const match = value.match(/tt(\d{6,9})/i)
    if (match) return match[1]

    const digits = value.match(/(\d{6,9})/)
    return digits ? digits[1] : null
}

export function buildImdbUrl(imdbLink: string | null | undefined): string | null {
    const imdbId = normalizeImdbLink(imdbLink)
    return imdbId ? `https://www.imdb.com/title/tt${imdbId}` : null
}

export function extractImdbId(imdbLink: string | null | undefined): string | null {
    const imdbId = normalizeImdbLink(imdbLink)
    return imdbId ? `tt${imdbId}` : null
}

export function normalizePosterUrl(posterUrl: string | null | undefined): string | null {
    if (!posterUrl) return null
    const value = posterUrl.trim()
    if (!value) return null

    const match = value.match(/https:\/\/image\.tmdb\.org\/t\/p\/[^/]+\/(.+)/)
    if (match) {
        let path = match[1].replace(/^\/+/, '')
        if (path.includes('.')) path = path.slice(0, path.lastIndexOf('.'))
        return path
    }

    let v = value.startsWith('/') ? value.slice(1) : value
    if (v.includes('.')) v = v.slice(0, v.lastIndexOf('.'))
    return v
}

export function buildPosterUrl(posterUrl: string | null | undefined): string | null {
    if (!posterUrl) return null
    const value = posterUrl.trim()
    if (!value) return null

    if (value.startsWith('http://') 
        || value.startsWith('https://')) 
        return value

    const normalized = normalizePosterUrl(value)
    if (!normalized) return null

    const withExt = normalized.includes('.') ? normalized : `${normalized}.jpg`
    return `${TMDB_IMAGE_BASE}/${withExt.replace(/^\/+/, '')}`
}

export async function lookupTmdbInfo(imdbLink: string | null | undefined):
    Promise<TmdbLookupResult> {
    const tmdbKey = getTmdbApiKey()
    if (!tmdbKey) return EMPTY_LOOKUP

    const imdbId = extractImdbId(imdbLink)
    if (!imdbId) return EMPTY_LOOKUP

    const url = new URL(`${TMDB_FIND_URL}/${imdbId}`)
    url.searchParams.set('api_key', tmdbKey)
    url.searchParams.set('external_source', 'imdb_id')

    try {
        const response = await fetch(url, 
            { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
        if (!response.ok) {
            console.error(`[!] TMDb lookup failed for ${imdbId}: HTTP ${response.status}`)
            return EMPTY_LOOKUP
        }

        const data = await response.json()
        const resultsByType: Array<[key: 'movie_results' | 
            'tv_results', mediaType: 'movie' | 'tv']> = [
            ['movie_results', 'movie'], ['tv_results', 'tv'],
        ]

        for (const [key, mediaType] of resultsByType) {
            const first = (data[key] ?? [])[0]
            if (first) {
                return { posterUrl: first.poster_path ? 
                    `${TMDB_IMAGE_BASE}${first.poster_path}` : null,
                    tmdbId: first.id ?? null, mediaType }
            }
        }
        return EMPTY_LOOKUP
    } catch (e) {
        console.error(`[!] TMDb request failed for ${imdbId}:`, e)
        return EMPTY_LOOKUP
    }
}


