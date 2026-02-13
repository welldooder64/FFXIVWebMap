import type Viewport from '@/render/Viewport'
import RenderTarget from '@/render/gl/RenderTarget'
import Layer from '@/render/layers/Layer'
import type Texture from '@/render/textures/Texture'
import IconPass from '@/render/passes/IconPass'
import { CoordinateSpace, type Transform } from '@/types/math'
import type { Assets } from '@/types/map'

export interface PlayerLayerState {
    playerTransform?: Transform
    cameraRotation?: number
}

export default class PlayerLayer extends Layer<PlayerLayerState> {
    public readonly coordinateSpace = CoordinateSpace.Screen

    private readonly renderTarget: RenderTarget
    private readonly iconPass: IconPass

    /* Asset aliases */
    private readonly iconAtlas = this.assets.atlas.icon
    private readonly naviMapAtlas = this.assets.atlas.naviMap

    /* State needed for rendering the layer */
    private playerTransform?: Transform
    private cameraRotation?: number

    constructor(gl: WebGL2RenderingContext, assets: Assets) {
        super(gl, assets)

        this.renderTarget = new RenderTarget(gl)
        this.iconPass = new IconPass(gl)
    }

    protected updateState(state: PlayerLayerState): Promise<void> | void {
        if ('playerTransform' in state) {
            this.playerTransform = state.playerTransform
        }

        if ('cameraRotation' in state) {
            this.cameraRotation = state.cameraRotation
        }
    }

    protected draw(viewport: Viewport): Texture | undefined {
        if (!this.playerTransform || !this.cameraRotation) return

        const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()

        return this.renderTarget.use(screenWidth, screenHeight, () => {
            if (!this.playerTransform || !this.cameraRotation) return

            const playerRotation = -this.playerTransform.rotation - Math.PI
            const cameraRotation = -this.cameraRotation - Math.PI - (Math.PI / 4)

            this.iconPass.begin(viewport)

            /* Draw shadow first */
            this.iconPass.addInstance(this.naviMapAtlas, {
                position: this.playerTransform.position,
                rotation: cameraRotation,
                uvOffset: this.naviMapAtlas.get('playerShadow'),
                iconOffset: { x: 25, y: -25 },
                useSecondarySampler: true,
            })

            /* Draw player icon */
            this.iconPass.addInstance(this.iconAtlas, {
                position: this.playerTransform.position,
                rotation: playerRotation,
                uvOffset: this.iconAtlas.get(60443),
            })

            this.iconPass.draw(this.iconAtlas, this.naviMapAtlas)
        })
    }
}
