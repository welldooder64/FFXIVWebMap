export default class Texture {
    protected readonly gl: WebGL2RenderingContext
    readonly texture: WebGLTexture

    width: number = 0
    height: number = 0

    constructor(gl: WebGL2RenderingContext, width: number = 0, height: number = 0) {
        this.gl = gl
        this.texture = gl.createTexture()
        this.width = width
        this.height = height
    }

    bind(activeTextureUnit: GLenum) {
        const gl = this.gl

        gl.activeTexture(activeTextureUnit)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
    }

    delete() {
        this.gl.deleteTexture(this.texture)
    }

    static empty(gl: WebGL2RenderingContext, width: number, height: number): Texture {
        const tex = new Texture(gl, width, height)

        tex.bind(gl.TEXTURE0)
        tex.setParameters()
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

        return tex
    }

    protected setParameters() {
        const gl = this.gl

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    }

    generateMipmap() {
        const gl = this.gl

        this.bind(gl.TEXTURE0)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }
}
