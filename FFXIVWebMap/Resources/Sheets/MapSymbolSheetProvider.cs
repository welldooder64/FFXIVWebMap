using System.Collections.Generic;
using System.Linq;
using Dalamud.Plugin.Services;
using FFXIVWebMap.Models;
using Lumina.Excel.Sheets;

namespace FFXIVWebMap.Resources.Sheets;

public class MapSymbolSheetProvider
{
    private readonly IDataManager dataManager;

    public readonly IReadOnlyDictionary<uint, MapSymbol> Sheet;

    public MapSymbolSheetProvider(IDataManager dataManager)
    {
        this.dataManager = dataManager;

        Sheet = this.dataManager.GetExcelSheet<MapSymbol>()
                    .ToDictionary(x => x.RowId, x => x)
                    .AsReadOnly();
    }
}
