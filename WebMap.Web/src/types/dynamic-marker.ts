import type { Vector3 } from '@/types/math'

export interface DynamicMarker<T = MarkerType> {
    objectiveId: number
    label: string
    data: DynamicMarkerData[]
    recommendedLevel: number
    shouldRender: boolean
    type: T
}

export interface DynamicMarkerData {
    levelId: number
    objectiveId: number
    tooltip: string
    icon: number
    position: Vector3
    radius: number
    mapId: number
    dataId: number
}

// export const GameMarkerType = {
//     Unknown: 0,
//     Fate: 1,
//     Stellar: 6,
// } as const
// export type GameMarkerType = typeof GameMarkerType[keyof typeof GameMarkerType]

export const MarkerType = {
    Quest: 0,
    QuestUnaccepted: 1,
    QuestLink: 2,
    Levequest: 3,
    LevequestActive: 4,
    GuildLeveAssignment: 5,
    GuildOrderGuide: 6,
    Housing: 7,
    TripleTriad: 8,
    CustomTalk: 9,
    GemstoneTrader: 10,
    Flag: 11,
}
export type MarkerType = typeof MarkerType[keyof typeof MarkerType]

export interface MarkerSetting {
    highlight: boolean
    radius: {
        enabled: boolean
        color: {
            add: { r: number, g: number, b: number, a: number }
            multiply: { r: number, g: number, b: number, a: number }
        }
    }
}

export interface FlagMarker {
    mapId: number
}
