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
uniform bool u_useNormalMap;
uniform float u_opacity;

uniform vec3 u_cameraPos;

uniform AmbientLight u_ambientLight;
uniform PointLight u_pointLight;
uniform DirectionalLight u_directionalLight;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_fragPos;
in mat4 v_worldMatrix;

out vec4 outColor;

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 getNormal() {
    if (!u_useNormalMap) {
        return normalize(v_normal);
    }

    vec3 q0 = dFdx(v_fragPos);
    vec3 q1 = dFdy(v_fragPos);
    vec2 st0 = dFdx(v_texcoord);
    vec2 st1 = dFdy(v_texcoord);

    vec3 N = normalize(v_normal);
    vec3 N1 = cross(q0, q1);
    vec3 N2 = cross(q1, q0);
    vec3 T = q1 * st0.x - q0 * st1.x;
    vec3 B = q0 * st1.y - q1 * st0.y;

    float det = max(dot(T, T), dot(B, B));
    float scale = det == 0.0 ? 0.0 : 1.0 / sqrt(det);

    mat3 tbn = mat3(T * scale, B * scale, N);
    return normalize(tbn * (texture(u_normalMap, v_texcoord).rgb * 2.0 - 1.0));
}

in float v_depth;

void main() {
    vec3 albedo = pow(texture(u_texture, v_texcoord).rgb, vec3(GAMMA));
    float ao = texture(u_aoMap, v_texcoord).r;
    float roughness = texture(u_roughnessMap, v_texcoord).g;
    float metallic = texture(u_metallicMap, v_texcoord).b;

    vec3 N = getNormal();
    vec3 V = normalize(u_cameraPos - v_fragPos);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 Lo = vec3(0.0);
    {
        vec3 L = normalize(u_pointLight.position - v_fragPos);
        vec3 H = normalize(V + L);
        float distance = length(u_pointLight.position - v_fragPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = u_pointLight.color * 3000.0 * u_pointLight.intensity * attenuation;

        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 nominator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
        vec3 specular = nominator / max(denominator, 0.001);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    {
        vec3 L = normalize(-u_directionalLight.direction);
        vec3 H = normalize(V + L);
        vec3 radiance = u_directionalLight.color * u_directionalLight.intensity;

        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 nominator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001;
        vec3 specular = nominator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = u_ambientLight.color * u_ambientLight.intensity * albedo * ao;
    vec3 color = ambient + Lo;

    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/GAMMA));

    float texture_opacity = texture(u_texture, v_texcoord).a;
    // float texture_opacity = 1.0;
    outColor = vec4(color, texture_opacity * u_opacity);
}
