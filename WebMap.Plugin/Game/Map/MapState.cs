using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using Dalamud.Plugin.Services;
using FFXIVClientStructs.FFXIV.Client.Game.UI;
using FFXIVClientStructs.FFXIV.Client.UI.Agent;
using FFXIVClientStructs.FFXIV.Component.GUI;
using FFXIVClientStructs.STD;
using WebMap.Models;
using Lumina.Excel;
using Lumina.Excel.Sheets;
using GameQuestLinkMarker = FFXIVClientStructs.FFXIV.Client.UI.Agent.QuestLinkMarker;
using QuestLinkMarker = WebMap.Models.QuestLinkMarker;
using UIMap = FFXIVClientStructs.FFXIV.Client.Game.UI.Map;

namespace WebMap.Game.Map;

public sealed class MapState : IDisposable
{
    private readonly IFramework framework;
    private readonly IPluginLog log;
    private readonly IClientState clientState;
    private readonly ExcelSheet<Level> levelSheet;
    
    public List<DynamicMarker> QuestMarkers = [];
    public List<DynamicMarker> UnacceptedQuestMarkers = [];
    public List<QuestLinkMarker> QuestLinkMarkers = [];
    public List<DynamicMarker> LevequestMarkers = [];
    public DynamicMarker? ActiveLevequestMarker;
    public List<DynamicMarker> GuildLeveAssignmentMarkers = [];
    public List<DynamicMarker> GuildOrderGuideMarkers = [];
    public List<DynamicMarker> HousingMarkers = [];
    public List<DynamicMarker> TripleTriadMarkers = [];
    public List<DynamicMarker> CustomTalkMarkers = [];
    public List<DynamicMarker> GemstoneTraderMarkers = [];
    
    public event Action<uint>? OnSelectedMapIdChanged;
    public event Action<int>? OnDiscoveryMaskChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnQuestMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnUnacceptedQuestMarkersChanged;
    public event Action<IEnumerable<QuestLinkMarker>>? OnQuestLinkMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnLevequestMarkersChanged;
    public event Action<DynamicMarker?>? OnActiveLevequestMarkerChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnGuildLeveAssignmentMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnGuildOrderGuideMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnHousingMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnTripleTriadMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnCustomTalkMarkersChanged;
    public event Action<IEnumerable<DynamicMarker>>? OnGemstoneTraderMarkersChanged;
    
    private bool suppressOtherSelectionEvents;
    
    public MapState(IFramework framework, IPluginLog log, IClientState clientState, IDataManager dataManager)
    {
        this.framework = framework;
        this.log = log;
        this.clientState = clientState;
        
        levelSheet = dataManager.GetExcelSheet<Level>();
        
        framework.Update += OnFrameworkUpdate;
    }
    
    private unsafe void OnFrameworkUpdate(IFramework _)
    {
        try
        {
            suppressOtherSelectionEvents = false;
            
            var agentMap = AgentMap.Instance();
            var map = UIMap.Instance();
            if (agentMap == null || map == null) return;
            
            SelectedMapId = agentMap->SelectedMapId;

            /* The mini-map container contains the link markers even when the map is closed,
             so we prefer that one if we are looking at the same area as the player is in */
            UpdateQuestLinkMarkers(SelectedMapId == clientState.MapId ? 
                                       agentMap->MiniMapQuestLinkContainer.Markers : 
                                       agentMap->MapQuestLinkContainer.Markers);

            /* All different marker arrays */
            UpdateMarkers(map->QuestMarkers, ref QuestMarkers, OnQuestMarkersChanged);
            UpdateMarkers(map->UnacceptedQuestMarkers, ref UnacceptedQuestMarkers, OnUnacceptedQuestMarkersChanged);
            UpdateMarkers(map->LevequestMarkers, ref LevequestMarkers, OnLevequestMarkersChanged);
            UpdateMarker(map->ActiveLevequestMarker, ref ActiveLevequestMarker, OnActiveLevequestMarkerChanged);
            UpdateMarkers(map->GuildLeveAssignmentMarkers, ref GuildLeveAssignmentMarkers, OnGuildLeveAssignmentMarkersChanged);
            UpdateMarkers(map->GuildOrderGuideMarkers, ref GuildOrderGuideMarkers, OnGuildOrderGuideMarkersChanged);
            UpdateMarkers(map->HousingMarkers, ref HousingMarkers, OnHousingMarkersChanged);
            UpdateMarkers(map->TripleTriadMarkers, ref TripleTriadMarkers, OnTripleTriadMarkersChanged);
            UpdateMarkers(map->CustomTalkMarkers, ref CustomTalkMarkers, OnCustomTalkMarkersChanged);
            UpdateMarkers(map->GemstoneTraderMarkers, ref GemstoneTraderMarkers, OnGemstoneTraderMarkersChanged);

            /* Fog of war discovery mask */
            var numberArrayData = AtkStage.Instance()->GetNumberArrayData(NumberArrayType.AreaMap2);
            if (numberArrayData != null)
            {
                DiscoveryMask = numberArrayData->IntArray[2];
            }
            
            /* Flag | TODO: Hook into the set flag method so we dont have to do this check every frame */
            // UpdateFlagMarker(agentMap);
            // 
            // var eventMarkerPointer = new StdVector<MapMarkerData>();
            // var territoryId = Convert.ToUInt16(agentMap->SelectedTerritoryId);
            // EventFramework.Instance()->GetEventMapMarkers(territoryId, &eventMarkerPointer);
            // // Fates are in here, quests are not.....
            // EventMarkersPtrs = eventMarkerPointer;
        }
        catch (Exception e)
        {
            log.Error(e, "Error updating map state");
        }
    }

    public uint SelectedMapId
    {
        get;
        private set
        {
            if (field != value)
            {
                field = value;
                suppressOtherSelectionEvents = true;
                OnSelectedMapIdChanged?.Invoke(value);
            }
        }
    }
    
    public int DiscoveryMask
    {
        get;
        private set
        {
            if (field != value)
            {
                field = value;

                if (!suppressOtherSelectionEvents)
                {
                    OnDiscoveryMaskChanged?.Invoke(value);
                }
            }
        }
    }
    
    private void UpdateQuestLinkMarkers(ReadOnlySpan<GameQuestLinkMarker> span)
    {
        if (!IsDifferent(span, QuestLinkMarkers)) return;
        
        RebuildGameQuestLinkMarkers(span, ref QuestLinkMarkers);
        OnQuestLinkMarkersChanged?.Invoke(QuestLinkMarkers);
    }
    
    private static bool IsDifferent(ReadOnlySpan<GameQuestLinkMarker> list, List<QuestLinkMarker> buffer)
    {
        var bufferIndex = 0;
        foreach (var markerInfo in list)
        {
            // Skip invalid/empty entries in the padded span
            if (markerInfo.QuestId == 0)
                continue;
            
            // More valid markers than we have in buffer
            if (bufferIndex >= buffer.Count)
                return true;

            var b = buffer[bufferIndex++];
            if (markerInfo.IconId != b.Icon ||
                markerInfo.SourceMapId != b.SourceMapId ||
                markerInfo.TargetMapId != b.TargetMapId ||
                markerInfo.RecommendedLevel != b.RecommendedLevel ||
                markerInfo.LevelId != b.LevelId)
            {
                return true;
            }
        }
    
        return false;
    }
    
    private void RebuildGameQuestLinkMarkers(ReadOnlySpan<GameQuestLinkMarker> markers, ref List<QuestLinkMarker> publicField)
    {
        publicField.Clear();
    
        if (markers.Length == 0) return;
    
        publicField.Capacity = markers.Length;
    
        foreach (var marker in markers)
        {
            var level = levelSheet.GetRowOrDefault(marker.LevelId);
            if (!level.HasValue)
                continue;
    
            var data = level.Value;
            
            publicField.Add(new QuestLinkMarker
            {
                Icon = marker.IconId,
                Tooltip = marker.TooltipText.ToString(),
                LevelId = marker.LevelId,
                Position = new Vector3(data.X, data.Z, data.Y),
                RecommendedLevel = (ushort)marker.RecommendedLevel,
                SourceMapId = marker.SourceMapId,
                TargetMapId = marker.TargetMapId,
            });
        }
    }
    
    private static void UpdateMarker(MarkerInfo info, ref DynamicMarker? publicField, Action<DynamicMarker?>? onChanged)
    {
        if (IsEqualToMarker(info, publicField)) return;
    
        publicField = RebuildEventMarker(info);
        onChanged?.Invoke(publicField);
    }
    
    private static void UpdateMarkers(
        ReadOnlySpan<MarkerInfo> span,
        ref List<DynamicMarker> publicField,
        Action<IEnumerable<DynamicMarker>>? onChanged)
    {
        if (!IsDifferent(span, publicField)) return;

        publicField.Clear();
        if (span.Length > 0)
            publicField.Capacity = span.Length;

        foreach (var markerInfo in span)
        {
            var eventMarker = RebuildEventMarker(markerInfo);
            if (eventMarker != null)
                publicField.Add(eventMarker);
        }

        onChanged?.Invoke(publicField);
    }

    private static void UpdateMarkers(
        StdList<MarkerInfo> list,
        ref List<DynamicMarker> publicField,
        Action<IEnumerable<DynamicMarker>>? onChanged)
    {
        if (!IsDifferent(list, publicField)) return;
    
        publicField.Clear();
        foreach (var markerInfo in list)
        {
            var eventMarker = RebuildEventMarker(markerInfo);
            if (eventMarker != null)
                publicField.Add(eventMarker);
        }
        onChanged?.Invoke(publicField);
    }
    
    private static bool IsDifferent(ReadOnlySpan<MarkerInfo> list, List<DynamicMarker> buffer)
    {
        var bufferIndex = 0;
        foreach (var markerInfo in list)
        {
            // Skip invalid/empty entries in the padded span
            if (markerInfo.MarkerData.Count == 0)
                continue;
            
            // More valid markers than we have in buffer
            if (bufferIndex >= buffer.Count)
                return true;
            
            if (!IsEqualToMarker(markerInfo, buffer[bufferIndex++]))
                return true;
        }
    
        return bufferIndex != buffer.Count;
    }

    private static bool IsDifferent(StdList<MarkerInfo> list, List<DynamicMarker> buffer)
    {
        if (list.Count != buffer.Count) return true;
    
        var i = 0;
        foreach (var markerInfo in list)
        {
            if (!IsEqualToMarker(markerInfo, buffer[i++]))
                return true;
        }
    
        return false;
    }

    private static bool IsEqualToMarker(MarkerInfo info, DynamicMarker? marker)
    {
        var markerDataCount = info.MarkerData.Count;
        
        if (marker == null) return markerDataCount == 0;
        if (markerDataCount == 0 || markerDataCount != marker.Data.Count) return false;

        for (var i = 0; i < markerDataCount; i++)
        {
            var data = info.MarkerData[i];
            
            // Compare fields that affect the built EventMarker
            if (info.ShouldRender != marker.ShouldRender ||
                data.DataId != marker.Data[i].DataId ||
                data.LevelId != marker.Data[i].LevelId ||
                data.ObjectiveId != marker.Data[i].ObjectiveId ||
                data.IconId != marker.Data[i].Icon ||
                data.MapId != marker.Data[i].MapId)
            {
                return false;
            }
        }
        
        return true;
    }

    private static unsafe DynamicMarker? RebuildEventMarker(MarkerInfo marker)
    {
        if (marker.MarkerData.Count == 0)
            return null;

        return new DynamicMarker
        {
            ObjectiveId = marker.ObjectiveId,
            Label = marker.Label.ToString(),
            RecommendedLevel = marker.RecommendedLevel,
            ShouldRender = marker.ShouldRender,
            Data = marker.MarkerData.Select(data => new DynamicMarkerData
            {
                LevelId = data.LevelId,
                ObjectiveId = data.ObjectiveId,
                Tooltip = data.TooltipString->ToString(),
                Icon = data.IconId,
                Position = new Vector3(data.Position.X, data.Position.Z, data.Position.Y),
                Radius = data.Radius,
                MapId = data.MapId,
                DataId = data.DataId,
            }).ToList()
        };
    }

    public void Dispose()
    {
        framework.Update -= OnFrameworkUpdate;
    }
}
