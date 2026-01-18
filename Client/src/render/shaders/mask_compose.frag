#version 300 es
precision mediump float;
precision mediump int;

in vec2 v_texCoord;

uniform sampler2D u_maskSampler; // RGB discovery mask atlas (4x3 cells)
uniform int u_discoveryMask;     // bits from right to left

out vec4 outColor;

const ivec2 GRID = ivec2(4, 3);

// Returns UV inside the Nth cell of a grid-based atlas with half-texel inset to avoid bleeding
vec2 maskAtlasUV(vec2 uv, int index) {
    ivec2 atlasSizePx = textureSize(u_maskSampler, 0);
    vec2 atlasTexel = 1.0 / vec2(atlasSizePx);

    vec2 cellSize = 1.0 / vec2(GRID);

    int col = index % GRID.x;
    int rowFromBottom = index / GRID.x;
    int row = GRID.y - 1 - rowFromBottom; // invert so row 0 is top
    vec2 origin = vec2(float(col), float(row)) * cellSize;

    // Inset by half a texel on all sides to avoid bleeding
    vec2 inset = atlasTexel * 0.5;
    vec2 uvInCell = inset + uv * (cellSize - atlasTexel);

    return origin + uvInCell;
}

bool bitOn(int value, int bitIndex) {
    return (((value >> bitIndex) & 1) == 0);
}

void main() {
    // Slightly expand the mask by sampling a few neighboring texels within the atlas cell
    ivec2 atlasSizePx2 = textureSize(u_maskSampler, 0);
    vec2 texel = 1.0 / vec2(atlasSizePx2);
    vec2 halfStepX = vec2(texel.x * 0.5, 0.0);
    vec2 halfStepY = vec2(0.0, texel.y * 0.5);

    // Compose a single-channel mask across all atlas cells without per-cell blur.
    float mask = 0.0;
    for (int cell = 0; cell < 11; ++cell) {
        int baseBit = cell * 3;
        vec2 mUV = maskAtlasUV(v_texCoord, cell);

        vec3 m = texture(u_maskSampler, mUV).rgb;
        vec3 mR = texture(u_maskSampler, mUV + halfStepX).rgb;
        vec3 mL = texture(u_maskSampler, mUV - halfStepX).rgb;
        vec3 mU = texture(u_maskSampler, mUV + halfStepY).rgb;
        vec3 mD = texture(u_maskSampler, mUV - halfStepY).rgb;

        // Component-wise max to achieve a tiny dilation of the mask
        m = max(m, max(mR, max(mL, max(mU, mD))));

        float r = bitOn(u_discoveryMask, baseBit + 0) ? m.r : 0.0;
        float g = bitOn(u_discoveryMask, baseBit + 1) ? m.g : 0.0;
        float b = bitOn(u_discoveryMask, baseBit + 2) ? m.b : 0.0;

        mask = max(mask, max(r, max(g, b)));
    }

    // Boost brightness of the resulting mask to cover up seams between the islands.
    mask = clamp(mask * 5.0, 0.0, 1.0);

    outColor = vec4(mask, mask, mask, 1.0);
}
