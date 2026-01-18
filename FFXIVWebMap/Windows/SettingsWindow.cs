using System.Numerics;
using Dalamud.Bindings.ImGui;
using Dalamud.Interface.Windowing;
using FFXIVWebMap.Config;

namespace FFXIVWebMap.Windows;

public class SettingsWindow : Window
{
    private readonly ConfigurationService configurationService;
    
    public SettingsWindow(ConfigurationService configurationService) : base("Settings###web_map_settings_window")
    {
        this.configurationService = configurationService;
        
        Flags = ImGuiWindowFlags.NoResize | ImGuiWindowFlags.NoCollapse | ImGuiWindowFlags.NoScrollbar |
                ImGuiWindowFlags.NoScrollWithMouse;

        Size = new Vector2(232, 90);
        SizeCondition = ImGuiCond.Always;
    }

    public override void PreDraw()
    {
        // Flags must be added or removed before Draw() is being called, or they won't apply
        if (configurationService.Configuration.IsConfigWindowMovable)
            Flags &= ~ImGuiWindowFlags.NoMove;
        else
            Flags |= ImGuiWindowFlags.NoMove;
    }

    public override void Draw()
    {
        // Can't ref a property, so use a local copy
        var configValue = configurationService.Configuration.SomePropertyToBeSavedAndWithADefault;
        if (ImGui.Checkbox("Random Config Bool", ref configValue))
        {
            configurationService.Configuration.SomePropertyToBeSavedAndWithADefault = configValue;
            // Can save immediately on change if you don't want to provide a "Save and Close" button
            configurationService.Save();
        }

        var movable = configurationService.Configuration.IsConfigWindowMovable;
        if (ImGui.Checkbox("Movable Config Window", ref movable))
        {
            configurationService.Configuration.IsConfigWindowMovable = movable;
            configurationService.Save();
        }
    }
}
