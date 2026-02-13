using System.Collections.Generic;

namespace WebMap.Models;

public class MapData
{
    public required IReadOnlyDictionary<uint, MapEntry> Maps { get; init; }
    public required IReadOnlyDictionary<uint, Dictionary<ushort, StaticMarker>>  Markers { get; init; }
    public required IReadOnlyDictionary<uint, string> MarkerNames { get; init; }
}
