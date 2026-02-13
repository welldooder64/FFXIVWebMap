using System;
using Dalamud.Configuration;

namespace WebMap.Config;

[Serializable]
public class Configuration : IPluginConfiguration
{
    public int Port { get; set; } = 6335;
    public bool ExposeToLocalNetwork { get; set; } = false;
    public int Version { get; set; } = 0;
}
