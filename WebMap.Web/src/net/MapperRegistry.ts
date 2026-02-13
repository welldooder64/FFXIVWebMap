import { MessageType } from '@/net/models'

interface FBLike {
    bb: unknown
    bb_pos: number
}

type Mapper<TFB, T, TOut> = (fb: TFB, type: T) => TOut

interface MapperEntry<TFB = any, T extends MessageType = any, TOut = any> {
    fbClass: new () => TFB
    map: Mapper<TFB, T, TOut>
}

export default class MapperRegistry<TMap extends Partial<Record<MessageType, unknown>> = {}> {
    private readonly mappers = new Map<MessageType, MapperEntry>()

    register<T extends MessageType, TFB extends FBLike, TOut>(
        fbType: T,
        fbClass: new () => TFB,
        map: Mapper<TFB, T, TOut>
    ): MapperRegistry<TMap & Record<T, TOut>> {
        this.mappers.set(fbType, { fbClass, map })
        return this as MapperRegistry<TMap & Record<T, TOut>>
    }

    get(fbType: MessageType): MapperEntry | undefined {
        return this.mappers.get(fbType)
    }
}

export type InferMessageDataMap<R> = R extends MapperRegistry<infer TMap> ? TMap : never
