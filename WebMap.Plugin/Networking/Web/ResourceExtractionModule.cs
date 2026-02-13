using System.IO;
using System.Threading.Tasks;
using Dalamud.Plugin.Services;
using EmbedIO;
using WebMap.Config;
using WebMap.Resources.Textures;

namespace WebMap.Networking.Web;

public class ResourceExtractionModule(
    string baseRoute,
    IPluginLog log,
    ConfigurationService configurationService,
    TextureProvider textureProvider
)
    : WebModuleBase(baseRoute)
{
    public override bool IsFinalHandler => false;

    protected override Task OnRequestAsync(IHttpContext context)
    {
        var relativePath = context.Request.Url.AbsolutePath[BaseRoute.Length..].TrimStart('/');
        var localPath = Path.Combine(configurationService.ResourcesDirectory, relativePath);

        // Try to extract only if it's a png, and it doesn't exist yet
        if (!File.Exists(localPath) && relativePath.EndsWith(".png"))
        {
            var gamePath = relativePath[..^4] + ".tex";
            if (textureProvider.Extract(gamePath, false))
                log.Information($"Successfully extracted missing resource: {gamePath}");
        }

        // Return Task.CompletedTask and don't set context.IsHandled to true 
        // so that the next module (FileModule from WithStaticFolder) can handle it.
        return Task.CompletedTask;
    }
}
