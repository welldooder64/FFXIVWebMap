import type MapTexture from '@/render/textures/MapTexture'

export interface MapData {
    maps: Record<number, Map>
    markers: Record<number, Record<number, MapMarker>>
}

export interface Map {
    id: string
    discoveryFlag: number
    offsetX: number
    offsetY: number
    sizeFactor: number
    mapMarkerRange: number
}

export interface MapMarker {
    id: number
    icon: number
    title: string
    subtextOrientation: number
    x: number
    y: number
}

export interface MapImageSet {
    foreground: MapTexture
    background?: MapTexture
    mask?: MapTexture
}

export interface Location {
    mapId: number
}

export interface SelectedLocation {
    mapId: number
    discoveryMask: number
}
