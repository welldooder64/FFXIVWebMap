// import type { Dimension, DrawRect, Transform } from '@/types/map';
//
// /**
//  * Renders the player marker overlay.
//  * Stateless regarding WebGL; caller passes GL and geometry per draw.
//  */
// export default class PlayerOverlay {
//     private readonly gl: WebGL2RenderingContext
//
//     private lastTransform?: Transform
//
//     constructor(gl: WebGL2RenderingContext) {
//         this.gl = gl
//     }
//
//     setPlayer(transform?: Transform) {
//         this.lastTransform = transform
//     }
//
//     draw(
//         canvasSize: Dimension,
//         drawRect: DrawRect,
//         imageSize: Dimension,
//     ) {
//         if (!this.lastTransform) return
//
//         const gl = this.gl
//         const { dx, dy, width, height } = drawRect
//         const { width: imgWidth, height: imgHeight } = imageSize
//
//         /**
//          * Convert map-space to canvas-space. Player position is in top-left origin, but
//          * drawRect.dy is in bottom-left origin, so we need to flip the Y coordinate.
//          */
//         const px = dx + (this.lastTransform.position.x / imgWidth) * width
//         const py = dy + ((imgHeight - this.lastTransform.position.y) / imgHeight) * height
//
//         // Marker size in device pixels
//         const size = Math.max(6, Math.round(Math.min(width, height) * 0.01)) // 1% of drawn map, min 6px
//         const half = Math.floor(size / 2)
//
//         // Clamp to canvas bounds
//         const sx = Math.max(0, Math.min(canvasSize.width - 1, Math.round(px)))
//         const sy = Math.max(0, Math.min(canvasSize.height - 1, Math.round(py)))
//
//         gl.enable(gl.SCISSOR_TEST)
//
//         /* Scissor uses bottom-left origin (no conversion needed) */
//         const scX = sx - half
//         const scY = sy - half
//
//         gl.scissor(scX, scY, size, size)
//
//         // Draw the marker as a solid red block by clearing the scissored region
//         gl.clearColor(1, 0, 0, 1)
//         gl.clear(gl.COLOR_BUFFER_BIT)
//         gl.clearColor(0, 0, 0, 0)
//
//         gl.disable(gl.SCISSOR_TEST)
//     }
// }
