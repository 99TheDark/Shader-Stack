#version 300 es

precision highp float;

uniform vec2 aspect;

in vec2 vertPos;
in vec2 vertUV;
out vec2 pos;
out vec2 uv;

void main() {
    pos = vertPos * aspect;
    uv = vertUV;
    gl_Position = vec4(vertPos, 0.0, 1.0);
}