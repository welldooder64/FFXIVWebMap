import Program from '@/render/gl/Program'
import type { VertexAttrib } from '@/types/gl'

import vertSrc from '@/render/shaders/sdf/sdf.vert'
import fragSrc from '@/render/shaders/sdf/sdf.frag'

export default class SDFProgram extends Program {
    /* Attribute locations */
    readonly attribPosition: GLint = 0
    readonly attribTexCoord: GLint = 1
    readonly attribSDFSize: GLint = 2
    readonly attribFillColor: GLint = 3
    readonly attribOutlineColor: GLint = 4
    readonly attribStyling: GLint = 5
    readonly attribAnchor: GLint = 6

    /* Vertex layout */
    readonly vertexLayout: VertexAttrib[]
    readonly stride: number

    /* Uniforms */
    readonly uniformResolution: WebGLUniformLocation | null = null
    readonly uniformSampler: WebGLUniformLocation | null = null
    readonly uniformBorderSize: WebGLUniformLocation | null = null
    readonly uniformTransform: WebGLUniformLocation | null = null
    readonly uniformHintAmount: WebGLUniformLocation | null = null
    readonly uniformMapOrigin: WebGLUniformLocation | null = null
    readonly uniformMapScale: WebGLUniformLocation | null = null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertSrc, fragSrc)

        const { layout, stride } = Program.buildVertexLayout([
            { location: this.attribPosition,     size: 2, type: gl.FLOAT },  // vec2 pos
            { location: this.attribTexCoord,     size: 2, type: gl.FLOAT },  // vec2 tex0
            { location: this.attribSDFSize,      size: 1, type: gl.FLOAT },  // float scale
            { location: this.attribFillColor,    size: 4, type: gl.FLOAT },  // vec4 fill_color
            { location: this.attribOutlineColor, size: 3, type: gl.FLOAT },  // vec3 outline_color
            { location: this.attribStyling,      size: 4, type: gl.FLOAT },  // vec4 styling
            { location: this.attribAnchor,       size: 2, type: gl.FLOAT },  // vec2 anchor
        ])

        this.vertexLayout = layout
        this.stride = stride

        this.uniformResolution = this.uniform('sdf_tex_size')
        this.uniformSampler = this.uniform('font_tex')
        this.uniformBorderSize = this.uniform('sdf_border_size')
        this.uniformTransform = this.uniform('transform')
        this.uniformHintAmount = this.uniform('hint_amount')
        this.uniformMapOrigin = this.uniform('u_mapOrigin')
        this.uniformMapScale = this.uniform('u_mapScale')
    }

    /**
     * Binds vertex attributes for a WebGL2RenderingContext based on the current vertex layout configuration.
     */
    bindVertexAttribs(): void {
        for (const attr of this.vertexLayout) {
            this.gl.enableVertexAttribArray(attr.location)
            this.gl.vertexAttribPointer(
                attr.location,
                attr.size,
                attr.type,
                attr.normalized,
                this.stride,
                attr.offset
            )
        }
    }
}
