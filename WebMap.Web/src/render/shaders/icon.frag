#version 300 es
precision mediump float;
precision mediump int;

in vec2 v_texCoord;
in float v_useSecondarySampler;
in vec4 v_colorMultiply;
in vec4 v_colorAdd;

uniform sampler2D u_sampler;
uniform sampler2D u_sampler_secondary;

out vec4 outColor;

void main() {
    vec4 texColor;
    if (v_useSecondarySampler > 0.5) {
        texColor = texture(u_sampler_secondary, v_texCoord);
    } else {
        texColor = texture(u_sampler, v_texCoord);
    }
    outColor = texColor * v_colorMultiply + v_colorAdd * texColor.a;
}
