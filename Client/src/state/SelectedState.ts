import type WebSocketService from '@/net/WebSocketService'
import type { SelectedLocation } from '@/types/map'

type SelectionChangedHandler = (selectedLocation: SelectedLocation) => void

export default class SelectedState {
    private readonly webSocketService: WebSocketService

    private readonly listeners = new Set<SelectionChangedHandler>()

    public selectedLocation?: SelectedLocation;

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService

        this.webSocketService.on('selectedLocation', (msg) => {
            /* Don't do anything if the received location is the same as the current one */
            if (msg.data.mapId === this.selectedLocation?.mapId && msg.data.discoveryMask === this.selectedLocation?.discoveryMask) {
                return
            }

            this.selectedLocation = msg.data
            this.emitSelectionChanged(msg.data)
        })
    }

    onSelectionChanged(handler: SelectionChangedHandler) {
        this.listeners.add(handler)
    }

    private emitSelectionChanged(selectedLocation: SelectedLocation): void {
        for (const handler of this.listeners) {
            try {
                handler(selectedLocation)
            } catch (err) {
                console.error('[SelectedState] selection changed listener error:', err)
            }
        }
    }
}
