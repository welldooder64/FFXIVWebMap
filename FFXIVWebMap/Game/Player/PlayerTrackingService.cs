using System;
using System.Numerics;
using System.Threading.Tasks;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Models;
using FFXIVWebMap.Networking;
using FFXIVWebMap.Networking.Messages;

namespace FFXIVWebMap.Game.Player;

public sealed class PlayerTrackingService : IDisposable
{
    private readonly IFramework framework;
    private readonly IClientState clientState;
    private readonly IObjectTable objectTable;
    private readonly INetworkService networkService;
    
    private Transform? lastPosition;
    
    public PlayerTrackingService
    (
        IFramework framework,
        IClientState clientState,
        IObjectTable objectTable,
        INetworkService networkService
    )
    {
        this.framework = framework;
        this.clientState = clientState;
        this.objectTable = objectTable;
        this.networkService = networkService;

        clientState.MapIdChanged += OnMapIdChanged;
        framework.Update += OnFrameworkUpdate;
        networkService.OnClientConnected += OnClientConnected;
    }

    private void OnClientConnected(INetworkService service, INetworkClient client)
    {
        framework.Run(() =>
        {
            var current = GetPositionAndRotation();
            if (current == null) return;
            
            client.Send(Message.PlayerLocation(new Location { MapId = clientState.MapId }));
            client.Send(Message.PlayerPosition(current));
        });
    }
    
    private void OnMapIdChanged(uint mapId)
    {
        WebMap.Log.Information($"Player changed map to: {mapId}");
        
        networkService.Broadcast(Message.PlayerLocation(new Location { MapId = mapId }));
    }
    
    private void OnFrameworkUpdate(IFramework fw)
    {
        var current = GetPositionAndRotation();
        if (current == null) return;
        
        // Check if the position or rotation changed somewhat to avoid spamming
        if (lastPosition == null || Vector2.Distance(lastPosition.Position, current.Position) > 0.2f || Math.Abs(lastPosition.Rotation - current.Rotation) > 0.3f)
        {
            lastPosition = current;

            networkService.Broadcast(Message.PlayerPosition(current));
        }
    }
    
    private Transform? GetPositionAndRotation()
    {
        var player = objectTable.LocalPlayer;
        if (player == null) return null;

        return new Transform
        {
            Position = new Vector2(player.Position.X, player.Position.Z),
            Rotation = player.Rotation,
        };
    }
    
    public void Dispose()
    {
        clientState.MapIdChanged -= OnMapIdChanged;
        framework.Update -= OnFrameworkUpdate;
        networkService.OnClientConnected -= OnClientConnected;
    }
}
