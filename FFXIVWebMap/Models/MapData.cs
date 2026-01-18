using System.Collections.Generic;

namespace FFXIVWebMap.Models;

public class MapData
{
    public required IReadOnlyDictionary<uint, MapEntry> Maps { get; init; }
    public required IReadOnlyDictionary<uint, Dictionary<ushort, MapMarker>>  Markers { get; init; }
}
