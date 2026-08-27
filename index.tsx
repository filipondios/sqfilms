import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { reviewsRoutes } from './src/routes/reviews.routes'
import { initDb } from './src/db/client'
import { NotFoundError, ValidationError } from './src/errors'
import { toseeRoutes } from './src/routes/tosee.routes'

import { getReviews } from './src/services/reviews.service'
import { IndexPage } from './src/views/index.page'
import { ReviewsFragment } from './src/views/reviews-fragment.page'

initDb(process.env.DB_PATH ?? './dev.db')
const app = new Hono()
app.route('/api/reviews', reviewsRoutes)
app.route('/api/tosee', toseeRoutes)
app.use('/static/*', serveStatic({ root: './public' }))

app.onError((err, c) => {
    console.error(err)
    if (err instanceof NotFoundError) 
        return c.json({ error: err.message }, 404)
    if (err instanceof ValidationError) 
        return c.json({ error: err.message }, 400)
    return c.json({ error: 'Internal server error' }, 500)
})

function readListParams(c: any) {
    return {
        title: c.req.query('title'),
        sortBy: c.req.query('sort_by'),
        typeFilter: c.req.query('type_filter'),
    }
}

app.get('/', (c) => {
    const params = readListParams(c)
    const reviews = getReviews(params)
    const series = reviews.filter((r) => r.season !== null).length

    return c.html(
        <IndexPage reviews={reviews} films={reviews.length - series} series={series}
            total={reviews.length} titleFilter={params.title ?? ''}
            sortBy={params.sortBy} typeFilter={params.typeFilter} />
    )
})

app.get('/reviews-fragment', (c) => {
    const reviews = getReviews(readListParams(c))
    return c.html(<ReviewsFragment reviews={reviews} />)
})

export default app