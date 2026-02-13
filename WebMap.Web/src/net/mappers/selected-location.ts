import { SelectedLocation as FBSelectedLocation } from '@/net/models'
import type { SelectedLocation } from '@/types/map'

export default function mapSelectedLocation(fb: FBSelectedLocation): SelectedLocation {
    return {
        mapId: fb.mapId(),
        discoveryMask: fb.discoveryMask(),
    }
}
