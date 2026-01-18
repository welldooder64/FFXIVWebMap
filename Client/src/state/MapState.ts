import type WebSocketService from '@/net/WebSocketService'
import type { MapData, MapMarker } from '@/types/map'
import EventMixin from '@/utils/EventMixin'

type MapExtractedHandler = (mapId: number) => void
type MapDataLoadedHandler = () => void

export default class MapState {
    private readonly webSocketService: WebSocketService

    private readonly mapDataLoaded = new EventMixin<MapDataLoadedHandler>()
    private readonly mapExtracted = new EventMixin<MapExtractedHandler>()

    private mapDictionary?: MapData['maps'] = undefined;
    private markerDictionary?: MapData['markers'] = undefined;

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService

        this.webSocketService.on('mapData', (msg) => {
            this.mapDictionary = msg.data.maps
            this.markerDictionary = msg.data.markers
            this.mapDataLoaded.emit()
        })

        this.webSocketService.on('mapExtracted', (msg) => {
            this.mapExtracted.emit(msg.data)
        })
    }

    get(mapId: number) {
        return this.mapDictionary?.[mapId]
    }

    getMarkers(mapId: number): MapMarker[] {
        const index = this.mapDictionary?.[mapId].mapMarkerRange
        if (!index) {
            return []
        }

        return Object.values(this.markerDictionary?.[index] ?? {})
    }

    requestMap(mapId: number) {
        this.webSocketService.send({ type: 'extractMap', data: mapId })
    }

    onMapDataLoaded(handler: MapDataLoadedHandler) {
        this.mapDataLoaded.add(handler)
    }

    onMapExtracted(handler: MapExtractedHandler) {
        this.mapExtracted.add(handler)
    }
}
