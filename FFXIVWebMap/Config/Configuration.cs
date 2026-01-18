using System;
using Dalamud.Configuration;

namespace FFXIVWebMap.Config;

[Serializable]
public class Configuration : IPluginConfiguration
{
    public bool IsConfigWindowMovable { get; set; } = true;
    public bool SomePropertyToBeSavedAndWithADefault { get; set; } = true;
    public int Version { get; set; } = 0;
}
