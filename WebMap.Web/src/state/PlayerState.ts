import WebSocketService, { MessageType } from '@/net/WebSocketService'
import type MapState from '@/state/MapState'
import type { Transform } from '@/types/math'
import EventMixin from '@/utils/EventMixin'

type MapChangeHandler = (newMapId: number, prevMapId: number | undefined) => void
type PositionChangeHandler = (
    worldSpacePlayerTransform: Transform,
    mapSpacePlayerTransform: Transform,
) => void
type CameraRotationChangeHandler = (cameraRotation: number) => void

export default class PlayerState {
    private readonly mapState: MapState

    private readonly mapChange = new EventMixin<MapChangeHandler>()
    private readonly positionChange = new EventMixin<PositionChangeHandler>()
    private readonly cameraRotationChange = new EventMixin<CameraRotationChangeHandler>()

    public mapId?: number
    public worldSpacePlayerTransform?: Transform
    public cameraRotation?: number

    constructor(webSocketService: WebSocketService, mapState: MapState) {
        this.mapState = mapState

        webSocketService.on(MessageType.PlayerLocation, (msg) => {
            const next = msg.mapId
            const previous = this.mapId
            if (previous !== next) {
                this.mapId = next
                this.mapChange.emit(next, previous)
            }
        })

        webSocketService.on(MessageType.PlayerPosition, (msg) => {
            if (this.cameraRotation !== msg.cameraRotation) {
                this.cameraRotation = msg.cameraRotation
                this.cameraRotationChange.emit(this.cameraRotation)
            }

            this.worldSpacePlayerTransform = msg.playerTransform
            const mapSpaceTransform = this.mapSpacePlayerTransform

            if (mapSpaceTransform) {
                this.positionChange.emit(this.worldSpacePlayerTransform, mapSpaceTransform)
            }
        })
    }

    get mapSpacePlayerTransform(): Transform | undefined {
        if (!this.worldSpacePlayerTransform || !this.mapId) {
            return
        }

        const map = this.mapState.getMap(this.mapId)
        if (!map) {
            return
        }

        const scaleFactor = map.sizeFactor / 100

        return  {
            rotation: this.worldSpacePlayerTransform.rotation,
            position: {
                x: (this.worldSpacePlayerTransform.position.x * scaleFactor) - (-map.offsetX * scaleFactor) + 1024,
                y: (this.worldSpacePlayerTransform.position.y * scaleFactor) - (-map.offsetY * scaleFactor) + 1024,
                z: this.worldSpacePlayerTransform.position.z,
            },
        }
    }

    onMapChange(handler: MapChangeHandler): void {
        this.mapChange.add(handler)
    }

    onPositionChange(handler: PositionChangeHandler): void {
        this.positionChange.add(handler)
    }

    onCameraRotationChange(handler: CameraRotationChangeHandler): void {
        this.cameraRotationChange.add(handler)
    }
}
