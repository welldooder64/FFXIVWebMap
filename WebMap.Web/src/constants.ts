import { type MarkerSetting, MarkerType } from '@/types/dynamic-marker'

export const FRAMERATE_LIMIT = 60

export const WS_URL = `/ws`
export const RESOURCE_PATH = `/resources/`
export const RETRY_MS = 1500

export const ZOOM_MIN_SCALE = 0.1
export const ZOOM_MAX_SCALE = 8
export const ZOOM_INTENSITY = 0.003

export const UI_SCALE = window.devicePixelRatio
export const BASE_MAP_SIZE = 2048

export const MARKER_SETTINGS_DEFAULT: MarkerSetting = {
    highlight: true,

    /* Default to orange color */
    radius: {
        enabled: true,
        color: {
            add: { r: 0.4, g: 0.2, b: 0, a: 0 },
            multiply: { r: 0.8, g: 0.4, b: 0, a: 1 },
        },
    },
} as const

export const MARKER_SETTINGS: Record<MarkerType, MarkerSetting> = {
    [MarkerType.QuestLink]: { ...MARKER_SETTINGS_DEFAULT, highlight: false },
    [MarkerType.Housing]: { ...MARKER_SETTINGS_DEFAULT, radius: { ...MARKER_SETTINGS_DEFAULT.radius, enabled: false }, highlight: false },
    [MarkerType.TripleTriad]: { ...MARKER_SETTINGS_DEFAULT, highlight: false },
    [MarkerType.CustomTalk]: { ...MARKER_SETTINGS_DEFAULT, highlight: false },
} as const
