using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Dalamud.Plugin.Services;
using EmbedIO.WebSockets;
using WebMap.Networking.Messages;
using WebMap.Networking.Models;
using WebMap.Networking.Serialization;

namespace WebMap.Networking.Web;

public class WebSocketHandler(IPluginLog log, string route) : WebSocketModule(route, true), INetworkService
{
    private readonly ConcurrentDictionary<IWebSocketContext, WebSocketClient> clients = new();
    
    public event INetworkService.OnClientConnectedDelegate? OnClientConnected;
    public event INetworkService.OnClientDisconnectedDelegate? OnClientDisconnected;

    protected override Task OnClientConnectedAsync(IWebSocketContext context)
    {
        log.Debug("WebSocket client connected from {RemoteEndPoint}", context.RemoteEndPoint);

        var client = new WebSocketClient(this, context);
        if (!clients.TryAdd(context, client))
        {
            log.Warning($"Failed to add client with id {context.Id} to clients list");
        }
        
        OnClientConnected?.Invoke(this, client);
        
        return Task.CompletedTask;
    }

    protected override Task OnClientDisconnectedAsync(IWebSocketContext context)
    {
        log.Debug("WebSocket client disconnected from {RemoteEndPoint}", context.RemoteEndPoint);

        if (clients.TryRemove(context, out var client))
        {
            OnClientDisconnected?.Invoke(this, client);

            client.Dispose();
        }
        
        return Task.CompletedTask;
    }
    
    protected override Task OnMessageReceivedAsync(IWebSocketContext context, byte[] buffer, IWebSocketReceiveResult result)
    {
        return Task.CompletedTask;
    }
    
    public Task Broadcast<T>(Message.ContentWithType<MessageType, T> message)
    {
        return Task.Run(async () =>
        {
            await Task.WhenAll(clients.Values.Select<WebSocketClient, Task>(c => c.Send(message)));
        });
    }
    
    public Task Send<T>(IWebSocketContext context, Message.ContentWithType<MessageType, T> message)
    {
        return SendAsync(context, FlatBufferMessageMapper.Map(message));
    }
    
    public new void Dispose()
    {
        foreach (var client in clients.Values)
        {
            client.Dispose();
        }
        
        clients.Clear();
        base.Dispose();
    }
}
