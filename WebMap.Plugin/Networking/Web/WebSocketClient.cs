using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using EmbedIO.WebSockets;
using WebMap.Networking.Messages;
using WebMap.Networking.Models;

namespace WebMap.Networking.Web;

public sealed class WebSocketClient(WebSocketHandler webSocketHandler, IWebSocketContext context) : IDisposable, INetworkClient
{
    public sealed class SendQueue
    {
        public abstract class QueueItem
        {
            public abstract TaskCompletionSource<bool> Tcs { get; }
            public abstract Task SendAsync(WebSocketHandler handler, IWebSocketContext context);
        }
        
        public sealed class QueueItem<T>: QueueItem
        {
            public required TaskCompletionSource<bool> TcsImpl { get; init; }
            public required Message.ContentWithType<MessageType, T> Message { get; init; }

            public override TaskCompletionSource<bool> Tcs => TcsImpl;
            public override Task SendAsync(WebSocketHandler handler, IWebSocketContext context) 
                => handler.Send(context, Message);
        }
        
        public readonly ConcurrentQueue<QueueItem> Queue = new();
        public int IsProcessing; // 0 = idle, 1 = processing
    }
    
    private readonly SendQueue queue = new();
    
    private Task<bool> EnqueueSend<T>(Message.ContentWithType<MessageType, T> message)
    {
        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        queue.Queue.Enqueue(new SendQueue.QueueItem<T> { Message = message, TcsImpl = tcs });

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
                    await item.SendAsync(webSocketHandler, context);
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
