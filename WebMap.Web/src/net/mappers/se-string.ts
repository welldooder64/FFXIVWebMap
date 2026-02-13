import type { SeString as FBSeString } from '@/net/models'
import type { SeString } from '@/types/string'

export default function mapSeString(fb: FBSeString | null | undefined): SeString | undefined {
    if (!fb) return undefined

    const arr = fb.dataArray()
    if (!arr || arr.length === 0) return undefined

    /* Copy to a new Uint8Array to detach from the FlatBuffer */
    return new Uint8Array(arr)
}
