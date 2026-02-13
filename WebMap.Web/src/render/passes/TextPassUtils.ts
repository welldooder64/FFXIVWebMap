import type { FontChar, FontData, FontMetrics } from '@/types/font'

export function fontMetrics(font: FontData, pixelSize: number, moreLineGap: number = 0.0): FontMetrics {
    // We use separate scale for the low case characters
    // so that x-height fits the pixel grid.
    // Other characters use cap-height to fit to the pixels
    const capScale = pixelSize / font.capHeight
    const lowScale = Math.round(font.xHeight * capScale) / font.xHeight

    // Ascent should be a whole number since it's used to calculate the baseline
    // position which should lie at the pixel boundary
    const ascent = Math.round(font.ascent * capScale)

    // Same for the line height
    const lineHeight = Math.round(capScale * (font.ascent + font.descent + font.lineGap) + moreLineGap)

    return {
        capScale,
        lowScale,
        pixelSize,
        ascent,
        lineHeight,
    }
}

export function writeString(
    text: string,
    font: FontData,
    fontMetrics: FontMetrics,
    position: [number, number],
    vertexArray: Float32Array,
    vertexArrayPos: number,
    styling: {
        fillColor: { r: number, g: number, b: number, a: number },
        outlineColor: { r: number, g: number, b: number },
        fillSoftness: number,
        fillExpand: number,
        outlineWidth: number,
        outlineSoftness: number
    },
    letterSpacing: number,
    anchorAlign: 'left' | 'center' | 'right' = 'center',
    textAlign: 'left' | 'center' | 'right' = 'center',
    baseline: 'top' | 'middle' | 'bottom' = 'middle',
) {
    const scale = fontMetrics.capScale
    const glyphFloatCount = 6 * 18 // 18 floats per vertex

    const lines = text.split("\n")
    const totalHeight = lines.length * fontMetrics.lineHeight
    const startY = getBaselineOffset(baseline, totalHeight)
    const lineWidths = lines.map(line => measureLineWidth(line, font, fontMetrics, letterSpacing))
    const maxWidth = Math.max(...lineWidths)

    let xMax = 0.0

    for (const [lineIndex, line] of lines.entries()) {
        const lineY = 0 - startY + lineIndex * fontMetrics.lineHeight
        const blockOffset = getAlignmentOffset(anchorAlign, maxWidth)
        const lineInternalOffset = getLineInternalOffset(textAlign, maxWidth, lineWidths[lineIndex])

        let penX = blockOffset + lineInternalOffset
        let prevChar = " "

        for (const char of line) {
            if (vertexArrayPos + glyphFloatCount >= vertexArray.length) break

            if (char === " ") {
                penX += font.spaceAdvance * scale
                prevChar = " "
                continue
            }

            const fontChar = font.chars[char] ?? font.chars["?"]
            const kern = font.kern[prevChar + char] ?? 0.0
            const written = writeCharVertices(
                [penX, lineY], position, font, fontMetrics, fontChar,
                letterSpacing, kern, vertexArray, vertexArrayPos, styling
            )
            vertexArrayPos = written.outPos
            penX = written.newPosX
            prevChar = char
        }

        if (penX > xMax) {
            xMax = penX
        }
    }

    const finalY = 0 - startY + (lines.length - 1) * fontMetrics.lineHeight
    return {
        rect: [position[0], position[1], xMax, finalY + fontMetrics.lineHeight],
        strPos: text.length,
        arrayPos: vertexArrayPos,
    }
}

function writeCharVertices(
    pos: [number, number],
    anchor: [number, number],
    font: FontData,
    fontMetrics: FontMetrics,
    fontChar: FontChar,
    letterSpacing: number,
    kern: number,
    out: Float32Array,
    outPos: number,
    styling: {
        fillColor: { r: number, g: number, b: number, a: number },
        fillSoftness: number,
        fillExpand: number,
        outlineColor: { r: number, g: number, b: number },
        outlineWidth: number,
        outlineSoftness: number
    }
) : { outPos: number, newPosX: number } {
    /* Lowercase characters have the first bit set in 'flags' */
    const isLowercase = (fontChar.flags & 1) == 1

    /* Pen position is at the top of the line, Y goes down */
    const baseline = pos[1] + fontMetrics.ascent

    /* Lowercase chars use their own scale */
    const scale = isLowercase ? fontMetrics.lowScale : fontMetrics.capScale

    /* Laying out the glyph rectangle */
    const g = fontChar.rect
    const g0 = g[0], g1 = g[1], g2 = g[2], g3 = g[3]

    const top = baseline + scale * (font.descent + font.iy)
    const bottom = top - scale * (font.rowHeight)
    const left = pos[0] + font.aspect * scale * (fontChar.bearingX + kern - font.ix)
    const right = left + font.aspect * scale * (g[2] - g[0])

    /* Advancing pen position */
    const newPosX = pos[0] + font.aspect * scale * (fontChar.advanceX + kern) + letterSpacing

    const { fillColor, outlineColor, fillSoftness, fillExpand, outlineWidth, outlineSoftness } = styling

    /* Write 6 vertices */
    for (let i = 0; i < 6; i++) {
        if (i === 0) { out[outPos++] = left;  out[outPos++] = top;     out[outPos++] = g0; out[outPos++] = g3; }
        if (i === 1) { out[outPos++] = right; out[outPos++] = top;     out[outPos++] = g2; out[outPos++] = g3; }
        if (i === 2) { out[outPos++] = left;  out[outPos++] = bottom;  out[outPos++] = g0; out[outPos++] = g1; }
        if (i === 3) { out[outPos++] = left;  out[outPos++] = bottom;  out[outPos++] = g0; out[outPos++] = g1; }
        if (i === 4) { out[outPos++] = right; out[outPos++] = top;     out[outPos++] = g2; out[outPos++] = g3; }
        if (i === 5) { out[outPos++] = right; out[outPos++] = bottom;  out[outPos++] = g2; out[outPos++] = g1; }

        out[outPos++] = scale
        out[outPos++] = fillColor.r;    out[outPos++] = fillColor.g;    out[outPos++] = fillColor.b;   out[outPos++] = fillColor.a
        out[outPos++] = outlineColor.r; out[outPos++] = outlineColor.g; out[outPos++] = outlineColor.b
        out[outPos++] = fillSoftness;   out[outPos++] = fillExpand;     out[outPos++] = outlineWidth;  out[outPos++] = outlineSoftness
        out[outPos++] = anchor[0];      out[outPos++] = anchor[1]
    }

    return { outPos, newPosX }
}


function getBaselineOffset(b: 'top' | 'middle' | 'bottom', height: number) {
    if (b === 'middle') return height / 2
    if (b === 'bottom') return height
    return 0
}

function getAlignmentOffset(align: 'left' | 'center' | 'right', lineWidth: number): number {
    if (align === 'center') return -lineWidth / 2
    if (align === 'right') return -lineWidth
    return 0
}

function getLineInternalOffset(align: 'left' | 'center' | 'right', maxWidth: number, lineWidth: number): number {
    if (align === 'center') return (maxWidth - lineWidth) / 2
    if (align === 'right') return maxWidth - lineWidth
    return 0
}

function measureLineWidth(line: string, font: FontData, metrics: FontMetrics, letterSpacing: number): number {
    let width = 0
    let prev = " "

    for (const char of line) {
        if (char === " ") {
            width += font.spaceAdvance * metrics.capScale
            prev = " "
            continue
        }

        const fontChar = font.chars[char] ?? font.chars["?"]
        if (!fontChar) continue

        const isLowercase = (fontChar.flags & 1) === 1
        const charScale = isLowercase ? metrics.lowScale : metrics.capScale
        const kern = font.kern[prev + char] ?? 0

        width += font.aspect * charScale * (fontChar.advanceX + kern) + letterSpacing
        prev = char
    }

    return width
}
