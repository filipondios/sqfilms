import { Hono } from 'hono'
import { ToseeInputSchema } from '../schemas/tosee.schema'
import { 
    getToseeItems,
    getToseeItem,
    createToseeItem,
    deleteToseeItem
} from '../services/tosee.service'
import { NotFoundError } from '../errors'

export const toseeRoutes = new Hono()
toseeRoutes.get('/', (c) => {
    return c.json(getToseeItems({
        title: c.req.query('title'),
        mediaFilter: c.req.query('media_filter') as any,
    }))
})

toseeRoutes.get('/:id', (c) => {
    const id = Number(c.req.param('id'))
    const item = getToseeItem(id)
    if (!item) throw new NotFoundError('Tosee item', id)
    return c.json(item)
})

toseeRoutes.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = ToseeInputSchema.safeParse(body)
    if (!parsed.success) 
        return c.json({ error: parsed.error.flatten() }, 400)

    const item = await createToseeItem({
        title: parsed.data.title,
        mediaType: parsed.data.media_type,
        imdbLink: parsed.data.imdb_link,
        seasons: parsed.data.seasons,
    })
    return c.json(item, 201)
})

toseeRoutes.delete('/:id', (c) => {
    deleteToseeItem(Number(c.req.param('id')))
    return c.json({ success: 'To-see item deleted successfully' })
})