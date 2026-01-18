using System.Collections.Generic;
using System.IO;
using System.Linq;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Config;

namespace FFXIVWebMap.Resources.Textures;

public class TextureProvider
(
    IDataManager dataManager,
    ConfigurationService configurationService
)
{
    private readonly Dictionary<string, string> extensionMapping = new()
    {
        { "tex", "png" }
    };
    
    public bool Extract(string path, bool overwrite = true)
    {
        var ext = path.Split('.').Last();
        var resultPath = $"{configurationService.ResourcesDirectory}/{path[..(path.Length - ext.Length - 1)]}.{extensionMapping[ext]}";
        if (File.Exists(resultPath) && !overwrite)
            return true;
        
        WebMap.Log.Information($"Extracting texture {path}");
                    
        // Extract the texture from the game
        var texture = GetTexture(path);
        if (texture == null)
        {
            WebMap.Log.Warning($"Failed to extract texture {path}");
            return false;
        }

        // Create the directory if it doesn't exist
        var directory = Path.GetDirectoryName(resultPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }
                    
        // Save the texture as a png
        WebMap.Log.Information($"Saving texture at: {resultPath}");
        texture.SaveAsPng(resultPath);

        return true;
    }
    
    public TextureDataFile? GetTexture(string path)
    {
        return dataManager.GetFile<TextureDataFile>(path);
    }
}
