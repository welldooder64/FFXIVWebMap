# Web Map - Frontend

## Fonts
The fonts are rendered using SDFs (Signed Distance Fields) and generated using the `sdf_atlas` tool that can be found [here](https://github.com/astiopin/sdf_atlas/). 
They can be regenerated using `./scripts/generate-sdf.sh`

#### Fonts used:
 - [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans)           | Regular & Italic
 - [FFXIV Lodestone SSF](https://github.com/ewwwin/ffxiv-symbol-fonts/) | Symbols ([Wiki](https://ffxiv.consolegameswiki.com/wiki/Special_chat_characters))

## Licensing
The FFXIV Lodestone SSF font is owned by Square Enix and reproduced in accordance with the [Materials Usage License](https://support.na.square-enix.com/rule.php?id=5382&tag=authc). © SQUARE ENIX. FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.


# Random notes
Static markers:
- Type:
- 0: Normal markers
- 1: District names (which are italic)
- DataType & DataKey:
- 0: Normal
- 1: Map links
- 2: Map links (not sure what the diff with 1 is)
- 3: Aetheryte
- 4: Ref to place name in tooltip
- Unknown1 Seems to be related to 'unlocking' the icon

TODO:
 - Support text containing <italic(1)> <italic(0)>
 - tooltips
 - large titles
 - set correct text color
   - Light blue teleports are in the same region
   - Orange teleports are to a different region

Missing info:
- Atheryte tooltip / price
- Hidden markers

font sizes: 18,12
