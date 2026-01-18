import MouseController from '@/input/MouseController'
import Renderer from '@/render/Renderer'
import BackgroundLayer from '@/render/layers/background/BackgroundLayer'
import MarkerLayer from '@/render/layers/marker/MarkerLayer'
import type MapState from '@/state/MapState'
import type PlayerState from '@/state/PlayerState'
import type SelectedState from '@/state/SelectedState'
import type { SelectedLocation } from '@/types/map'

export default class Map {
    private readonly playerState: PlayerState
    private readonly mapState: MapState
    private readonly selectedState: SelectedState

    private readonly renderer: Renderer

    private readonly mouseController: MouseController

    private backgroundLayer!: BackgroundLayer
    private markerLayer!: MarkerLayer

    constructor(elementId: string, playerState: PlayerState, mapState: MapState, selectedState: SelectedState) {
        this.playerState = playerState
        this.mapState = mapState
        this.selectedState = selectedState

        /* Setup the renderer */
        this.renderer = new Renderer(elementId, (gl) => {
            /* Setup all rendering layers */
            this.backgroundLayer = new BackgroundLayer(gl)
            this.markerLayer = new MarkerLayer(gl)

            return [
                this.backgroundLayer,
                this.markerLayer,
            ]
        })

        /* Wire input controllers once the renderer is ready */
        this.mouseController = new MouseController(this.renderer)

        this.setupEventListeners()
    }

    private setupEventListeners() {
        this.playerState.onPositionChange((_) => {
        //     this.renderer.setPlayer(mapSpaceTransform)
        })

        this.selectedState.onSelectionChanged((selectedLocation) => {
            // const mapSpaceTransform = playerState.mapSpaceTransform

            /* If the selected location is different from the player location, change it to 'undefined' to prevent it from being rendered */
            // if (mapSpaceTransform && playerState.mapId === selectedLocation.mapId) {
            //     this.renderer.setPlayer(mapSpaceTransform)
            // } else {
            //     this.renderer.setPlayer(undefined)
            // }

            void this.updateBackgroundLayer(selectedLocation)
        })

        this.mapState.onMapExtracted((mapId) => {
            /* If the map has changed in the meantime, we ignore the event */
            if (this.selectedState.selectedLocation?.mapId !== mapId) {
                return
            }

            void this.updateBackgroundLayer(this.selectedState.selectedLocation)
        })

        this.mouseController.onZoomChange(() => {
            this.markerLayer.markDirty()
        })

        this.mouseController.onPanChange(() => {
            this.markerLayer.markDirty()
        })
    }

    private async updateBackgroundLayer(selectedLocation: SelectedLocation) {
        const map = this.mapState.get(selectedLocation.mapId)
        if (!map) {
            console.warn('[MAP] map not found for selected location:', selectedLocation)
            return
        }

        try {
            await this.backgroundLayer.update({ map, selectedLocation })
            void this.markerLayer.update({ markers: this.mapState.getMarkers(selectedLocation.mapId) })
        } catch (e) {
            console.info('[MAP] resource missing for mapId:', selectedLocation.mapId)
            this.mapState.requestMap(selectedLocation.mapId)
        }
    }
}
