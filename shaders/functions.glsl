#define FLT_MAX 3.402823466e+38
#define f1 1
vec2 raySphere( vec3 sphereCentre, float sphereRadius,vec3 rayOrigin, vec3 rayDir){
	vec3 offset = rayOrigin - sphereCentre;
	float a = 1.0;
	float b = 2.0*dot(offset,rayDir);
	float c = dot(offset,offset) - sphereRadius*sphereRadius;
	float d = b*b - 4.0*a*c;
	if(d>0.0){
		float s = sqrt(d);
		float dstToSphereNear = max(0.0,(-b-s)/(2.0*a));
		float dstToSphereFar = (-b+s)/(2.0*a);

		if(dstToSphereFar>=0.0){
			return vec2(dstToSphereNear,dstToSphereFar-dstToSphereNear);
		}
	}

	return vec2(FLT_MAX, 0);
}

#define f2 2
float densityAtPoint(vec3 densitySamplePoint){
	float heightAboveSurface = length(densitySamplePoint-planetCentre) - planetRadius;
	float height01 = heightAboveSurface/(atmRadius-planetRadius);
	float localDensity = exp(-height01*densityFalloff)*(1.0-height01);
	return localDensity;
}
#define f3 3
float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength){
	vec3 densitySamplePoint = rayOrigin;
	float stepSize = rayLength/(numOpticalDepthPoints-1.0);
	float opticalDepth = 0.0;
	for(float i = 0.0;i<numOpticalDepthPoints;i++){
		float localDensity = densityAtPoint(densitySamplePoint);
		opticalDepth+=localDensity*stepSize;
		densitySamplePoint+=rayDir*stepSize;
	}
	return opticalDepth;
}
#define f4 4
float calculateLight(vec3 rayOrigin,vec3 rayDir, float rayLength){
	vec3 inScatterPoint = rayOrigin;
	float stepSize = rayLength/(numInScatteringPoints-1.0);
	float inScatteredLight = 0.0;
	vec3 dirToSun = normalize(vec3(lightsPosition - vPosition));
	for(float i = 0.0;i<numInScatteringPoints;i++){
		float sunRayLength = raySphere(planetCentre,atmRadius, inScatterPoint, dirToSun).y;
		float sunRayOpticalDepth  = opticalDepth(inScatterPoint,dirToSun,sunRayLength);
		float viewRayOpticalDepth  = opticalDepth(inScatterPoint,-rayDir,stepSize*i);
		float transmittance = exp(-(sunRayOpticalDepth+viewRayOpticalDepth));

		float localDensity = densityAtPoint(inScatterPoint);
		inScatteredLight+= localDensity*transmittance*stepSize;
		inScatterPoint+=rayDir*stepSize;
	}
	return inScatteredLight;
}

#define f5 5
vec4 getAtmosphere(vec4 originalColor){
  // float sceneDepth = length(vViewVector)-1.0;

	vec3 rayOrigin = cameraPosition;
	vec3 rayDir = normalize(vec3(vPosition - cameraPosition));
	vec2 hitInfo  = raySphere(planetCentre,atmRadius,rayOrigin,rayDir);

	vec2 dstToOcean  = raySphere(planetCentre, planetRadius,rayOrigin,rayDir);
	float dstToSurface = dstToOcean.x;
	float dstToAtmosphere = hitInfo.x;
	float dstThroughAtmosphere =min(hitInfo.y,dstToSurface-dstToAtmosphere);

	if(dstThroughAtmosphere>0.0){
		const float epsilon  =0.0001;
		vec3 pointInAtmosphere = rayOrigin+rayDir*(dstToAtmosphere*epsilon);
		float light =calculateLight(pointInAtmosphere,rayDir,dstThroughAtmosphere-epsilon*2.0);
	  return originalColor*(1.0-light)+light;
	}
  return originalColor;
}
