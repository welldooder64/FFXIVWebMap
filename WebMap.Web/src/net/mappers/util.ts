export function mapToRecord<TFB, TOut, TKey extends string | number>(
    length: number,
    getter: (i: number) => TFB | null,
    mapper: (item: TFB) => TOut,
    keyFn: (item: TOut, fb: TFB) => TKey
): Record<TKey, TOut> {
    const result = {} as Record<TKey, TOut>
    for (let i = 0; i < length; i++) {
        const item = getter(i)
        if (item) {
            const mapped = mapper(item)
            result[keyFn(mapped, item)] = mapped
        }
    }
    return result
}
