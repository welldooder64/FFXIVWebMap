import RenderTarget from '@/render/gl/RenderTarget'
import type Viewport from '@/render/Viewport'
import Layer from '@/render/layers/Layer'
import type Texture from '@/render/textures/Texture'
import IconPass from '@/render/passes/IconPass'
import { CoordinateSpace } from '@/types/math'
import type { Assets } from '@/types/map'
import { type StaticMarker } from '@/types/static-marker'

export interface MarkerLayerState {
    markers: StaticMarker[]
}

export default class StaticMarkerLayer extends Layer<MarkerLayerState> {
    public readonly coordinateSpace = CoordinateSpace.Screen

    private readonly renderTarget: RenderTarget
    private readonly iconPass: IconPass
    // private readonly textPass: TextPass

    /* Asset aliases */
    private readonly iconAtlas = this.assets.atlas.icon

    /* State needed for rendering the layer */
    private markers: StaticMarker[] = []

    constructor(gl: WebGL2RenderingContext, textureAtlases: Assets) {
        super(gl, textureAtlases)

        this.renderTarget = new RenderTarget(gl)
        this.iconPass = new IconPass(gl)
        // this.textPass = new TextPass(gl)
    }

    protected updateState(state: MarkerLayerState): Promise<void> | void {
        this.markers = state.markers
    }

    protected draw(viewport: Viewport): Texture | undefined {
        if (this.markers.length === 0) return

        const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()
        // const scale = viewport.getScale()

        return this.renderTarget.use(screenWidth, screenHeight, () => {
            /* Draw icons */
            this.iconPass.begin(viewport)

            for (const marker of this.markers) {
                if (marker.icon === undefined) continue

                let uvOffset = this.iconAtlas.get(marker.icon)
                if (!uvOffset) continue

                this.iconPass.addInstance(this.iconAtlas, {
                    position: marker.position,
                    rotation: 0,
                    uvOffset
                })
            }

            this.iconPass.draw(this.iconAtlas)

            /* Draw text */
            // const font = this.assets.font.notoSans.get('Regular')
            // this.textPass.begin(viewport)
            // for (const marker of this.markers) {
            //     if (marker.title === undefined || scale <= 1.25) continue
            //
            //     let anchorAlign: 'left' | 'center' | 'right' = 'center'
            //     let baseline: 'top' | 'middle' | 'bottom' = 'middle'
            //     let offset = { x: 0, y: 0 }
            //
            //     /* no offset when the text has no icon */
            //     const baseOffset = (marker.icon ? 22 / scale : 0)
            //
            //     switch (marker.subtextOrientation) {
            //         case SubtextOrientation.Left:
            //             anchorAlign = 'right'
            //             offset.x = -baseOffset
            //             break
            //         case SubtextOrientation.Right:
            //             anchorAlign = 'left'
            //             offset.x = baseOffset
            //             break
            //         case SubtextOrientation.Bottom:
            //             baseline = 'top'
            //             offset.y = baseOffset
            //             break
            //         case SubtextOrientation.Top:
            //             baseline = 'bottom'
            //             offset.y = -baseOffset
            //             break
            //         default:
            //             console.warn(`Unknown subtext orientation for marker '${marker.title}': ${marker.subtextOrientation}`)
            //     }
            //
            //     this.textPass.addText(font, {
            //         text: marker.title,
            //         fontSize: 12,
            //         position: {
            //             x: marker.position.x + offset.x,
            //             y: marker.position.y + offset.y,
            //         },
            //         letterSpacing: 0.1,
            //         anchorAlign,
            //         baseline,
            //
            //         fillColor: { r: 1, g: 1, b: 1, a: 1 },
            //         fillSoftness: 0.1,
            //         fillExpand: 0.02,
            //
            //         outlineColor: { r: 0, g: 0, b: 0 },
            //         outlineWidth: 0.08,
            //         outlineSoftness: 0.02,
            //     })
            // }
            //
            // this.textPass.draw(font)
        })
    }

}
