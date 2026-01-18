export interface Transform {
    position: Vector2
    rotation: number
}

export interface Vector2 {
    x: number
    y: number
}

export interface Dimension {
    width: number
    height: number
}

export interface DrawRect {
    dx: number
    dy: number
    width: number
    height: number
}

export const CoordinateSpace = {
    Map: 'map',
    Screen: 'screen',
} as const

export type CoordinateSpace = typeof CoordinateSpace[keyof typeof CoordinateSpace]
