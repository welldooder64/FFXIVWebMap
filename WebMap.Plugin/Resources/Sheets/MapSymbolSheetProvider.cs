using System.Collections.Generic;
using System.Linq;
using Dalamud.Plugin.Services;
using Dalamud.Utility;
using Lumina.Excel;
using Lumina.Excel.Sheets;

namespace WebMap.Resources.Sheets;

public class MapSymbolSheetProvider
{
    private readonly IDataManager dataManager;

    public readonly ExcelSheet<MapSymbol> Sheet;

    public MapSymbolSheetProvider(IDataManager dataManager)
    {
        this.dataManager = dataManager;

        Sheet = this.dataManager.GetExcelSheet<MapSymbol>();
    }

    public IReadOnlyDictionary<uint, string> GetMapSymbols()
    {
        return Sheet
               .Select(row => new { Icon = (uint)row.Icon, Name = row.PlaceName.Value.Name.ExtractText() })
               .Where(row => row.Icon != 0 && !row.Name.IsNullOrEmpty())
               .ToDictionary(row => row.Icon, row => row.Name);
    }
}
