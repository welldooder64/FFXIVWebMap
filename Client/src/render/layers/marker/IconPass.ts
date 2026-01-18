import Texture from '@/render/textures/Texture'
import Quad from '@/render/gl/Quad'
import { ICON_SCALE } from '@/constants'
import type { MapMarker } from '@/types/map'
import type Viewport from '@/render/Viewport'
import MarkerProgram from '@/render/layers/marker/MarkerProgram'

export default class IconPass {
    private readonly gl: WebGL2RenderingContext;
    private readonly quad: Quad;

    private program: MarkerProgram

    private fbTex: Texture | null = null
    private fbo: WebGLFramebuffer | null = null

    constructor(gl: WebGL2RenderingContext, quad: Quad) {
        this.gl = gl;
        this.quad = quad;

        this.program = new MarkerProgram(this.gl)
    }

    draw(viewport: Viewport, texture: Texture, marker: MapMarker, width: number, height: number) {
        const gl = this.gl

        if (!this.fbo || !this.fbTex || this.fbTex.width !== width || this.fbTex.height !== height) {
            this.resizeTargets(width, height)
        }

        this.program.use()

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, width, height)

        /* 1. Calculate the 'Base Fit' constants once per frame/marker-set */
        const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()
        const { x: cx, y: cy } = viewport.getCenter()
        const mapScale = viewport.getScale()
        const scale = ICON_SCALE * 0.5

        /* 2. Set Uniforms for GPU Projection */
        gl.uniform2f(this.program.uniformResolution, screenWidth, screenHeight)
        gl.uniform2f(this.program.uniformMapOrigin, cx, cy)
        gl.uniform1f(this.program.uniformMapScale, mapScale)
        gl.uniform2f(this.program.uniformMarkerPos, marker.x, marker.y)
        gl.uniform2f(this.program.uniformIconSize, texture.width * scale, texture.height * scale)

        /* 3. Standard Texture Binding */
        texture.bind(gl.TEXTURE0)
        gl.uniform1i(this.program.uniformSampler, 0)

        /* 4. Draw a normalized 0..1 quad; the shader handles position and size */
        this.quad.setQuad(0, 0, 1, 1)
        this.quad.bindAttribs(this.program.attribPosition, this.program.attribTexCoord)
        this.quad.draw()

        return this.fbTex!
    }

    private resizeTargets(width: number, height: number) {
        this.destroyTargets()

        this.fbTex = Texture.empty(this.gl, width, height)
        this.fbo = this.createFramebuffer(this.fbTex)
    }

    private createFramebuffer(tex: Texture): WebGLFramebuffer {
        const gl = this.gl
        const fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.texture, 0)
        return fbo
    }

    private destroyTargets() {
        const gl = this.gl
        if (this.fbo) gl.deleteFramebuffer(this.fbo)
        if (this.fbTex) this.fbTex.delete()
        this.fbo = null
        this.fbTex = null
    }
}
