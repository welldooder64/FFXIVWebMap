import type { ServerMessage } from '@/types/messages'

type MessageHandler<T extends ServerMessage> = (msg: T) => void
type MessageType = ServerMessage['type']
type MessageOfType<T extends MessageType> = Extract<ServerMessage, { type: T }>

export default class WebSocketService {
    private readonly url: string
    private readonly retryMs: number

    private ws: WebSocket | null = null
    private retryTimer: number | null = null
    private handlers: Map<MessageType, Set<(msg: ServerMessage) => void>> = new Map()

    constructor(url: string, retryMs: number) {
        this.url = url
        this.retryMs = retryMs
    }

    connect() {
        console.debug('[WS] connecting to', this.url)
        try {
            this.ws = new WebSocket(this.url)
        } catch {
            this.scheduleReconnect()
            return
        }

        this.ws.onopen = () => {
            console.debug('[WS] connected')
        }

        this.ws.onmessage = (ev) => {
            let data: ServerMessage | null = null
            try {
                data = JSON.parse(ev.data)
            } catch {
                console.debug('[WS] failed to parse message', ev.data, '...ignoring')
            }

            if (!data || typeof data !== 'object' || !('type' in data)) {
                console.debug('[WS] message without valid "type"', data, '...ignoring')
                return
            }

            const msg = data as ServerMessage
            console.debug('[WS] received message', msg.type)

            const set = this.handlers.get(msg.type)
            if (!set || set.size === 0) return

            for (const h of set) {
                h(msg)
            }
        }

        this.ws.onclose = () => {
            this.scheduleReconnect()
        }
    }

    send(obj: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj))
            return true
        }
        return false
    }

    on<T extends MessageType>(type: T, handler: MessageHandler<MessageOfType<T>>) {
        let set = this.handlers.get(type)
        if (!set) {
            set = new Set()
            this.handlers.set(type, set)
        }
        // Store as ServerMessage handler; typing is preserved at call sites
        const wrapped = handler as unknown as (msg: ServerMessage) => void
        set.add(wrapped)

        return () => {
            const s = this.handlers.get(type)
            if (!s) return
            s.delete(wrapped)
            if (s.size === 0) {
                this.handlers.delete(type)
            }
        }
    }

    private scheduleReconnect() {
        if (this.retryTimer !== null) return

        this.retryTimer = window.setTimeout(() => {
            console.debug('[WS] reconnecting...')
            this.retryTimer = null
            this.connect()
        }, this.retryMs)
    }
}
