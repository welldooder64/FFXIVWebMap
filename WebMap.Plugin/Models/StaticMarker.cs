using System;
using System.Numerics;

namespace WebMap.Models;

public abstract class StaticMarker
{
    public required ReadOnlyMemory<byte>? Title { get; init; }
    public required ushort? Icon { get; init; }
    public required Vector2 Position  { get; init; }
    public required byte SubtextOrientation { get; init; }
    public required StaticMarkerType Type { get; init; }
    
    // ReSharper disable once UnusedMember.Global
    public abstract StaticMarkerDataType DataType { get; }
}

public sealed class NormalStaticMarker : StaticMarker
{
    public override StaticMarkerDataType DataType => StaticMarkerDataType.Normal;
}

public sealed class MapLinkStaticMarker : StaticMarker
{
    public override StaticMarkerDataType DataType => StaticMarkerDataType.MapLink;
    public required uint TargetMapId { get; init; }
}

public sealed class ImplicitMapLinkStaticMarker : StaticMarker
{
    public override StaticMarkerDataType DataType => StaticMarkerDataType.ImplicitMapLink;
    public required uint TargetMapId { get; init; }
}

public sealed class AetheryteStaticMarker : StaticMarker
{
    public override StaticMarkerDataType DataType => StaticMarkerDataType.Aetheryte;
    public required uint AetheryteId { get; init; }
}

public sealed class PlaceNameStaticMarker : StaticMarker
{
    public override StaticMarkerDataType DataType => StaticMarkerDataType.PlaceName;
    public required ReadOnlyMemory<byte> Tooltip { get; init; }
}

public sealed class UnknownStaticMarker(byte dataType) : StaticMarker
{
    public override StaticMarkerDataType DataType => new(dataType);
    public required uint DataKey { get; init; }
}

public readonly struct StaticMarkerType(byte value) : IRawValue<byte>
{
    public byte RawValue { get; } = value;
    
    public const byte NormalValue = 0;
    public const byte TitleValue = 1;
    
    public static readonly StaticMarkerType Normal = new(NormalValue);
    public static readonly StaticMarkerType Title = new(TitleValue);
}

public readonly struct StaticMarkerDataType(byte value) : IRawValue<byte>
{
    public byte RawValue { get; } = value;
    
    public const byte NormalValue = 0;
    public const byte MapLinkValue = 1;
    public const byte ImplicitMapLinkValue = 2;
    public const byte AetheryteValue = 3;
    public const byte PlaceNameValue = 4;

    public static readonly StaticMarkerDataType Normal = new(NormalValue);
    public static readonly StaticMarkerDataType MapLink = new(MapLinkValue);
    public static readonly StaticMarkerDataType ImplicitMapLink = new(ImplicitMapLinkValue);
    public static readonly StaticMarkerDataType Aetheryte = new(AetheryteValue);
    public static readonly StaticMarkerDataType PlaceName = new(PlaceNameValue);
}
