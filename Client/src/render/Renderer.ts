import Viewport from '@/render/Viewport'
import Layer from '@/render/layers/Layer'
import CompositorPass from '@/render/passes/compositor/CompositorPass'
import type { Dimension } from '@/types/math'

/**
 * Renderer class is responsible for managing WebGL-based canvas rendering,
 * including setting up the rendering environment, handling viewports, zoom,
 * pan operations, and rendering images or overlays. It manages WebGL states,
 * supports redraw requests, and handles responsive canvas resizing.
 */
export default class Renderer {
    public readonly canvas: HTMLCanvasElement

    /* WebGL state */
    readonly gl: WebGL2RenderingContext

    /* Passes & Layers */
    private readonly compositor: CompositorPass
    private readonly layers: Layer<any>[]

    /* View state */
    private viewport = new Viewport(this)

    /* Render scheduling */
    private needsRedraw: boolean = false

    constructor(elementId: string, initializeLayers: (gl: WebGL2RenderingContext) => Layer<any>[]) {
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

        /* Initialize layers */
        this.layers = initializeLayers(this.gl)

        /* Set GL defaults */
        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1)

        /* Create helpers / passes */
        this.compositor = new CompositorPass(this.gl)

        /* Initialize size and GL state */
        this.resizeToViewport()

        /* Run the animation loop */
        requestAnimationFrame(this.animate.bind(this))
    }

    private requestRedraw() {
        this.needsRedraw = true
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
        this.requestRedraw()
    }

    zoomAt(ax: number, ay: number, factor: number) {
        this.viewport.zoomAt(ax, ay, factor)
        this.requestRedraw()
    }

    resetView() {
        this.viewport.reset()
        this.requestRedraw()
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
    }

    /**
     * Animates the canvas by checking and acting on factors such as canvas size changes,
     * the need to redraw, or layers marked as dirty. If any of these conditions are true,
     * the canvas is resized or redrawn accordingly before scheduling the next frame.
     */
    animate() {
        const targetSize = this.targetSize
        const didResize = this.canvas.width !== targetSize.width || this.canvas.height !== targetSize.height

        if (didResize || this.needsRedraw || this.layers.some(layer => layer.isDirty())) {
            if (didResize) {
                this.resizeToViewport()
            }

            this.render()
            this.needsRedraw = false
        }

        requestAnimationFrame(this.animate.bind(this))
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
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)

        const layerResults = this.layers.map(layer => ({
            texture: layer.render(this.viewport),
            space: layer.coordinateSpace
        })).filter(it => it.texture !== undefined)

        if (layerResults.length === 0) {
            return
        }

        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

        for (const result of layerResults) {
            this.compositor.draw(this.viewport, result.texture!, result.space)
        }

        this.gl.disable(this.gl.BLEND)
    }
}
