import { Hono } from 'hono'
import { ReviewInputSchema } from '../schemas/review.schema'
import { getDb } from '../db/client'
import { 
    getReviews, 
    createReview, 
    deleteReview 
} from '../services/reviews.service'

export const reviewsRoutes = new Hono()
reviewsRoutes.get('/', (c) => {
    return c.json(getReviews({
        title: c.req.query('title'),
        sortBy: c.req.query('sort_by') as any,
        typeFilter: c.req.query('type_filter') as any,
    }))
})

reviewsRoutes.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = ReviewInputSchema.safeParse(body)
    if (!parsed.success) {
        return c.json({ error: parsed.error.flatten() }, 400)
    }

    const review = await createReview({
        title: parsed.data.title,
        note: parsed.data.note,
        imdbLink: parsed.data.imdb_link,
        date: parsed.data.date,
        season: parsed.data.season,
    })

    if (parsed.data.delete_tosee && parsed.data.tosee_id) {
        getDb().run('DELETE FROM tosee WHERE id = ?', [parsed.data.tosee_id])
    }
    return c.json(review, 201)
})

reviewsRoutes.delete('/:id', (c) => {
    const id = Number(c.req.param('id'))
    deleteReview(id)
    return c.json({ success: 'Review deleted successfully' })
})