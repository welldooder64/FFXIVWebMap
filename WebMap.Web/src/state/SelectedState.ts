import WebSocketService, { MessageType } from '@/net/WebSocketService'
import type { SelectedLocation } from '@/types/map'
import type MapState from '@/state/MapState'
import EventMixin from '@/utils/EventMixin'

type SelectionChangedHandler = (selectedLocation: SelectedLocation) => void

export default class SelectedState {
    private readonly mapState: MapState

    private readonly selectionChanged = new EventMixin<SelectionChangedHandler>()

    public selectedLocation?: SelectedLocation

    constructor(webSocketService: WebSocketService, mapState: MapState) {
        this.mapState = mapState

        webSocketService.on(MessageType.SelectedLocation, (msg) => {
            /* Don't do anything if the received location is the same as the current one */
            if (msg.mapId === this.selectedLocation?.mapId && msg.discoveryMask === this.selectedLocation?.discoveryMask) {
                return
            }

            this.mapState.onceMapDataLoaded(() => {
                this.selectedLocation = msg
                this.selectionChanged.emit(msg)
            })
        })

        webSocketService.on(MessageType.DiscoveryMask, (msg) => {
            if (this.selectedLocation) {
                this.selectedLocation.discoveryMask = msg
                this.selectionChanged.emit(this.selectedLocation)
            }
        })
    }

    onSelectionChanged(handler: SelectionChangedHandler) {
        this.selectionChanged.add(handler)
    }
}
