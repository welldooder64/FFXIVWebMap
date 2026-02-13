import {
    StaticMarker as FBStaticMarker,
    AetheryteData as FBAetheryteData,
    MapLinkData as FBMapLinkData,
    PlaceNameData as FBPlaceNameData,
} from '@/net/models'
import { StaticMarkerData } from '@/net/models'
import type {
    StaticMarker,
    NormalStaticMarker,
    MapLinkStaticMarker,
    ImplicitMapLinkStaticMarker,
    AetheryteStaticMarker,
    PlaceNameStaticMarker,
    UnknownStaticMarker,
} from '@/types/static-marker'
import { StaticMarkerDataType } from '@/types/static-marker'
import mapSeString from './se-string'

export default function mapStaticMarker(fb: FBStaticMarker): StaticMarker {
    const position = fb.position()!
    const base = {
        title: mapSeString(fb.title()),
        icon: fb.icon() ?? undefined,
        position: { x: position.x(), y: position.y() },
        subtextOrientation: fb.subtextOrientation() ?? 0,
        type: fb.type(),
    }

    const dataType = fb.dataType()

    switch (dataType) {
        case StaticMarkerData.NONE:
            return {
                ...base,
                dataType: StaticMarkerDataType.Normal,
            } as NormalStaticMarker

        case StaticMarkerData.MapLink: {
            const data = fb.data(new FBMapLinkData()) as FBMapLinkData | null
            return {
                ...base,
                dataType: StaticMarkerDataType.MapLink,
                targetMapId: data?.targetMapId()!,
            } as MapLinkStaticMarker
        }

        case StaticMarkerData.ImplicitMapLink: {
            const data = fb.data(new FBMapLinkData()) as FBMapLinkData | null
            return {
                ...base,
                dataType: StaticMarkerDataType.ImplicitMapLink,
                targetMapId: data?.targetMapId()!,
            } as ImplicitMapLinkStaticMarker
        }

        case StaticMarkerData.Aetheryte: {
            const data = fb.data(new FBAetheryteData()) as FBAetheryteData | null
            return {
                ...base,
                dataType: StaticMarkerDataType.Aetheryte,
                aetheryteId: data?.aetheryteId()!,
            } as AetheryteStaticMarker
        }

        case StaticMarkerData.PlaceName: {
            const data = fb.data(new FBPlaceNameData()) as FBPlaceNameData | null
            return {
                ...base,
                dataType: StaticMarkerDataType.PlaceName,
                tooltip: mapSeString(data?.tooltip()),
            } as PlaceNameStaticMarker
        }

        default:
            return {
                ...base,
                dataType: dataType,
                dataKey: dataType,
            } as UnknownStaticMarker
    }
}
