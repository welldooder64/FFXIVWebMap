import { ZOOM_INTENSITY } from '@/constants'
import type Renderer from '@/render/Renderer'
import EventMixin from '@/utils/EventMixin'

type ZoomChangeHandler = () => void
type PanChangeHandler = () => void

export default class MouseController {
    private renderer: Renderer
    private isPanning = false
    private panStartX = 0
    private panStartY = 0

    private readonly zoomChange = new EventMixin<ZoomChangeHandler>()
    private readonly panChange = new EventMixin<PanChangeHandler>()

    constructor(renderer: Renderer) {
        this.renderer = renderer
        this.bind()
    }

    private bind() {
        const canvas = this.renderer.canvas

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return
            this.isPanning = true
            this.renderer.setCursor('grabbing')
            this.panStartX = e.clientX
            this.panStartY = e.clientY
        })

        window.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return

            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            const dx = (e.clientX - this.panStartX) * scaleX
            const dy = (e.clientY - this.panStartY) * scaleY
            this.panStartX = e.clientX
            this.panStartY = e.clientY
            this.renderer.panBy(dx, dy)
            this.panChange.emit()
        })

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false
                this.renderer.setCursor('grab')
            }
        })

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault()
            const rect = canvas.getBoundingClientRect()
            const x = (e.clientX - rect.left) * (canvas.width / rect.width)
            const y = (e.clientY - rect.top) * (canvas.height / rect.height)
            const delta = -e.deltaY
            const factor = 1 + delta * ZOOM_INTENSITY
            this.renderer.zoomAt(x, y, factor)
            this.zoomChange.emit()
        }, { passive: false })

        canvas.addEventListener('dblclick', () => {
            this.renderer.resetView()
        })
    }

    onZoomChange(handler: ZoomChangeHandler): void {
        this.zoomChange.add(handler)
    }

    onPanChange(handler: PanChangeHandler): void {
        this.panChange.add(handler)
    }
}
