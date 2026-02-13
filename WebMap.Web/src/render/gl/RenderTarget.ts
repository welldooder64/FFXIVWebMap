import Framebuffer from '@/render/gl/Framebuffer'
import type Texture from '@/render/textures/Texture'

export default class RenderTarget {
    private readonly gl: WebGL2RenderingContext
    private readonly fbo: Framebuffer

    private _width = 0
    private _height = 0

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        this.fbo = new Framebuffer(gl)
    }

    get width() { return this._width }
    get height() { return this._height }
    get texture(): Texture | null { return this.fbo.texture }

    begin(width: number, height: number, clear = true) {
        this._width = width
        this._height = height

        this.fbo.resizeTargets(width, height)
        this.fbo.bind()

        if (clear) this.fbo.clear()

        this.gl.viewport(0, 0, width, height)
    }

    end(): Texture | undefined {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)

        if (this.fbo.texture)
            return this.fbo.texture
    }

    use(width: number, height: number, callback: (renderTarget: RenderTarget) => void): Texture | undefined {
        this.begin(width, height)
        callback(this)
        return this.end()
    }
}
