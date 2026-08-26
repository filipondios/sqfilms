import { z } from 'zod'

export const ReviewInputSchema = z.object({
    title: z.string().min(1),
    note: z.coerce.number().min(0).max(10),
    imdb_link: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    season: z.coerce.number().int().optional().nullable(),
    tosee_id: z.coerce.number().int().optional().nullable(),
    delete_tosee: z.boolean().optional().default(false),
})