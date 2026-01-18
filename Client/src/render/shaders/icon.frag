#version 300 es
precision mediump float;
precision mediump int;

in vec2 v_texCoord;

uniform sampler2D u_sampler;

out vec4 outColor;

void main() {
    outColor = texture(u_sampler, v_texCoord);
}
