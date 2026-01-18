#version 300 es
precision mediump float;
precision mediump int;

in vec2 v_texCoord;

uniform sampler2D u_foregroundSampler; // map image
uniform sampler2D u_backgroundSampler; // parchment / background
uniform sampler2D u_maskSampler;       // pre-blurred full-screen mask

uniform bool u_useBackground; // true when background is bound
uniform bool u_useMask;       // true when mask is bound

out vec4 outColor;

void main() {
//    outColor = texture(u_maskSampler, v_texCoord);
//    return;

    vec4 fg = texture(u_foregroundSampler, v_texCoord);

    if (!u_useBackground) {
        outColor = fg;
        return;
    }

    vec4 bg = texture(u_backgroundSampler, v_texCoord);
    vec3 multiplied = bg.rgb * fg.rgb;

    if (!u_useMask) {
        outColor = vec4(multiplied, 1.0);
        return;
    }

    float mask = 1.0 - texture(u_maskSampler, vec2(v_texCoord.x, 1.0 - v_texCoord.y)).r;
    outColor = vec4(mix(bg.rgb, multiplied, mask), 1.0);
}
