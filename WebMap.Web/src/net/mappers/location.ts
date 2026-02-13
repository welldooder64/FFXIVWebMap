import type { Location as FBLocation } from '@/net/models'
import type { Location } from '@/types/map'

export default function mapLocation(fb: FBLocation): Location {
    return {
        mapId: fb.mapId(),
    }
}
