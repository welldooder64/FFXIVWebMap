export default class EventMixin<T extends (...args: any[]) => void> {
    private readonly handlers = new Set<T>()

    add(handler: T) {
        this.handlers.add(handler)
    }

    once(handler: T) {
        const wrapper = ((...args: Parameters<T>) => {
            handler(...args)
            this.remove(wrapper as T)
        }) as T

        this.handlers.add(wrapper)
    }

    remove(handler: T) {
        this.handlers.delete(handler)
    }

    emit(...args: Parameters<T>): void {
        for (const handler of this.handlers) {
            try {
                handler(...args)
            } catch (err) {
                console.error('handler error:', err)
            }
        }
    }
}
