using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using Lumina.Data;
using TeximpNet;

namespace FFXIVWebMap.Resources.Textures;

public class TextureDataFile : FileResource
{
    private TexHeader header;

    private byte[] imageData = null!;
    
    private static int HeaderLength => Marshal.SizeOf<TexHeader>();

    public override void LoadFile()
    {
        Reader.BaseStream.Position = 0;
        var allData = Reader.ReadBytes((int)Reader.BaseStream.Length);
        Reader.BaseStream.Position = 0;

        var buffer = Reader.ReadBytes(HeaderLength);
        var handle = Marshal.AllocHGlobal(HeaderLength);
        Marshal.Copy(buffer, 0, handle, HeaderLength);
        header = Marshal.PtrToStructure<TexHeader>(handle);
        Marshal.FreeHGlobal(handle);

        using var ms = new MemoryStream(allData);
        TexFileParser.Parse(ms).GetRGBA(out var rgba);
        imageData = rgba.Images.ToArray().Select(image => image.Span[..(image.Width * image.Height * 4)].ToArray()).ToList()[0];
    }

    public Surface? GetPNGData(out nint pin)
    {
        var data = new RGBAQuad[header.Height * header.Width];
        for (var i = 0; i < header.Height; i++)
        for (var j = 0; j < header.Width; j++)
        {
            var idx = (i * header.Width) + j;
            data[idx] = new RGBAQuad(imageData[idx * 4], imageData[(idx * 4) + 1], imageData[(idx * 4) + 2],
                                     imageData[(idx * 4) + 3]);
        }

        pin = MemoryHelper.PinObject(data);
        return Surface.LoadFromRawData(pin, header.Width, header.Height, header.Width * 4, false, true);
    }

    public void SaveAsPng(string path)
    {
        var surface = GetPNGData(out var pin);
        if (surface == null) return;

        surface.SaveToFile(ImageFormat.PNG, path);
        surface.Dispose();
        MemoryHelper.UnpinObject(pin);
    }

    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    public struct TexHeader
    {
        public uint Type;
        public uint Format;
        public ushort Width;
        public ushort Height;
        public ushort Depth;
    }
}
