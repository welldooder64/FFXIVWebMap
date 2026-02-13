import WebSocketService, { MessageType } from '@/net/WebSocketService'
import type { MapData } from '@/types/map'
import EventMixin from '@/utils/EventMixin'

type MapDataLoadedHandler = () => void

export default class MapState {
    private readonly webSocketService: WebSocketService

    private readonly mapDataLoaded = new EventMixin<MapDataLoadedHandler>()

    private mapDictionary?: MapData['maps'] = undefined
    private markerDictionary?: MapData['markers'] = undefined
    // private markerNameDictionary?: MapData['markerNames'] = undefined

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService

        this.webSocketService.on(MessageType.MapData, (msg) => {
            this.mapDictionary = msg.maps
            this.markerDictionary = msg.markers
            // this.markerNameDictionary = msg.markerNames

            this.mapDataLoaded.emit()
        })
    }

    getMap(mapId: number, callback?: (map: MapData['maps'][number] | undefined) => void): MapData['maps'][number] | undefined {
        if (callback) {
            if (this.hasMapData()) {
                callback(this.mapDictionary?.[mapId])
            } else {
                this.onceMapDataLoaded(() => {
                    callback(this.mapDictionary?.[mapId])
                })
            }
        }

        return this.mapDictionary?.[mapId]
    }

    getMarkers(mapId: number): MapData['markers'][number][number][] {
        const index = this.mapDictionary?.[mapId].mapMarkerRange
        if (!index) {
            return []
        }

        return Object.values(this.markerDictionary?.[index] ?? {})
    }

    onceMapDataLoaded(handler: MapDataLoadedHandler) {
        if (this.hasMapData()) {
            handler()
            return
        }

        this.mapDataLoaded.once(handler)
    }

    onMapDataLoaded(handler: MapDataLoadedHandler) {
        this.mapDataLoaded.add(handler)
    }

    hasMapData() {
        return this.mapDictionary !== undefined
    }
}
