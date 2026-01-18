using System;
using System.Collections.Generic;
using System.Linq;
using Dalamud.Utility;
using FFXIVWebMap.Models;
using Lumina.Excel.Sheets;

namespace FFXIVWebMap.Networking.Messages;

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
    
    public interface IReceiveMessage
    {
        static IReadOnlyList<Type> Cases { get; } =
        [
            typeof(ExtractMap)
        ];
        
        static IReadOnlyDictionary<string, Type> CasesByName { get; } = Cases.ToDictionary(it => it.Name.FirstCharToLower(), it => it);
    }
    
    /* Send Methods */
    public static ContentWithType<MessageType, MapData> MapData(MapData data) => new() { Type = MessageType.MapData, Data = data };
    public static ContentWithType<MessageType, uint> MapExtracted(uint data) => new() { Type = MessageType.MapExtracted, Data = data };
    public static ContentWithType<MessageType, Location> PlayerLocation(Location data) => new() { Type = MessageType.PlayerLocation, Data = data };
    public static ContentWithType<MessageType, Transform> PlayerPosition(Transform data) => new() { Type = MessageType.PlayerPosition, Data = data };
    public static ContentWithType<MessageType, SelectedLocation> SelectedLocation(SelectedLocation data) => new() { Type = MessageType.SelectedLocation, Data = data };

    /* Receive classes */
    public sealed class ExtractMap : Content<uint>, IReceiveMessage;
}
