precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Color de la luz
 * @color
 * @default #D8DCE0
 */
uniform vec3 u_color;

/**
 * @label Intensidad
 * @default 0.07
 * @range 0.0, 0.3
 */
uniform float u_strength;

/**
 * @label Velocidad
 * @default 0.06
 * @range 0.0, 0.5
 */
uniform float u_speed;

/**
 * @label Tamaño
 * @default 0.55
 * @range 0.1, 1.5
 */
uniform float u_size;

float blob(vec2 p, vec2 c, float r) {
  float d = length(p - c);
  return exp(-(d * d) / (r * r));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * u_speed * 6.2831853;

  // Dos focos que recorren el fondo en trayectorias lentas y distintas.
  vec2 c1 = vec2((0.5 + 0.45 * sin(t)) * aspect, 0.78 + 0.14 * cos(t * 0.7));
  vec2 c2 = vec2((0.5 + 0.40 * cos(t * 0.8 + 1.7)) * aspect, 0.30 + 0.16 * sin(t * 0.6 + 0.9));

  float r = u_size * aspect;
  float light = blob(p, c1, r) + 0.6 * blob(p, c2, r * 0.85);

  float a = clamp(light * u_strength, 0.0, 1.0);
  gl_FragColor = vec4(u_color * a, a);
}
