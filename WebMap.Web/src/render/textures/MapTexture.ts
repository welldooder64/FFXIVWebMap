import { RESOURCE_PATH } from '@/constants'
import ImageTexture, { type ImageTextureOptions } from '@/render/textures/ImageTexture'

export const MapLayer = {
    FOREGROUND: '_m',
    BACKGROUND: 'm_m',
    MASK: 'd',
} as const

type MapLayer = typeof MapLayer[keyof typeof MapLayer]

export default class MapTexture extends ImageTexture<string> {
    private readonly layer: MapLayer

    constructor(gl: WebGL2RenderingContext, id: string, options: Omit<ImageTextureOptions, 'highResolution'>, layer: MapLayer) {
        super(gl, id, { ...options, highResolution: false })
        this.layer = layer
    }

    override getUrl(_: boolean = this.highResolution, format: string = this.format): string {
        return  `${RESOURCE_PATH}ui/map/${this.id}/${this.id.replace('/', '')}${this.layer}.${format}`
    }
}
