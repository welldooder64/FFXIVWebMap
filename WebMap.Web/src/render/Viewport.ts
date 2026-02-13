import { BASE_MAP_SIZE, ZOOM_MAX_SCALE, ZOOM_MIN_SCALE } from '@/constants'
import type Renderer from '@/render/Renderer'
import type { Dimension, Rectangle, Vector2 } from '@/types/math'

/**
 * Simple viewport model that stores zoom (relative to base fit) and pan offsets in device pixels.
 * Renderer is responsible for converting this into actual draw rect values.
 */
export default class Viewport {
    private readonly renderer: Renderer

    /* Zoom multiplier relative to the base-fit size computed by the Renderer */
    zoom: number = 1

    /* Pan offsets in device pixels, applied on top of the base-fit rect */
    panX: number = 0
    panY: number = 0

    constructor(renderer: Renderer) {
        this.renderer = renderer
    }

    getScreenSize(): Dimension {
        return this.renderer.size
    }

    getScale(): number {
        return this.getBaseScale() * this.zoom
    }

    getScreenDrawRect(): Rectangle {
        return { x: 0, y: 0, ...this.getScreenSize() }
    }

    getCenter(): Vector2 {
        const base = this.getBaseMapSize()
        const { dx: baseDx, dy: baseDy } = this.getBaseOffsets()

        const cx = baseDx + base / 2 + this.panX
        const cy = baseDy + base / 2 + this.panY

        return { x: cx, y: cy }
    }

    /**
     * Calculates the rectangle where the base map should be drawn in Screen Space.
     */
    getMapDrawRect(): Rectangle {
        const { x: cx, y: cy } = this.getCenter()
        const size = this.getScale() * BASE_MAP_SIZE

        const dx = Math.round(cx - size / 2)
        const dy = Math.round(cy - size / 2)

        return { x: dx, y: dy, width: size, height: size }
    }

    reset() {
        this.zoom = 1
        this.panX = 0
        this.panY = 0
    }

    setZoom(next: number) {
        this.zoom = Math.max(ZOOM_MIN_SCALE, Math.min(ZOOM_MAX_SCALE, next))
    }

    zoomAt(ax: number, ay: number, factor: number) {
        const base = this.getBaseMapSize()
        const { dx: baseDx, dy: baseDy } = this.getBaseOffsets()

        const cx = baseDx + base / 2
        const cy = baseDy + base / 2

        const z = this.zoom
        const dx = cx - (base * z) / 2 + this.panX
        const dy = cy - (base * z) / 2 + this.panY

        const bx = (ax - dx) / z
        const by = (ay - dy) / z

        this.setZoom(z * factor)
        const z2 = this.zoom

        const newDx = ax - bx * z2
        const newDy = ay - by * z2

        this.panX = Math.round(newDx - cx + (base * z2) / 2)
        this.panY = Math.round(newDy - cy + (base * z2) / 2)
    }

    panBy(dx: number, dy: number) {
        const { width, height } = this.getScreenSize()

        const maxPan = Math.min(width, height) / 2 * this.zoom

        /* Clamp pan to keep the map within at least half of the viewport */
        this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX + dx))
        this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY + dy))
    }

    private getBaseScale(): number {
        const { width: screenWidth, height: screenHeight } = this.getScreenSize()

        const isWide = (window.innerWidth >= window.innerHeight)
        return isWide ? (screenHeight / BASE_MAP_SIZE) : (screenWidth / BASE_MAP_SIZE)
    }

    private getBaseMapSize(): number {
        return BASE_MAP_SIZE * this.getBaseScale()
    }

    private getBaseOffsets() {
        const { width: screenWidth, height: screenHeight } = this.getScreenSize()
        const base = this.getBaseMapSize()

        return {
            dx: (screenWidth - base) / 2,
            dy: (screenHeight - base) / 2
        }
    }
}
