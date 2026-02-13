using System.Collections.Generic;
using WebMap.Models;
using FB = WebMap.Networking.Models;


namespace WebMap.Networking.Messages;

public static class Message
{
    public class Content<TData>
    {
        public required TData Data { get; init; }
    }
    
    public class ContentWithType<T, TData> : Content<TData>
    {
        public required T Type { get; init; }
    }
    
    /* Send Methods */
    public static ContentWithType<FB.MessageType, MapData> MapData(MapData data) => new() { Type = FB.MessageType.MapData, Data = data };
    public static ContentWithType<FB.MessageType, Location> PlayerLocation(Location data) => new() { Type = FB.MessageType.PlayerLocation, Data = data };
    public static ContentWithType<FB.MessageType, PlayerTransformAndCameraRotation> PlayerPosition(PlayerTransformAndCameraRotation data) => new() { Type = FB.MessageType.PlayerPosition, Data = data };
    public static ContentWithType<FB.MessageType, SelectedLocation> SelectedLocation(SelectedLocation data) => new() { Type = FB.MessageType.SelectedLocation, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> QuestMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.QuestMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> UnacceptedQuestMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.UnacceptedQuestMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<QuestLinkMarker>> QuestLinkMarkers(IEnumerable<QuestLinkMarker> data) => new() { Type = FB.MessageType.QuestLinkMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> LevequestMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.LevequestMarkers, Data = data };
    public static ContentWithType<FB.MessageType, DynamicMarker?> ActiveLevequestMarker(DynamicMarker? data) => new() { Type = FB.MessageType.ActiveLevequestMarker, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> GuildLeveAssignmentMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.GuildLeveAssignmentMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> GuildOrderGuideMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.GuildOrderGuideMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> HousingMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.HousingMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> TripleTriadMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.TripleTriadMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> CustomTalkMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.CustomTalkMarkers, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<DynamicMarker>> GemstoneTraderMarkers(IEnumerable<DynamicMarker> data) => new() { Type = FB.MessageType.GemstoneTraderMarkers, Data = data };
    public static ContentWithType<FB.MessageType, int> DiscoveryMask(int data) => new() { Type = FB.MessageType.DiscoveryMask, Data = data };
    public static ContentWithType<FB.MessageType, IEnumerable<FlagMarker>> FlagMarkers(IEnumerable<FlagMarker> data) => new() { Type = FB.MessageType.FlagMarkers, Data = data };
}
