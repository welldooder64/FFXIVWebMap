import { Transform as FBTransform } from '@/net/models'
import type { Transform } from '@/types/math'
import mapVector3 from '@/net/mappers/vector3'

export default function mapTransform(fb: FBTransform): Transform {
    const position = fb.position()!
    return {
        position: mapVector3(position),
        rotation: fb.rotation(),
    }
}
