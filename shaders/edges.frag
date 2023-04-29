#version 300 es

precision highp float;

uniform sampler2D frame;
uniform ivec2 size;

in vec2 uv;
out vec4 color;

vec4 get(float x, float y) {
    return texture(frame, uv + vec2(x, y) / vec2(size));
}

void main() {
    vec4 tex = texture(frame, uv);

    const float left[9] = float[](
        1.0, 0.0, -1.0,
        2.0, 0.0, -2.0,
        1.0, 0.0, -1.0
    ); 

    const float right[9] = float[](
        -1.0, 0.0, 1.0,
        -2.0, 0.0, 2.0,
        -1.0, 0.0, 1.0
    ); 

    const float top[9] = float[](
        1.0, 2.0, 1.0,
        0.0, 0.0, 0.0,
        -1.0, -2.0, -1.0
    ); 

    const float bottom[9] = float[](
        -1.0, -2.0, -1.0,
        0.0, 0.0, 0.0,
        1.0, 2.0, 1.0
    ); 

    vec3 ltotal = vec4(
        get(-1.0, -1.0) * left[0] +
        get(0.0, -1.0) * left[1] +
        get(1.0, -1.0) * left[2] +
        get(-1.0, 0.0) * left[3] +
        get(0.0, 0.0) * left[4] +
        get(1.0, 0.0) * left[5] +
        get(-1.0, 1.0) * left[6] +
        get(0.0, 1.0) * left[7] +
        get(1.0, 1.0) * left[8]
    ).rgb;

    vec3 rtotal = vec4(
        get(-1.0, -1.0) * right[0] +
        get(0.0, -1.0) * right[1] +
        get(1.0, -1.0) * right[2] +
        get(-1.0, 0.0) * right[3] +
        get(0.0, 0.0) * right[4] +
        get(1.0, 0.0) * right[5] +
        get(-1.0, 1.0) * right[6] +
        get(0.0, 1.0) * right[7] +
        get(1.0, 1.0) * right[8]
    ).rgb;

    vec3 ttotal = vec4(
        get(-1.0, -1.0) * top[0] +
        get(0.0, -1.0) * top[1] +
        get(1.0, -1.0) * top[2] +
        get(-1.0, 0.0) * top[3] +
        get(0.0, 0.0) * top[4] +
        get(1.0, 0.0) * top[5] +
        get(-1.0, 1.0) * top[6] +
        get(0.0, 1.0) * top[7] +
        get(1.0, 1.0) * top[8]
    ).rgb;

    vec3 btotal = vec4(
        get(-1.0, -1.0) * bottom[0] +
        get(0.0, -1.0) * bottom[1] +
        get(1.0, -1.0) * bottom[2] +
        get(-1.0, 0.0) * bottom[3] +
        get(0.0, 0.0) * bottom[4] +
        get(1.0, 0.0) * bottom[5] +
        get(-1.0, 1.0) * bottom[6] +
        get(0.0, 1.0) * bottom[7] +
        get(1.0, 1.0) * bottom[8]
    ).rgb;

    vec3 total = max(max(ltotal, rtotal), max(btotal, ttotal));

    float luminance = max(0.2126 * total.r + 0.7152 * total.g + 0.0722 * total.b, 0.0); 

    color = tex + vec4(vec3(luminance), 1.0);
}