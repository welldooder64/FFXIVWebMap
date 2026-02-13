using System;
using System.Threading.Tasks;
using Dalamud.Plugin.Services;
using WebMap.Config;
using WebMap.Networking.Messages;
using WebMap.Networking.Models;
using WebMap.Resources.Textures;

namespace WebMap.Networking.Web;

public sealed class WebService : IDisposable, INetworkService
{
    private readonly WebServerService webServerService;
    private readonly WebSocketHandler webSocketEventHandler;
    
    public WebService(IPluginLog log, ConfigurationService configurationService, TextureProvider textureProvider)
    {
        webSocketEventHandler = new WebSocketHandler(log, "/ws");
        webServerService = new WebServerService(log, webSocketEventHandler, configurationService, textureProvider);
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
