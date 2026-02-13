using System;
using System.Collections.Generic;
using Dalamud.Plugin.Services;
using WebMap.Models;
using WebMap.Networking;
using WebMap.Networking.Messages;
using WebMap.Resources.Sheets;

namespace WebMap.Game.Map;

public sealed class MapTrackingService : IDisposable
{
    private readonly IFramework framework;
    private readonly INetworkService networkService;
    private readonly MapSheetProvider mapSheetProvider;
    private readonly MapMarkerSheetProvider mapMarkerSheetProvider;
    private readonly MapSymbolSheetProvider mapSymbolSheetProvider;
    private readonly MapState mapState;
    
    public MapTrackingService
    (
        IFramework framework,
        INetworkService networkService,
        MapSheetProvider mapSheetProvider,
        MapMarkerSheetProvider mapMarkerSheetProvider,
        MapSymbolSheetProvider mapSymbolSheetProvider,
        MapState mapState
    )
    {
        this.framework = framework;
        this.networkService = networkService;
        this.mapSheetProvider = mapSheetProvider;
        this.mapMarkerSheetProvider = mapMarkerSheetProvider;
        this.mapSymbolSheetProvider = mapSymbolSheetProvider;
        this.mapState = mapState;
        
        networkService.OnClientConnected += OnClientConnected;
        mapState.OnSelectedMapIdChanged += OnSelectedMapIdChanged;
        mapState.OnDiscoveryMaskChanged += OnDiscoveryMaskChanged;
        mapState.OnQuestMarkersChanged += OnQuestMarkersChanged;
        mapState.OnUnacceptedQuestMarkersChanged += OnUnacceptedQuestMarkersChanged;
        mapState.OnQuestLinkMarkersChanged += OnQuestLinkMarkersChanged;
        mapState.OnLevequestMarkersChanged += OnLevequestMarkersChanged;
        mapState.OnActiveLevequestMarkerChanged += OnActiveLevequestMarkerChanged;
        mapState.OnGuildLeveAssignmentMarkersChanged += OnGuildLeveAssignmentMarkersChanged;
        mapState.OnGuildOrderGuideMarkersChanged += OnGuildOrderGuideMarkersChanged;
        mapState.OnHousingMarkersChanged += OnHousingMarkersChanged;
        mapState.OnTripleTriadMarkersChanged += OnTripleTriadMarkersChanged;
        mapState.OnCustomTalkMarkersChanged += OnCustomTalkMarkersChanged;
        mapState.OnGemstoneTraderMarkersChanged += OnGemstoneTraderMarkersChanged;
        // mapState.OnFlagMarkersChanged += OnFlagMarkersChanged;
    }
    
    private void OnClientConnected(INetworkService service, INetworkClient client)
    {
        framework.Run(() =>
        {
            client.Send(Message.MapData(new MapData
            {
                Maps = mapSheetProvider.GetMapData(),
                Markers = mapMarkerSheetProvider.GetMapMarkers(),
                MarkerNames = mapSymbolSheetProvider.GetMapSymbols()
            }));
            client.Send(Message.SelectedLocation(new SelectedLocation
            {
                MapId = mapState.SelectedMapId,
                DiscoveryMask = mapState.DiscoveryMask,
            }));
            client.Send(Message.QuestMarkers(mapState.QuestMarkers));
            client.Send(Message.UnacceptedQuestMarkers(mapState.UnacceptedQuestMarkers));
            client.Send(Message.QuestLinkMarkers(mapState.QuestLinkMarkers));
            client.Send(Message.LevequestMarkers(mapState.LevequestMarkers));
            client.Send(Message.ActiveLevequestMarker(mapState.ActiveLevequestMarker));
            client.Send(Message.GuildLeveAssignmentMarkers(mapState.GuildLeveAssignmentMarkers));
            client.Send(Message.GuildOrderGuideMarkers(mapState.GuildOrderGuideMarkers));
            client.Send(Message.HousingMarkers(mapState.HousingMarkers));
            client.Send(Message.TripleTriadMarkers(mapState.TripleTriadMarkers));
            client.Send(Message.CustomTalkMarkers(mapState.CustomTalkMarkers));
            client.Send(Message.GemstoneTraderMarkers(mapState.GemstoneTraderMarkers));
            // client.Send(Message.FlagMarkers(mapState.FlagMarkers));
        });
    }

    private void OnSelectedMapIdChanged(uint mapId)
    {
        /* We delay the broadcast until the next tick, since it takes one tick for the discovery mask to get updated in the Atk Data */
        framework.RunOnTick(() =>
        {
            networkService.Broadcast(Message.SelectedLocation(new SelectedLocation
            {
                MapId = mapId,
                DiscoveryMask = mapState.DiscoveryMask,
            }));
        }, delayTicks: 1);
    }
    
    private void OnDiscoveryMaskChanged(int discoveryMask)
    {
        networkService.Broadcast(Message.DiscoveryMask(discoveryMask));
    }

    private void OnQuestMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.QuestMarkers(markers));
    }
    
    private void OnUnacceptedQuestMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.UnacceptedQuestMarkers(markers));
    }
    
    private void OnQuestLinkMarkersChanged(IEnumerable<QuestLinkMarker> markers)
    {
        networkService.Broadcast(Message.QuestLinkMarkers(markers));
    }
    
    private void OnLevequestMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.LevequestMarkers(markers));
    }
    
    private void OnActiveLevequestMarkerChanged(DynamicMarker? marker)
    {
        networkService.Broadcast(Message.ActiveLevequestMarker(marker));
    }
    
    private void OnGuildLeveAssignmentMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.GuildLeveAssignmentMarkers(markers));
    }
    
    private void OnGuildOrderGuideMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.GuildOrderGuideMarkers(markers));
    }
    
    private void OnHousingMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.HousingMarkers(markers));
    }
    
    private void OnTripleTriadMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.TripleTriadMarkers(markers));
    }
    
    private void OnCustomTalkMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.CustomTalkMarkers(markers));
    }
    
    private void OnGemstoneTraderMarkersChanged(IEnumerable<DynamicMarker> markers)
    {
        networkService.Broadcast(Message.GemstoneTraderMarkers(markers));
    }
    
    // private void OnFlagMarkersChanged(IEnumerable<FlagMarker> flagMarkers)
    // {
    //     networkService.Broadcast(Message.FlagMarkers(flagMarkers));
    // }

    public void Dispose()
    {
        networkService.OnClientConnected -= OnClientConnected;
        mapState.OnSelectedMapIdChanged -= OnSelectedMapIdChanged;
        mapState.OnDiscoveryMaskChanged -= OnDiscoveryMaskChanged;
        mapState.OnQuestMarkersChanged -= OnQuestMarkersChanged;
        mapState.OnUnacceptedQuestMarkersChanged -= OnUnacceptedQuestMarkersChanged;
        mapState.OnQuestLinkMarkersChanged -= OnQuestLinkMarkersChanged;
        mapState.OnLevequestMarkersChanged -= OnLevequestMarkersChanged;
        mapState.OnActiveLevequestMarkerChanged -= OnActiveLevequestMarkerChanged;
        mapState.OnGuildLeveAssignmentMarkersChanged -= OnGuildLeveAssignmentMarkersChanged;
        mapState.OnGuildOrderGuideMarkersChanged -= OnGuildOrderGuideMarkersChanged;
        mapState.OnHousingMarkersChanged -= OnHousingMarkersChanged;
        mapState.OnTripleTriadMarkersChanged -= OnTripleTriadMarkersChanged;
        mapState.OnCustomTalkMarkersChanged -= OnCustomTalkMarkersChanged;
        mapState.OnGemstoneTraderMarkersChanged -= OnGemstoneTraderMarkersChanged;
        // mapState.OnFlagMarkersChanged -= OnFlagMarkersChanged;
    }
}
