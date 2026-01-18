using System;
using System.Threading.Tasks;
using FFXIVWebMap.Config;
using FFXIVWebMap.Networking.Messages;

namespace FFXIVWebMap.Networking.Web;

public sealed class WebService : IDisposable, INetworkService
{
    private readonly WebServerService webServerService;
    private readonly WebSocketHandler webSocketEventHandler;
    
    public WebService(ConfigurationService configurationService)
    {
        webSocketEventHandler = new WebSocketHandler("/ws");
        webServerService = new WebServerService(webSocketEventHandler, configurationService);
    }
    
    public event INetworkService.OnClientConnectedDelegate? OnClientConnected
    {
        add => webSocketEventHandler.OnClientConnected += value;
        remove => webSocketEventHandler.OnClientConnected -= value;
    }
    
    public event INetworkService.OnClientDisconnectedDelegate? OnClientDisconnected
    {
        add => webSocketEventHandler.OnClientDisconnected += value;
        remove => webSocketEventHandler.OnClientDisconnected -= value;
    }
    
    public void RegisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage
    {
        webSocketEventHandler.RegisterHandler(handler);
    }

    public void UnregisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage
    {
        webSocketEventHandler.UnregisterHandler(handler);
    }

    public Task Broadcast<T>(Message.ContentWithType<MessageType, T> message)
    {
        return webSocketEventHandler.Broadcast(message);
    }

    public void Dispose()
    {
        webSocketEventHandler.Dispose();
        webServerService.Dispose();
    }
}
