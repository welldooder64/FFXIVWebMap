using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using Dalamud.Plugin.Services;
using WebMap.Models;
using Lumina.Excel;
using Lumina.Excel.Sheets;

namespace WebMap.Resources.Sheets;

public class MapMarkerSheetProvider
{
    private readonly IDataManager dataManager;

    public readonly SubrowExcelSheet<MapMarker> Sheet;

    public MapMarkerSheetProvider(IDataManager dataManager)
    {
        this.dataManager = dataManager;

        Sheet = this.dataManager.GetSubrowExcelSheet<MapMarker>();
    }

    public IReadOnlyDictionary<uint, Dictionary<ushort, StaticMarker>> GetMapMarkers()
    {
        return Sheet.Select(it => new
        {
            Key = it.RowId,
            Value = it
                    .Select(row => new
                    {
                        Key = row.SubrowId,
                        Value = CreateMarker(row)
                    })
                    .Where(row => row.Value.Title != null || row.Value.Icon != null)
                    .ToDictionary(x => x.Key, x => x.Value)
        }).ToDictionary(x => x.Key, x => x.Value);
    }

    private static StaticMarker CreateMarker(MapMarker row)
    {
        var title = row.PlaceNameSubtext.ValueNullable?.Name;
        title = title is { IsEmpty: false } ? title.Value.Data : null;
        
        var icon = row.Icon == 0 ? null : (ushort?)row.Icon;
        var position = new Vector2 { X = row.X, Y = row.Y };
        var subtextOrientation = row.SubtextOrientation;
        var type = new StaticMarkerType(row.Type);

        return row.DataType switch
        {
            StaticMarkerDataType.NormalValue => new NormalStaticMarker
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
            },
            StaticMarkerDataType.MapLinkValue => new MapLinkStaticMarker
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
                TargetMapId = row.DataKey.RowId
            },
            StaticMarkerDataType.ImplicitMapLinkValue => new ImplicitMapLinkStaticMarker
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
                TargetMapId = row.DataKey.RowId
            },
            StaticMarkerDataType.AetheryteValue => new AetheryteStaticMarker
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
                AetheryteId = row.DataKey.RowId
            },
            StaticMarkerDataType.PlaceNameValue => new PlaceNameStaticMarker
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
                Tooltip = row.DataKey.GetValueOrDefault<PlaceName>()?.Name.Data
                          ?? throw new Exception("Attempt to create PlaceNameStaticMarker without PlaceName data.")
            },
            _ => new UnknownStaticMarker(row.DataType)
            {
                Title = title,
                Icon = icon,
                Position = position,
                SubtextOrientation = subtextOrientation,
                Type = type,
                DataKey = row.DataKey.RowId
            }
        };
    }
}
