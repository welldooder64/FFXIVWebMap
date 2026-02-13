using System;
using System.Numerics;
using Dalamud.Plugin.Services;
using FFXIVClientStructs.FFXIV.Client.Game.Control;
using WebMap.Models;
using WebMap.Networking;
using WebMap.Networking.Messages;

namespace WebMap.Game.Player;

public sealed class PlayerTrackingService : IDisposable
{
    private readonly IFramework framework;
    private readonly IClientState clientState;
    private readonly IObjectTable objectTable;
    private readonly INetworkService networkService;
    
    private Transform? lastPosition;
    private float? lastCameraRotation;
    
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
            if (!TryGetPlayerTransform(out var playerTransform)) return;
            if (!TryGetCameraRotation(out var cameraRotation)) return;
            
            client.Send(Message.PlayerLocation(new Location { MapId = clientState.MapId }));
            client.Send(Message.PlayerPosition(new PlayerTransformAndCameraRotation
            {
                PlayerTransform = playerTransform, 
                CameraRotation = cameraRotation
            }));
        });
    }
    
    private void OnMapIdChanged(uint mapId)
    {
        networkService.Broadcast(Message.PlayerLocation(new Location { MapId = mapId }));
    }
    
    private void OnFrameworkUpdate(IFramework fw)
    {
        if (!TryGetPlayerTransform(out var playerTransform)) return;
        if (!TryGetCameraRotation(out var cameraRotation)) return;
        
        const float positionThreshold = 0.1f;
        const float positionThresholdSq = positionThreshold * positionThreshold;
        const float rotationThreshold = 0.1f;
        
        var shouldSend =
            lastPosition == null || lastCameraRotation == null ||
            Vector3.DistanceSquared(lastPosition.Value.Position, playerTransform.Position) > positionThresholdSq ||
            MathF.Abs(lastPosition.Value.Rotation - playerTransform.Rotation) > rotationThreshold ||
            MathF.Abs(lastCameraRotation.Value - cameraRotation) > rotationThreshold;
        
        if (!shouldSend) return;
        
        lastPosition = playerTransform;
        lastCameraRotation = cameraRotation;

        networkService.Broadcast(Message.PlayerPosition(new PlayerTransformAndCameraRotation
        {
            PlayerTransform = playerTransform, 
            CameraRotation = cameraRotation
        }));
    }
    
    private bool TryGetPlayerTransform(out Transform transform)
    {
        var player = objectTable.LocalPlayer;
        if (player == null)
        {
            transform = default;
            return false;
        }

        transform = new Transform(
            new Vector3(player.Position.X, player.Position.Z, player.Position.Y),
            player.Rotation
        );
        return true;
    }
    
    private static unsafe bool TryGetCameraRotation(out float yawRadians)
    {
        var cameraManager = CameraManager.Instance();
        if (cameraManager == null)
        {
            yawRadians = 0;
            return false;
        }

        var camera = cameraManager->GetActiveCamera();
        if (camera == null)
        {
            yawRadians = 0;
            return false;
        }

        var view = camera->SceneCamera.ViewMatrix;

        // World forward derived from view rotation part; negation matches your previous working sign.
        var forwardWorld = Vector3.Normalize(-new Vector3(view.M13, view.M23, view.M33));
        yawRadians = MathF.Atan2(forwardWorld.X, forwardWorld.Z);
        return true;
    }
    
    public void Dispose()
    {
        clientState.MapIdChanged -= OnMapIdChanged;
        framework.Update -= OnFrameworkUpdate;
        networkService.OnClientConnected -= OnClientConnected;
    }
}
