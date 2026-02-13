import type { VertexAttrib, VertexAttribDef } from '@/types/gl'

/* Map GL types to their byte sizes */
const GL_TYPE_SIZES: Record<number, number> = {
    0x1400: 1,  // BYTE
    0x1401: 1,  // UNSIGNED_BYTE
    0x1402: 2,  // SHORT
    0x1403: 2,  // UNSIGNED_SHORT
    0x1404: 4,  // INT
    0x1405: 4,  // UNSIGNED_INT
    0x1406: 4,  // FLOAT
}

export default abstract class Program {
    protected readonly gl: WebGL2RenderingContext
    protected readonly program: WebGLProgram

    protected constructor(gl: WebGL2RenderingContext, vertexSrc: string, fragmentSrc: string) {
        this.gl = gl

        const vs = Program.compileShader(gl, gl.VERTEX_SHADER, vertexSrc)
        const fs = Program.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc)
        this.program = gl.createProgram()

        gl.attachShader(this.program, vs)
        gl.attachShader(this.program, fs)
        gl.linkProgram(this.program)
        gl.deleteShader(vs)
        gl.deleteShader(fs)

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(this.program)
            gl.deleteProgram(this.program)
            throw new Error(`Program link error: ${info || 'unknown'}`)
        }
    }

    use() {
        this.gl.useProgram(this.program)
    }

    protected attrib(name: string): GLint {
        return this.gl.getAttribLocation(this.program, name)
    }

    protected uniform(name: string): WebGLUniformLocation | null {
        return this.gl.getUniformLocation(this.program, name)
    }

    protected static buildVertexLayout(attribs: VertexAttribDef[]): { layout: VertexAttrib[], stride: number } {
        let offset = 0
        const layout: VertexAttrib[] = []

        for (const attr of attribs) {
            const typeSize = GL_TYPE_SIZES[attr.type]
            if (!typeSize) {
                throw new Error(`Unknown GL type: ${attr.type}`)
            }

            layout.push({
                ...attr,
                offset,
                normalized: attr.normalized ?? false
            })
            offset += attr.size * typeSize
        }

        return { layout, stride: offset }
    }

    private static compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type)
        if (!shader) {
            throw new Error('Failed to create shader')
        }

        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader)
            gl.deleteShader(shader)
            throw new Error(`Shader compile error: ${info || 'unknown'}`)
        }

        return shader
    }
}
