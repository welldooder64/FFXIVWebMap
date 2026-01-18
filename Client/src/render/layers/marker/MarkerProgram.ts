import Program from '@/render/gl/Program'

import vertSrc from '@/render/shaders/icon.vert?raw'
import fragSrc from '@/render/shaders/icon.frag?raw'

export default class MarkerProgram extends Program {
    readonly attribPosition: GLint = -1
    readonly attribTexCoord: GLint = -1

    readonly uniformResolution: WebGLUniformLocation | null = null
    readonly uniformSampler: WebGLUniformLocation | null = null

    /* Projection Uniforms */
    readonly uniformMapOrigin: WebGLUniformLocation | null = null
    readonly uniformMapScale: WebGLUniformLocation | null = null
    readonly uniformMarkerPos: WebGLUniformLocation | null = null
    readonly uniformIconSize: WebGLUniformLocation | null = null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc);

        this.attribPosition = this.attrib('a_position')
        this.attribTexCoord = this.attrib('a_texCoord')
        this.uniformResolution = this.uniform('u_resolution')
        this.uniformSampler = this.uniform('u_sampler')

        this.uniformMapOrigin = this.uniform('u_mapOrigin')
        this.uniformMapScale = this.uniform('u_mapScale')
        this.uniformMarkerPos = this.uniform('u_markerPos')
        this.uniformIconSize = this.uniform('u_iconSize')
    }
}
