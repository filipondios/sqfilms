const TMDB_API_KEY = process.env.TMDB_API_KEY

export function getTmdbApiKey(): string | undefined 
    { return TMDB_API_KEY }

export const config = {
    dbPath: process.env.DB_PATH ?? './data/reviews.db',
    port: Number(process.env.PORT ?? 3000),
}