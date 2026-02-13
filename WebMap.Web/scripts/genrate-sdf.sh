#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

generate_font() {
    local name=$1
    local rh=$2
    local ur=$3
    local base="$SCRIPT_DIR/../public/fonts/$name"

    sdf_atlas -f "$base.ttf" -o "$base" -tw 2048 -th 1024 -bs 22 -rh "$rh" -ur "$ur"

    # Convert JS object to JSON
    sed -i 's|//[^"]*$||g' "$base.js"                                          # Remove // comments (but not inside strings)
    sed -i 's/; $//' "$base.js"                                                # Remove trailing semicolon
    sed -i 's/\([{,]\)\s*\([a-zA-Z_][a-zA-Z0-9_]*\)\s*:/\1"\2":/g' "$base.js"  # Quote unquoted keys
    sed -i 's/^\s*\([a-zA-Z_][a-zA-Z0-9_]*\)\s*:/"\1":/g' "$base.js"           # Quote keys at start of line
    sed -i 's/\([{,]\)\s*\([a-zA-Z_][a-zA-Z0-9_]*\)\s*:/\1"\2":/g' "$base.js"  # Quote keys after { or ,

    # Convert snake_case keys to camelCase
    # Protect unicode escapes, process with jq, then restore them
    sed -i 's/\\u/\\\\u/g' "$base.js"
    jq 'walk(if type == "object" then with_entries(.key |= gsub("_(?<c>[a-z])"; .c | ascii_upcase)) else . end)' "$base.js" > "$base.json"
    sed -i 's/\\\\u/\\u/g' "$base.json"

    rm "$base.js"
}

generate_font "NotoSans-Regular" 84 31:126,0xA0:0xFF,0xFFFF
generate_font "NotoSans-Italic" 84 31:126,0xA0:0xFF,0xFFFF
generate_font "FFXIV_Lodestone_SSF" 96 0xE000:0xF8FF,0xFFFF
