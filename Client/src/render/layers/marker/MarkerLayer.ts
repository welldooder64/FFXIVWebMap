import Layer from '@/render/layers/Layer'
import type Texture from '@/render/textures/Texture'
import type { MapMarker } from '@/types/map'
import TextureCache from '@/render/textures/TextureCache'
import IconTexture from '@/render/textures/IconTexture'
import Quad from '@/render/gl/Quad'
import IconPass from '@/render/layers/marker/IconPass'
import type Viewport from '@/render/Viewport'
import { CoordinateSpace } from '@/types/math'

export interface MarkerLayerState {
    markers: MapMarker[]
}

export default class MarkerLayer extends Layer<MarkerLayerState> {
    public readonly coordinateSpace = CoordinateSpace.Screen

    private readonly quad: Quad
    private readonly iconPass: IconPass

    private iconCache: TextureCache<IconTexture, number> = new TextureCache(IconTexture)

    /* State needed for rendering the layer */
    private markers: MapMarker[] = []

    constructor(gl: WebGL2RenderingContext) {
        super(gl)

        this.quad = new Quad(this.gl)
        this.iconPass = new IconPass(gl, this.quad)
    }

    protected updateState(state: MarkerLayerState): Promise<void> | void {
        this.markers = state.markers

        /* Kick off async icon loads for unique icon ids */
        const unique = new Set(this.markers.map(m => m.icon))
        for (const id of unique) {
            this.iconCache.getOrCreate(this.gl, id, () => {
                this.markDirty()
            })
        }
    }
    protected draw(viewport: Viewport): Texture | undefined {
        if (this.markers.length === 0) return

        const gl = this.gl

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        let tex: Texture | undefined = undefined
        for (const marker of this.markers) {
            const cache = this.iconCache.getOrCreate(this.gl, marker.icon)
            if (!cache.loaded) continue

            cache.texImage2D(gl.TEXTURE0)

            const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()

            tex = this.iconPass.draw(viewport, cache, marker, screenWidth, screenHeight)
        }

        gl.disable(gl.BLEND)

        return tex
    }

}
