using System.Collections.Generic;
using System.Linq;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Models;
using Lumina.Excel;

namespace FFXIVWebMap.Resources.Sheets;

public class MapMarkerSheetProvider
{
    private readonly IDataManager dataManager;

    public readonly SubrowExcelSheet<Lumina.Excel.Sheets.MapMarker> Sheet;

    public MapMarkerSheetProvider(IDataManager dataManager)
    {
        this.dataManager = dataManager;

        Sheet = this.dataManager.GetSubrowExcelSheet<Lumina.Excel.Sheets.MapMarker>();
    }

    public IReadOnlyList<ushort> GetDistinctIcons()
    {
        return Sheet.Flatten().DistinctBy(it => it.Icon).Select(it => it.Icon).ToList();
    }

    public IReadOnlyDictionary<uint, Dictionary<ushort, MapMarker>> GetMapMarkers()
    {
        return Sheet.Select(it => new
        {
            Key = it.RowId,
            Value = it.Select(row => new
                      {
                          Key = row.SubrowId,
                          Value = new MapMarker
                          {
                              Id = row.SubrowId,
                              Title = row.PlaceNameSubtext.ValueNullable?.Name.ExtractText() ?? string.Empty,
                              Icon = row.Icon,
                              X = row.X,
                              Y = row.Y,
                              SubtextOrientation = row.SubtextOrientation,
                          }
                      })
                      .ToDictionary(x => x.Key, x => x.Value)
        }).ToDictionary(x => x.Key, x => x.Value);
    }
}
