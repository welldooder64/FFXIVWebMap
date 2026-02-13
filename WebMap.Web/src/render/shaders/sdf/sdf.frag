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

precision mediump float;

uniform sampler2D font_tex;
uniform float hint_amount;

varying vec2  tc0;
varying float doffset;
varying vec2  sdf_texel;

varying vec4  v_fill_color;
varying vec3  v_outline_color;
varying vec4  v_styling; // [fill_softness, fill_expand, outline_width, outline_softness]

float horz_scale = 1.1;
float vert_scale = 0.6;

// Compute the adjusted offset for hinting based on stroke direction
float calc_rdoffset(float vgrad) {
    float hdoffset = mix(doffset * horz_scale, doffset * vert_scale, vgrad);
    return mix(doffset, hdoffset, hint_amount);
}

// General-purpose SDF smoothstep at a given threshold with optional extra softness
float sdf_smoothstep(float sdf, float threshold, float rdoffset, float softness) {
    return smoothstep(threshold - rdoffset - softness, threshold + rdoffset + softness, sdf);
}

void main() {
    // Styling attributes
    float fill_softness    = v_styling.x;
    float fill_expand      = v_styling.y;
    float outline_width    = v_styling.z;
    float outline_softness = v_styling.w;

    // Sampling the texture, L pattern
    float sdf       = texture2D(font_tex, tc0).r;
    float sdf_north = texture2D(font_tex, tc0 + vec2(0.0, sdf_texel.y)).r;
    float sdf_east  = texture2D(font_tex, tc0 + vec2(sdf_texel.x, 0.0)).r;

    // Estimating stroke direction by the distance field gradient vector
    vec2  sgrad     = vec2(sdf_east - sdf, sdf_north - sdf);
    float sgrad_len = max(length(sgrad), 1.0 / 128.0);
    vec2  grad      = sgrad / vec2(sgrad_len);
    float vgrad = abs(grad.y); // 0.0 - vertical stroke, 1.0 - horizontal one

    // Precompute the hinting-adjusted offset (shared by all calculations)
    float rdoffset = calc_rdoffset(vgrad);

    // Fill threshold: 0.5 is the glyph edge, lower = expand outward
    float fill_threshold = 0.5 - fill_expand;

    // Calculate fill alpha
    float fill_alpha = sdf_smoothstep(sdf, fill_threshold, rdoffset, 0.0);
    fill_alpha = pow(fill_alpha, 1.0 + 0.2 * vgrad * hint_amount);

    // Skip outline calculations if outline is disabled
    if (outline_width <= 0.001) {
        float final_alpha = fill_alpha * v_fill_color.a;
        gl_FragColor = vec4(v_fill_color.rgb * final_alpha, final_alpha);
        return;
    }

    // Outline alpha: threshold pushed outward by outline_width
    float outline_alpha = sdf_smoothstep(sdf, 0.5 - outline_width, rdoffset, outline_softness);

    // Use the maximum of both alphas so text is never more transparent than it would be without outline
    float combined_alpha = max(fill_alpha, outline_alpha);

    // Sharpen the color blend: only show outline color where fill hasn't started
    // This prevents dark bleeding into the text fill at small sizes
    float color_blend = sdf_smoothstep(sdf, fill_threshold, rdoffset, rdoffset * fill_softness);
    vec3 color = mix(v_outline_color.rgb, v_fill_color.rgb, color_blend);

    float final_alpha = combined_alpha * v_fill_color.a;

    gl_FragColor = vec4(color * final_alpha, final_alpha);
}
