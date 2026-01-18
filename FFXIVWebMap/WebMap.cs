using System;
using System.IO;
using Dalamud.Interface.Textures;
using Dalamud.Plugin;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Config;
using FFXIVWebMap.Game.Chat;
using FFXIVWebMap.Game.Map;
using FFXIVWebMap.Game.Player;
using FFXIVWebMap.Networking;
using FFXIVWebMap.Resources.Sheets;
using FFXIVWebMap.Resources.Textures;
using FFXIVWebMap.Networking.Web;
using FFXIVWebMap.Windows;
using Microsoft.Extensions.DependencyInjection;

namespace FFXIVWebMap;

// ReSharper disable once ClassNeverInstantiated.Global
public sealed class WebMap : IDalamudPlugin
{
    public const string Name = "Web Map";

    private static ServiceProvider? Services;
    
    public static IPluginLog Log { get; private set; } = null!;

    public WebMap(IDalamudPluginInterface pluginInterface)
    {
        // Setup dalamud services
        var dalamudServices = new DalamudServices(pluginInterface);
        Log = dalamudServices.Log;

        try
        {
            // Setup plugin services
            Log.Info($"Starting {Name}...");
            var serviceCollection = SetupServices(dalamudServices);
            Services = serviceCollection.BuildServiceProvider(new ServiceProviderOptions { ValidateOnBuild = true });
        
            // Initialize the singletons
            foreach(var service in serviceCollection)
            {
                if(service.Lifetime == ServiceLifetime.Singleton)
                {
                    Log.Debug($"Initializing {service.ServiceType}...");
                    Services.GetRequiredService(service.ServiceType);
                }
            }
            
            ExtractStaticAssets(Services);

            Log.Info($"Started {Name}");
        }
        catch (Exception e)
        {
            Log.Error(e, $"Failed to start {Name}");
            Services?.Dispose();
            throw;
        }
    }

    private static ServiceCollection SetupServices(DalamudServices dalamudServices)
    {
        ServiceCollection serviceCollection = new();
        
        // Dalamud
        serviceCollection.AddSingleton(dalamudServices.PluginInterface);
        serviceCollection.AddSingleton(dalamudServices.GameInteropProvider);
        serviceCollection.AddSingleton(dalamudServices.Framework);
        serviceCollection.AddSingleton(dalamudServices.Log);
        serviceCollection.AddSingleton(dalamudServices.CommandManager);
        serviceCollection.AddSingleton(dalamudServices.DataManager);
        serviceCollection.AddSingleton(dalamudServices.TextureProvider);
        serviceCollection.AddSingleton(dalamudServices.ClientState);
        serviceCollection.AddSingleton(dalamudServices.ObjectTable);
        serviceCollection.AddSingleton(dalamudServices.GameGui);
        
        // Configuration
        serviceCollection.AddSingleton<ConfigurationService>();
        
        // Game -> Chat
        serviceCollection.AddSingleton<CommandHandlerService>();
        
        // Game -> Player
        serviceCollection.AddSingleton<PlayerTrackingService>();
        
        // Game -> Map
        serviceCollection.AddSingleton<MapState>();
        serviceCollection.AddSingleton<MapTrackingService>();
        serviceCollection.AddSingleton<MapExtractionService>();
        
        // Resources
        serviceCollection.AddSingleton<MapSheetProvider>();
        serviceCollection.AddSingleton<MapMarkerSheetProvider>();
        serviceCollection.AddSingleton<MapSymbolSheetProvider>();
        serviceCollection.AddSingleton<TextureProvider>();
        
        // Windows
        serviceCollection.AddSingleton<WindowManager>();
        serviceCollection.AddSingleton<SettingsWindow>();
        
        // Networking
        serviceCollection.AddSingleton<WebService>();
        serviceCollection.AddSingleton<INetworkService>(sp => sp.GetRequiredService<WebService>());
        
        return serviceCollection;
    }

    private static void ExtractStaticAssets(ServiceProvider services)
    {
        var textureProvider = services.GetRequiredService<TextureProvider>();
        var dalamudTextureProvider = services.GetRequiredService<ITextureProvider>();
        var mapMarkerSheetProvider = services.GetRequiredService<MapMarkerSheetProvider>();
        
        // Extract static textures
        textureProvider.Extract("ui/uld/NaviMap_hr1.tex", false);
            
        // Extract map symbols
        foreach (var icon in mapMarkerSheetProvider.GetDistinctIcons())
        {
            textureProvider.Extract(dalamudTextureProvider.GetIconPath(new GameIconLookup(icon)), false);
        }
            
        // Extract icons for specific ranges (there might be a better way to do this...)
        (uint, uint)[] ranges = [(60300, 60649), (60750, 60792), (60900, 60999), (70960, 71356)];
        foreach (var (start, end) in ranges)
        {
            for (var i = start; i <= end; i++)
            {
                try
                {
                    textureProvider.Extract(dalamudTextureProvider.GetIconPath(new GameIconLookup(i)), false);
                } catch (FileNotFoundException) {}
            }
        }
    }

    public void Dispose()
    {
        Services?.Dispose();
    }
}
