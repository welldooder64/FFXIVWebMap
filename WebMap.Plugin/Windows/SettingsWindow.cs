using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Numerics;
using Dalamud.Bindings.ImGui;
using Dalamud.Interface.Windowing;
using WebMap.Config;

namespace WebMap.Windows;

public class SettingsWindow : Window
{
    private readonly ConfigurationService configurationService;
    private string? cachedLocalIp;
    
    public SettingsWindow(ConfigurationService configurationService) : base("Settings###web_map_settings_window")
    {
        this.configurationService = configurationService;
        
        Flags = ImGuiWindowFlags.NoResize | ImGuiWindowFlags.NoCollapse | ImGuiWindowFlags.NoScrollbar |
                ImGuiWindowFlags.NoScrollWithMouse;

        Size = new Vector2(400, 200);
        SizeCondition = ImGuiCond.Always;
    }

    public override void Draw()
    {
        var configValue = configurationService.Configuration.Port;
        if (ImGui.InputInt("Port", ref configValue))
        {
            configurationService.Configuration.Port = configValue;
        }
        
        var exposeToNetwork = configurationService.Configuration.ExposeToLocalNetwork;
        if (ImGui.Checkbox("Expose to local network", ref exposeToNetwork))
        {
            configurationService.Configuration.ExposeToLocalNetwork = exposeToNetwork;
        }
        
        if (ImGui.IsItemHovered())
        {
            ImGui.BeginTooltip();
            ImGui.PushTextWrapPos(300);
            ImGui.TextUnformatted("When enabled, the web server will be accessible from other devices on your local network (e.g., phones, tablets). When disabled, only this computer can access the map.");
            ImGui.PopTextWrapPos();
            ImGui.EndTooltip();
        }
        
        if (exposeToNetwork)
        {
            var localIp = GetLocalIpAddress();
            var port = configurationService.Configuration.Port;
            ImGui.TextColored(new Vector4(0.7f, 0.7f, 0.7f, 1.0f), $"Access from: http://{localIp}:{port}");
        }
        
        var buttonHeight = ImGui.GetFrameHeight();
        var spacing = ImGui.GetStyle().ItemSpacing.Y;
        var bottomY = ImGui.GetWindowHeight() - buttonHeight - ImGui.GetStyle().WindowPadding.Y;
        
        ImGui.SetCursorPosY(bottomY - spacing - ImGui.GetStyle().ItemSpacing.Y);
        ImGui.Separator();
        ImGui.Spacing();
        
        var buttonWidth = (ImGui.GetContentRegionAvail().X - ImGui.GetStyle().ItemSpacing.X) / 2;
        
        if (ImGui.Button("Save", new Vector2(buttonWidth, 0)))
        {
            configurationService.Save();
        }
        
        ImGui.SameLine();
        
        if (ImGui.Button("Save & Close", new Vector2(buttonWidth, 0)))
        {
            configurationService.Save();
            IsOpen = false;
        }
    }
    
    private string GetLocalIpAddress()
    {
        if (cachedLocalIp != null)
            return cachedLocalIp;
        
        try
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            var ip = host.AddressList.FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork);
            cachedLocalIp = ip?.ToString() ?? "Unknown";
        }
        catch
        {
            cachedLocalIp = "Unknown";
        }
        
        return cachedLocalIp;
    }
}
