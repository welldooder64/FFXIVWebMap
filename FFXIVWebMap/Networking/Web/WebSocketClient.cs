using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using EmbedIO.WebSockets;
using FFXIVWebMap.Networking.Messages;

namespace FFXIVWebMap.Networking.Web;

public sealed class WebSocketClient(WebSocketHandler webSocketHandler, IWebSocketContext context) : IDisposable, INetworkClient
{
    public sealed class SendQueue
    {
        public sealed class QueueItem
        {
            public required string Payload { get; init; }
            public required TaskCompletionSource<bool> Tcs { get; init; }
        }
        
        public readonly ConcurrentQueue<QueueItem> Queue = new();
        public int IsProcessing; // 0 = idle, 1 = processing
    }
    
    private readonly SendQueue queue = new();
    
    private Task<bool> EnqueueSend(string payload)
    {
        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        queue.Queue.Enqueue(new SendQueue.QueueItem { Payload = payload, Tcs = tcs });

        // Start processing if not already
        if (Interlocked.CompareExchange(ref queue.IsProcessing, 1, 0) == 0)
        {
            _ = ProcessQueueAsync();
        }

        return tcs.Task;
    }
    
    private async Task ProcessQueueAsync()
    {
        try
        {
            while (true)
            {
                if (!queue.Queue.TryDequeue(out var item))
                {
                    // No items left; set to idle if still empty, otherwise continue
                    Interlocked.Exchange(ref queue.IsProcessing, 0);
                    
                    // If an item was added after we set to 0, try to acquire again
                    if (!queue.Queue.IsEmpty && Interlocked.CompareExchange(ref queue.IsProcessing, 1, 0) == 0)
                        continue;
                    
                    break;
                }

                try
                {
                    await webSocketHandler.Send(context, item.Payload);
                    item.Tcs.TrySetResult(true);
                }
                catch (Exception ex)
                {
                    item.Tcs.TrySetException(ex);
                }
            }
        }
        finally
        {
            Interlocked.Exchange(ref queue.IsProcessing, 0);
        }
    }
    
    public Task Send<T>(Message.ContentWithType<MessageType, T> message)
    {
        return EnqueueSend(WebSocketHandler.Serialize(message));
    }

    public Task Send(string message)
    {
        return EnqueueSend(message);

    }

    public void Dispose()
    {
        // Cleanup send queue and fault any pending items
        while (queue.Queue.TryDequeue(out var item))
        {
            item.Tcs.TrySetException(new InvalidOperationException("WebSocket client disconnected"));
        }
    }
}
