import { getTmdbApiKey } from '../config'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'
const TMDB_FIND_URL = 'https://api.themoviedb.org/3/find'
const REQUEST_TIMEOUT_MS = 5000


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

export async function fetchPosterUrl(imdbLink: string | null | undefined): Promise<string | null> {
    const tmdbKey = getTmdbApiKey()
    if (!tmdbKey) return null

    const imdbId = extractImdbId(imdbLink)
    if (!imdbId) return null

    const url = new URL(`${TMDB_FIND_URL}/${imdbId}`)
    url.searchParams.set('api_key', tmdbKey)
    url.searchParams.set('external_source', 'imdb_id')

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })

        if (!response.ok) {
            console.error(`[!] TMDb lookup failed for ${imdbId}: HTTP ${response.status}`)
            return null
        }

        const data = await response.json()
        for (const key of ['movie_results', 'tv_results'] as const) {
            const results = data[key] ?? []
            if (results.length > 0 && results[0].poster_path) {
                return `${TMDB_IMAGE_BASE}${results[0].poster_path}`
            }
        }
        return null
    } catch (e) {
        console.error(`[!] TMDb request failed for ${imdbId}:`, e)
        return null
    }
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