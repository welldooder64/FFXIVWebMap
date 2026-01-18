import Texture from '@/render/textures/Texture'

export default class Framebuffer {
    private readonly gl: WebGL2RenderingContext

    private _texture: Texture | null = null
    private fbo: WebGLFramebuffer | null = null

    constructor(gl: WebGL2RenderingContext, width?: number, height?: number) {
        this.gl = gl

        if (width && height) {
            this.resizeTargets(width, height)
        }
    }

    public get texture(): Texture | null {
        return this._texture;
    }

    private set texture(value: Texture | null) {
        this._texture = value;
    }

    /**
     * Resizes the rendering targets by updating the texture and framebuffer objects.
     * If the current texture dimensions match the provided width and height, no changes are made.
     *
     * @param {number} width - The new width for the texture.
     * @param {number} height - The new height for the texture.
     */
    resizeTargets(width: number, height: number) {
        if (this.fbo && this.texture && this.texture.width === width && this.texture.height === height) {
            return
        }

        this.destroyTargets()

        this.texture = Texture.empty(this.gl, width, height)
        this.fbo = this.createFramebuffer(this.texture)
    }

    bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo)
    }

    private createFramebuffer(tex: Texture): WebGLFramebuffer {
        const gl = this.gl
        const fbo = gl.createFramebuffer()

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.texture, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        return fbo
    }

    private destroyTargets() {
        if (this.fbo) {
            this.gl.deleteFramebuffer(this.fbo)
        }

        if (this.texture) {
            this.texture.delete()
        }

        this.fbo = null
        this.texture = null
    }
}
