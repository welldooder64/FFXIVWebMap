import { UI_SCALE } from '@/constants'
import type { Vector2 } from '@/types/math'
import SDFProgram from '@/render/programs/SDFProgram'
import { fontMetrics, writeString } from '@/render/passes/TextPassUtils'
import type Font from '@/render/textures/Font'
import type Viewport from '@/render/Viewport'

export interface TextDrawOptions {
    text: string
    fontSize: number
    position: Vector2
    letterSpacing?: number
    anchorAlign?: 'left' | 'center' | 'right',
    textAlign?: 'left' | 'center' | 'right',
    baseline?: 'top' | 'middle' | 'bottom',
    fillColor?: { r: number, g: number, b: number, a: number }
    fillSoftness?: number
    fillExpand?: number
    outlineColor?: { r: number, g: number, b: number }
    outlineWidth?: number
    outlineSoftness?: number
}

export default class TextPass {
    private readonly gl: WebGL2RenderingContext
    private readonly program: SDFProgram

    private readonly vertexBuffer: WebGLBuffer
    private readonly vertexArray: Float32Array

    private readonly maxVertices = 100000
    private vertexArrayLength = 0

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        this.program = new SDFProgram(this.gl)

        this.vertexBuffer = gl.createBuffer()!
        this.vertexArray = new Float32Array(this.maxVertices * (this.program.stride / Float32Array.BYTES_PER_ELEMENT))
    }

    begin(viewport: Viewport) {
        const gl = this.gl

        this.program.use()

        gl.enable(gl.BLEND)
        gl.blendEquation(gl.FUNC_ADD)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        const { width, height } = viewport.getScreenSize()
        const { x: cx, y: cy } = viewport.getCenter()
        const mapScale = viewport.getScale()

        const ws = 2.0 / width
        const hs = 2.0 / height
        const screenMat = new Float32Array([
            ws, 0, 0,
            0, hs, 0,
            -1, -1, 1
        ])

        gl.uniformMatrix3fv(this.program.uniformTransform, false, screenMat)
        gl.uniform2f(this.program.uniformMapOrigin, cx, cy)
        gl.uniform1f(this.program.uniformMapScale, mapScale)

        this.vertexArrayLength = 0
    }

    addText(font: Font, options: TextDrawOptions) {
        if (!font.isLoaded()) return

        const fontSize = Math.round(options.fontSize * UI_SCALE * .704)
        const fMetrics = fontMetrics(font.data, fontSize, fontSize * 0.2)

        const styling = {
            fillColor: options.fillColor || { r: 1, g: 1, b: 1, a: 1 },
            outlineColor: options.outlineColor || { r: 0, g: 0, b: 0 },
            fillSoftness: options.fillSoftness ?? 0.2,
            fillExpand: options.fillExpand ?? 0,
            outlineWidth: options.outlineWidth ?? 0,
            outlineSoftness: options.outlineSoftness ?? 0
        }

        const { arrayPos } = writeString(
            options.text.replace('\r\n', '\n'),
            font.data,
            fMetrics,
            [options.position.x, options.position.y],
            this.vertexArray,
            this.vertexArrayLength,
            styling,
            options.letterSpacing ?? 0,
            options.anchorAlign ?? 'center',
            options.textAlign ?? 'center',
            options.baseline ?? 'top',
        )

        this.vertexArrayLength = arrayPos
    }

    draw(font: Font) {
        if (this.vertexArrayLength === 0 || !font.isLoaded()) return
        const gl = this.gl

        /* Bind uniforms */
        font.texture.texImage2D(gl.TEXTURE0)
        gl.uniform1i(this.program.uniformSampler, 0)
        gl.uniform2f(this.program.uniformResolution, font.texture.width, font.texture.height)
        gl.uniform1f(this.program.uniformBorderSize, font.data.iy)
        gl.uniform1f(this.program.uniformHintAmount, 1.0)

        /* Bind vertex data */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray.subarray(0, this.vertexArrayLength), gl.DYNAMIC_DRAW)
        this.program.bindVertexAttribs()

        /* Draw */
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexArrayLength / (this.program.stride / this.vertexArray.BYTES_PER_ELEMENT))

        this.gl.disable(this.gl.BLEND)
    }
}
