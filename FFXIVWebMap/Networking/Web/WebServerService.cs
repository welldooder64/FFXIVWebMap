using System;
using EmbedIO;
using FFXIVWebMap.Config;

namespace FFXIVWebMap.Networking.Web;

public sealed class WebServerService : IDisposable
{
    private readonly WebSocketHandler webSocketHandler;
    private readonly ConfigurationService configurationService;
    
    private WebServer? webServer;
    
    public WebServerService(WebSocketHandler webSocketHandler, ConfigurationService configurationService)
    {
        this.webSocketHandler = webSocketHandler;
        this.configurationService = configurationService;
        
        CreateWebServer();
    }

    private void CreateWebServer()
    {
        DestroyWebServer();
        
        try
        {
            webServer = new WebServer(o => o
                    .WithUrlPrefix("http://localhost:8080")
                    .WithUrlPrefix("http://127.0.0.1:8080")
                    .WithMode(HttpListenerMode.EmbedIO))
                .WithCors()
                .WithStaticFolder("/resources", configurationService.ResourcesDirectory, false)
                .WithModule(webSocketHandler);

            webServer.Start();
             
            WebMap.Log.Information("Map server started at http://127.0.0.1:8080");
        }
        catch (Exception ex)
        {
            WebMap.Log.Error(ex, "Failed to start web server");
            webServer = null;
            throw;
        }
    }

    private void DestroyWebServer()
    {
        webServer?.Dispose();
        webServer = null;
    }

    public void Dispose()
    {
        DestroyWebServer();
    }
}
