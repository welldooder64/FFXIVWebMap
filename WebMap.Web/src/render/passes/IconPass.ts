import { UI_SCALE } from '@/constants'
import Quad from '@/render/gl/Quad'
import type Viewport from '@/render/Viewport'
import MarkerProgram from '@/render/programs/MarkerProgram'
import type ImageTexture from '@/render/textures/ImageTexture'
import type { Rectangle, Vector2 } from '@/types/math'

export interface IconDrawOptions {
    position: Vector2
    rotation?: number
    uvOffset?: Rectangle
    iconOffset?: Vector2
    scaleWithMap?: boolean
    overrideSize?: Vector2
    useSecondarySampler?: boolean
    colorMultiply?: { r: number, g: number, b: number, a: number }
    colorAdd?: { r: number, g: number, b: number, a: number }
}

const INSTANCE_FLOAT_COUNT = 2 + 2 + 1 + 4 + 2 + 1 + 1 + 4 + 4 // pos(2), size(2), rot(1), uv(4), offset(2), scale(1), secondary(1), multiply(4), add(4) = 21 floats

export default class IconPass {
    private readonly gl: WebGL2RenderingContext
    private readonly quad: Quad
    private readonly program: MarkerProgram

    private readonly instanceBuffer: WebGLBuffer
    private instanceData: Float32Array
    private instanceCount: number = 0

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        this.program = new MarkerProgram(this.gl)
        this.quad = new Quad(this.gl)
        this.quad.setQuad(0, 0, 1, 1)

        this.instanceBuffer = gl.createBuffer()!
        this.instanceData = new Float32Array(1024 * INSTANCE_FLOAT_COUNT)
    }

    begin(viewport: Viewport) {
        const gl = this.gl

        this.program.use()

        const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()
        const { x: cx, y: cy } = viewport.getCenter()
        const mapScale = viewport.getScale()

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        /* Set Uniforms for GPU Projection */
        gl.uniform2f(this.program.uniformResolution, screenWidth, screenHeight)
        gl.uniform2f(this.program.uniformMapOrigin, cx, cy)
        gl.uniform1f(this.program.uniformMapScale, mapScale)

        this.instanceCount = 0
    }

    private ensureCapacity(count: number) {
        if (this.instanceCount + count > this.instanceData.length / INSTANCE_FLOAT_COUNT) {
            const newData = new Float32Array(this.instanceData.length * 2)
            newData.set(this.instanceData)
            this.instanceData = newData
        }
    }

    addInstance(texture: ImageTexture<any>, options: IconDrawOptions) {
        this.ensureCapacity(1)
        const {
            position,
            rotation = 0,
            uvOffset = { x: 0, y: 0, width: texture.width, height: texture.height },
            iconOffset = { x: 0, y: 0 },
            scaleWithMap = false,
            overrideSize,
            useSecondarySampler = false,
            colorMultiply = { r: 1, g: 1, b: 1, a: 1 },
            colorAdd = { r: 0, g: 0, b: 0, a: 0 },
        } = options

        const scaledOffset = { x: iconOffset.x * UI_SCALE, y: iconOffset.y * UI_SCALE }
        let finalScale = UI_SCALE * (texture.highResolution ? 0.5 : 1)
        const size = overrideSize ?? { x: uvOffset.width * finalScale, y: uvOffset.height * finalScale }

        const offset = this.instanceCount * INSTANCE_FLOAT_COUNT
        const d = this.instanceData
        d[offset] = position.x
        d[offset + 1] = position.y
        d[offset + 2] = size.x
        d[offset + 3] = size.y
        d[offset + 4] = rotation
        d[offset + 5] = uvOffset.x
        d[offset + 6] = uvOffset.y
        d[offset + 7] = uvOffset.width
        d[offset + 8] = uvOffset.height
        d[offset + 9] = scaledOffset.x
        d[offset + 10] = scaledOffset.y
        d[offset + 11] = scaleWithMap ? 1 : 0
        d[offset + 12] = useSecondarySampler ? 1 : 0
        d[offset + 13] = colorMultiply.r
        d[offset + 14] = colorMultiply.g
        d[offset + 15] = colorMultiply.b
        d[offset + 16] = colorMultiply.a
        d[offset + 17] = colorAdd.r
        d[offset + 18] = colorAdd.g
        d[offset + 19] = colorAdd.b
        d[offset + 20] = colorAdd.a

        this.instanceCount++
    }

    draw(texture: ImageTexture<any>, secondaryTexture?: ImageTexture<any>) {
        if (this.instanceCount === 0) return

        const gl = this.gl

        if (secondaryTexture) {
            secondaryTexture.texImage2D(gl.TEXTURE1)
            gl.uniform1i(this.program.uniformSamplerSecondary, 1)
        }

        /* Standard Texture Binding */
        texture.texImage2D(gl.TEXTURE0)
        gl.uniform1i(this.program.uniformSampler, 0)

        this.quad.bindAttribs(this.program.attribPosition, this.program.attribTexCoord)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.subarray(0, this.instanceCount * INSTANCE_FLOAT_COUNT), gl.STREAM_DRAW)

        const stride = INSTANCE_FLOAT_COUNT * 4

        // i_markerPos
        gl.enableVertexAttribArray(this.program.attribMarkerPos)
        gl.vertexAttribPointer(this.program.attribMarkerPos, 2, gl.FLOAT, false, stride, 0)
        gl.vertexAttribDivisor(this.program.attribMarkerPos, 1)

        // i_iconSize
        gl.enableVertexAttribArray(this.program.attribIconSize)
        gl.vertexAttribPointer(this.program.attribIconSize, 2, gl.FLOAT, false, stride, 2 * 4)
        gl.vertexAttribDivisor(this.program.attribIconSize, 1)

        // i_rotation
        gl.enableVertexAttribArray(this.program.attribRotation)
        gl.vertexAttribPointer(this.program.attribRotation, 1, gl.FLOAT, false, stride, 4 * 4)
        gl.vertexAttribDivisor(this.program.attribRotation, 1)

        // i_uvOffset
        gl.enableVertexAttribArray(this.program.attribUVOffset)
        gl.vertexAttribPointer(this.program.attribUVOffset, 4, gl.FLOAT, false, stride, 5 * 4)
        gl.vertexAttribDivisor(this.program.attribUVOffset, 1)

        // i_iconOffset
        gl.enableVertexAttribArray(this.program.attribIconOffset)
        gl.vertexAttribPointer(this.program.attribIconOffset, 2, gl.FLOAT, false, stride, 9 * 4)
        gl.vertexAttribDivisor(this.program.attribIconOffset, 1)

        // i_scaleWithMap
        gl.enableVertexAttribArray(this.program.attribScaleWithMap)
        gl.vertexAttribPointer(this.program.attribScaleWithMap, 1, gl.FLOAT, false, stride, 11 * 4)
        gl.vertexAttribDivisor(this.program.attribScaleWithMap, 1)

        // i_useSecondarySampler
        gl.enableVertexAttribArray(this.program.attribUseSecondarySampler)
        gl.vertexAttribPointer(this.program.attribUseSecondarySampler, 1, gl.FLOAT, false, stride, 12 * 4)
        gl.vertexAttribDivisor(this.program.attribUseSecondarySampler, 1)

        // i_colorMultiply
        gl.enableVertexAttribArray(this.program.attribColorMultiply)
        gl.vertexAttribPointer(this.program.attribColorMultiply, 4, gl.FLOAT, false, stride, 13 * 4)
        gl.vertexAttribDivisor(this.program.attribColorMultiply, 1)

        // i_colorAdd
        gl.enableVertexAttribArray(this.program.attribColorAdd)
        gl.vertexAttribPointer(this.program.attribColorAdd, 4, gl.FLOAT, false, stride, 17 * 4)
        gl.vertexAttribDivisor(this.program.attribColorAdd, 1)

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instanceCount)

        // Clean up divisors to avoid affecting other draws
        gl.vertexAttribDivisor(this.program.attribMarkerPos, 0)
        gl.vertexAttribDivisor(this.program.attribIconSize, 0)
        gl.vertexAttribDivisor(this.program.attribRotation, 0)
        gl.vertexAttribDivisor(this.program.attribUVOffset, 0)
        gl.vertexAttribDivisor(this.program.attribIconOffset, 0)
        gl.vertexAttribDivisor(this.program.attribScaleWithMap, 0)
        gl.vertexAttribDivisor(this.program.attribUseSecondarySampler, 0)
        gl.vertexAttribDivisor(this.program.attribColorMultiply, 0)
        gl.vertexAttribDivisor(this.program.attribColorAdd, 0)

        this.instanceCount = 0
        this.gl.disable(this.gl.BLEND)
    }
}
