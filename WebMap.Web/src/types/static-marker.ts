import type { Vector2 } from '@/types/math'
import type { SeString } from '@/types/string'

export const StaticMarkerType = {
    Normal: 0,
    Title: 1,
} as const
export type StaticMarkerType = typeof StaticMarkerType[keyof typeof StaticMarkerType]

export const StaticMarkerDataType = {
    Normal: 0,
    MapLink: 1,
    ImplicitMapLink: 2,
    Aetheryte: 3,
    PlaceName: 4,
} as const
export type StaticMarkerDataType = typeof StaticMarkerDataType[keyof typeof StaticMarkerDataType]

export const SubtextOrientation = {
    Left: 1,
    Right: 2,
    Bottom: 3,
    Top: 4,
} as const
export type SubtextOrientation = typeof SubtextOrientation[keyof typeof SubtextOrientation] | number

interface StaticMarkerBase {
    title?: SeString
    icon?: number
    position: Vector2
    subtextOrientation: SubtextOrientation | number
    type: StaticMarkerType
    dataType: number
}

export interface NormalStaticMarker extends StaticMarkerBase {
    dataType: typeof StaticMarkerDataType.Normal
}

export interface MapLinkStaticMarker extends StaticMarkerBase {
    dataType: typeof StaticMarkerDataType.MapLink
    targetMapId: number
}

export interface ImplicitMapLinkStaticMarker extends StaticMarkerBase {
    dataType: typeof StaticMarkerDataType.ImplicitMapLink
    targetMapId: number
}

export interface AetheryteStaticMarker extends StaticMarkerBase {
    dataType: typeof StaticMarkerDataType.Aetheryte
    aetheryteId: number
}

export interface PlaceNameStaticMarker extends StaticMarkerBase {
    dataType: typeof StaticMarkerDataType.PlaceName
    tooltip: SeString
}

export interface UnknownStaticMarker extends StaticMarkerBase {
    dataKey: number
}

export type StaticMarker =
    | NormalStaticMarker
    | MapLinkStaticMarker
    | ImplicitMapLinkStaticMarker
    | AetheryteStaticMarker
    | PlaceNameStaticMarker
    | UnknownStaticMarker
