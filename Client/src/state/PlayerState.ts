import type WebSocketService from '@/net/WebSocketService'
import type MapState from '@/state/MapState'
import type { Transform } from '@/types/math'
import EventMixin from '@/utils/EventMixin'

type MapChangeHandler = (newMapId: number, prevMapId: number | undefined) => void
type PositionChangeHandler = (worldSpaceTransform: Transform, mapSpaceTransform: Transform) => void

export default class PlayerState {
    private readonly mapState: MapState

    private readonly mapChange = new EventMixin<MapChangeHandler>()
    private readonly positionChange = new EventMixin<PositionChangeHandler>()

    public mapId?: number;
    public worldSpaceTransform?: Transform;

    constructor(webSocketService: WebSocketService, mapState: MapState) {
        this.mapState = mapState

        webSocketService.on('playerLocation', (msg) => {
            const next = msg.data.mapId
            const previous = this.mapId
            if (previous !== next) {
                this.mapId = next
                this.mapChange.emit(next, previous)
            }
        })

        webSocketService.on('playerPosition', (msg) => {
            this.worldSpaceTransform = msg.data
            const mapSpaceTransform = this.mapSpaceTransform

            if (mapSpaceTransform) {
                this.positionChange.emit(msg.data, mapSpaceTransform)
            }

        })
    }

    get mapSpaceTransform(): Transform | undefined {
        if (!this.worldSpaceTransform || !this.mapId) {
            return
        }

        const map = this.mapState.get(this.mapId)
        if (!map) {
            return
        }

        const scaleFactor = map.sizeFactor / 100

        return {
            rotation: this.worldSpaceTransform.rotation,
            position: {
                x: (this.worldSpaceTransform.position.x * scaleFactor) - (-map.offsetX * scaleFactor) + 1024,
                y: (this.worldSpaceTransform.position.y * scaleFactor) - (-map.offsetY * scaleFactor) + 1024,
            },
        }
    }

    onMapChange(handler: MapChangeHandler): void {
        this.mapChange.add(handler)
    }

    onPositionChange(handler: PositionChangeHandler): void {
        this.positionChange.add(handler)
    }
}
