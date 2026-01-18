using System;
using System.IO;
using FFXIVClientStructs.FFXIV.Component.GUI;
using FFXIVWebMap.Config;
using FFXIVWebMap.Networking;
using FFXIVWebMap.Networking.Messages;
using FFXIVWebMap.Resources.Sheets;
using FFXIVWebMap.Resources.Textures;

namespace FFXIVWebMap.Game.Map;

public sealed class MapExtractionService : IDisposable
{
    private readonly INetworkService networkService;
    private readonly TextureProvider textureProvider;
    private readonly MapSheetProvider mapSheetProvider;
    
    public MapExtractionService
    (
        INetworkService networkService,
        TextureProvider textureProvider,
        MapSheetProvider mapSheetProvider
    )
    {
        this.networkService = networkService;
        this.textureProvider = textureProvider;
        this.mapSheetProvider = mapSheetProvider;
        
        
        
        networkService.RegisterHandler<Message.ExtractMap>(OnExtractMapMessage);
    }
    
    private void OnExtractMapMessage(INetworkService service, INetworkClient client, Message.ExtractMap message)
    {
        if (ExtractMap(message.Data))
        {
            // Notify the client that the map was extracted
            client.Send(Message.MapExtracted(message.Data));
        }
    }
    
    private bool ExtractMap(uint mapId)
    {
        if (!mapSheetProvider.Sheet.TryGetValue(mapId, out var map))
        {
            WebMap.Log.Warning($"Unknown map id: {mapId}");
            return false;
        }

        var splitId = map.Id.ToString().Split('/');
        var path = $"ui/map/{map.Id}/{splitId[0]}{splitId[1]}_m.tex";
        var maskPath = $"ui/map/{map.Id}/{splitId[0]}{splitId[1]}d.tex";
        var bgPath = $"ui/map/{map.Id}/{splitId[0]}{splitId[1]}m_m.tex";

        if (!textureProvider.Extract(path))
        {
            WebMap.Log.Information($"Failed to extract map foreground {path}");
            return false;
        }

        // The discovery flag is 0 for all maps that have no fog layer
        if (map.DiscoveryFlag != 0)
        {
            if (!textureProvider.Extract(maskPath))
            {
                WebMap.Log.Information($"Failed to extract map mask {maskPath}");
                return false;
            }
        
            if (!textureProvider.Extract(bgPath))
            {
                WebMap.Log.Information($"Failed to extract map background {bgPath}");
                return false;
            }
        }

        return true;
    }

    public void Dispose()
    {
        networkService.UnregisterHandler<Message.ExtractMap>(OnExtractMapMessage);
    }
}
