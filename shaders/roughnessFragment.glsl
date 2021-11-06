float roughnessFactor = roughness;

float texelRoughness = 2.0;

if(heightMetres< uSeaLevel){
  texelRoughness = 0.33/0.5;
}

// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
roughnessFactor *= texelRoughness;
