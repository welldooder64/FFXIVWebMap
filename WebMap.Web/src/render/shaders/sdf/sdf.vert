/*
 * Copyright (c) 2017 Anton Stepin astiopin@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

attribute vec2  pos; // Vertex position (relative to anchor)
attribute vec2  tex0; // Tex coord
attribute float scale;

attribute vec4  fill_color_attr;
attribute vec3  outline_color_attr;
attribute vec4  styling_attr; // [fill_softness, fill_expand, outline_width, outline_softness]
attribute vec2  anchor_attr; // Anchor position in map space

uniform vec2  sdf_tex_size; // Size of font texture in pixels
uniform mat3  transform;
uniform float sdf_border_size;

uniform vec2  u_mapOrigin;
uniform float u_mapScale;

varying vec2  tc0;
varying float doffset;
varying vec2  sdf_texel;

varying vec4  v_fill_color;
varying vec3  v_outline_color;
varying vec4  v_styling; // [fill_softness, fill_expand, outline_width, outline_softness]

void main(void) {
    float sdf_size = 2.0 * scale * sdf_border_size;
    tc0 = tex0;
    doffset = 1.0 / sdf_size; // Distance field delta in screen pixels
    sdf_texel = 1.0 / sdf_tex_size;

    v_fill_color = fill_color_attr;
    v_outline_color = outline_color_attr;
    v_styling = styling_attr;

    // Project the anchor from map space to screen space
    vec2 screen_anchor = u_mapOrigin + (anchor_attr - vec2(1024.0, 1024.0)) * u_mapScale;

    // The vertex position 'pos' is relative to anchor in screen pixels.
    // 'pos' calculation in text-utils.ts assumes Y increases UP for the baseline calculation.
    // However, our projection to clip space (via 'transform') expects Y increasing UP as well,
    // but the 'transform' matrix usually handles the screen space conversion.
    // In the previous implementation, we were passing 'pos' (absolute map coords) and it worked.
    // Map coords also have Y increasing UP (0 at bottom, 2048 at top).
    // So 'pos' relative to (0,0) in screen pixels should also have Y increasing UP to match.
    vec2 projected_pos = screen_anchor + pos;

    vec3 screen_pos = transform * vec3(projected_pos, 1.0);
    gl_Position = vec4(screen_pos.xy, 0.0, 1.0);
}
