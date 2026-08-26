import { z } from 'zod'

export const ToseeInputSchema = z.object({
    title: z.string().min(1),
    media_type: z.enum(['movie', 'series']),
    imdb_link: z.string().optional().nullable(),
    seasons: z.coerce.number().int().optional().nullable(),
})