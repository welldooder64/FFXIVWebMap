import Quad from '@/render/gl/Quad'
import Layer from '@/render/layers/Layer'
import BackgroundPass from '@/render/layers/background/BackgroundPass'
import BackgroundMaskPrepass from '@/render/layers/background/BackgroundMaskPrepass'
import Texture from '@/render/textures/Texture'
import MapTexture, { MapLayer } from '@/render/textures/MapTexture'
import TextureCache from '@/render/textures/TextureCache'
import type { Map, MapImageSet, SelectedLocation } from '@/types/map'
import { CoordinateSpace } from '@/types/math'

export interface BackgroundLayerState {
    map: Map
    selectedLocation: SelectedLocation
}

export default class BackgroundLayer extends Layer<BackgroundLayerState> {
    public readonly coordinateSpace = CoordinateSpace.Map

    private readonly quad: Quad
    private readonly backgroundPass: BackgroundPass
    private readonly backgroundMaskPrepass: BackgroundMaskPrepass

    private readonly mapCache = new TextureCache(MapTexture)

    /* State needed for rendering the layer */
    private images?: MapImageSet
    private discoveryMask: number = 0

    constructor(gl: WebGL2RenderingContext) {
        super(gl)

        this.quad = new Quad(this.gl)

        this.backgroundPass = new BackgroundPass(this.gl, this.quad)
        this.backgroundMaskPrepass = new BackgroundMaskPrepass(this.gl, this.quad)
    }

    protected async updateState(state: BackgroundLayerState) {
        const { map, selectedLocation } = state

        /* Retrieve textures for each layer, skipping layers that are not needed for the current map state */
        const layers = {
            foreground: this.mapCache.getOrCreate(this.gl, map.id, MapLayer.FOREGROUND),
            background: map.discoveryFlag !== 0 ?
                this.mapCache.getOrCreate(this.gl, map.id, MapLayer.BACKGROUND) : undefined,

            /* Only set the mask from if the full area already has not been fully explored */
            mask: map.discoveryFlag !== selectedLocation.discoveryMask && selectedLocation.discoveryMask !== -1 ?
                this.mapCache.getOrCreate(this.gl, map.id, MapLayer.MASK) : undefined,
        }

        /* Load all textures */
        const results = await Promise.allSettled(
            Object.entries(layers)
                .filter((entry): entry is [string, MapTexture] => entry[1] !== undefined)
                .map(([_, texture]) => texture.load()),
        )

        /* If any of the textures failed to load with a 404, request the map data to be extracted */
        for (const result of results) {
            if (result.status === 'rejected') {
                if (result.reason.status === 404) {
                    throw Error('Resource missing for mapId: ' + selectedLocation.mapId)
                }

                console.error('Failed to load texture:', result.reason)
                return
            }
        }

        /* Update the actual state of the layer */
        this.images = layers
        this.discoveryMask = selectedLocation.discoveryMask
    }

    protected draw(): Texture | undefined {
        if (!this.images) return

        const { foreground, background, mask } = this.images

        return this.backgroundPass.draw(
            foreground,
            background,
            mask ? this.backgroundMaskPrepass.draw(mask, this.discoveryMask) : undefined,
        )
    }

}

