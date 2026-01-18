export default abstract class Program {
    private readonly gl: WebGL2RenderingContext
    public readonly program: WebGLProgram

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

    use() {
        this.gl.useProgram(this.program)
    }

    protected attrib(name: string): GLint {
        return this.gl.getAttribLocation(this.program, name)
    }

    protected uniform(name: string): WebGLUniformLocation | null {
        return this.gl.getUniformLocation(this.program, name)
    }
}
