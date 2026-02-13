import {
    DynamicMarkerList as FBDynamicMarkerList,
    DynamicMarker as FBDynamicMarker,
    DynamicMarkerData as FBDynamicMarkerData,
} from '@/net/models'
import type { DynamicMarker, DynamicMarkerData, MarkerType } from '@/types/dynamic-marker'
import mapVector3 from './vector3'

function mapDynamicMarkerData(fb: FBDynamicMarkerData): DynamicMarkerData {
    const position = fb.position()
    return {
        levelId: fb.levelId(),
        objectiveId: fb.objectiveId(),
        tooltip: fb.tooltip()!,
        icon: fb.icon(),
        position: mapVector3(position!),
        radius: fb.radius(),
        mapId: fb.mapId(),
        dataId: fb.dataId(),
    }
}

export function mapDynamicMarker(fb: FBDynamicMarker, type: MarkerType): DynamicMarker {
    const data: DynamicMarkerData[] = new Array(fb.dataLength())
    for (let i = 0; i < fb.dataLength(); i++) {
        const item = fb.data(i)
        if (item) {
            data[i] = mapDynamicMarkerData(item)
        }
    }

    return {
        objectiveId: fb.objectiveId(),
        label: fb.label()!,
        data,
        recommendedLevel: fb.recommendedLevel(),
        shouldRender: fb.shouldRender(),
        type,
    }
}

export default function mapDynamicMarkerList(fb: FBDynamicMarkerList, type: MarkerType): DynamicMarker[] {
    const markers: DynamicMarker[] = new Array(fb.markersLength())
    for (let i = 0; i < fb.markersLength(); i++) {
        const marker = fb.markers(i)
        if (marker) {
            markers[i] = mapDynamicMarker(marker, type)
        }
    }
    return markers
}
