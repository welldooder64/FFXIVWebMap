import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        glsl(),
    ],
    assetsInclude: ['**/*.json'],
    build: {
        rolldownOptions: {
            output: {
                minify: {
                    compress: {
                        dropConsole: true,
                        dropDebugger: true
                    }
                }
            }
        }
    },
    server: {
        proxy: {
            '/resources': {
                target: 'http://localhost:6335',
                changeOrigin: true,
                configure: (proxy) => {
                    // Gracefully handle bad upstream responses (e.g., HEAD not supported),
                    // returning a 404 instead of crashing with a parse error.
                    // @ts-ignore
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
            '/ws': {
                target: 'ws://localhost:6335',
                ws: true,
            },
        },
    },
})
