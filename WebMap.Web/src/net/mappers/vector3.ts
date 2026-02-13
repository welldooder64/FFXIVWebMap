import { Vector3 as FBVector3 } from '@/net/models'
import type { Vector3 } from '@/types/math'

export default function mapVector3(fb: FBVector3): Vector3 {
    return {
        x: fb.x(),
        y: fb.y(),
        z: fb.z(),
    }
}
