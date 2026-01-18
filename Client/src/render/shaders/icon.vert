#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

// Projection Uniforms
uniform vec2 u_resolution; // Canvas size
uniform vec2 u_mapOrigin;  // Center of the map in Screen Space (cx + panX, cy - panY)
uniform float u_mapScale;  // (baseScale * zoom)
uniform vec2 u_markerPos;  // Map Space position of the icon
uniform vec2 u_iconSize;   // Physical size in pixels

out vec2 v_texCoord;

void main() {
    v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);

    // 1. Project the marker center to Screen Space
    vec2 screenCenter = u_mapOrigin + (u_markerPos - vec2(1024.0, 1024.0)) * u_mapScale;

    // 2. Offset the vertex by the physical icon size (keeping it constant)
    // a_position is 0..1, so (a_position - 0.5) gives us -0.5..0.5 range
    vec2 pos = screenCenter + (a_position - 0.5) * u_iconSize;

    // 3. Convert Screen Space (0..W, 0..H) to Clip Space (-1..1)
    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clipSpace.x, clipSpace.y, 0, 1);
}
