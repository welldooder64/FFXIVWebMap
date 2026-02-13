import type {
    MapData as FBMapData,
    MarkerName as FBMarkerName,
    MapMarkersPair as FBMapMarkersPair
} from '@/net/models'
import { mapToRecord } from '@/net/mappers/util'
import type { MapData } from '@/types/map'
import type { StaticMarker } from '@/types/static-marker'

import mapMap from './map'
import mapStaticMarker from './static-marker';

function mapMarkersToNestedRecord(
    length: number,
    getter: (i: number) => FBMapMarkersPair | null
): Record<number, Record<number, StaticMarker>> {
    const result: Record<number, Record<number, StaticMarker>> = {}
    for (let i = 0; i < length; i++) {
        const pair = getter(i)
        if (!pair) continue

        const key = pair.key()
        const markers: Record<number, StaticMarker> = {}

        for (let j = 0; j < pair.valueLength(); j++) {
            const marker = pair.value(j)
            if (marker) {
                markers[marker.subRowId()] = mapStaticMarker(marker)
            }
        }

        result[key] = markers
    }
    return result
}

export default function mapMapData(fb: FBMapData): MapData {
    return {
        maps: mapToRecord(
            fb.mapsLength(),
            i => fb.maps(i),
            mapMap,
            (_, fbMap) => fbMap.rowId()
        ),
        markers: mapMarkersToNestedRecord(
            fb.markersLength(),
            i => fb.markers(i)
        ),
        markerNames: mapToRecord(
            fb.markerNamesLength(),
            i => fb.markerNames(i),
            (fbName: FBMarkerName) => fbName.name()!,
            (_, fbName) => fbName.id()
        ),
    }
}
