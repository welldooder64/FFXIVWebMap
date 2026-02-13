# FFXIV Web Map

## Missing stuff

### Highest priority
 - Event markers
   - Radiuses
   - Radius colors
   - up / down arrows
 - flag marker
 - marker text
 - quest markers into other areas

### Medium priority
 - party markers
 - enemy markers
 - world maps
 - region maps
 - interactions
 - waymarks

### Nice to have
 - special DoH markers (temporary markers)
 - party member markers
 - friend markers

### Bugs
 - Some fates have incorrect icon                            | High priority
 - Player shadow should be rendered below all other icons    | Medium priority
 - Fog of war dissapearing does not have an animation        | Low priority
 - Some static markers should not yet be rendered on the map | Low priority

# Notes
 - The hiding of the static icons seems to be attached to MapMarker.Unknown1
 some icons related to 'The empty' are tied to the value '85'. The empty is unlocked by the quest `In the Middle of Nowhere`
   https://ffxiv.consolegameswiki.com/wiki/Sohm_Al_(Hard) also has one of those icons (164, 30) with '25' as value

FFXIVWebMap/
├── FFXIVWebMap.Protos/        # Source .proto files (the source of truth)
│   ├── markers.proto
│   ├── messages.proto
│   └── common.proto
│
├── FFXIVWebMap.Plugin/        # C# Dalamud plugin
│   ├── Generated/             # Auto-generated C# from protos
│   │   └── ...
│   └── ...
│
├── FFXIVWebMap.Web/           # TypeScript frontend
│   ├── src/
│   │   ├── generated/         # Auto-generated TS from protos
│   │   └── ...
│   └── ...
│
├── scripts/
│   └── generate-protos.ps1    # Build script
│
└── FFXIVWebMap.sln
