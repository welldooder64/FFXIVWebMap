namespace FFXIVWebMap.Models;

public sealed class SelectedLocation
{
    /// <summary>
    /// Identifies the unique ID of the map currently selected or displayed in-game.
    /// </summary>
    public required uint MapId { get; init; }

    /// <summary>
    /// Represents a bitmask indicating discovered areas on a specific map in the game.
    /// </summary>
    public required int DiscoveryMask { get; init; }
}
