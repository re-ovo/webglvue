#version 300 es
precision mediump float;

#define PI 3.14159265359
#define GAMMA 2.2

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

struct AmbientLight {
    vec3 color;
    float intensity;
};

// 纹理
uniform sampler2D u_texture;
uniform sampler2D u_normalMap;
uniform sampler2D u_metallicMap;
uniform sampler2D u_roughnessMap;
uniform sampler2D u_aoMap;

uniform vec3 u_cameraPos;

uniform AmbientLight u_ambientLight;
uniform PointLight u_pointLight;
uniform DirectionalLight u_directionalLight;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_fragPos;
in mat4 v_worldMatrix;

out vec4 outColor;

void main() {
    vec3 albedo = pow(texture(u_texture, v_texcoord).rgb, vec3(GAMMA));
    float ao = texture(u_aoMap, v_texcoord).r;
    float roughness = texture(u_roughnessMap, v_texcoord).g;
    float metallic = texture(u_metallicMap, v_texcoord).b;

    // 计算directional light造成的diffuse
    vec3 lightDir = normalize(-u_directionalLight.direction);
    float diff = max(dot(v_normal, lightDir), 0.0);
    vec3 diffuse = diff * u_directionalLight.color * u_directionalLight.intensity;

    // 计算ambient light造成的diffuse
    diffuse += u_ambientLight.color * u_ambientLight.intensity;

    outColor = vec4(albedo * diffuse, 1.0);
}