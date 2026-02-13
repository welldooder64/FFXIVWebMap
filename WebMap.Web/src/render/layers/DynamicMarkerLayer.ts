import RenderTarget from '@/render/gl/RenderTarget'
import Layer from '@/render/layers/Layer'
import type Texture from '@/render/textures/Texture'
import { type DynamicMarker, type DynamicMarkerData, type MarkerSetting } from '@/types/dynamic-marker'
import type { Assets } from '@/types/map'
import IconPass from '@/render/passes/IconPass'
import type Viewport from '@/render/Viewport'
import { CoordinateSpace } from '@/types/math'
import { MARKER_SETTINGS, MARKER_SETTINGS_DEFAULT } from '@/constants'

export interface EventMarkerLayerState {
    markers?: DynamicMarker[]
    playerZPosition?: number
}

export default class DynamicMarkerLayer extends Layer<EventMarkerLayerState> {
    public readonly coordinateSpace = CoordinateSpace.Screen

    private readonly renderTarget: RenderTarget
    private readonly iconPass: IconPass

    /* Asset aliases */
    private readonly areaMapAtlas = this.assets.atlas.areaMap
    private readonly iconAtlas = this.assets.atlas.icon

    /* State needed for rendering the layer */
    private markers: DynamicMarker[] = []
    private playerZPosition?: number

    constructor(gl: WebGL2RenderingContext, textureAtlases: Assets) {
        super(gl, textureAtlases)

        this.renderTarget = new RenderTarget(gl)
        this.iconPass = new IconPass(gl)
    }

    private getArrowState(settings: MarkerSetting, markerData: DynamicMarkerData, playerZPosition?: number): number {
        if (playerZPosition === undefined) return 0

        if (markerData.radius <= 1 || !settings.radius.enabled) return 0

        const zDiff = playerZPosition - markerData.position.z
        if (zDiff < 0) return 1 // Up
        if (zDiff > 20) return 2 // Down
        return 0 // None
    }

    protected updateState(state: EventMarkerLayerState): boolean {
        let changed = false

        if (state.markers !== undefined) {
            this.markers = state.markers
            changed = true
        }

        if (state.playerZPosition !== undefined && this.playerZPosition !== state.playerZPosition) {
            /* If changed is already set to true or the layer is already marked dirty, we can skip this check */
            if (!changed && !this.isDirty()) {
                /* Check if any marker's arrow state changed */
                for (const marker of this.markers) {
                    const settings = this.getSettings(marker)

                    for (const markerData of marker.data) {
                        if (this.getArrowState(settings, markerData, this.playerZPosition) !== this.getArrowState(settings, markerData, state.playerZPosition)) {
                            changed = true
                            break
                        }
                    }

                }
            }

            this.playerZPosition = state.playerZPosition
        }

        return changed
    }

    private rotation: number = 0

    private getSettings(marker: DynamicMarker): MarkerSetting {
        return MARKER_SETTINGS[marker.type] ?? MARKER_SETTINGS_DEFAULT
    }

    protected draw(viewport: Viewport, deltaTime: number): Texture | undefined {
        if (this.markers.length === 0) return

        const highlightUvOffset = this.areaMapAtlas.get('markerHighlight')
        const iconAtlas = this.iconAtlas

        this.rotation += deltaTime * 3

        const { width: screenWidth, height: screenHeight } = viewport.getScreenSize()
        return this.renderTarget.use(screenWidth, screenHeight, () => {
            this.iconPass.begin(viewport)

            /* Draw radii */
            for (const marker of this.markers) {
                const settings = this.getSettings(marker)

                for (const markerData of marker.data) {
                    if (markerData.radius <= 1 || !settings.radius.enabled) continue

                    /* Grab larger images based on how large the radius is */
                    const iconId =
                        markerData.radius >= 100 ? 60497 :
                        markerData.radius >= 50  ? 60496 :
                                60495

                    const arrowIconId =
                        markerData.radius >= 50 ? 60543 :
                            60542

                    let uvOffset = iconAtlas.get(iconId)
                    if (!uvOffset) {
                        continue
                    }

                    this.iconPass.addInstance(iconAtlas, {
                        position: markerData.position,
                        uvOffset,
                        scaleWithMap: true,
                        overrideSize: { x: markerData.radius * 2, y: markerData.radius * 2 },
                        colorAdd: settings.radius.color.add,
                        colorMultiply: settings.radius.color.multiply,
                    })

                    if (!this.playerZPosition) {
                        continue;
                    }

                    /* Draw arrow based on the player's Z position */
                    const zDiff = this.playerZPosition - markerData.position.z
                    const showUpArrow = zDiff < 0
                    const showDownArrow = zDiff > 20
                    if (showUpArrow || showDownArrow) {
                        const arrowUvOffset = iconAtlas.get(showDownArrow ? arrowIconId + 4 : arrowIconId)
                        if (arrowUvOffset) {
                            this.iconPass.addInstance(iconAtlas, {
                                position: markerData.position,
                                uvOffset: arrowUvOffset,
                                scaleWithMap: true,
                                iconOffset: { x: 0, y: -1 },
                                colorAdd: settings.radius.color.add,
                                colorMultiply: settings.radius.color.multiply,
                            })
                        }
                    }
                }
            }

            /* Draw highlights */
            for (const marker of this.markers) {
                const settings = this.getSettings(marker)

                for (const markerData of marker.data) {
                    if ((markerData.icon === 0 && markerData.radius > 1) || !settings.highlight) continue

                    this.markAnimating()
                    this.iconPass.addInstance(iconAtlas, {
                        position: markerData.position,
                        rotation: this.rotation,
                        uvOffset: highlightUvOffset,
                        useSecondarySampler: true,
                    })
                }
            }

            /* Draw icon */
            for (const marker of this.markers) {
                for (const markerData of marker.data) {
                    if (markerData.icon === 0) continue

                    let uvOffset = iconAtlas.get(markerData.icon)
                    if (!uvOffset) {
                        continue
                    }

                    this.iconPass.addInstance(iconAtlas, {
                        position: markerData.position,
                        uvOffset
                    })
                }
            }

            this.iconPass.draw(iconAtlas, this.areaMapAtlas)
        })
    }

}
