import { Hono } from 'hono'
import { reviewsRoutes } from './src/routes/reviews.routes'
import { initDb } from './src/db/client'
import { NotFoundError, ValidationError } from './src/errors'
import { toseeRoutes } from './src/routes/tosee.routes'

initDb(process.env.DB_PATH ?? './dev.db')
const app = new Hono()
app.route('/api/reviews', reviewsRoutes)
app.route('/api/tosee', toseeRoutes)

app.onError((err, c) => {
    console.error(err)
    if (err instanceof NotFoundError) 
        return c.json({ error: err.message }, 404)
    if (err instanceof ValidationError) 
        return c.json({ error: err.message }, 400)
    return c.json({ error: 'Internal server error' }, 500)
})

export default app