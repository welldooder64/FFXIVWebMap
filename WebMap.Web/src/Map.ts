import MouseController from '@/input/MouseController'
import Renderer from '@/render/Renderer'
import BackgroundLayer from '@/render/layers/BackgroundLayer'
import StaticMarkerLayer from '@/render/layers/StaticMarkerLayer'
import DynamicMarkerLayer from '@/render/layers/DynamicMarkerLayer'
import PlayerLayer from '@/render/layers/PlayerLayer'
import type MapState from '@/state/MapState'
import type PlayerState from '@/state/PlayerState'
import type SelectedState from '@/state/SelectedState'
import type { SelectedLocation, Assets } from '@/types/map'
import TextureAtlas from '@/render/textures/TextureAtlas'
import type DynamicMarkerState from '@/state/DynamicMarkerState'
import FontFamily from '@/render/textures/FontFamily';

export default class Map {
    private readonly playerState: PlayerState
    private readonly mapState: MapState
    private readonly selectedState: SelectedState
    private readonly dynamicMarkerState: DynamicMarkerState

    private readonly renderer: Renderer
    private backgroundLayer!: BackgroundLayer
    private markerLayer!: StaticMarkerLayer
    private dynamicMarkerLayer!: DynamicMarkerLayer
    private playerLayer!: PlayerLayer

    constructor(elementId: string, playerState: PlayerState, mapState: MapState, selectedState: SelectedState, dynamicMarkerState: DynamicMarkerState) {
        this.playerState = playerState
        this.mapState = mapState
        this.selectedState = selectedState
        this.dynamicMarkerState = dynamicMarkerState

        /* Setup the renderer */
        this.renderer = new Renderer(elementId, async (gl) => {
            const assets = await this.setupAssets(gl)

            /* Setup all rendering layers */
            this.backgroundLayer = new BackgroundLayer(gl, assets)
            this.markerLayer = new StaticMarkerLayer(gl, assets)
            this.dynamicMarkerLayer = new DynamicMarkerLayer(gl, assets)
            this.playerLayer = new PlayerLayer(gl, assets)

            return [
                this.backgroundLayer,
                this.markerLayer,
                this.dynamicMarkerLayer,
                this.playerLayer,
            ]
        })

        /* Wire input controllers once the renderer is ready */
        new MouseController(this.renderer)
    }

    /**
     * Initializes and starts the renderer, sets up event listeners, and updates the background layer
     * if a selected location is present.
     *
     * @return {Promise<void>} A promise that resolves when the start process is complete.
     */
    async start(): Promise<void> {
        await this.renderer.start()
        this.setupEventListeners()

        const selectedLocation = this.selectedState.selectedLocation
        if (selectedLocation) {
            void this.updateBackgroundLayer(selectedLocation)
        }
    }

    private async setupAssets(gl: WebGL2RenderingContext): Promise<Assets> {
        const notoSansFont = new FontFamily(gl, 'NotoSans')

        const iconAtlas = new TextureAtlas<number>(gl, 'ui/atlas/icons', undefined, { generateMipmaps: true })
        const areaMapAtlas = new TextureAtlas(gl, 'ui/uld/AreaMap', {
            markerHighlight: { x: 252, y: 32, width: 40, height: 40 }
        }, { generateMipmaps: true })
        const naviMapAtlas = new TextureAtlas(gl, 'ui/uld/NaviMap', {
            playerShadow: { x: 352, y: 0, width: 96, height: 96 }
        }, { generateMipmaps: true })

        return Promise.all([notoSansFont.load(), iconAtlas.load(), areaMapAtlas.load(), naviMapAtlas.load()]).then(() => ({
            font: {
                notoSans: notoSansFont,
            },
            atlas: {
                icon: iconAtlas,
                areaMap: areaMapAtlas,
                naviMap: naviMapAtlas,
            }
        }))
    }

    private setupEventListeners() {
        this.playerState.onPositionChange((worldSpaceTransform, mapSpaceTransform) => {
            if (!this.isPlayerInSelectedLocation()) {
                return
            }

            void this.playerLayer.update({ playerTransform: mapSpaceTransform })
            void this.dynamicMarkerLayer.update({ playerZPosition: worldSpaceTransform.position.z })
        })

        this.selectedState.onSelectionChanged((selectedLocation) => {
            void this.updateBackgroundLayer(selectedLocation)
        })

        this.playerState.onCameraRotationChange((cameraRotation) => {
            void this.playerLayer.update({ cameraRotation })
        })

        this.dynamicMarkerState.onDynamicMarkersChanged(() => {
            const mapId = this.selectedState.selectedLocation?.mapId
            if (!mapId) {
                return
            }

            void this.dynamicMarkerLayer.update({
                markers: this.dynamicMarkerState.getMarkers(mapId),
                playerZPosition: this.isPlayerInSelectedLocation() ? this.playerState.worldSpacePlayerTransform?.position.z : undefined
            })
        })
    }

    private async updateBackgroundLayer(selectedLocation: SelectedLocation) {
        const map = this.mapState.getMap(selectedLocation.mapId)
        if (!map) {
            console.warn('[MAP] map not found for selected location:', selectedLocation)
            return
        }

        await this.backgroundLayer.update({ map, selectedLocation })
        void this.markerLayer.update({ markers: this.mapState.getMarkers(selectedLocation.mapId) })
        void this.dynamicMarkerLayer.update({
            markers: this.dynamicMarkerState.getMarkers(selectedLocation.mapId),
            playerZPosition: this.isPlayerInSelectedLocation() ? this.playerState.worldSpacePlayerTransform?.position.z : undefined
        })

        /* If the selected location is different from the player location, change it to 'undefined' to prevent it from being rendered */
        const mapSpaceTransform = this.playerState.mapSpacePlayerTransform
        void this.playerLayer.update({
            playerTransform: mapSpaceTransform && this.playerState.mapId === selectedLocation.mapId ? mapSpaceTransform : undefined,
            cameraRotation: this.playerState.cameraRotation,
        })
    }

    private isPlayerInSelectedLocation(): boolean {
        return this.playerState.mapId === this.selectedState.selectedLocation?.mapId
    }
}
