const SERVER_URL = 'localhost:8080'

export const WS_URL = `ws://${SERVER_URL}/ws`
export const RETRY_MS = 1500

export const ZOOM_MIN_SCALE = 0.1
export const ZOOM_MAX_SCALE = 8
export const ZOOM_INTENSITY = 0.003

export const ICON_SCALE = 1.5
export const BASE_MAP_SIZE = 2048;

export function resourcePathFor(path: string): string {
    return `/resources/${path}`
}
