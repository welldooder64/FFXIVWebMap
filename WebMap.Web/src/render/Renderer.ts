import Viewport from '@/render/Viewport'
import Layer from '@/render/layers/Layer'
import CompositorPass from '@/render/passes/CompositorPass'
import { CoordinateSpace, type Dimension } from '@/types/math'
import { FRAMERATE_LIMIT } from '@/constants'

/**
 * Renderer class is responsible for managing WebGL-based canvas rendering,
 * including setting up the rendering environment, handling viewports, zoom,
 * pan operations, and rendering images or overlays. It manages WebGL states,
 * supports redraw requests, and handles responsive canvas resizing.
 */
export default class Renderer {
    public readonly canvas: HTMLCanvasElement

    /* WebGL state */
    private readonly gl: WebGL2RenderingContext

    /* Passes & Layers */
    private readonly compositor: CompositorPass
    private readonly initializeLayers: (gl: WebGL2RenderingContext) => Promise<Layer<any>[]>
    private layers: Layer<any>[] = []

    /* View state */
    private viewport = new Viewport(this)

    /* Render scheduling */
    private viewportChanged: boolean = false
    private lastFrameTime: number = 0

    private readonly animateBound = (time: number) => this.animate(time)

    constructor(elementId: string, initializeLayers: (gl: WebGL2RenderingContext) => Promise<Layer<any>[]>) {
        /* Retrieve canvas DOM element */
        const canvas = document.getElementById(elementId) as HTMLCanvasElement | null
        if (!canvas) {
            throw new Error('Canvas not found')
        }
        this.canvas = canvas

        /* Get the WebGL2 context */
        const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })
        if (!gl) {
            throw new Error('WebGL not supported')
        }
        this.gl = gl

        this.initializeLayers = initializeLayers

        /* Set GL defaults */
        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
        this.gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

        /* Create helpers / passes */
        this.compositor = new CompositorPass(this.gl)

        /* Initialize size and GL state */
        this.resizeToViewport()
    }

    /**
     * Starts the animation loop by requesting the first animation frame.
     * Binds the `animate` method to the current context to ensure proper execution.
     */
    async start() {
        this.layers = await this.initializeLayers(this.gl)

        this.lastFrameTime = performance.now()
        requestAnimationFrame(this.animateBound)
    }

    private markViewportChanged() {
        this.viewportChanged = true
    }

    private get targetSize(): Dimension {
        const dpr = window.devicePixelRatio
        const targetWidth = Math.round(this.canvas.clientWidth * dpr)
        const targetHeight = Math.round(this.canvas.clientHeight * dpr)

        return { width: targetWidth, height: targetHeight }
    }

    get size() {
        return { width: this.canvas.width, height: this.canvas.height }
    }

    setCursor(cursor: string) {
        this.canvas.style.cursor = cursor
    }


    panBy(dx: number, dy: number) {
        this.viewport.panBy(dx, dy)
        this.markViewportChanged()
    }

    zoomAt(ax: number, ay: number, factor: number) {
        this.viewport.zoomAt(ax, ay, factor)
        this.markViewportChanged()
    }

    resetView() {
        this.viewport.reset()
        this.markViewportChanged()
    }

    /**
     * Resizes the canvas element to match the target size in device pixels.
     * This method ensures that the canvas width and height are adjusted
     * based on the specified target size dimensions.
     */
    resizeToViewport() {
        const targetSize = this.targetSize

        /* Size the canvas in device pixels */
        this.canvas.width = targetSize.width
        this.canvas.height = targetSize.height

        this.markViewportChanged()
    }

    /**
     * Animates the canvas by checking and acting on factors such as canvas size changes,
     * the need to redraw, or layers marked as dirty. If any of these conditions are true,
     * the canvas is resized or redrawn accordingly before scheduling the next frame.
     */
    animate(time: number) {
        requestAnimationFrame(this.animateBound)

        const elapsedMs = time - this.lastFrameTime

        if (FRAMERATE_LIMIT > 0) {
            const frameBudgetMs = 1000 / FRAMERATE_LIMIT

            /* Not enough time has passed yet; skip rendering this tick */
            if (elapsedMs < frameBudgetMs) {
                return
            }

            /* Snap forward by whole frame intervals to reduce drift/jitter */
            this.lastFrameTime = time - (elapsedMs % frameBudgetMs)
        } else {
            /* Uncapped */
            this.lastFrameTime = time
        }

        const deltaTime = elapsedMs / 1000

        const targetSize = this.targetSize
        if (this.canvas.width !== targetSize.width || this.canvas.height !== targetSize.height) {
            this.resizeToViewport()
        }

        if (this.viewportChanged || this.layers.some(layer => layer.isDirty())) {
            this.render(deltaTime)
            this.viewportChanged = false
        }
    }

    /**
     * Renders all layers by clearing the canvas, processing each layer, and compositing the resulting visuals.
     *
     * The method starts by clearing the WebGL context to prepare for rendering.
     * It iterates through all available layers, invoking their `render` method and collecting their results if they produce a texture.
     * If no layers produce a texture, the method returns early without rendering anything further.
     *
     * For valid layer results, it enables blending to properly handle transparency, composites the textures onto the viewport,
     * and finally disables blending when all layers have been processed.
     */
    render(deltaTime: number) {
        const gl = this.gl
        gl.clear(gl.COLOR_BUFFER_BIT)

        const layerResults = this.layers.map(layer => {
            /* In case of the viewport changing, all layers rendered in screen space will be miss-sized, so we mark them all as dirty */
            if (this.viewportChanged && layer.coordinateSpace === CoordinateSpace.Screen) {
                layer.markDirty()
            }

            return {
                texture: layer.render(this.viewport, deltaTime),
                space: layer.coordinateSpace
            }
        }).filter(it => it.texture !== undefined)

        if (layerResults.length === 0) {
            return
        }

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)

        for (const result of layerResults) {
            this.compositor.draw(this.viewport, result.texture!, result.space)
        }

        gl.disable(gl.BLEND)
    }
}
