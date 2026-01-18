using System;
using Dalamud.Interface.Windowing;
using Dalamud.Plugin;

namespace FFXIVWebMap.Windows;

public sealed class WindowManager : IDisposable
{
    private readonly WindowSystem windowSystem;
    private readonly IDalamudPluginInterface pluginInterface;
    private readonly SettingsWindow settingsWindow;
    
    public WindowManager
        (
            IDalamudPluginInterface pluginInterface,
            SettingsWindow settingsWindow
        )
    {
        this.pluginInterface = pluginInterface;
        this.settingsWindow = settingsWindow;
        
        windowSystem = new(WebMap.Name);
        windowSystem.AddWindow(this.settingsWindow);
        
        this.pluginInterface.UiBuilder.Draw += windowSystem.Draw;
        this.pluginInterface.UiBuilder.OpenConfigUi += ToggleSettingsWindow;
        this.pluginInterface.UiBuilder.OpenMainUi += OpenMap;
    }

    public void ToggleSettingsWindow()
    {
        settingsWindow.Toggle();
    }
    
    public void OpenMap()
    {
        // TODO: Open web map in browser
    }

    public void Dispose()
    {
        pluginInterface.UiBuilder.Draw -= windowSystem.Draw;
        pluginInterface.UiBuilder.OpenConfigUi -= ToggleSettingsWindow;
        pluginInterface.UiBuilder.OpenMainUi -= OpenMap;
        
        windowSystem.RemoveAllWindows();
    }
}
