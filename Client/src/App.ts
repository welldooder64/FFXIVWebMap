import { RETRY_MS, WS_URL } from '@/constants'
import WebSocketService from '@/net/WebSocketService'
import MapState from '@/state/MapState'
import PlayerState from '@/state/PlayerState'
import SelectedState from '@/state/SelectedState'
import Map from '@/Map'

export default class App {
    private readonly ws: WebSocketService

    private readonly mapState: MapState
    private readonly playerState: PlayerState
    private readonly selectedState: SelectedState

    constructor() {
        this.ws = new WebSocketService(WS_URL, RETRY_MS)

        this.mapState = new MapState(this.ws)
        this.playerState = new PlayerState(this.ws, this.mapState)
        this.selectedState = new SelectedState(this.ws)
    }

    run() {
        /* Wait for the map data to be sent, we cannot do anything without it */
        this.mapState.onMapDataLoaded(() => {
            new Map('map', this.playerState, this.mapState, this.selectedState)
        })

        this.ws.connect()
    }
}
