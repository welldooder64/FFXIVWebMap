export default class Quad {
    private readonly gl: WebGL2RenderingContext

    private readonly positionBuffer: WebGLBuffer
    private readonly texCoordBuffer: WebGLBuffer

    private positions?: Float32Array
    private texCoords?: Float32Array

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        this.positionBuffer = gl.createBuffer()
        this.texCoordBuffer = gl.createBuffer()
    }

    setQuad(dx: number, dy: number, drawWidth: number, drawHeight: number) {
        const x1 = dx
        const y1 = dy
        const x2 = dx + drawWidth
        const y2 = dy + drawHeight

        this.positions = new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ])

        this.texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,
        ])
    }

    bindAttribs(attributePosition: GLint, attributeTexCoord: GLint) {
        const gl = this.gl
        if (!this.positions || !this.texCoords) return

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STREAM_DRAW)
        gl.enableVertexAttribArray(attributePosition)
        gl.vertexAttribPointer(attributePosition, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STREAM_DRAW)
        gl.enableVertexAttribArray(attributeTexCoord)
        gl.vertexAttribPointer(attributeTexCoord, 2, gl.FLOAT, false, 0, 0)
    }

    draw() {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }
}
