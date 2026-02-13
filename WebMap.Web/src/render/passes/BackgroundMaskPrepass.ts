import Texture from '@/render/textures/Texture'
import Quad from '@/render/gl/Quad'
import BlurProgram from '@/render/programs/BlurProgram'
import MaskComposeProgram from '@/render/programs/MaskProgram'
import type MapTexture from '@/render/textures/MapTexture'
import Framebuffer from '@/render/gl/Framebuffer'

export default class BackgroundMaskPrepass {
    private readonly gl: WebGL2RenderingContext
    private readonly quad: Quad

    private maskCompose: MaskComposeProgram
    private blur: BlurProgram

    private readonly fboA: Framebuffer
    private readonly fboB: Framebuffer

    constructor(gl: WebGL2RenderingContext, quad: Quad) {
        this.gl = gl
        this.quad = quad

        this.maskCompose = new MaskComposeProgram(gl)
        this.blur = new BlurProgram(gl)

        this.fboA = new Framebuffer(gl)
        this.fboB = new Framebuffer(gl)
    }

    draw(maskTexture: MapTexture, discoveryMask: number): Texture | undefined {
        const gl = this.gl

        this.fboA.resizeTargets(maskTexture.width, maskTexture.height)
        this.fboB.resizeTargets(maskTexture.width, maskTexture.height)

        /* Ensure quad covers the full FBO resolution (0,0 to width,height) */
        this.quad.setQuad(0, 0, maskTexture.width, maskTexture.height)

        /* Compose mask into FBO A */
        this.fboA.bind()
        gl.viewport(0, 0, maskTexture.width, maskTexture.height)
        this.maskCompose.use()

        maskTexture.texImage2D(gl.TEXTURE0)
        gl.uniform1i(this.maskCompose.uniformSampler, 0)
        gl.uniform2f(this.maskCompose.uniformResolution, maskTexture.width, maskTexture.height)
        gl.uniform1i(this.maskCompose.uniformDiscoveryMask, discoveryMask)

        this.quad.bindAttribs(this.maskCompose.attribPosition, this.maskCompose.attribTexCoord)
        this.quad.draw()

        /* Horizontal blur into FBO B */
        this.fboB.bind()
        gl.viewport(0, 0, maskTexture.width, maskTexture.height)
        this.blur.use()

        this.fboA.texture?.bind(gl.TEXTURE0)
        gl.uniform1i(this.blur.uniformInput, 0)
        gl.uniform2f(this.blur.uniformResolution, maskTexture.width, maskTexture.height)
        gl.uniform2f(this.blur.uniformTexelStep, 2 / maskTexture.width, 0)

        this.quad.bindAttribs(this.maskCompose.attribPosition, this.maskCompose.attribTexCoord)
        this.quad.draw()

        /* Vertical blur into FBO A */
        this.fboA.bind()
        gl.viewport(0, 0, maskTexture.width, maskTexture.height)
        this.blur!.use()

        this.fboB.texture?.bind(gl.TEXTURE0)
        gl.uniform1i(this.blur.uniformInput, 0)
        gl.uniform2f(this.blur.uniformResolution, maskTexture.width, maskTexture.height)
        gl.uniform2f(this.blur.uniformTexelStep, 0, 2 / maskTexture.height)

        this.quad.bindAttribs(this.blur.attribPosition, this.blur.attribTexCoord)
        this.quad.draw()

        return this.fboA.texture ?? undefined
    }
}
