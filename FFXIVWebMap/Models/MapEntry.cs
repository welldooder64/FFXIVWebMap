namespace FFXIVWebMap.Models;

public sealed class MapEntry
{
    public string Id { get; init; } = string.Empty;
    public string Region { get; init; } = string.Empty;
    public string Place { get; init; } = string.Empty;
    public string SubPlace { get; init; } = string.Empty;
    public ushort MapMarkerRange { get; init; }
    public uint PriorityCategoryUI { get; init; }
    public uint PriorityUI { get; init; }
    public uint Hierarchy { get; init; }
    
    public bool DiscoveryArrayByte { get; init; }
    public uint DiscoveryFlag { get; init; }
    public short DiscoveryIndex { get; init; }
    
    public ushort SizeFactor { get; init; }
    public short OffsetX { get; init; }
    public short OffsetY { get; init; }
}
