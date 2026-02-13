using System;
using System.Diagnostics;
using Dalamud.Interface.Windowing;
using Dalamud.Plugin;
using WebMap.Config;

namespace WebMap.Windows;

public sealed class WindowManager : IDisposable
{
    private readonly WindowSystem windowSystem;
    private readonly IDalamudPluginInterface pluginInterface;
    private readonly SettingsWindow settingsWindow;
    private readonly ConfigurationService configurationService;

    
    public WindowManager
        (
            IDalamudPluginInterface pluginInterface,
            SettingsWindow settingsWindow,
            ConfigurationService configurationService
        )
    {
        this.pluginInterface = pluginInterface;
        this.settingsWindow = settingsWindow;
        this.configurationService = configurationService;
        
        windowSystem = new WindowSystem(WebMapPlugin.Name);
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
        var url = $"http://localhost:{configurationService.Configuration.Port}";
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    public void Dispose()
    {
        pluginInterface.UiBuilder.Draw -= windowSystem.Draw;
        pluginInterface.UiBuilder.OpenConfigUi -= ToggleSettingsWindow;
        pluginInterface.UiBuilder.OpenMainUi -= OpenMap;
        
        windowSystem.RemoveAllWindows();
    }
}
