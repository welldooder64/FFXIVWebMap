using System.Collections.Generic;
using System.Numerics;

namespace WebMap.Models;

public sealed record DynamicMarker
{
    public required uint ObjectiveId { get; init; }
    public required string Label { get; init; }
    public required List<DynamicMarkerData> Data { get; init; }
    public required ushort RecommendedLevel { get; init; }
    public required bool ShouldRender { get; init; }
}

public abstract record MarkerData
{
    public uint Icon { get; init; }
    public required string Tooltip { get; init; }
    public required uint LevelId { get; init; }
    public required Vector3 Position { get; init; }
}

public sealed record DynamicMarkerData : MarkerData
{
    public required uint ObjectiveId { get; init; }
    public required float Radius { get; init; }
    public required uint MapId { get; init; }
    public required uint DataId { get; init; }
}

public sealed record QuestLinkMarker : MarkerData
{
    public required ushort RecommendedLevel { get; init; }
    
    public required uint SourceMapId { get; init; }
    public required uint TargetMapId { get; init; }
}

// TODO: Move somewhere else

public sealed record FlagMarker
{
    // public required uint MapId { get; init; }
}
