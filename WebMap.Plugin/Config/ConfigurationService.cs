using System;
using System.IO;
using Dalamud.Plugin;

namespace WebMap.Config;

public sealed class ConfigurationService : IDisposable
{
    public Configuration Configuration { get; private set; }
    
    public event Action? OnConfigurationSaved;
    
    private readonly IDalamudPluginInterface pluginInterface;
    
    public string ConfigDirectory => pluginInterface.ConfigDirectory.FullName;
    public string ResourcesDirectory => Path.Combine(ConfigDirectory, "resources");
    
    public ConfigurationService(IDalamudPluginInterface pluginInterface)
    {
        this.pluginInterface = pluginInterface;
        Configuration = this.pluginInterface.GetPluginConfig() as Configuration ?? new Configuration();
        
        if (!Directory.Exists(ResourcesDirectory))
            Directory.CreateDirectory(ResourcesDirectory);
    }
    
    public void Save()
    {
        pluginInterface.SavePluginConfig(Configuration);
        OnConfigurationSaved?.Invoke();
    }

    public void Dispose()
    {
        Save();
    }
}
