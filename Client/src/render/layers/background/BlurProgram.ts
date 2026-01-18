import Program from '@/render/gl/Program'

import vertSrc from '@/render/shaders/default.vert?raw'
import fragSrc from '@/render/shaders/blur.frag?raw'

export default class BlurProgram extends Program {
    readonly attribPosition: GLint = -1
    readonly attribTexCoord: GLint = -1

    readonly uniformResolution: WebGLUniformLocation | null = null

    readonly uniformInput: WebGLUniformLocation | null = null
    readonly uniformTexelStep: WebGLUniformLocation | null = null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc);

        this.attribPosition = this.attrib('a_position')
        this.attribTexCoord = this.attrib('a_texCoord')
        this.uniformResolution = this.uniform('u_resolution')
        this.uniformInput = this.uniform('u_input')
        this.uniformTexelStep = this.uniform('u_texelStep')
    }
}
