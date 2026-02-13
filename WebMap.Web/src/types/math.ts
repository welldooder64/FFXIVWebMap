export interface Transform {
    position: Vector3
    rotation: number
}

export interface Vector2 {
    x: number
    y: number
}

export interface Vector3 {
    x: number
    y: number
    z: number
}

export interface Dimension {
    width: number
    height: number
}

export interface Rectangle {
    x: number
    y: number
    width: number
    height: number
}

export const CoordinateSpace = {
    Map: 'map',
    Screen: 'screen',
} as const

export type CoordinateSpace = typeof CoordinateSpace[keyof typeof CoordinateSpace]
