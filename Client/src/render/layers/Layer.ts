import type Viewport from '@/render/Viewport'
import Texture from '@/render/textures/Texture'
import type { CoordinateSpace } from '@/types/math'

export default abstract class Layer<T> {
    protected readonly gl: WebGL2RenderingContext

    public abstract readonly coordinateSpace: CoordinateSpace

    private dirty: boolean = false
    private texture?: Texture

    protected constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
    }

    protected abstract updateState(state: T): Promise<void> | void

    protected abstract draw(viewport: Viewport): Texture | undefined

    isDirty(): boolean {
        return this.dirty
    }

    markDirty() {
        this.dirty = true
    }

    async update(state: T): Promise<void> {
        const result = this.updateState(state)

        if (result instanceof Promise) {
            return result.then(this.markDirty.bind(this))
        }

        this.markDirty()
    }

    render(viewport: Viewport): Texture | undefined {
        if (this.isDirty()) {
            console.debug('[LAY] Rendering layer', this.constructor.name)
            this.texture = this.draw(viewport)
            this.dirty = false
        }

        return this.texture
    }

}
