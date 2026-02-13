import type { Map as FBMap } from '@/net/models'
import type { Map } from '@/types/map'

export default function mapMap(fb: FBMap): Map {
    return {
        id: fb.id()!,
        discoveryFlag: fb.discoveryFlag(),
        offsetX: fb.offsetX(),
        offsetY: fb.offsetY(),
        sizeFactor: fb.sizeFactor(),
        mapMarkerRange: fb.mapMarkerRange(),
    }
}
