import { resourcePathFor } from '@/constants'
import ImageTexture from '@/render/textures/ImageTexture'

export const MapLayer = {
    FOREGROUND: '_m',
    BACKGROUND: 'm_m',
    MASK: 'd',
} as const;

type MapLayer = typeof MapLayer[keyof typeof MapLayer];

export default class MapTexture extends ImageTexture<string> {
    private readonly layer: MapLayer

    constructor(gl: WebGL2RenderingContext, id: string, layer: MapLayer) {
        super(gl, id)
        this.layer = layer;
    }

    get url(): string {
        return  resourcePathFor(`ui/map/${this.id}/${this.id.replace('/', '')}${this.layer}.png`)
    }
}
