import Texture from '@/render/textures/Texture'
import EventMixin from '@/utils/EventMixin'

export default abstract class ImageTexture<T> extends Texture {
    id: T
    image: HTMLImageElement
    loaded: boolean = false
    errored: boolean = false
    private loadingPromise: Promise<ImageTexture<T> | undefined> | undefined = undefined

    /* Cache of the last uploaded image state to avoid redundant GPU uploads */
    private lastCurrentSrc?: string;

    private readonly loadHandlers = new EventMixin<() => void>()
    private readonly errorHandlers = new EventMixin<() => void>()

    constructor(gl: WebGL2RenderingContext, id: T) {
        super(gl)

        this.id = id;
        this.image = new Image()
    }

    load(): Promise<ImageTexture<T> | undefined> {
        if (this.loadingPromise) {
            return this.loadingPromise
        }

        this.loaded = false
        this.errored = false

        this.loadingPromise = new Promise<ImageTexture<T> | undefined>((resolve, reject) => {
            this.image.onload = () => {
                console.debug('[TEX] Loaded', this.url)
                this.loaded = true
                this.loadingPromise = undefined
                this.width = this.image.naturalWidth
                this.height = this.image.naturalHeight
                resolve(this)
                this.loadHandlers.emit()
            }
            this.image.onerror = async (e) => {
                console.error('[TEX] Failed to load', e)
                this.errored = true
                this.loadingPromise = undefined

                /* Fetch to get the actual status code */
                try {
                    reject(await fetch(this.url))
                } catch (e) {
                    reject(e)
                }

                this.errorHandlers.emit()
            }
        });

        console.debug('[TEX] Loading', this.url)
        this.image.src = this.url

        return this.loadingPromise
    }

    onLoad(cb: () => void): void {
        this.loadHandlers.add(cb)
    }

    onError(cb: () => void): void {
        this.errorHandlers.add(cb)
    }

    /**
     * Uploads a 2D texture to the GPU for rendering. This method binds the texture to the active texture unit,
     * checks if the image content has changed, and uploads the updated image data to the GPU if necessary.
     *
     * @param {GLenum} activeTextureUnit - The active WebGL texture unit where the texture should be bound.
     */
    texImage2D(activeTextureUnit: GLenum) {
        const gl = this.gl

        /* Skip if the image is not loaded yet */
        if (!this.loaded) {
            return
        }

        /* Always bind so the correct unit/handle is active for rendering */
        this.bind(activeTextureUnit)

        /**
         * Only upload to GPU if the image content changed. We consider it changed when:
         * - The HTMLImageElement instance differs, OR
         * - The element's currentSrc changed (same element, new URL/content)
         */
        if (this.lastCurrentSrc !== this.image.currentSrc) {
            this.setParameters()
            console.debug('[TEX] uploading', this.image.currentSrc)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image)

            // Update cache
            this.lastCurrentSrc = this.image.currentSrc
        }
    }

    override delete() {
        super.delete()

        /* Reset cache */
        this.lastCurrentSrc = undefined
        this.image.src = ''
    }

    abstract get url(): string
}
