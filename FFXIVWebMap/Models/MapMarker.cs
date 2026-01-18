namespace FFXIVWebMap.Models;

public sealed class MapMarker
{
    public required ushort Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public required ushort Icon { get; init; }
    public required short X { get; init; }
    public required short Y { get; init; }
    public required byte SubtextOrientation { get; init; }
}
