import { ByteBuffer } from 'flatbuffers'
import { type InferMessageDataMap } from '@/net/MapperRegistry'
import mapperRegistry from '@/net/mappers'
import {
    MessageType,
    ServerMessage as FBServerMessage,
} from '@/net/models'

export { MessageType } from '@/net/models'

type MessageDataMap = InferMessageDataMap<typeof mapperRegistry>
type MessageHandler<T> = (data: T) => void

export default class WebSocketService {
    private readonly url: string
    private readonly retryMs: number

    private ws: WebSocket | null = null
    private retryTimer: number | null = null
    private handlers = new Map<MessageType, Set<(data: unknown) => void>>()

    constructor(url: string, retryMs: number) {
        this.url = url
        this.retryMs = retryMs
    }

    connect() {
        console.debug('[WS] connecting to', this.url)
        try {
            this.ws = new WebSocket(this.url)
            this.ws.binaryType = 'arraybuffer'
        } catch {
            this.scheduleReconnect()
            return
        }

        this.ws.onopen = () => {
            console.debug('[WS] connected')
        }

        this.ws.onmessage = (ev) => {
            const raw = new Uint8Array(ev.data)
            const buf = new ByteBuffer(raw)
            const fbMsg = FBServerMessage.getRootAsServerMessage(buf)
            const type = fbMsg.type()

            const entry = mapperRegistry.get(type)
            if (!entry) {
                console.debug('[WS] no mapper for type', fbMsg.type(), '...ignoring')
                return
            }

            const fbPayload = fbMsg.payload(new entry.fbClass())
            if (!fbPayload) {
                console.debug('[WS] empty payload for', entry.fbClass.name, '...ignoring')
                return
            }

            console.debug('[WS] received', MessageType[type])

            const msg = entry.map(fbPayload, type)

            const set = this.handlers.get(type)
            if (!set || set.size === 0) return

            for (const h of set) {
                h(msg)
            }
        }

        this.ws.onclose = () => {
            this.scheduleReconnect()
        }
    }

    on<T extends keyof MessageDataMap>(type: T,  handler: MessageHandler<MessageDataMap[T]>) {
        let set = this.handlers.get(type)
        if (!set) {
            set = new Set()
            this.handlers.set(type, set)
        }

        const wrapped = handler as (data: unknown) => void
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
