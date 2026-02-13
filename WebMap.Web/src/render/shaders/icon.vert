#version 300 es

// Instanced attributes
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
layout(location = 2) in vec2 i_markerPos;
layout(location = 3) in vec2 i_iconSize;
layout(location = 4) in float i_rotation;
layout(location = 5) in vec4 i_uvOffset;
layout(location = 6) in vec2 i_iconOffset;
layout(location = 7) in float i_scaleWithMap;
layout(location = 8) in float i_useSecondarySampler;
layout(location = 9) in vec4 i_colorMultiply;
layout(location = 10) in vec4 i_colorAdd;

// Projection Uniforms
uniform sampler2D u_sampler;
uniform sampler2D u_sampler_secondary;
uniform vec2 u_resolution; // Canvas size
uniform vec2 u_mapOrigin;  // Center of the map in Screen Space (cx + panX, cy - panY)
uniform float u_mapScale;  // (baseScale * zoom)

out vec2 v_texCoord;
out float v_useSecondarySampler;
out vec4 v_colorMultiply;
out vec4 v_colorAdd;

void main() {
    // 0. Calculate UVs based on offset
    // a_texCoord is 0..1
    vec2 atlasSize = (i_useSecondarySampler > 0.5) ? vec2(textureSize(u_sampler_secondary, 0)) : vec2(textureSize(u_sampler, 0));
    v_texCoord = vec2(i_uvOffset.x / atlasSize.x + a_texCoord.x * i_uvOffset.z / atlasSize.x, 1.0 - (i_uvOffset.y / atlasSize.y + a_texCoord.y * i_uvOffset.w / atlasSize.y));
    v_useSecondarySampler = i_useSecondarySampler;
    v_colorMultiply = i_colorMultiply;
    v_colorAdd = i_colorAdd;

    // 1. Project the marker center to Screen Space
    vec2 screenCenter = u_mapOrigin + (i_markerPos - vec2(1024.0, 1024.0)) * u_mapScale;

    // 2. Offset the vertex by the physical icon size (keeping it constant)
    // a_position is 0..1, so (a_position - 0.5) gives us -0.5..0.5 range
    vec2 size = i_iconSize;
    if (i_scaleWithMap > 0.5) {
        size *= u_mapScale;
    }

    vec2 offset = (a_position - 0.5) * size + i_iconOffset;

    // Apply rotation
    float s = sin(i_rotation);
    float c = cos(i_rotation);
    mat2 rot = mat2(c, s, -s, c);
    offset = rot * offset;

    vec2 pos = screenCenter + offset;

    // 3. Convert Screen Space (0..W, 0..H) to Clip Space (-1..1)
    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clipSpace.x, clipSpace.y, 0, 1);
}
