import { RESOURCE_PATH } from '@/constants'
import ImageTexture from '@/render/textures/ImageTexture'

export default class IconTexture extends ImageTexture<number> {
    override getUrl(highResolution: boolean = this.highResolution, format: string = this.format): string {
        const iconGroupIndex = Math.floor(this.id / 1000).toString().padStart(3, '0')
        const iconIdString = this.id.toString().padStart(6, '0')
        return `${RESOURCE_PATH}ui/icon/${iconGroupIndex}000/${iconIdString}${highResolution ? '_hr1' : ''}.${format}`
    }
}
