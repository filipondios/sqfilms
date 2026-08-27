import type { FC, PropsWithChildren } from 'hono/jsx'

export const Layout: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => {
    return (
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>{title}</title>
            <link rel="stylesheet" href="/static/css/common.css" />
            <link rel="stylesheet" href="/static/css/index.css" />
            <link rel="icon" href="/static/img/icon.svg" type="image/svg+xml" />
            <script src="/static/vendor/htmx.min.js" defer></script>
        </head>
        <body>{children}</body>
        </html>
    )
}