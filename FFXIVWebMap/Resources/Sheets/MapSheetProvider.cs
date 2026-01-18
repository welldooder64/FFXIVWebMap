using System.Collections.Generic;
using System.Linq;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Models;
using Lumina.Excel.Sheets;

namespace FFXIVWebMap.Resources.Sheets;

public class MapSheetProvider
{
    private readonly IDataManager dataManager;

    public readonly IReadOnlyDictionary<uint, Map> Sheet;

    public MapSheetProvider(IDataManager dataManager)
    {
        this.dataManager = dataManager;

        Sheet = this.dataManager.GetExcelSheet<Map>()
                    .ToDictionary(x => x.RowId, x => x)
                    .AsReadOnly();
    }

    public IReadOnlyDictionary<uint, MapEntry> GetMapData()
    {
        return Sheet
           .Where(x => !x.Value.Id.IsEmpty)
           .Select(x =>
           {
               var map = x.Value;
               return new
               {
                   x.Key,
                   Entry = new MapEntry
                   {
                       Id = map.Id.ExtractText(),
                       Region = map.PlaceNameRegion.ValueNullable?.Name.ExtractText() ?? string.Empty,
                       Place = map.PlaceName.ValueNullable?.Name.ExtractText() ?? string.Empty,
                       SubPlace = map.PlaceNameSub.ValueNullable?.Name.ExtractText() ?? string.Empty,
                       MapMarkerRange = map.MapMarkerRange,
                       PriorityCategoryUI = map.PriorityCategoryUI,
                       PriorityUI = map.PriorityUI,
                       // Hierarchy = map.Hierarchy,

                       DiscoveryArrayByte = map.DiscoveryArrayByte,
                       DiscoveryFlag = map.DiscoveryFlag,
                       DiscoveryIndex = map.DiscoveryIndex,

                       SizeFactor = map.SizeFactor,
                       OffsetX = map.OffsetX,
                       OffsetY = map.OffsetY
                   }
               };
           })
           .ToDictionary(x => x.Key, x => x.Entry);
    }
}
