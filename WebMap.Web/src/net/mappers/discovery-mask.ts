import { DiscoveryMask as FBDiscoveryMask } from '@/net/models'

export default function mapDiscoveryMask(fb: FBDiscoveryMask): number {
    return fb.mask()
}
