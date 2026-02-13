import {
    QuestLinkMarkerList as FBQuestLinkMarkerList,
    QuestLinkMarker as FBQuestLinkMarker,
} from '@/net/models'
import type { DynamicMarker } from '@/types/dynamic-marker'
import { MarkerType } from '@/types/dynamic-marker'
import mapVector3 from './vector3'

function mapQuestLinkMarker(fb: FBQuestLinkMarker): DynamicMarker {
    return {
        objectiveId: 0,
        label: '',
        data: [{
            levelId: fb.levelId(),
            objectiveId: 0,
            tooltip: fb.tooltip() ?? '',
            icon: fb.icon(),
            position: mapVector3(fb.position()!),
            radius: 0,
            mapId: fb.sourceMapId(),
            dataId: 0,
        }],
        recommendedLevel: fb.recommendedLevel(),
        shouldRender: true,
        type: MarkerType.QuestLink,
    }
}

export default function mapQuestLinkMarkerList(fb: FBQuestLinkMarkerList): DynamicMarker[] {
    const markers: DynamicMarker[] = new Array(fb.markersLength())
    for (let i = 0; i < fb.markersLength(); i++) {
        const marker = fb.markers(i)
        if (marker) {
            markers[i] = mapQuestLinkMarker(marker)
        }
    }
    return markers
}
