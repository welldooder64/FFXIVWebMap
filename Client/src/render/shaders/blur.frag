#version 300 es
precision mediump float;

in vec2 v_texCoord;

uniform sampler2D u_input;
uniform vec2 u_texelStep; // (1/width, 0) for horizontal, (0, 1/height) for vertical

out vec4 outColor;

void main() {
    // 9-tap Gaussian-like kernel
    float w0 = 0.2270270270; // center
    float w1 = 0.1945945946;
    float w2 = 0.1216216216;
    float w3 = 0.0540540541;

    vec4 c = texture(u_input, v_texCoord) * w0;
    c += texture(u_input, v_texCoord + 1.0 * u_texelStep) * w1;
    c += texture(u_input, v_texCoord - 1.0 * u_texelStep) * w1;
    c += texture(u_input, v_texCoord + 2.0 * u_texelStep) * w2;
    c += texture(u_input, v_texCoord - 2.0 * u_texelStep) * w2;
    c += texture(u_input, v_texCoord + 3.0 * u_texelStep) * w3;
    c += texture(u_input, v_texCoord - 3.0 * u_texelStep) * w3;

    outColor = c;
}
