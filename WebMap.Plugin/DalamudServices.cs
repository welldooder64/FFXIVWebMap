using Dalamud.IoC;
using Dalamud.Plugin;
using Dalamud.Plugin.Services;

namespace WebMap;

public class DalamudServices
{
    [PluginService] public IDalamudPluginInterface PluginInterface { get; private set; } = null!;
    [PluginService] public IGameInteropProvider GameInteropProvider { get; private set; } = null!;
    [PluginService] public IFramework Framework { get; private set; } = null!;
    [PluginService] public IPluginLog Log { get; private set; } = null!;
    [PluginService] public ICommandManager CommandManager { get; private set; } = null!;
    [PluginService] public IDataManager DataManager { get; private set; } = null!;
    [PluginService] public ITextureProvider TextureProvider { get; private set; } = null!;
    [PluginService] public IClientState ClientState { get; private set; } = null!;
    [PluginService] public IObjectTable ObjectTable { get; private set; } = null!;
    [PluginService] public IGameGui GameGui { get; private set; } = null!;
    
    public DalamudServices(IDalamudPluginInterface pluginInterface)
    {
        pluginInterface.Inject(this);
    }
}
