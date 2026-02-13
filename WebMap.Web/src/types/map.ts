import type MapTexture from '@/render/textures/MapTexture'
import TextureAtlas from '@/render/textures/TextureAtlas'
import type { StaticMarker } from '@/types/static-marker'
import type FontFamily from '@/render/textures/FontFamily'

export interface MapData {
    maps: Record<number, Map>
    markers: Record<number, Record<number, StaticMarker>>
    markerNames: Record<number, string>
}

export interface Map {
    id: string
    discoveryFlag: number
    offsetX: number
    offsetY: number
    sizeFactor: number
    mapMarkerRange: number
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

export interface Assets {
    font: {
        notoSans: FontFamily
    }
    atlas: {
        icon: TextureAtlas<number>
        areaMap: TextureAtlas<string>
        naviMap: TextureAtlas<string>
    }
}
