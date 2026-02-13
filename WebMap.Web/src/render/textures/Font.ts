import type { FontData } from '@/types/font'
import ImageTexture, { type ImageTextureOptions } from '@/render/textures/ImageTexture';

export default class Font {
    private readonly id: string
    readonly texture: ImageTexture<string>
    public data?: FontData

    constructor(gl: WebGL2RenderingContext, id: string) {
        this.id = id;
        this.texture = new SDFTexture(gl, id)
    }

    async load(): Promise<Font> {
        if (this.texture.loaded && this.data) {
            return Promise.resolve(this);
        }

        const imagePromise = this.texture.load()
        const definitionPromise = fetch(`/fonts/${this.id}.json`).then(async res => {
            this.data = await res.json() as FontData
        })

        const results = await Promise.allSettled([imagePromise, definitionPromise])
        const allSucceeded = results.every(r => r.status === 'fulfilled')

        if (allSucceeded) {
            return this
        }

        return Promise.reject(results.find(result => result.status !== 'fulfilled')?.reason)
    }

    isLoaded(): this is this & { data: FontData } {
        return this.data !== undefined && this.texture.loaded
    }
}

class SDFTexture extends ImageTexture<string> {
    override readonly internalFormat: GLenum = this.gl.LUMINANCE

    constructor(gl: WebGL2RenderingContext, id: string, options: ImageTextureOptions = {}) {
        super(gl, id, options);

        this.generateMipmaps = false
        this.flipY = false
    }

    override getUrl(): string {
        return `/fonts/${this.id}.png`
    }
}
