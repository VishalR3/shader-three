vec2 mUv = vUv*5.0;
vec3 normalTex = texture2D( seaNormal, mUv ).xyz * 2.0 - 1.0;


// #ifdef OBJECTSPACE_NORMALMAP

	if( heightMetres< uSeaLevel){
    normal = normalTex;
  }

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normal );

// #elif defined( TANGENTSPACE_NORMALMAP )

// 	vec3 mapN = normalTex;
// 	mapN.xy *= normalScale;

// 	#ifdef USE_TANGENT

// 		normal = normalize( vTBN * mapN );

// 	#else

// 		normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );

// 	#endif

// #elif defined( USE_BUMPMAP )

// 	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

// #endif