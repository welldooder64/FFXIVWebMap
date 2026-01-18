import type ImageTexture from '@/render/textures/ImageTexture'

/**
 * A generic texture caching class that creates and manages instances of textures.
 * It ensures that textures are reused if they are already created, avoiding duplication.
 *
 * Cache keys are created by combining the texture identifier and constructor arguments
 * into a single string, separated by colons (e.g., "textureId:arg1:arg2").
 *
 * @template T - The type of the texture class that extends `ImageTexture`.
 * @template U - The type representing the texture identifier (e.g., a URL or unique key).
 * @template Args - The type of the additional arguments passed to the texture class constructor.
 */
export default class TextureCache<T extends ImageTexture<U>, U, Args extends any[] = []> {
    private readonly imageTextureClass: new (gl: WebGL2RenderingContext, id: U, ...args: Args) => T
    private readonly cache = new Map<string, T>()

    constructor(imageTextureClass: new (gl: WebGL2RenderingContext, id: U, ...args: Args) => T) {
        this.imageTextureClass = imageTextureClass
    }

    getOrCreate(gl: WebGL2RenderingContext, id: U, ...args: [...Args, (() => void)?]): T {
        /* Extract onLoad callback if present (last argument if it's a function) */
        const lastArg = args[args.length - 1]
        const onLoad = typeof lastArg === 'function' ? lastArg as () => void : undefined
        const constructorArgs = (typeof lastArg === 'function' ? args.slice(0, -1) : args) as Args
        const cacheKey = this.getCacheKey(id, constructorArgs)

        // console.debug('[TEX] Attempting to read from', this.imageTextureClass.name, 'cache with key:', cacheKey)

        const cachedEntry = this.cache.get(cacheKey)
        if (cachedEntry) {
            // console.debug('[TEX]', 'Cache hit!', this.imageTextureClass.name, cacheKey)
            return cachedEntry
        }

        // console.debug('[TEX]', 'Creating new', this.imageTextureClass.name, 'instance for', id, 'with args:', constructorArgs)

        const imageTexture = new this.imageTextureClass(gl, id, ...constructorArgs)
        this.cache.set(cacheKey, imageTexture)

        if (onLoad) {
            imageTexture.onLoad(onLoad)
        }

        void imageTexture.load()

        return imageTexture
    }

    private getCacheKey(id: U, args: Args): string {
        return `${String(id)}:${args.map(arg => String(arg)).join(':')}`
    }
}
