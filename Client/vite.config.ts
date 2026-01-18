import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
    ],
    server: {
        proxy: {
            '/resources': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                configure: (proxy) => {
                    // Gracefully handle bad upstream responses (e.g., HEAD not supported),
                    // returning a 404 instead of crashing with a parse error.
                    proxy.on('error', (_err, _req, res) => {
                        try {
                            const r: any = res
                            if (r && !r.headersSent) {
                                r.writeHead?.(404, { 'Content-Type': 'text/plain' })
                            }
                            r?.end?.('Not found')
                        } catch {
                            // ignore
                        }
                    })
                },
            },
        },
    },
})
