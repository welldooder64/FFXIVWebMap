using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Dalamud.Interface.Textures;
using Dalamud.Plugin.Services;
using WebMap.Config;
using TeximpNet;

namespace WebMap.Resources.Textures;

public class AtlasProvider(
    IPluginLog log,
    ITextureProvider dalamudTextureProvider,
    TextureProvider textureProvider,
    ConfigurationService configurationService
)
{
    private readonly string atlasPath = Path.Combine(configurationService.ResourcesDirectory, "ui", "atlas");
    private readonly JsonSerializerOptions jsonSerializerOptions =
        new() { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    
    private const int Padding = 4; // Padding between icons to prevent mipmap bleeding

    public void GenerateAtlas(
        IEnumerable<(uint Start, uint End)> ranges, string atlasName, bool hiRes = true, bool overwrite = true)
    {
        var pngPath = Path.Combine(atlasPath, $"{atlasName}{(hiRes ? "_hr1" : "")}.png");
        var jsonPath = Path.Combine(atlasPath, $"{atlasName}.json");

        if (File.Exists(pngPath) && File.Exists(jsonPath) && !overwrite)
            return;

        var icons = new List<(uint Id, TextureDataFile Texture)>();

        foreach (var (start, end) in ranges)
            for (var i = start; i <= end; i++)
                try
                {
                    var path = dalamudTextureProvider.GetIconPath(new GameIconLookup(i, hiRes: hiRes));
                    var texture = textureProvider.GetTexture(path);
                    if (texture != null) icons.Add((i, texture));
                }
                catch (FileNotFoundException) { }

        if (icons.Count == 0) return;

        // Simple Shelf Packing Algorithm
        icons = icons.OrderByDescending(it => it.Texture.Height).ToList();

        var atlasWidth = 1024 * (hiRes ? 2 : 1); // Initial guess
        var entries = new List<AtlasEntry>();

        var currentX = Padding;
        var currentY = Padding;
        var shelfHeight = 0;
        var maxW = 0;

        foreach (var (id, texture) in icons)
        {
            // log.Debug("Adding icon {id} to atlas", id);
            if (currentX + texture.Width + Padding > atlasWidth)
            {
                currentX = Padding;
                currentY += shelfHeight + Padding;
                shelfHeight = 0;
            }

            entries.Add(new AtlasEntry
            {
                Id = id,
                X = currentX,
                Y = currentY,
                Width = texture.Width,
                Height = texture.Height
            });

            currentX += texture.Width + Padding;
            shelfHeight = Math.Max(shelfHeight, texture.Height);
            maxW = Math.Max(maxW, currentX);
        }

        var atlasHeight = currentY + shelfHeight + Padding;

        // The final width could be smaller if we want, but let's stick to maxW or power of two
        atlasWidth = NextPowerOfTwo(maxW);
        atlasHeight = NextPowerOfTwo(atlasHeight);

        var atlasData = new byte[atlasWidth * atlasHeight * 4];

        foreach (var entry in entries)
        {
            var texture = icons.First(it => it.Id == entry.Id).Texture;
            for (var y = 0; y < entry.Height; y++)
            {
                var srcOffset = y * entry.Width * 4;
                var dstOffset = (((entry.Y + y) * atlasWidth) + entry.X) * 4;
                Array.Copy(texture.ImageData, srcOffset, atlasData, dstOffset, entry.Width * 4);
            }
        }

        Save(atlasName, pngPath, jsonPath, atlasWidth, atlasHeight, atlasData, entries, overwrite, hiRes);
    }

    private static int NextPowerOfTwo(int v)
    {
        v--;
        v |= v >> 1;
        v |= v >> 2;
        v |= v >> 4;
        v |= v >> 8;
        v |= v >> 16;
        v++;
        return v;
    }

    private void Save(
        string atlasName, string pngPath, string jsonPath, int atlasWidth, int atlasHeight,
        byte[] atlasData, List<AtlasEntry> entries, bool overwrite, bool hiRes = true)
    {
        Directory.CreateDirectory(atlasPath);
        SaveAtlasImage(pngPath, atlasWidth, atlasHeight, atlasData);

        if (!File.Exists(jsonPath) || overwrite) SaveAtlasData(hiRes, jsonPath, entries);

        log.Debug($"Saved atlas {atlasName} to {pngPath}");
    }

    private static void SaveAtlasImage(string pngPath, int width, int height, byte[] data)
    {
        var rgbaData = new RGBAQuad[width * height];
        for (var i = 0; i < width * height; i++)
            rgbaData[i] = new RGBAQuad(data[i * 4], data[(i * 4) + 1], data[(i * 4) + 2], data[(i * 4) + 3]);

        var pin = MemoryHelper.PinObject(rgbaData);
        using var surface = Surface.LoadFromRawData(pin, width, height, width * 4, false, true);
        surface.SaveToFile(ImageFormat.PNG, pngPath);
        MemoryHelper.UnpinObject(pin);
    }

    private void SaveAtlasData(bool hiRes, string jsonPath, List<AtlasEntry> entries)
    {
        var json = JsonSerializer.Serialize(
            entries.ToDictionary(it => it.Id.ToString(), it => new
            {
                X = it.X / (hiRes ? 2 : 1),
                Y = it.Y / (hiRes ? 2 : 1),
                Width = it.Width / (hiRes ? 2 : 1),
                Height = it.Height / (hiRes ? 2 : 1)
            }),
            jsonSerializerOptions);
        File.WriteAllText(jsonPath, json);
    }

    private class AtlasEntry
    {
        public uint Id { get; init; }
        public int X { get; init; }
        public int Y { get; init; }
        public int Width { get; init; }
        public int Height { get; init; }
    }
}
