import Program from '@/render/gl/Program'

import vertSrc from '@/render/shaders/default.vert'
import fragSrc from '@/render/shaders/map.frag'

export default class BackgroundProgram extends Program {
    readonly attribPosition: GLint = -1
    readonly attribTexCoord: GLint = -1

    readonly uniformResolution: WebGLUniformLocation | null

    readonly uniformForegroundSampler: WebGLUniformLocation | null
    readonly uniformBackgroundSampler: WebGLUniformLocation | null
    readonly uniformMaskSampler: WebGLUniformLocation | null

    readonly uniformUseBackground: WebGLUniformLocation | null
    readonly uniformUseMask: WebGLUniformLocation | null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc)

        this.attribPosition = this.attrib('a_position')
        this.attribTexCoord = this.attrib('a_texCoord')
        this.uniformResolution = this.uniform('u_resolution')
        this.uniformForegroundSampler = this.uniform('u_foregroundSampler')
        this.uniformBackgroundSampler = this.uniform('u_backgroundSampler')
        this.uniformMaskSampler = this.uniform('u_maskSampler')
        this.uniformUseBackground = this.uniform('u_useBackground')
        this.uniformUseMask = this.uniform('u_useMask')
    }
}
