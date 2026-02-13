import Font from '@/render/textures/Font'

export type FontStyle = 'Regular' | 'Italic'

export default class FontFamily {
    private readonly gl: WebGL2RenderingContext
    private readonly baseName: string
    private readonly fonts: Map<FontStyle, Font> = new Map()
    private readonly styles: FontStyle[]

    loaded: boolean = false
    errored: boolean = false

    constructor(gl: WebGL2RenderingContext, baseName: string, styles: FontStyle[] = ['Regular', 'Italic']) {
        this.gl = gl
        this.baseName = baseName
        this.styles = styles
    }

    /**
     * Loads the specified font styles. Defaults to loading both Regular and Italic.
     */
    async load(): Promise<FontFamily> {
        this.loaded = false
        this.errored = false

        const loadPromises = this.styles.map(async (style) => {
            const font = new Font(this.gl, `${this.baseName}-${style}`)
            await font.load()
            this.fonts.set(style, font)
        })

        const results = await Promise.allSettled(loadPromises)
        const allSucceeded = results.every(r => r.status === 'fulfilled')

        if (allSucceeded) {
            this.loaded = true
            return this
        } else {
            this.errored = true
            const failed = results.find(r => r.status === 'rejected') as PromiseRejectedResult
            return Promise.reject(failed.reason)
        }
    }

    /**
     * Gets the font for a specific style. Falls back to Regular if the requested style isn't loaded.
     */
    get(style: FontStyle = 'Regular'): Font {
        const font = this.fonts.get(style)
        if (font) {
            return font
        }

        throw new Error(`Font style ${style} not found`)
    }
}
