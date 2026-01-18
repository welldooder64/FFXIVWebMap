import Quad from '@/render/gl/Quad'
import Texture from '@/render/textures/Texture'
import type Viewport from '@/render/Viewport';
import type { CoordinateSpace, Dimension, DrawRect } from '@/types/math'
import CompositorProgram from '@/render/passes/compositor/CompositorProgram'

export default class CompositorPass {
    private readonly gl: WebGL2RenderingContext;
    private readonly quad: Quad;

    private readonly program: CompositorProgram

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.quad = new Quad(this.gl);

        this.program = new CompositorProgram(this.gl)
    }

    draw(viewport: Viewport, texture: Texture, coordinateSpace: CoordinateSpace) {
        switch (coordinateSpace) {
            case 'map':
                this.drawToScreen(texture, viewport.getMapDrawRect(), viewport.getScreenSize())
                break;
            case 'screen':
                this.drawToScreen(texture, viewport.getScreenDrawRect(), viewport.getScreenSize())
                break;
        }
    }

    private drawToScreen(texture: Texture, drawRect: DrawRect, screenSize: Dimension) {
        const gl = this.gl

        this.program.use()

        this.quad.setQuad(drawRect.dx, drawRect.dy, drawRect.width, drawRect.height)
        this.quad.bindAttribs(this.program.attribPosition, this.program.attribTexCoord)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, screenSize.width, screenSize.height)

        texture.bind(gl.TEXTURE0)
        gl.uniform1i(this.program.uniformSampler, 0)
        gl.uniform2f(this.program.uniformResolution, screenSize.width, screenSize.height)

        this.quad.draw()
    }
}
