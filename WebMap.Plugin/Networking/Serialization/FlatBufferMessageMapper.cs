using System;
using System.Collections.Generic;
using System.Linq;
using Google.FlatBuffers;
using WebMap.Models;
using WebMap.Networking.Messages;
using FB = WebMap.Networking.Models;

namespace WebMap.Networking.Serialization;

public static class FlatBufferMessageMapper
{
    public static byte[] Map<T>(Message.ContentWithType<FB.MessageType, T> data)
    {
        var builder = new FlatBufferBuilder(1024);

        var (payloadType, payloadOffset) = MapPayload(builder, data);

        var serverMessageOffset = FB.ServerMessage.CreateServerMessage(builder, data.Type, payloadType, payloadOffset);
        FB.ServerMessage.FinishServerMessageBuffer(builder, serverMessageOffset);

        return builder.SizedByteArray();
    }

    private static (FB.MessagePayload, int) MapPayload(FlatBufferBuilder builder, object data)
    {
        return data switch
        {
            Message.ContentWithType<FB.MessageType, MapData> mapDataContent => 
                (FB.MessagePayload.MapData, MapMapData(builder, mapDataContent.Data).Value),
            Message.ContentWithType<FB.MessageType, Location> locationContent => 
                (FB.MessagePayload.Location, MapLocation(builder, locationContent.Data).Value),
            Message.ContentWithType<FB.MessageType, PlayerTransformAndCameraRotation> playerPosContent =>
                (FB.MessagePayload.PlayerTransformAndCameraRotation, MapPlayerPosition(builder, playerPosContent.Data).Value),
            Message.ContentWithType<FB.MessageType, SelectedLocation> selectedLocContent =>
                (FB.MessagePayload.SelectedLocation, MapSelectedLocation(builder, selectedLocContent.Data).Value),
            Message.ContentWithType<FB.MessageType, int> discoveryMaskContent => 
                (FB.MessagePayload.DiscoveryMask, MapDiscoveryMask(builder, discoveryMaskContent.Data).Value),
            Message.ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> dynamicMarkersContent =>
                (FB.MessagePayload.DynamicMarkerList, MapDynamicMarkerList(builder, dynamicMarkersContent.Data).Value),
            Message.ContentWithType<FB.MessageType, DynamicMarker?> activeLeveContent => 
                (FB.MessagePayload.DynamicMarker, activeLeveContent.Data == null ? 0 : MapDynamicMarker(builder, activeLeveContent.Data).Value),
            Message.ContentWithType<FB.MessageType, IEnumerable<QuestLinkMarker>> questLinkMarkersContent =>
                (FB.MessagePayload.QuestLinkMarkerList, MapQuestLinkMarkerList(builder, questLinkMarkersContent.Data).Value),
            Message.ContentWithType<FB.MessageType, IEnumerable<FlagMarker>> flagMarkersContent =>
                (FB.MessagePayload.FlagMarkerList, MapFlagMarkerList(builder, flagMarkersContent.Data).Value),
            
            _ => throw new ArgumentException($"Unsupported data type for FlatBuffer mapping: {data.GetType().FullName}")
        };
    }
    
    private static Offset<FB.MapData> MapMapData(FlatBufferBuilder builder, MapData data)
    {
        var mapsOffsets = data.Maps.Select(kvp =>
        {
            var id = builder.CreateString(kvp.Value.Id);
            var region = builder.CreateString(kvp.Value.Region);
            var place = builder.CreateString(kvp.Value.Place);
            var subPlace = builder.CreateString(kvp.Value.SubPlace);

            FB.Map.StartMap(builder);
            FB.Map.AddRowId(builder, kvp.Key);
            FB.Map.AddId(builder, id);
            FB.Map.AddRegion(builder, region);
            FB.Map.AddPlace(builder, place);
            FB.Map.AddSubPlace(builder, subPlace);
            FB.Map.AddMapMarkerRange(builder, kvp.Value.MapMarkerRange);
            FB.Map.AddPriorityCategoryUi(builder, kvp.Value.PriorityCategoryUI);
            FB.Map.AddPriorityUi(builder, kvp.Value.PriorityUI);
            FB.Map.AddHierarchy(builder, kvp.Value.Hierarchy);
            FB.Map.AddDiscoveryArrayByte(builder, kvp.Value.DiscoveryArrayByte);
            FB.Map.AddDiscoveryFlag(builder, kvp.Value.DiscoveryFlag);
            FB.Map.AddDiscoveryIndex(builder, kvp.Value.DiscoveryIndex);
            FB.Map.AddSizeFactor(builder, kvp.Value.SizeFactor);
            FB.Map.AddOffsetX(builder, kvp.Value.OffsetX);
            FB.Map.AddOffsetY(builder, kvp.Value.OffsetY);
            return FB.Map.EndMap(builder);
        }).ToArray();

        var mapsVector = FB.MapData.CreateMapsVector(builder, mapsOffsets);

        var markersOffsets = data.Markers.Select(kvp =>
        {
            var innerMarkersOffsets = kvp.Value
                .OrderBy(m => m.Key)
                .Select(m => MapStaticMarker(builder, m.Key, m.Value))
                .ToArray();
            var innerMarkersVector = FB.MapMarkersPair.CreateValueVector(builder, innerMarkersOffsets);

            FB.MapMarkersPair.StartMapMarkersPair(builder);
            FB.MapMarkersPair.AddKey(builder, kvp.Key);
            FB.MapMarkersPair.AddValue(builder, innerMarkersVector);
            return FB.MapMarkersPair.EndMapMarkersPair(builder);
        }).ToArray();

        var markersVector = FB.MapData.CreateMarkersVector(builder, markersOffsets);

        var markerNamesOffsets = data.MarkerNames.Select(kvp =>
        {
            var name = builder.CreateString(kvp.Value);
            return FB.MarkerName.CreateMarkerName(builder, kvp.Key, name);
        }).ToArray();

        var markerNamesVector = FB.MapData.CreateMarkerNamesVector(builder, markerNamesOffsets);

        return FB.MapData.CreateMapData(builder, mapsVector, markersVector, markerNamesVector);
    }

    private static Offset<FB.StaticMarker> MapStaticMarker(FlatBufferBuilder builder, uint subRowId, StaticMarker marker)
    {
        Offset<FB.SeString>? titleSeOffset = marker.Title.HasValue ? FB.SeString.CreateSeString(builder, FB.SeString.CreateDataVector(builder, marker.Title.Value.ToArray())) : null;

        int dataOffset = 0;
        FB.StaticMarkerData dataType = FB.StaticMarkerData.NONE;

        if (marker is MapLinkStaticMarker ml)
        {
            dataType = FB.StaticMarkerData.MapLink;
            dataOffset = FB.MapLinkData.CreateMapLinkData(builder, ml.TargetMapId).Value;
        }
        else if (marker is ImplicitMapLinkStaticMarker iml)
        {
            dataType = FB.StaticMarkerData.ImplicitMapLink;
            dataOffset = FB.MapLinkData.CreateMapLinkData(builder, iml.TargetMapId).Value;
        }
        else if (marker is AetheryteStaticMarker a)
        {
            dataType = FB.StaticMarkerData.Aetheryte;
            dataOffset = FB.AetheryteData.CreateAetheryteData(builder, a.AetheryteId).Value;
        }
        else if (marker is PlaceNameStaticMarker p)
        {
            dataType = FB.StaticMarkerData.PlaceName;
            var tooltip = FB.SeString.CreateSeString(builder, FB.SeString.CreateDataVector(builder, p.Tooltip.ToArray()));
            dataOffset = FB.PlaceNameData.CreatePlaceNameData(builder, tooltip).Value;
        }

        FB.StaticMarker.StartStaticMarker(builder);
        FB.StaticMarker.AddSubRowId(builder, subRowId);
        if (titleSeOffset.HasValue) FB.StaticMarker.AddTitle(builder, titleSeOffset.Value);
        FB.StaticMarker.AddIcon(builder, marker.Icon);
        FB.StaticMarker.AddPosition(builder, FB.Vector2.CreateVector2(builder, marker.Position.X, marker.Position.Y));
        FB.StaticMarker.AddSubtextOrientation(builder, marker.SubtextOrientation);
        FB.StaticMarker.AddType(builder, marker.Type.RawValue);
        FB.StaticMarker.AddDataType(builder, dataType);
        if (dataOffset != 0) FB.StaticMarker.AddData(builder, dataOffset);

        return FB.StaticMarker.EndStaticMarker(builder);
    }

    private static Offset<FB.Location> MapLocation(FlatBufferBuilder builder, Location data)
    {
        return FB.Location.CreateLocation(builder, data.MapId);
    }

    private static Offset<FB.PlayerTransformAndCameraRotation> MapPlayerPosition(FlatBufferBuilder builder, PlayerTransformAndCameraRotation data)
    {
        FB.PlayerTransformAndCameraRotation.StartPlayerTransformAndCameraRotation(builder);
        FB.PlayerTransformAndCameraRotation.AddPlayerTransform(builder, FB.Transform.CreateTransform(builder,
            data.PlayerTransform.Position.X, data.PlayerTransform.Position.Y, data.PlayerTransform.Position.Z,
            data.PlayerTransform.Rotation));
        FB.PlayerTransformAndCameraRotation.AddCameraRotation(builder, data.CameraRotation);
        return FB.PlayerTransformAndCameraRotation.EndPlayerTransformAndCameraRotation(builder);
    }

    private static Offset<FB.SelectedLocation> MapSelectedLocation(FlatBufferBuilder builder, SelectedLocation data)
    {
        return FB.SelectedLocation.CreateSelectedLocation(builder, data.MapId, data.DiscoveryMask);
    }

    private static Offset<FB.DiscoveryMask> MapDiscoveryMask(FlatBufferBuilder builder, int data)
    {
        return FB.DiscoveryMask.CreateDiscoveryMask(builder, data);
    }

    private static Offset<FB.DynamicMarkerList> MapDynamicMarkerList(FlatBufferBuilder builder, IEnumerable<DynamicMarker> data)
    {
        var offsets = data.Select(m => MapDynamicMarker(builder, m)).ToArray();
        var vector = FB.DynamicMarkerList.CreateMarkersVector(builder, offsets);
        return FB.DynamicMarkerList.CreateDynamicMarkerList(builder, vector);
    }

    private static Offset<FB.DynamicMarker> MapDynamicMarker(FlatBufferBuilder builder, DynamicMarker data)
    {
        var label = builder.CreateString(data.Label);
        var offsets = data.Data.Select(m => MapDynamicMarkerData(builder, m)).ToArray();
        var vector = FB.DynamicMarker.CreateDataVector(builder, offsets);
        
        FB.DynamicMarker.StartDynamicMarker(builder);
        FB.DynamicMarker.AddObjectiveId(builder, data.ObjectiveId);
        FB.DynamicMarker.AddLabel(builder, label);
        FB.DynamicMarker.AddData(builder, vector);
        FB.DynamicMarker.AddRecommendedLevel(builder, data.RecommendedLevel);
        FB.DynamicMarker.AddShouldRender(builder, data.ShouldRender);
        return FB.DynamicMarker.EndDynamicMarker(builder);
    }
    
    private static Offset<FB.DynamicMarkerData> MapDynamicMarkerData(FlatBufferBuilder builder, DynamicMarkerData data)
    {
        var tooltip = builder.CreateString(data.Tooltip);
        FB.DynamicMarkerData.StartDynamicMarkerData(builder);
        FB.DynamicMarkerData.AddLevelId(builder, data.LevelId);
        FB.DynamicMarkerData.AddObjectiveId(builder, data.ObjectiveId);
        FB.DynamicMarkerData.AddTooltip(builder, tooltip);
        FB.DynamicMarkerData.AddIcon(builder, data.Icon);
        FB.DynamicMarkerData.AddPosition(builder, FB.Vector3.CreateVector3(builder, data.Position.X, data.Position.Y, data.Position.Z));
        FB.DynamicMarkerData.AddRadius(builder, data.Radius);
        FB.DynamicMarkerData.AddMapId(builder, data.MapId);
        FB.DynamicMarkerData.AddDataId(builder, data.DataId);
        return FB.DynamicMarkerData.EndDynamicMarkerData(builder);
    }
    
    private static Offset<FB.QuestLinkMarkerList> MapQuestLinkMarkerList(FlatBufferBuilder builder, IEnumerable<QuestLinkMarker> data)
    {
        var offsets = data.Select(m => MapQuestLinkMarker(builder, m)).ToArray();
        var vector = FB.QuestLinkMarkerList.CreateMarkersVector(builder, offsets);
        return FB.QuestLinkMarkerList.CreateQuestLinkMarkerList(builder, vector);
    }

    private static Offset<FB.QuestLinkMarker> MapQuestLinkMarker(FlatBufferBuilder builder, QuestLinkMarker data)
    {
        var tooltip = builder.CreateString(data.Tooltip);
        
        FB.QuestLinkMarker.StartQuestLinkMarker(builder);
        FB.QuestLinkMarker.AddIcon(builder, data.Icon);
        FB.QuestLinkMarker.AddTooltip(builder, tooltip);
        FB.QuestLinkMarker.AddLevelId(builder, data.LevelId);
        FB.QuestLinkMarker.AddPosition(builder, FB.Vector3.CreateVector3(builder, data.Position.X, data.Position.Y, data.Position.Z));
        FB.QuestLinkMarker.AddRecommendedLevel(builder, data.RecommendedLevel);
        FB.QuestLinkMarker.AddSourceMapId(builder, data.SourceMapId);
        FB.QuestLinkMarker.AddTargetMapId(builder, data.TargetMapId);
        return FB.QuestLinkMarker.EndQuestLinkMarker(builder);
    }

    private static Offset<FB.FlagMarkerList> MapFlagMarkerList(FlatBufferBuilder builder, IEnumerable<FlagMarker> data)
    {
        var offsets = data.Select(_ =>
        {
            FB.FlagMarker.StartFlagMarker(builder);
            return FB.FlagMarker.EndFlagMarker(builder);
        }).ToArray();
        var vector = FB.FlagMarkerList.CreateMarkersVector(builder, offsets);
        return FB.FlagMarkerList.CreateFlagMarkerList(builder, vector);
    }
}
