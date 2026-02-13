import Program from '@/render/gl/Program'

import vertSrc from '@/render/shaders/icon.vert'
import fragSrc from '@/render/shaders/icon.frag'

export default class MarkerProgram extends Program {
    readonly attribPosition: GLint = 0
    readonly attribTexCoord: GLint = 1

    readonly attribMarkerPos: GLint = 2
    readonly attribIconSize: GLint = 3
    readonly attribRotation: GLint = 4
    readonly attribUVOffset: GLint = 5
    readonly attribIconOffset: GLint = 6
    readonly attribScaleWithMap: GLint = 7
    readonly attribUseSecondarySampler: GLint = 8
    readonly attribColorMultiply: GLint = 9
    readonly attribColorAdd: GLint = 10

    readonly uniformResolution: WebGLUniformLocation | null = null
    readonly uniformSampler: WebGLUniformLocation | null = null
    readonly uniformSamplerSecondary: WebGLUniformLocation | null = null

    /* Projection Uniforms */
    readonly uniformMapOrigin: WebGLUniformLocation | null = null
    readonly uniformMapScale: WebGLUniformLocation | null = null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc)

        this.uniformResolution = this.uniform('u_resolution')
        this.uniformSampler = this.uniform('u_sampler')
        this.uniformSamplerSecondary = this.uniform('u_sampler_secondary')

        this.uniformMapOrigin = this.uniform('u_mapOrigin')
        this.uniformMapScale = this.uniform('u_mapScale')
    }
}
