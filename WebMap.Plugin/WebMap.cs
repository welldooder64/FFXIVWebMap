using System;
using Dalamud.Plugin;
using Dalamud.Plugin.Services;
using Microsoft.Extensions.DependencyInjection;
using WebMap.Config;
using WebMap.Framework;
using WebMap.Game.Chat;
using WebMap.Game.Map;
using WebMap.Game.Player;
using WebMap.Networking;
using WebMap.Networking.Web;
using WebMap.Resources.Sheets;
using WebMap.Resources.Textures;
using WebMap.Windows;

namespace WebMap;

// ReSharper disable once ClassNeverInstantiated.Global
public sealed class WebMapPlugin : IDalamudPlugin
{
    public const string Name = "Web Map";

    private static ServiceProvider? Services;
    private static IPluginLog? Log;

    public WebMapPlugin(IDalamudPluginInterface pluginInterface)
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
            foreach (var service in serviceCollection)
                if (service.Lifetime == ServiceLifetime.Singleton)
                {
                    Log.Debug($"Initializing {service.ServiceType}...");
                    Services.GetRequiredService(service.ServiceType);
                }

            GenerateIconAtlas(Services);

            Log.Info($"Started {Name}");
        }
        catch (Exception e)
        {
            Log.Error(e, $"Failed to start {Name}");
            Services?.Dispose();
            throw;
        }
    }

    public void Dispose()
    {
        Services?.Dispose();
    }

    private static ServiceCollection SetupServices(DalamudServices dalamudServices)
    {
        ServiceCollection serviceCollection = new();

        // Dalamud
        serviceCollection.AddSingleton(dalamudServices.PluginInterface);
        serviceCollection.AddSingleton(dalamudServices.GameInteropProvider);
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

        // Resources
        serviceCollection.AddSingleton<MapSheetProvider>();
        serviceCollection.AddSingleton<MapMarkerSheetProvider>();
        serviceCollection.AddSingleton<MapSymbolSheetProvider>();
        serviceCollection.AddSingleton<TextureProvider>();
        serviceCollection.AddSingleton<AtlasProvider>();

        // Windows
        serviceCollection.AddSingleton<WindowManager>();
        serviceCollection.AddSingleton<SettingsWindow>();

        // Networking
        serviceCollection.AddSingleton<WebService>();
        serviceCollection.AddSingleton<INetworkService>(sp => sp.GetRequiredService<WebService>());
        
        // Framework helpers 
        serviceCollection.AddSingleton<IFramework>(sp => new ClientAwareFramework(
                                                       dalamudServices.Framework,
                                                       sp.GetRequiredService<INetworkService>()));

        return serviceCollection;
    }

    private static void GenerateIconAtlas(ServiceProvider services)
    {
        var atlasProvider = services.GetRequiredService<AtlasProvider>();

        (uint, uint)[] ranges =
        [
            (60300, 60649), // Map Symbol, Map Marker I, Fates, Fate objects + more
            (60750, 60799), // Housing Markers
            (60900, 60999), // Map Marker II
            (61731, 61749), // Map Announce Other
            (63875, 64199), // Map Marker III?
            (70960, 70979), // Map Announce Link
            (71000, 71199)  // Map Announce (all the others)
        ];

        atlasProvider.GenerateAtlas(ranges, "icons", overwrite: false);
    }
}
