import Program from '@/render/gl/Program'

import vertSrc from '@/render/shaders/default.vert?raw'
import fragSrc from '@/render/shaders/mask_compose.frag?raw'

export default class MaskProgram extends Program {
    readonly attribPosition: GLint = -1
    readonly attribTexCoord: GLint = -1

    readonly uniformResolution: WebGLUniformLocation | null = null
    readonly uniformSampler: WebGLUniformLocation | null = null

    readonly uniformDiscoveryMask: WebGLUniformLocation | null = null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc);

        this.attribPosition = this.attrib('a_position')
        this.attribTexCoord = this.attrib('a_texCoord')
        this.uniformResolution = this.uniform('u_resolution')
        this.uniformSampler = this.uniform('u_maskSampler')
        this.uniformDiscoveryMask = this.uniform('u_discoveryMask')
    }


}
