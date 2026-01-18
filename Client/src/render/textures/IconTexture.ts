import { resourcePathFor } from '@/constants'
import ImageTexture from '@/render/textures/ImageTexture'

export default class IconTexture extends ImageTexture<number> {
    get url(): string {
        const iconGroupIndex = Math.floor(this.id / 1000).toString().padStart(3, '0')
        const iconIdString = this.id.toString().padStart(6, '0')
        return  resourcePathFor(`ui/icon/${iconGroupIndex}000/${iconIdString}_hr1.png`)
    }
}
