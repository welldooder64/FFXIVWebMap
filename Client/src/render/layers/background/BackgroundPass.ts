import Quad from '@/render/gl/Quad'
import Framebuffer from '@/render/gl/Framebuffer'
import Texture from '@/render/textures/Texture'
import BackgroundProgram from '@/render/layers/background/BackgroundProgram'
import type MapTexture from '@/render/textures/MapTexture'

export default class BackgroundPass {
    private readonly gl: WebGL2RenderingContext;
    private readonly quad: Quad;

    private readonly program: BackgroundProgram
    private readonly fbo: Framebuffer

    constructor(gl: WebGL2RenderingContext, quad: Quad) {
        this.gl = gl
        this.quad = quad

        this.program = new BackgroundProgram(gl)
        this.fbo = new Framebuffer(gl)
    }

    draw(foreground: MapTexture, background?: MapTexture, mask?: Texture): Texture | undefined {
        const gl = this.gl
        const { width, height } = foreground


        this.program.use()
        this.fbo.resizeTargets(width, height)
        this.fbo.bind()

        gl.viewport(0, 0, width, height)
        this.quad.setQuad(0, 0, width, height)
        this.quad.bindAttribs(this.program.attribPosition, this.program.attribTexCoord)


        foreground.texImage2D(gl.TEXTURE0)
        gl.uniform1i(this.program.uniformForegroundSampler, 0)

        if (background) {
            background.texImage2D(gl.TEXTURE1)
            gl.uniform1i(this.program.uniformBackgroundSampler, 1)
        }

        if (mask) {
            mask.bind(gl.TEXTURE2)
            gl.uniform1i(this.program.uniformMaskSampler, 2)
        }

        gl.uniform2f(this.program.uniformResolution, width, height)
        gl.uniform1i(this.program.uniformUseBackground, background ? 1 : 0)
        gl.uniform1i(this.program.uniformUseMask, mask ? 1 : 0)

        this.quad.draw()

        return this.fbo.texture ?? undefined
    }
}
