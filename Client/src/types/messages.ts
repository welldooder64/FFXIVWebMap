import type { Location, MapData, SelectedLocation } from '@/types/map'
import type { Transform } from '@/types/math';

interface Message<T, TData> {
    type: T
    data: TData
}

export interface MapDictionaryMessage extends Message<'mapData', MapData> {}
export interface MapExtractedMessage extends Message<'mapExtracted', number> {}

export interface PlayerLocationMessage extends Message<'playerLocation', Location> {}
export interface PlayerPositionMessage extends Message<'playerPosition', Transform> {}

export interface SelectedLocationMessage extends Message<'selectedLocation', SelectedLocation> {}

export type ServerMessage =
    | MapDictionaryMessage
    | MapExtractedMessage
    | PlayerPositionMessage
    | PlayerLocationMessage
    | SelectedLocationMessage

