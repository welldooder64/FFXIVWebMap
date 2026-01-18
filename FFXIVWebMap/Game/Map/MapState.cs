using System;
using Dalamud.Plugin.Services;
using FFXIVClientStructs.FFXIV.Client.UI.Agent;

namespace FFXIVWebMap.Game.Map;

public sealed class MapState : IDisposable
{
    private readonly IFramework framework;
    
    private uint selectedMapId;
    
    public event Action<uint>? OnSelectedMapIdChanged;
    
    public MapState(IFramework framework)
    {
        this.framework = framework;
        framework.Update += OnFrameworkUpdate;
    }
    
    private unsafe void OnFrameworkUpdate(IFramework _)
    {
        SelectedMapId = AgentMap.Instance()->SelectedMapId;
    }
    
    public uint SelectedMapId
    {
        get => selectedMapId;
        private set
        {
            if (selectedMapId != value)
            {
                selectedMapId = value;
                OnSelectedMapIdChanged?.Invoke(value);
            }
        }
    }
    
    public void Dispose()
    {
        framework.Update -= OnFrameworkUpdate;
    }
}
