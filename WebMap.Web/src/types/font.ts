export interface FontData {
    ix: number
    iy: number
    rowHeight: number
    aspect: number
    ascent: number
    descent: number
    lineGap: number
    capHeight: number
    xHeight: number
    spaceAdvance: number
    chars: Record<string, FontChar>
    kern: Record<string, number>
}

export interface FontChar {
    codepoint: number
    rect: [number, number, number, number]
    bearingX: number
    advanceX: number
    flags: number
}

export interface FontMetrics {
    capScale: number,
    lowScale: number,
    pixelSize: number,
    ascent: number,
    lineHeight: number,
}
