using System;
using Dalamud.Game.Command;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Windows;

namespace FFXIVWebMap.Game.Chat;

public sealed class CommandHandlerService : IDisposable
{
    private const string WebMapCommandName = "/webmap";
    
    private readonly ICommandManager commandManager;
    private readonly WindowManager windowManager;
    
    public CommandHandlerService(ICommandManager commandManager, WindowManager windowManager)
    {
        this.commandManager = commandManager;
        this.windowManager = windowManager;
        
        this.commandManager.AddHandler(WebMapCommandName, new CommandInfo(OnCommand)
        {
            HelpMessage = "Open the web map in your default browser."
        });
    }
    
    private void OnCommand(string command, string args)
    {
        windowManager.OpenMap();
    }

    public void Dispose()
    {
        commandManager.RemoveHandler(WebMapCommandName);
    }
}
