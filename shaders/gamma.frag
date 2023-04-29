#version 300 es

precision highp float;

uniform sampler2D frame;

in vec2 uv;
out vec4 color;

#define gamma 1.4

void main() {
    vec4 tex = texture(frame, uv);

    color = vec4(pow(tex.r, gamma), pow(tex.g, gamma), pow(tex.b, gamma), tex.a);
}