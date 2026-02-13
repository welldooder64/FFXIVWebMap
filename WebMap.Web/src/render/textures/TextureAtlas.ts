import ImageTexture, { type ImageTextureOptions } from '@/render/textures/ImageTexture';
import type { Rectangle } from '@/types/math';

export default class TextureAtlas<K extends string | number | symbol = string, T = string> extends ImageTexture<T> {
    private definition?: Record<K, Rectangle>


    constructor(gl: WebGL2RenderingContext, id: T, definition?: Record<K, Rectangle>, options: ImageTextureOptions = {}) {
        super(gl, id, options)
        this.definition = definition
    }

    async load(): Promise<ImageTexture<T> | undefined> {
        const imagePromise = super.load()

        /* If the definition is already loaded or manually set, we can return early */
        if (this.definition) {
            return imagePromise
        }

        const definitionPromise = fetch(this.getUrl(false,'json')).then(async res => {
            this.definition = await res.json() as Record<K, Rectangle>
        })

        const results = await Promise.allSettled([imagePromise, definitionPromise])
        if (results[0].status === 'fulfilled') {
            return this;
        }
    }

    get(key: K): Rectangle | undefined {
        if (!this.definition)
            throw new Error('TextureAtlas definition not loaded');

        const rect = this.definition[key];
        if (!rect) {
            console.warn(`TextureAtlas '${this.id}' definition does not contain key ${String(key)}`)
            return undefined
        }


        if (this.highResolution) {
            return {
                x: rect.x * 2,
                y: rect.y * 2,
                width: rect.width * 2,
                height: rect.height * 2,
            };
        }

        return rect
    }
}
