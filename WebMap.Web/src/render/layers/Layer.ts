import type Viewport from '@/render/Viewport'
import Texture from '@/render/textures/Texture'
import type { CoordinateSpace } from '@/types/math'
import type { Assets } from '@/types/map'

export default abstract class Layer<T> {
    protected readonly gl: WebGL2RenderingContext
    protected readonly assets: Assets

    public abstract readonly coordinateSpace: CoordinateSpace

    private hasAnimation: boolean = false
    private dirty: boolean = false
    private texture?: Texture

    protected constructor(gl: WebGL2RenderingContext, textureAtlases: Assets) {
        this.gl = gl
        this.assets = textureAtlases
    }

    protected abstract updateState(state: T): Promise<boolean | void> | boolean | void

    protected abstract draw(viewport: Viewport, deltaTime: number): Texture | undefined

    isDirty(): boolean {
        return this.dirty || this.hasAnimation
    }

    markDirty() {
        this.dirty = true
    }

    markAnimating() {
        this.hasAnimation = true
    }

    async update(state: T): Promise<boolean> {
        let result = this.updateState(state)

        if (result instanceof Promise) {
            result = await result
        }

        if ((typeof result === 'boolean' && result) || result === undefined) {
            this.markDirty()
            return true
        }

        return false
    }

    render(viewport: Viewport, deltaTime: number): Texture | undefined {
        if (this.isDirty() || true) {
            this.hasAnimation = false
            this.texture = this.draw(viewport, deltaTime)
            this.dirty = false
        }

        return this.texture
    }
}
