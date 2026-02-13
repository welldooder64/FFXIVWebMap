using System;
using System.Reflection;
using Dalamud.Plugin.Services;
using EmbedIO;
using WebMap.Config;
using WebMap.Resources.Textures;

namespace WebMap.Networking.Web;

public sealed class WebServerService : IDisposable
{
    private readonly IPluginLog log;
    private readonly WebSocketHandler webSocketHandler;
    private readonly ConfigurationService configurationService;
    private readonly TextureProvider textureProvider;
    
    private WebServer? webServer;
    
    public WebServerService(IPluginLog log, WebSocketHandler webSocketHandler, ConfigurationService configurationService, TextureProvider textureProvider)
    {
        this.log = log;
        this.webSocketHandler = webSocketHandler;
        this.configurationService = configurationService;
        this.textureProvider = textureProvider;
        
        this.configurationService.OnConfigurationSaved += OnConfigurationSaved;
        
        CreateWebServer();
    }

    private void CreateWebServer()
    {
        DestroyWebServer();
        
        try
        {
            webServer = new WebServer(o =>
                        { 
                            o.WithUrlPrefix($"http://localhost:{configurationService.Configuration.Port}")
                             .WithUrlPrefix($"http://127.0.0.1:{configurationService.Configuration.Port}")
                             .WithMode(HttpListenerMode.EmbedIO);

                            if (configurationService.Configuration.ExposeToLocalNetwork)
                            {
                                o.WithUrlPrefix($"http://+:{configurationService.Configuration.Port}");
                            }
                        })
                .WithCors()
                .WithModule(new ResourceExtractionModule("/resources", log, configurationService, textureProvider))
                .WithStaticFolder("/resources", configurationService.ResourcesDirectory, false)
                .WithModule(webSocketHandler)
                .WithEmbeddedResources("/", Assembly.GetExecutingAssembly(), "WebMap.wwwroot", m =>
                {
                    m.DefaultDocument = "index.html";
                });

            webServer.Start();
            log.Information($"Map server started at http://localhost:{configurationService.Configuration.Port}");
        }
        catch (Exception ex)
        {
            log.Error(ex, "Failed to start web server");
            webServer = null;
            throw;
        }
    }

    private void OnConfigurationSaved()
    {
        log.Information("Configuration changed, restarting web server...");
        CreateWebServer();
    }

    private void DestroyWebServer()
    {
        webServer?.Dispose();
        webServer = null;
    }

    public void Dispose()
    {
        configurationService.OnConfigurationSaved -= OnConfigurationSaved;
        
        DestroyWebServer();
    }
}
