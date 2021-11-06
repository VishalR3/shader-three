#ifdef USE_MAP

	vec4 texelColor = texture2D( map, vUv );
  vec4 bump = texture2D(seaTexture,vUv);
  float heightMin = -10894.0;
  float heightMax = 7891.0;
  float heightMetres = heightMin + (heightMax-heightMin)*bump.r;
  if(heightMetres< uSeaLevel){
  float mixRatio = pow((heightMetres - uSeaLevel)/(heightMin-uSeaLevel),uSeaDepthIntensity);
    vec4 darkSeaColor = mix(texelColor,vec4(uSeaDarkColor,1.0),0.5);
    texelColor = mix(vec4(uSeaLightColor,1.0),darkSeaColor,mixRatio);
  }

	texelColor = mapTexelToLinear( texelColor );
	diffuseColor *= texelColor;

#endif