import WebSocketService, { MessageType } from '@/net/WebSocketService'
import { type DynamicMarker, type DynamicMarkerData, MarkerType } from '@/types/dynamic-marker'
import type { Vector3 } from '@/types/math'
import type MapState from '@/state/MapState'
import EventMixin from '@/utils/EventMixin'

type EventMarkersChangedHandler = () => void

export default class DynamicMarkerState {
    private readonly mapState: MapState

    private readonly dynamicMarkersChanged = new EventMixin<EventMarkersChangedHandler>()

    private _questMarkers: Record<number, DynamicMarker[]> = {}
    private _unacceptedQuestMarkers: Record<number, DynamicMarker[]> = {}
    private _questLinkMarkers: Record<number, DynamicMarker[]> = {}
    private _levequestMarkers: Record<number, DynamicMarker[]> = {}
    private _activeLevequestMarkers: Record<number, DynamicMarker[]> = {}
    private _guildLeveAssignmentMarkers: Record<number, DynamicMarker[]> = {}
    private _guildOrderGuideMarkers: Record<number, DynamicMarker[]> = {}
    private _housingMarkers: Record<number, DynamicMarker[]> = {}
    private _tripleTriadMarkers: Record<number, DynamicMarker[]> = {}
    private _customTalkMarkers: Record<number, DynamicMarker[]> = {}
    private _gemstoneTraderMarkers: Record<number, DynamicMarker[]> = {}

    markers: Record<number, DynamicMarker[]> = {}

    private set questMarkers(value: Record<number, DynamicMarker[]>) {
        this._questMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set unacceptedQuestMarkers(value: Record<number, DynamicMarker[]>) {
        this._unacceptedQuestMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set questLinkMarkers(value: Record<number, DynamicMarker[]>) {
        this._questLinkMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set levequestMarkers(value: Record<number, DynamicMarker[]>) {
        this._levequestMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set activeLevequestMarkers(value: Record<number, DynamicMarker[]>) {
        this._activeLevequestMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set guildLeveAssignmentMarkers(value: Record<number, DynamicMarker[]>) {
        this._guildLeveAssignmentMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set guildOrderGuideMarkers(value: Record<number, DynamicMarker[]>) {
        this._guildOrderGuideMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set housingMarkers(value: Record<number, DynamicMarker[]>) {
        this._housingMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set tripleTriadMarkers(value: Record<number, DynamicMarker[]>) {
        this._tripleTriadMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set customTalkMarkers(value: Record<number, DynamicMarker[]>) {
        this._customTalkMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    private set gemstoneTraderMarkers(value: Record<number, DynamicMarker[]>) {
        this._gemstoneTraderMarkers = value
        this.markers = this.rebuildMergedMarkers()
    }

    constructor(webSocketService: WebSocketService, mapState: MapState) {
        this.mapState = mapState

        webSocketService.on(MessageType.QuestMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.questMarkers = this.processDynamicMarkers(msg, MarkerType.Quest)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.UnacceptedQuestMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.unacceptedQuestMarkers = this.processDynamicMarkers(msg, MarkerType.QuestUnaccepted)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.QuestLinkMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.questLinkMarkers = this.processDynamicMarkers(msg, MarkerType.QuestLink)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.LevequestMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.levequestMarkers = this.processDynamicMarkers(msg, MarkerType.Levequest)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.ActiveLevequestMarker, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.activeLevequestMarkers = this.processDynamicMarkers([msg], MarkerType.LevequestActive)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.GuildLeveAssignmentMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.guildLeveAssignmentMarkers = this.processDynamicMarkers(msg, MarkerType.GuildLeveAssignment)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.GuildOrderGuideMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.guildOrderGuideMarkers = this.processDynamicMarkers(msg, MarkerType.GuildOrderGuide)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.HousingMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.housingMarkers = this.processDynamicMarkers(msg, MarkerType.Housing)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.TripleTriadMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.tripleTriadMarkers = this.processDynamicMarkers(msg, MarkerType.TripleTriad)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.CustomTalkMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.customTalkMarkers = this.processDynamicMarkers(msg, MarkerType.CustomTalk)
                this.dynamicMarkersChanged.emit()
            })
        })

        webSocketService.on(MessageType.GemstoneTraderMarkers, msg => {
            this.mapState.onceMapDataLoaded(() => {
                this.gemstoneTraderMarkers = this.processDynamicMarkers(msg, MarkerType.GemstoneTrader)
                this.dynamicMarkersChanged.emit()
            })
        })
    }

    getMarkers(mapId: number): DynamicMarker[] {
        return Object.values(this.markers[mapId] ?? {})
    }

    private rebuildMergedMarkers(): Record<number, DynamicMarker[]> {
        const out: Record<number, DynamicMarker[]> = {}

        const keys = new Set<number>([
            ...Object.keys(this._questMarkers).map(Number),
            ...Object.keys(this._questLinkMarkers).map(Number),
            ...Object.keys(this._unacceptedQuestMarkers).map(Number),
            ...Object.keys(this._levequestMarkers).map(Number),
            ...Object.keys(this._activeLevequestMarkers).map(Number),
            ...Object.keys(this._guildLeveAssignmentMarkers).map(Number),
            ...Object.keys(this._guildOrderGuideMarkers).map(Number),
            ...Object.keys(this._housingMarkers).map(Number),
            ...Object.keys(this._tripleTriadMarkers).map(Number),
            ...Object.keys(this._customTalkMarkers).map(Number),
            ...Object.keys(this._gemstoneTraderMarkers).map(Number),
        ])

        for (const mapId of keys) {
            out[mapId] = [
                ...(this._questMarkers[mapId] ?? []),
                ...(this._questLinkMarkers[mapId] ?? []),
                ...(this._unacceptedQuestMarkers[mapId] ?? []),
                ...(this._levequestMarkers[mapId] ?? []),
                ...(this._activeLevequestMarkers[mapId] ?? []),
                ...(this._guildLeveAssignmentMarkers[mapId] ?? []),
                ...(this._guildOrderGuideMarkers[mapId] ?? []),
                ...(this._housingMarkers[mapId] ?? []),
                ...(this._tripleTriadMarkers[mapId] ?? []),
                ...(this._customTalkMarkers[mapId] ?? []),
                ...(this._gemstoneTraderMarkers[mapId] ?? []),
            ]
        }

        return out
    }

    private processDynamicMarkers(markers: DynamicMarker[], type: MarkerType): Record<number, DynamicMarker[]> {
        markers.forEach(marker => this.processDynamicMarker(marker, type))

        return markers.reduce<Record<number, DynamicMarker[]>>((acc, marker) => {
            const dataByMap = new Map<number, DynamicMarkerData[]>()
            for (const data of marker.data) {
                const existing = dataByMap.get(data.mapId)
                if (existing) {
                    existing.push(data)
                } else {
                    dataByMap.set(data.mapId, [data])
                }
            }

            /* Create a marker copy for each map with only its relevant data */
            for (const [mapId, filteredData] of dataByMap) {
                const markerForMap: DynamicMarker = { ...marker, data: filteredData }
                const group = acc[mapId]
                if (group) {
                    group.push(markerForMap)
                } else {
                    acc[mapId] = [markerForMap]
                }
            }
            return acc
        }, {})
    }

    private processDynamicMarker(marker: DynamicMarker, type: MarkerType) {
        marker.type = type
        marker.data.forEach(data => {
            data.position = this.mapSpaceTransform(data.mapId, data.position) ?? data.position

            let icon = data.icon
            switch (icon) {
                case 60491:
                case 60493:
                case 60494:
                    data.icon = 0;
                    break;
            }
        })
    }

    private mapSpaceTransform(mapId: number, position: Vector3): Vector3 | undefined {
        const map = this.mapState.getMap(mapId)
        if (!map) {
            return undefined
        }

        const scaleFactor = map.sizeFactor / 100

        return  {
            x: (position.x * scaleFactor) - (-map.offsetX * scaleFactor) + 1024,
            y: (position.y * scaleFactor) - (-map.offsetY * scaleFactor) + 1024,
            z: position.z,
        }
    }

    onDynamicMarkersChanged(handler: EventMarkersChangedHandler) {
        this.dynamicMarkersChanged.add(handler)
    }
}
