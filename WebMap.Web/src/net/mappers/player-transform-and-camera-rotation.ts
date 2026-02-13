import type { PlayerTransformAndCameraRotation as FBPlayerTransformAndCameraRotation } from '@/net/models'
import type { PlayerTransformAndCameraRotation } from '@/types/player'
import mapTransform from '@/net/mappers/transform';

export default function mapLocation(fb: FBPlayerTransformAndCameraRotation): PlayerTransformAndCameraRotation {
    return {
        cameraRotation: fb.cameraRotation(),
        playerTransform: mapTransform(fb.playerTransform()!)
    }
}
