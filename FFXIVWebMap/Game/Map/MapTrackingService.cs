using System;
using Dalamud.Plugin.Services;
using FFXIVClientStructs.FFXIV.Component.GUI;
using FFXIVWebMap.Models;
using FFXIVWebMap.Networking;
using FFXIVWebMap.Networking.Messages;
using FFXIVWebMap.Resources.Sheets;

namespace FFXIVWebMap.Game.Map;

public sealed class MapTrackingService : IDisposable
{
    private readonly IFramework framework;
    private readonly INetworkService networkService;
    private readonly MapSheetProvider mapSheetProvider;
    private readonly MapMarkerSheetProvider mapMarkerSheetProvider;
    private readonly MapState mapState;

    
    public MapTrackingService
    (
        IFramework framework,
        INetworkService networkService,
        MapSheetProvider mapSheetProvider,
        MapMarkerSheetProvider mapMarkerSheetProvider,
        MapState mapState
    )
    {
        this.framework = framework;
        this.networkService = networkService;
        this.mapSheetProvider = mapSheetProvider;
        this.mapMarkerSheetProvider = mapMarkerSheetProvider;
        this.mapState = mapState;
        
        networkService.OnClientConnected += OnClientConnected;
        mapState.OnSelectedMapIdChanged += OnSelectedMapIdChanged;
    }
    
    private void OnClientConnected(INetworkService service, INetworkClient client)
    {
        framework.Run(() =>
        {
            client.Send(Message.MapData(new MapData
            {
                Maps = mapSheetProvider.GetMapData(),
                Markers = mapMarkerSheetProvider.GetMapMarkers()
            }));
            client.Send(Message.SelectedLocation(new SelectedLocation
            {
                MapId = mapState.SelectedMapId,
                DiscoveryMask = GetDiscoveryMask()
            }));
        });
    }

    private void OnSelectedMapIdChanged(uint mapId)
    {
        /* We delay the broadcast until the next tick, since it takes one tick for the discovery mask to get updated in the Atk Data */
        framework.RunOnTick(() =>
        {
            WebMap.Log.Debug($"Sending Selected Location {mapId}");
            networkService.Broadcast(Message.SelectedLocation(new SelectedLocation
            {
                MapId = mapId,
                DiscoveryMask = GetDiscoveryMask()
            }));
        }, delayTicks: 1);
    }

    private static unsafe int GetDiscoveryMask() =>
        AtkStage.Instance()->GetNumberArrayData(NumberArrayType.AreaMap2)->IntArray[2];

    public void Dispose()
    {
        networkService.OnClientConnected -= OnClientConnected;
        mapState.OnSelectedMapIdChanged -= OnSelectedMapIdChanged;
    }
}
