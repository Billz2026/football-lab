/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
import { Matrix3, Vector2, Color, mergeUniforms, Vector3, CubeUVReflectionMapping, Mesh, BoxGeometry, ShaderMaterial, BackSide, cloneUniforms, Euler, Matrix4, ColorManagement, SRGBTransfer, PlaneGeometry, FrontSide, getUnlitUniformColorSpace, IntType, HalfFloatType, UnsignedByteType, FloatType, RGBAFormat, Plane, EquirectangularReflectionMapping, EquirectangularRefractionMapping, WebGLCubeRenderTarget, CubeReflectionMapping, CubeRefractionMapping, OrthographicCamera, PerspectiveCamera, NoToneMapping, MeshBasicMaterial, NoBlending, WebGLRenderTarget, BufferGeometry, BufferAttribute, LinearSRGBColorSpace, LinearFilter, warnOnce, Uint32BufferAttribute, Uint16BufferAttribute, arrayNeedsUint32, Vector4, DataArrayTexture, CubeTexture, Data3DTexture, LessEqualCompare, DepthTexture, Texture, GLSL3, PCFShadowMap, PCFSoftShadowMap, VSMShadowMap, CustomToneMapping, NeutralToneMapping, AgXToneMapping, ACESFilmicToneMapping, CineonToneMapping, ReinhardToneMapping, LinearToneMapping, LinearTransfer, AddOperation, MixOperation, MultiplyOperation, UniformsUtils, DoubleSide, NormalBlending, TangentSpaceNormalMap, ObjectSpaceNormalMap, Layers, Frustum, MeshDepthMaterial, RGBADepthPacking, MeshDistanceMaterial, NearestFilter, LessEqualDepth, ReverseSubtractEquation, SubtractEquation, AddEquation, OneMinusConstantAlphaFactor, ConstantAlphaFactor, OneMinusConstantColorFactor, ConstantColorFactor, OneMinusDstAlphaFactor, OneMinusDstColorFactor, OneMinusSrcAlphaFactor, OneMinusSrcColorFactor, DstAlphaFactor, DstColorFactor, SrcAlphaSaturateFactor, SrcAlphaFactor, SrcColorFactor, OneFactor, ZeroFactor, NotEqualDepth, GreaterDepth, GreaterEqualDepth, EqualDepth, LessDepth, AlwaysDepth, NeverDepth, CullFaceNone, CullFaceBack, CullFaceFront, CustomBlending, MultiplyBlending, SubtractiveBlending, AdditiveBlending, MinEquation, MaxEquation, MirroredRepeatWrapping, ClampToEdgeWrapping, RepeatWrapping, LinearMipmapLinearFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, NotEqualCompare, GreaterCompare, GreaterEqualCompare, EqualCompare, LessCompare, AlwaysCompare, NeverCompare, NoColorSpace, DepthStencilFormat, getByteLength, DepthFormat, UnsignedIntType, UnsignedInt248Type, UnsignedShortType, createElementNS, UnsignedShort4444Type, UnsignedShort5551Type, UnsignedInt5999Type, UnsignedInt101111Type, ByteType, ShortType, AlphaFormat, RGBFormat, RedFormat, RedIntegerFormat, RGFormat, RGIntegerFormat, RGBAIntegerFormat, RGB_S3TC_DXT1_Format, RGBA_S3TC_DXT1_Format, RGBA_S3TC_DXT3_Format, RGBA_S3TC_DXT5_Format, RGB_PVRTC_4BPPV1_Format, RGB_PVRTC_2BPPV1_Format, RGBA_PVRTC_4BPPV1_Format, RGBA_PVRTC_2BPPV1_Format, RGB_ETC1_Format, RGB_ETC2_Format, RGBA_ETC2_EAC_Format, RGBA_ASTC_4x4_Format, RGBA_ASTC_5x4_Format, RGBA_ASTC_5x5_Format, RGBA_ASTC_6x5_Format, RGBA_ASTC_6x6_Format, RGBA_ASTC_8x5_Format, RGBA_ASTC_8x6_Format, RGBA_ASTC_8x8_Format, RGBA_ASTC_10x5_Format, RGBA_ASTC_10x6_Format, RGBA_ASTC_10x8_Format, RGBA_ASTC_10x10_Format, RGBA_ASTC_12x10_Format, RGBA_ASTC_12x12_Format, RGBA_BPTC_Format, RGB_BPTC_SIGNED_Format, RGB_BPTC_UNSIGNED_Format, RED_RGTC1_Format, SIGNED_RED_RGTC1_Format, RED_GREEN_RGTC2_Format, SIGNED_RED_GREEN_RGTC2_Format, ExternalTexture, EventDispatcher, ArrayCamera, WebXRController, RAD2DEG, createCanvasElement, SRGBColorSpace, REVISION, WebGLCoordinateSystem, probeAsync } from './three.core.js';
export { AdditiveAnimationBlendMode, AlwaysStencilFunc, AmbientLight, AnimationAction, AnimationClip, AnimationLoader, AnimationMixer, AnimationObjectGroup, AnimationUtils, ArcCurve, ArrowHelper, AttachedBindMode, Audio, AudioAnalyser, AudioContext, AudioListener, AudioLoader, AxesHelper, BasicDepthPacking, BasicShadowMap, BatchedMesh, Bone, BooleanKeyframeTrack, Box2, Box3, Box3Helper, BoxHelper, BufferGeometryLoader, Cache, Camera, CameraHelper, CanvasTexture, CapsuleGeometry, CatmullRomCurve3, CircleGeometry, Clock, ColorKeyframeTrack, CompressedArrayTexture, CompressedCubeTexture, CompressedTexture, CompressedTextureLoader, ConeGeometry, Controls, CubeCamera, CubeTextureLoader, CubicBezierCurve, CubicBezierCurve3, CubicInterpolant, CullFaceFrontBack, Curve, CurvePath, CylinderGeometry, Cylindrical, DataTexture, DataTextureLoader, DataUtils, DecrementStencilOp, DecrementWrapStencilOp, DefaultLoadingManager, DetachedBindMode, DirectionalLight, DirectionalLightHelper, DiscreteInterpolant, DodecahedronGeometry, DynamicCopyUsage, DynamicDrawUsage, DynamicReadUsage, EdgesGeometry, EllipseCurve, EqualStencilFunc, ExtrudeGeometry, FileLoader, Float16BufferAttribute, Float32BufferAttribute, Fog, FogExp2, FramebufferTexture, FrustumArray, GLBufferAttribute, GLSL1, GreaterEqualStencilFunc, GreaterStencilFunc, GridHelper, Group, HemisphereLight, HemisphereLightHelper, IcosahedronGeometry, ImageBitmapLoader, ImageLoader, ImageUtils, IncrementStencilOp, IncrementWrapStencilOp, InstancedBufferAttribute, InstancedBufferGeometry, InstancedInterleavedBuffer, InstancedMesh, Int16BufferAttribute, Int32BufferAttribute, Int8BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute, Interpolant, InterpolateDiscrete, InterpolateLinear, InterpolateSmooth, InterpolationSamplingMode, InterpolationSamplingType, InvertStencilOp, KeepStencilOp, KeyframeTrack, LOD, LatheGeometry, LessEqualStencilFunc, LessStencilFunc, Light, LightProbe, Line, Line3, LineBasicMaterial, LineCurve, LineCurve3, LineDashedMaterial, LineLoop, LineSegments, LinearInterpolant, LinearMipMapLinearFilter, LinearMipMapNearestFilter, Loader, LoaderUtils, LoadingManager, LoopOnce, LoopPingPong, LoopRepeat, MOUSE, Material, MaterialLoader, MathUtils, Matrix2, MeshLambertMaterial, MeshMatcapMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial, MeshToonMaterial, NearestMipMapLinearFilter, NearestMipMapNearestFilter, NeverStencilFunc, NormalAnimationBlendMode, NotEqualStencilFunc, NumberKeyframeTrack, Object3D, ObjectLoader, OctahedronGeometry, Path, PlaneHelper, PointLight, PointLightHelper, Points, PointsMaterial, PolarGridHelper, PolyhedronGeometry, PositionalAudio, PropertyBinding, PropertyMixer, QuadraticBezierCurve, QuadraticBezierCurve3, Quaternion, QuaternionKeyframeTrack, QuaternionLinearInterpolant, RGBDepthPacking, RGBIntegerFormat, RGDepthPacking, RawShaderMaterial, Ray, Raycaster, RectAreaLight, RenderTarget, RenderTarget3D, ReplaceStencilOp, RingGeometry, Scene, ShadowMaterial, Shape, ShapeGeometry, ShapePath, ShapeUtils, Skeleton, SkeletonHelper, SkinnedMesh, Source, Sphere, SphereGeometry, Spherical, SphericalHarmonics3, SplineCurve, SpotLight, SpotLightHelper, Sprite, SpriteMaterial, StaticCopyUsage, StaticDrawUsage, StaticReadUsage, StereoCamera, StreamCopyUsage, StreamDrawUsage, StreamReadUsage, StringKeyframeTrack, TOUCH, TetrahedronGeometry, TextureLoader, TextureUtils, Timer, TimestampQuery, TorusGeometry, TorusKnotGeometry, Triangle, TriangleFanDrawMode, TriangleStripDrawMode, TrianglesDrawMode, TubeGeometry, UVMapping, Uint8BufferAttribute, Uint8ClampedBufferAttribute, Uniform, UniformsGroup, VectorKeyframeTrack, VideoFrameTexture, VideoTexture, WebGL3DRenderTarget, WebGLArrayRenderTarget, WebGPUCoordinateSystem, WireframeGeometry, WrapAroundEnding, ZeroCurvatureEnding, ZeroSlopeEnding, ZeroStencilOp } from './three.core.js';

function WebGLAnimation() {

	let context = null;
	let isAnimating = false;
	let animationLoop = null;
	let requestId = null;

	function onAnimationFrame( time, frame ) {

		animationLoop( time, frame );

		requestId = context.requestAnimationFrame( onAnimationFrame );

	}

	return {

		start: function () {

			if ( isAnimating === true ) return;
			if ( animationLoop === null ) return;

			requestId = context.requestAnimationFrame( onAnimationFrame );

			isAnimating = true;

		},

		stop: function () {

			context.cancelAnimationFrame( requestId );

			isAnimating = false;

		},

		setAnimationLoop: function ( callback ) {

			animationLoop = callback;

		},

		setContext: function ( value ) {

			context = value;

		}

	};

}

function WebGLAttributes( gl ) {

	const buffers = new WeakMap();

	function createBuffer( attribute, bufferType ) {

		const array = attribute.array;
		const usage = attribute.usage;
		const size = array.byteLength;

		const buffer = gl.createBuffer();

		gl.bindBuffer( bufferType, buffer );
		gl.bufferData( bufferType, array, usage );

		attribute.onUploadCallback();

		let type;

		if ( array instanceof Float32Array ) {

			type = gl.FLOAT;

		} else if ( typeof Float16Array !== 'undefined' && array instanceof Float16Array ) {

			type = gl.HALF_FLOAT;

		} else if ( array instanceof Uint16Array ) {

			if ( attribute.isFloat16BufferAttribute ) {

				type = gl.HALF_FLOAT;

			} else {

				type = gl.UNSIGNED_SHORT;

			}

		} else if ( array instanceof Int16Array ) {

			type = gl.SHORT;

		} else if ( array instanceof Uint32Array ) {

			type = gl.UNSIGNED_INT;

		} else if ( array instanceof Int32Array ) {

			type = gl.INT;

		} else if ( array instanceof Int8Array ) {

			type = gl.BYTE;

		} else if ( array instanceof Uint8Array ) {

			type = gl.UNSIGNED_BYTE;

		} else if ( array instanceof Uint8ClampedArray ) {

			type = gl.UNSIGNED_BYTE;

		} else {

			throw new Error( 'THREE.WebGLAttributes: Unsupported buffer data format: ' + array );

		}

		return {
			buffer: buffer,
			type: type,
			bytesPerElement: array.BYTES_PER_ELEMENT,
			version: attribute.version,
			size: size
		};

	}

	function updateBuffer( buffer, attribute, bufferType ) {

		const array = attribute.array;
		const updateRanges = attribute.updateRanges;

		gl.bindBuffer( bufferType, buffer );

		if ( updateRanges.length === 0 ) {

			// Not using update ranges
			gl.bufferSubData( bufferType, 0, array );

		} else {

			// Before applying update ranges, we merge any adjacent / overlapping
			// ranges to reduce load on `gl.bufferSubData`. Empirically, this has led
			// to performance improvements for applications which make heavy use of
			// update ranges. Likely due to GPU command overhead.
			//
			// Note that to reduce garbage collection between frames, we merge the
			// update ranges in-place. This is safe because this method will clear the
			// update ranges once updated.

			updateRanges.sort( ( a, b ) => a.start - b.start );

			// To merge the update ranges in-place, we work from left to right in the
			// existing updateRanges array, merging ranges. This may result in a final
			// array which is smaller than the original. This index tracks the last
			// index representing a merged range, any data after this index can be
			// trimmed once the merge algorithm is completed.
			let mergeIndex = 0;

			for ( let i = 1; i < updateRanges.length; i ++ ) {

				const previousRange = updateRanges[ mergeIndex ];
				const range = updateRanges[ i ];

				// We add one here to merge adjacent ranges. This is safe because ranges
				// operate over positive integers.
				if ( range.start <= previousRange.start + previousRange.count + 1 ) {

					previousRange.count = Math.max(
						previousRange.count,
						range.start + range.count - previousRange.start
					);

				} else {

					++ mergeIndex;
					updateRanges[ mergeIndex ] = range;

				}

			}

			// Trim the array to only contain the merged ranges.
			updateRanges.length = mergeIndex + 1;

			for ( let i = 0, l = updateRanges.length; i < l; i ++ ) {

				const range = updateRanges[ i ];

				gl.bufferSubData( bufferType, range.start * array.BYTES_PER_ELEMENT,
					array, range.start, range.count );

			}

			attribute.clearUpdateRanges();

		}

		attribute.onUploadCallback();

	}

	//

	function get( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		return buffers.get( attribute );

	}

	function remove( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		const data = buffers.get( attribute );

		if ( data ) {

			gl.deleteBuffer( data.buffer );

			buffers.delete( attribute );

		}

	}

	function update( attribute, bufferType ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		if ( attribute.isGLBufferAttribute ) {

			const cached = buffers.get( attribute );

			if ( ! cached || cached.version < attribute.version ) {

				buffers.set( attribute, {
					buffer: attribute.buffer,
					type: attribute.type,
					bytesPerElement: attribute.elementSize,
					version: attribute.version
				} );

			}

			return;

		}

		const data = buffers.get( attribute );

		if ( data === undefined ) {

			buffers.set( attribute, createBuffer( attribute, bufferType ) );

		} else if ( data.version < attribute.version ) {

			if ( data.size !== attribute.array.byteLength ) {

				throw new Error( 'THREE.WebGLAttributes: The size of the buffer attribute\'s array buffer does not match the original size. Resizing buffer attributes is not supported.' );

			}

			updateBuffer( data.buffer, attribute, bufferType );

			data.version = attribute.version;

		}

	}

	return {

		get: get,
		remove: remove,
		update: update

	};

}

var alphahash_fragment = "#ifdef USE_ALPHAHASH\n\tif ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;\n#endif";

var alphahash_pars_fragment = "#ifdef USE_ALPHAHASH\n\tconst float ALPHA_HASH_SCALE = 0.05;\n\tfloat hash2D( vec2 value ) {\n\t\treturn fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );\n\t}\n\tfloat hash3D( vec3 value ) {\n\t\treturn hash2D( vec2( hash2D( value.xy ), value.z ) );\n\t}\n\tfloat getAlphaHashThreshold( vec3 position ) {\n\t\tfloat maxDeriv = max(\n\t\t\tlength( dFdx( position.xyz ) ),\n\t\t\tlength( dFdy( position.xyz ) )\n\t\t);\n\t\tfloat pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );\n\t\tvec2 pixScales = vec2(\n\t\t\texp2( floor( log2( pixScale ) ) ),\n\t\t\texp2( ceil( log2( pixScale ) ) )\n\t\t);\n\t\tvec2 alpha = vec2(\n\t\t\thash3D( floor( pixScales.x * position.xyz ) ),\n\t\t\thash3D( floor( pixScales.y * position.xyz ) )\n\t\t);\n\t\tfloat lerpFactor = fract( log2( pixScale ) );\n\t\tfloat x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;\n\t\tfloat a = min( lerpFactor, 1.0 - lerpFactor );\n\t\tvec3 cases = vec3(\n\t\t\tx * x / ( 2.0 * a * ( 1.0 - a ) ),\n\t\t\t( x - 0.5 * a ) / ( 1.0 - a ),\n\t\t\t1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )\n\t\t);\n\t\tfloat threshold = ( x < ( 1.0 - a ) )\n\t\t\t? ( ( x < a ) ? cases.x : cases.y )\n\t\t\t: cases.z;\n\t\treturn clamp( threshold , 1.0e-6, 1.0 );\n\t}\n#endif";

var alphamap_fragment = "#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;\n#endif";

var alphamap_pars_fragment = "#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif";

var alphatest_fragment = "#ifdef USE_ALPHATEST\n\t#ifdef ALPHA_TO_COVERAGE\n\tdiffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );\n\tif ( diffuseColor.a == 0.0 ) discard;\n\t#else\n\tif ( diffuseColor.a < alphaTest ) discard;\n\t#endif\n#endif";

var alphatest_pars_fragment = "#ifdef USE_ALPHATEST\n\tuniform float alphaTest;\n#endif";

var aomap_fragment = "#ifdef USE_AOMAP\n\tfloat ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;\n\treflectedLight.indirectDiffuse *= ambientOcclusion;\n\t#if defined( USE_CLEARCOAT ) \n\t\tclearcoatSpecularIndirect *= ambientOcclusion;\n\t#endif\n\t#if defined( USE_SHEEN ) \n\t\tsheenSpecularIndirect *= ambientOcclusion;\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( STANDARD )\n\t\tfloat dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n\t\treflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n\t#endif\n#endif";

var aomap_pars_fragment = "#ifdef USE_AOMAP\n\tuniform sampler2D aoMap;\n\tuniform float aoMapIntensity;\n#endif";

var batching_pars_vertex = "#ifdef USE_BATCHING\n\t#if ! defined( GL_ANGLE_multi_draw )\n\t#define gl_DrawID _gl_DrawID\n\tuniform int _gl_DrawID;\n\t#endif\n\tuniform highp sampler2D batchingTexture;\n\tuniform highp usampler2D batchingIdTexture;\n\tmat4 getBatchingMatrix( const in float i ) {\n\t\tint size = textureSize( batchingTexture, 0 ).x;\n\t\tint j = int( i ) * 4;\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\tvec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );\n\t\tvec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );\n\t\tvec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );\n\t\tvec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );\n\t\treturn mat4( v1, v2, v3, v4 );\n\t}\n\tfloat getIndirectIndex( const in int i ) {\n\t\tint size = textureSize( batchingIdTexture, 0 ).x;\n\t\tint x = i % size;\n\t\tint y = i / size;\n\t\treturn float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );\n\t}\n#endif\n#ifdef USE_BATCHING_COLOR\n\tuniform sampler2D batchingColorTexture;\n\tvec3 getBatchingColor( const in float i ) {\n\t\tint size = textureSize( batchingColorTexture, 0 ).x;\n\t\tint j = int( i );\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\treturn texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;\n\t}\n#endif";

var batching_vertex = "#ifdef USE_BATCHING\n\tmat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );\n#endif";

var begin_vertex = "vec3 transformed = vec3( position );\n#ifdef USE_ALPHAHASH\n\tvPosition = vec3( position );\n#endif";

var beginnormal_vertex = "vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\n\tvec3 objectTangent = vec3( tangent.xyz );\n#endif";

var bsdfs = "float G_BlinnPhong_Implicit( ) {\n\treturn 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n\treturn RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, 1.0, dotVH );\n\tfloat G = G_BlinnPhong_Implicit( );\n\tfloat D = D_BlinnPhong( shininess, dotNH );\n\treturn F * ( G * D );\n} // validated";

var iridescence_fragment = "#ifdef USE_IRIDESCENCE\n\tconst mat3 XYZ_TO_REC709 = mat3(\n\t\t 3.2404542, -0.9692660,  0.0556434,\n\t\t-1.5371385,  1.8760108, -0.2040259,\n\t\t-0.4985314,  0.0415560,  1.0572252\n\t);\n\tvec3 Fresnel0ToIor( vec3 fresnel0 ) {\n\t\tvec3 sqrtF0 = sqrt( fresnel0 );\n\t\treturn ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );\n\t}\n\tvec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {\n\t\treturn pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );\n\t}\n\tfloat IorToFresnel0( float transmittedIor, float incidentIor ) {\n\t\treturn pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));\n\t}\n\tvec3 evalSensitivity( float OPD, vec3 shift ) {\n\t\tfloat phase = 2.0 * PI * OPD * 1.0e-9;\n\t\tvec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );\n\t\tvec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );\n\t\tvec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );\n\t\tvec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );\n\t\txyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );\n\t\txyz /= 1.0685e-7;\n\t\tvec3 rgb = XYZ_TO_REC709 * xyz;\n\t\treturn rgb;\n\t}\n\tvec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {\n\t\tvec3 I;\n\t\tfloat iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );\n\t\tfloat sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );\n\t\tfloat cosTheta2Sq = 1.0 - sinTheta2Sq;\n\t\tif ( cosTheta2Sq < 0.0 ) {\n\t\t\treturn vec3( 1.0 );\n\t\t}\n\t\tfloat cosTheta2 = sqrt( cosTheta2Sq );\n\t\tfloat R0 = IorToFresnel0( iridescenceIOR, outsideIOR );\n\t\tfloat R12 = F_Schlick( R0, 1.0, cosTheta1 );\n\t\tfloat T121 = 1.0 - R12;\n\t\tfloat phi12 = 0.0;\n\t\tif ( iridescenceIOR < outsideIOR ) phi12 = PI;\n\t\tfloat phi21 = PI - phi12;\n\t\tvec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );\t\tvec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );\n\t\tvec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );\n\t\tvec3 phi23 = vec3( 0.0 );\n\t\tif ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;\n\t\tif ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;\n\t\tif ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;\n\t\tfloat OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;\n\t\tvec3 phi = vec3( phi21 ) + phi23;\n\t\tvec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );\n\t\tvec3 r123 = sqrt( R123 );\n\t\tvec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );\n\t\tvec3 C0 = R12 + Rs;\n\t\tI = C0;\n\t\tvec3 Cm = Rs - T121;\n\t\tfor ( int m = 1; m <= 2; ++ m ) {\n\t\t\tCm *= r123;\n\t\t\tvec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );\n\t\t\tI += Cm * Sm;\n\t\t}\n\t\treturn max( I, vec3( 0.0 ) );\n\t}\n#endif";

var bumpmap_pars_fragment = "#ifdef USE_BUMPMAP\n\tuniform sampler2D bumpMap;\n\tuniform float bumpScale;\n\tvec2 dHdxy_fwd() {\n\t\tvec2 dSTdx = dFdx( vBumpMapUv );\n\t\tvec2 dSTdy = dFdy( vBumpMapUv );\n\t\tfloat Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;\n\t\tfloat dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;\n\t\tfloat dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;\n\t\treturn vec2( dBx, dBy );\n\t}\n\tvec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {\n\t\tvec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );\n\t\tvec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );\n\t\tvec3 vN = surf_norm;\n\t\tvec3 R1 = cross( vSigmaY, vN );\n\t\tvec3 R2 = cross( vN, vSigmaX );\n\t\tfloat fDet = dot( vSigmaX, R1 ) * faceDirection;\n\t\tvec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n\t\treturn normalize( abs( fDet ) * surf_norm - vGrad );\n\t}\n#endif";

var clipping_planes_fragment = "#if NUM_CLIPPING_PLANES > 0\n\tvec4 plane;\n\t#ifdef ALPHA_TO_COVERAGE\n\t\tfloat distanceToPlane, distanceGradient;\n\t\tfloat clipOpacity = 1.0;\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n\t\t\tplane = clippingPlanes[ i ];\n\t\t\tdistanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n\t\t\tdistanceGradient = fwidth( distanceToPlane ) / 2.0;\n\t\t\tclipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n\t\t\tif ( clipOpacity == 0.0 ) discard;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n\t\t\tfloat unionClipOpacity = 1.0;\n\t\t\t#pragma unroll_loop_start\n\t\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n\t\t\t\tplane = clippingPlanes[ i ];\n\t\t\t\tdistanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n\t\t\t\tdistanceGradient = fwidth( distanceToPlane ) / 2.0;\n\t\t\t\tunionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n\t\t\t}\n\t\t\t#pragma unroll_loop_end\n\t\t\tclipOpacity *= 1.0 - unionClipOpacity;\n\t\t#endif\n\t\tdiffuseColor.a *= clipOpacity;\n\t\tif ( diffuseColor.a == 0.0 ) discard;\n\t#else\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n\t\t\tplane = clippingPlanes[ i ];\n\t\t\tif ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n\t\t\tbool clipped = true;\n\t\t\t#pragma unroll_loop_start\n\t\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n\t\t\t\tplane = clippingPlanes[ i ];\n\t\t\t\tclipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;\n\t\t\t}\n\t\t\t#pragma unroll_loop_end\n\t\t\tif ( clipped ) discard;\n\t\t#endif\n\t#endif\n#endif";

var clipping_planes_pars_fragment = "#if NUM_CLIPPING_PLANES > 0\n\tvarying vec3 vClipPosition;\n\tuniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif";

var clipping_planes_pars_vertex = "#if NUM_CLIPPING_PLANES > 0\n\tvarying vec3 vClipPosition;\n#endif";

var clipping_planes_vertex = "#if NUM_CLIPPING_PLANES > 0\n\tvClipPosition = - mvPosition.xyz;\n#endif";

var color_fragment = "#if defined( USE_COLOR_ALPHA )\n\tdiffuseColor *= vColor;\n#elif defined( USE_COLOR )\n\tdiffuseColor.rgb *= vColor;\n#endif";

var color_pars_fragment = "#if defined( USE_COLOR_ALPHA )\n\tvarying vec4 vColor;\n#elif defined( USE_COLOR )\n\tvarying vec3 vColor;\n#endif";

var color_pars_vertex = "#if defined( USE_COLOR_ALPHA )\n\tvarying vec4 vColor;\n#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n\tvarying vec3 vColor;\n#endif";

var color_vertex = "#if defined( USE_COLOR_ALPHA )\n\tvColor = vec4( 1.0 );\n#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n\tvColor = vec3( 1.0 );\n#endif\n#ifdef USE_COLOR\n\tvColor *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n\tvColor.xyz *= instanceColor.xyz;\n#endif\n#ifdef USE_BATCHING_COLOR\n\tvec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );\n\tvColor.xyz *= batchingColor.xyz;\n#endif";

var common = "#define PI 3.141592653589793\n#define PI2 6.283185307179586\n#define PI_HALF 1.5707963267948966\n#define RECIPROCAL_PI 0.3183098861837907\n#define RECIPROCAL_PI2 0.15915494309189535\n#define EPSILON 1e-6\n#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\n#define whiteComplement( a ) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nvec3 pow2( const in vec3 x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }\nfloat average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }\nhighp float rand( const in vec2 uv ) {\n\tconst highp float a = 12.9898, b = 78.233, c = 43758.5453;\n\thighp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n\treturn fract( sin( sn ) * c );\n}\n#ifdef HIGH_PRECISION\n\tfloat precisionSafeLength( vec3 v ) { return length( v ); }\n#else\n\tfloat precisionSafeLength( vec3 v ) {\n\t\tfloat maxComponent = max3( abs( v ) );\n\t\treturn length( v / maxComponent ) * maxComponent;\n\t}\n#endif\nstruct IncidentLight {\n\tvec3 color;\n\tvec3 direction;\n\tbool visible;\n};\nstruct ReflectedLight {\n\tvec3 directDiffuse;\n\tvec3 directSpecular;\n\tvec3 indirectDiffuse;\n\tvec3 indirectSpecular;\n};\n#ifdef USE_ALPHAHASH\n\tvarying vec3 vPosition;\n#endif\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\nvec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\n}\nmat3 transposeMat3( const in mat3 m ) {\n\tmat3 tmp;\n\ttmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );\n\ttmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );\n\ttmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );\n\treturn tmp;\n}\nbool isPerspectiveMatrix( mat4 m ) {\n\treturn m[ 2 ][ 3 ] == - 1.0;\n}\nvec2 equirectUv( in vec3 dir ) {\n\tfloat u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n\tfloat v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n\treturn vec2( u, v );\n}\nvec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n\treturn RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {\n\tfloat fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n\treturn f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n}\nfloat F_Schlick( const in float f0, const in float f90, const in float dotVH ) {\n\tfloat fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n\treturn f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n} // validated";

var cube_uv_reflection_fragment = "#ifdef ENVMAP_TYPE_CUBE_UV\n\t#define cubeUV_minMipLevel 4.0\n\t#define cubeUV_minTileSize 16.0\n\tfloat getFace( vec3 direction ) {\n\t\tvec3 absDirection = abs( direction );\n\t\tfloat face = - 1.0;\n\t\tif ( absDirection.x > absDirection.z ) {\n\t\t\tif ( absDirection.x > absDirection.y )\n\t\t\t\tface = direction.x > 0.0 ? 0.0 : 3.0;\n\t\t\telse\n\t\t\t\tface = direction.y > 0.0 ? 1.0 : 4.0;\n\t\t} else {\n\t\t\tif ( absDirection.z > absDirection.y )\n\t\t\t\tface = direction.z > 0.0 ? 2.0 : 5.0;\n\t\t\telse\n\t\t\t\tface = direction.y > 0.0 ? 1.0 : 4.0;\n\t\t}\n\t\treturn face;\n\t}\n\tvec2 getUV( vec3 direction, float face ) {\n\t\tvec2 uv;\n\t\tif ( face == 0.0 ) {\n\t\t\tuv = vec2( direction.z, direction.y ) / abs( direction.x );\n\t\t} else if ( face == 1.0 ) {\n\t\t\tuv = vec2( - direction.x, - direction.z ) / abs( direction.y );\n\t\t} else if ( face == 2.0 ) {\n\t\t\tuv = vec2( - direction.x, direction.y ) / abs( direction.z );\n\t\t} else if ( face == 3.0 ) {\n\t\t\tuv = vec2( - direction.z, direction.y ) / abs( direction.x );\n\t\t} else if ( face == 4.0 ) {\n\t\t\tuv = vec2( - direction.x, direction.z ) / abs( direction.y );\n\t\t} else {\n\t\t\tuv = vec2( direction.x, direction.y ) / abs( direction.z );\n\t\t}\n\t\treturn 0.5 * ( uv + 1.0 );\n\t}\n\tvec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {\n\t\tfloat face = getFace( direction );\n\t\tfloat filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );\n\t\tmipInt = max( mipInt, cubeUV_minMipLevel );\n\t\tfloat faceSize = exp2( mipInt );\n\t\thighp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;\n\t\tif ( face > 2.0 ) {\n\t\t\tuv.y += faceSize;\n\t\t\tface -= 3.0;\n\t\t}\n\t\tuv.x += face * faceSize;\n\t\tuv.x += filterInt * 3.0 * cubeUV_minTileSize;\n\t\tuv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );\n\t\tuv.x *= CUBEUV_TEXEL_WIDTH;\n\t\tuv.y *= CUBEUV_TEXEL_HEIGHT;\n\t\t#ifdef texture2DGradEXT\n\t\t\treturn texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;\n\t\t#else\n\t\t\treturn texture2D( envMap, uv ).rgb;\n\t\t#endif\n\t}\n\t#define cubeUV_r0 1.0\n\t#define cubeUV_m0 - 2.0\n\t#define cubeUV_r1 0.8\n\t#define cubeUV_m1 - 1.0\n\t#define cubeUV_r4 0.4\n\t#define cubeUV_m4 2.0\n\t#define cubeUV_r5 0.305\n\t#define cubeUV_m5 3.0\n\t#define cubeUV_r6 0.21\n\t#define cubeUV_m6 4.0\n\tfloat roughnessToMip( float roughness ) {\n\t\tfloat mip = 0.0;\n\t\tif ( roughness >= cubeUV_r1 ) {\n\t\t\tmip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;\n\t\t} else if ( roughness >= cubeUV_r4 ) {\n\t\t\tmip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;\n\t\t} else if ( roughness >= cubeUV_r5 ) {\n\t\t\tmip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;\n\t\t} else if ( roughness >= cubeUV_r6 ) {\n\t\t\tmip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;\n\t\t} else {\n\t\t\tmip = - 2.0 * log2( 1.16 * roughness );\t\t}\n\t\treturn mip;\n\t}\n\tvec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {\n\t\tfloat mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );\n\t\tfloat mipF = fract( mip );\n\t\tfloat mipInt = floor( mip );\n\t\tvec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );\n\t\tif ( mipF == 0.0 ) {\n\t\t\treturn vec4( color0, 1.0 );\n\t\t} else {\n\t\t\tvec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );\n\t\t\treturn vec4( mix( color0, color1, mipF ), 1.0 );\n\t\t}\n\t}\n#endif";

var defaultnormal_vertex = "vec3 transformedNormal = objectNormal;\n#ifdef USE_TANGENT\n\tvec3 transformedTangent = objectTangent;\n#endif\n#ifdef USE_BATCHING\n\tmat3 bm = mat3( batchingMatrix );\n\ttransformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n\ttransformedNormal = bm * transformedNormal;\n\t#ifdef USE_TANGENT\n\t\ttransformedTangent = bm * transformedTangent;\n\t#endif\n#endif\n#ifdef USE_INSTANCING\n\tmat3 im = mat3( instanceMatrix );\n\ttransformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );\n\ttransformedNormal = im * transformedNormal;\n\t#ifdef USE_TANGENT\n\t\ttransformedTangent = im * transformedTangent;\n\t#endif\n#endif\ntransformedNormal = normalMatrix * transformedNormal;\n#ifdef FLIP_SIDED\n\ttransformedNormal = - transformedNormal;\n#endif\n#ifdef USE_TANGENT\n\ttransformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;\n\t#ifdef FLIP_SIDED\n\t\ttransformedTangent = - transformedTangent;\n\t#endif\n#endif";

var displacementmap_pars_vertex = "#ifdef USE_DISPLACEMENTMAP\n\tuniform sampler2D displacementMap;\n\tuniform float displacementScale;\n\tuniform float displacementBias;\n#endif";

var displacementmap_vertex = "#ifdef USE_DISPLACEMENTMAP\n\ttransformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );\n#endif";

var emissivemap_fragment = "#ifdef USE_EMISSIVEMAP\n\tvec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n\t#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE\n\t\temissiveColor = sRGBTransferEOTF( emissiveColor );\n\t#endif\n\ttotalEmissiveRadiance *= emissiveColor.rgb;\n#endif";

var emissivemap_pars_fragment = "#ifdef USE_EMISSIVEMAP\n\tuniform sampler2D emissiveMap;\n#endif";

var colorspace_fragment = "gl_FragColor = linearToOutputTexel( gl_FragColor );";

var colorspace_pars_fragment = "vec4 LinearTransferOETF( in vec4 value ) {\n\treturn value;\n}\nvec4 sRGBTransferEOTF( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 sRGBTransferOETF( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}";

var envmap_fragment = "#ifdef USE_ENVMAP\n\t#ifdef ENV_WORLDPOS\n\t\tvec3 cameraToFrag;\n\t\tif ( isOrthographic ) {\n\t\t\tcameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n\t\t} else {\n\t\t\tcameraToFrag = normalize( vWorldPosition - cameraPosition );\n\t\t}\n\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( cameraToFrag, worldNormal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );\n\t\t#endif\n\t#else\n\t\tvec3 reflectVec = vReflect;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\t#else\n\t\tvec4 envColor = vec4( 0.0 );\n\t#endif\n\t#ifdef ENVMAP_BLENDING_MULTIPLY\n\t\toutgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_MIX )\n\t\toutgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_ADD )\n\t\toutgoingLight += envColor.xyz * specularStrength * reflectivity;\n\t#endif\n#endif";

var envmap_common_pars_fragment = "#ifdef USE_ENVMAP\n\tuniform float envMapIntensity;\n\tuniform float flipEnvMap;\n\tuniform mat3 envMapRotation;\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tuniform samplerCube envMap;\n\t#else\n\t\tuniform sampler2D envMap;\n\t#endif\n\t\n#endif";

var envmap_pars_fragment = "#ifdef USE_ENVMAP\n\tuniform float reflectivity;\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n\t\t#define ENV_WORLDPOS\n\t#endif\n\t#ifdef ENV_WORLDPOS\n\t\tvarying vec3 vWorldPosition;\n\t\tuniform float refractionRatio;\n\t#else\n\t\tvarying vec3 vReflect;\n\t#endif\n#endif";

var envmap_pars_vertex = "#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n\t\t#define ENV_WORLDPOS\n\t#endif\n\t#ifdef ENV_WORLDPOS\n\t\t\n\t\tvarying vec3 vWorldPosition;\n\t#else\n\t\tvarying vec3 vReflect;\n\t\tuniform float refractionRatio;\n\t#endif\n#endif";

var envmap_vertex = "#ifdef USE_ENVMAP\n\t#ifdef ENV_WORLDPOS\n\t\tvWorldPosition = worldPosition.xyz;\n\t#else\n\t\tvec3 cameraToVertex;\n\t\tif ( isOrthographic ) {\n\t\t\tcameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n\t\t} else {\n\t\t\tcameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n\t\t}\n\t\tvec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvReflect = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#endif\n#endif";

var fog_vertex = "#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n#endif";

var fog_pars_vertex = "#ifdef USE_FOG\n\tvarying float vFogDepth;\n#endif";

var fog_fragment = "#ifdef USE_FOG\n\t#ifdef FOG_EXP2\n\t\tfloat fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n\t#else\n\t\tfloat fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n\t#endif\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif";

var fog_pars_fragment = "#ifdef USE_FOG\n\tuniform vec3 fogColor;\n\tvarying float vFogDepth;\n\t#ifdef FOG_EXP2\n\t\tuniform float fogDensity;\n\t#else\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\t#endif\n#endif";

var gradientmap_pars_fragment = "#ifdef USE_GRADIENTMAP\n\tuniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n\tfloat dotNL = dot( normal, lightDirection );\n\tvec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n\t#ifdef USE_GRADIENTMAP\n\t\treturn vec3( texture2D( gradientMap, coord ).r );\n\t#else\n\t\tvec2 fw = fwidth( coord ) * 0.5;\n\t\treturn mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );\n\t#endif\n}";

var lightmap_pars_fragment = "#ifdef USE_LIGHTMAP\n\tuniform sampler2D lightMap;\n\tuniform float lightMapIntensity;\n#endif";

var lights_lambert_fragment = "LambertMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularStrength = specularStrength;";

var lights_lambert_pars_fragment = "varying vec3 vViewPosition;\nstruct LambertMaterial {\n\tvec3 diffuseColor;\n\tfloat specularStrength;\n};\nvoid RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_Lambert\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Lambert";

var lights_pars_begin = "uniform bool receiveShadow;\nuniform vec3 ambientLightColor;\n#if defined( USE_LIGHT_PROBES )\n\tuniform vec3 lightProbe[ 9 ];\n#endif\nvec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {\n\tfloat x = normal.x, y = normal.y, z = normal.z;\n\tvec3 result = shCoefficients[ 0 ] * 0.886227;\n\tresult += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;\n\tresult += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;\n\tresult += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;\n\tresult += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;\n\tresult += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;\n\tresult += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );\n\tresult += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;\n\tresult += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );\n\treturn result;\n}\nvec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {\n\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\tvec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );\n\treturn irradiance;\n}\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n\tvec3 irradiance = ambientLightColor;\n\treturn irradiance;\n}\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\tfloat distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n\tif ( cutoffDistance > 0.0 ) {\n\t\tdistanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n\t}\n\treturn distanceFalloff;\n}\nfloat getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {\n\treturn smoothstep( coneCosine, penumbraCosine, angleCosine );\n}\n#if NUM_DIR_LIGHTS > 0\n\tstruct DirectionalLight {\n\t\tvec3 direction;\n\t\tvec3 color;\n\t};\n\tuniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n\tvoid getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {\n\t\tlight.color = directionalLight.color;\n\t\tlight.direction = directionalLight.direction;\n\t\tlight.visible = true;\n\t}\n#endif\n#if NUM_POINT_LIGHTS > 0\n\tstruct PointLight {\n\t\tvec3 position;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t};\n\tuniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n\tvoid getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {\n\t\tvec3 lVector = pointLight.position - geometryPosition;\n\t\tlight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tlight.color = pointLight.color;\n\t\tlight.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );\n\t\tlight.visible = ( light.color != vec3( 0.0 ) );\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\tstruct SpotLight {\n\t\tvec3 position;\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tfloat coneCos;\n\t\tfloat penumbraCos;\n\t};\n\tuniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n\tvoid getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {\n\t\tvec3 lVector = spotLight.position - geometryPosition;\n\t\tlight.direction = normalize( lVector );\n\t\tfloat angleCos = dot( light.direction, spotLight.direction );\n\t\tfloat spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n\t\tif ( spotAttenuation > 0.0 ) {\n\t\t\tfloat lightDistance = length( lVector );\n\t\t\tlight.color = spotLight.color * spotAttenuation;\n\t\t\tlight.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );\n\t\t\tlight.visible = ( light.color != vec3( 0.0 ) );\n\t\t} else {\n\t\t\tlight.color = vec3( 0.0 );\n\t\t\tlight.visible = false;\n\t\t}\n\t}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n\tstruct RectAreaLight {\n\t\tvec3 color;\n\t\tvec3 position;\n\t\tvec3 halfWidth;\n\t\tvec3 halfHeight;\n\t};\n\tuniform sampler2D ltc_1;\tuniform sampler2D ltc_2;\n\tuniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\tstruct HemisphereLight {\n\t\tvec3 direction;\n\t\tvec3 skyColor;\n\t\tvec3 groundColor;\n\t};\n\tuniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n\tvec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {\n\t\tfloat dotNL = dot( normal, hemiLight.direction );\n\t\tfloat hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n\t\tvec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\treturn irradiance;\n\t}\n#endif";

var envmap_physical_pars_fragment = "#ifdef USE_ENVMAP\n\tvec3 getIBLIrradiance( const in vec3 normal ) {\n\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );\n\t\t\treturn PI * envMapColor.rgb * envMapIntensity;\n\t\t#else\n\t\t\treturn vec3( 0.0 );\n\t\t#endif\n\t}\n\tvec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\tvec3 reflectVec = reflect( - viewDir, normal );\n\t\t\treflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );\n\t\t\treflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );\n\t\t\treturn envMapColor.rgb * envMapIntensity;\n\t\t#else\n\t\t\treturn vec3( 0.0 );\n\t\t#endif\n\t}\n\t#ifdef USE_ANISOTROPY\n\t\tvec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n\t\t\t#ifdef ENVMAP_TYPE_CUBE_UV\n\t\t\t\tvec3 bentNormal = cross( bitangent, viewDir );\n\t\t\t\tbentNormal = normalize( cross( bentNormal, bitangent ) );\n\t\t\t\tbentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n\t\t\t\treturn getIBLRadiance( viewDir, bentNormal, roughness );\n\t\t\t#else\n\t\t\t\treturn vec3( 0.0 );\n\t\t\t#endif\n\t\t}\n\t#endif\n#endif";

var lights_toon_fragment = "ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;";

var lights_toon_pars_fragment = "varying vec3 vViewPosition;\nstruct ToonMaterial {\n\tvec3 diffuseColor;\n};\nvoid RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n\tvec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_Toon\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Toon";

var lights_phong_fragment = "BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;";

var lights_phong_pars_fragment = "varying vec3 vViewPosition;\nstruct BlinnPhongMaterial {\n\tvec3 diffuseColor;\n\tvec3 specularColor;\n\tfloat specularShininess;\n\tfloat specularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\treflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_BlinnPhong\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_BlinnPhong";

var lights_physical_fragment = "PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nvec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );\nfloat geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );\nmaterial.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;\nmaterial.roughness = min( material.roughness, 1.0 );\n#ifdef IOR\n\tmaterial.ior = ior;\n\t#ifdef USE_SPECULAR\n\t\tfloat specularIntensityFactor = specularIntensity;\n\t\tvec3 specularColorFactor = specularColor;\n\t\t#ifdef USE_SPECULAR_COLORMAP\n\t\t\tspecularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;\n\t\t#endif\n\t\t#ifdef USE_SPECULAR_INTENSITYMAP\n\t\t\tspecularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;\n\t\t#endif\n\t\tmaterial.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n\t#else\n\t\tfloat specularIntensityFactor = 1.0;\n\t\tvec3 specularColorFactor = vec3( 1.0 );\n\t\tmaterial.specularF90 = 1.0;\n\t#endif\n\tmaterial.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );\n#else\n\tmaterial.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );\n\tmaterial.specularF90 = 1.0;\n#endif\n#ifdef USE_CLEARCOAT\n\tmaterial.clearcoat = clearcoat;\n\tmaterial.clearcoatRoughness = clearcoatRoughness;\n\tmaterial.clearcoatF0 = vec3( 0.04 );\n\tmaterial.clearcoatF90 = 1.0;\n\t#ifdef USE_CLEARCOATMAP\n\t\tmaterial.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;\n\t#endif\n\t#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\t\tmaterial.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;\n\t#endif\n\tmaterial.clearcoat = saturate( material.clearcoat );\tmaterial.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );\n\tmaterial.clearcoatRoughness += geometryRoughness;\n\tmaterial.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );\n#endif\n#ifdef USE_DISPERSION\n\tmaterial.dispersion = dispersion;\n#endif\n#ifdef USE_IRIDESCENCE\n\tmaterial.iridescence = iridescence;\n\tmaterial.iridescenceIOR = iridescenceIOR;\n\t#ifdef USE_IRIDESCENCEMAP\n\t\tmaterial.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;\n\t#endif\n\t#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\t\tmaterial.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;\n\t#else\n\t\tmaterial.iridescenceThickness = iridescenceThicknessMaximum;\n\t#endif\n#endif\n#ifdef USE_SHEEN\n\tmaterial.sheenColor = sheenColor;\n\t#ifdef USE_SHEEN_COLORMAP\n\t\tmaterial.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;\n\t#endif\n\tmaterial.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );\n\t#ifdef USE_SHEEN_ROUGHNESSMAP\n\t\tmaterial.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;\n\t#endif\n#endif\n#ifdef USE_ANISOTROPY\n\t#ifdef USE_ANISOTROPYMAP\n\t\tmat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );\n\t\tvec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;\n\t\tvec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;\n\t#else\n\t\tvec2 anisotropyV = anisotropyVector;\n\t#endif\n\tmaterial.anisotropy = length( anisotropyV );\n\tif( material.anisotropy == 0.0 ) {\n\t\tanisotropyV = vec2( 1.0, 0.0 );\n\t} else {\n\t\tanisotropyV /= material.anisotropy;\n\t\tmaterial.anisotropy = saturate( material.anisotropy );\n\t}\n\tmaterial.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );\n\tmaterial.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;\n\tmaterial.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;\n#endif";

var lights_physical_pars_fragment = "struct PhysicalMaterial {\n\tvec3 diffuseColor;\n\tfloat roughness;\n\tvec3 specularColor;\n\tfloat specularF90;\n\tfloat dispersion;\n\t#ifdef USE_CLEARCOAT\n\t\tfloat clearcoat;\n\t\tfloat clearcoatRoughness;\n\t\tvec3 clearcoatF0;\n\t\tfloat clearcoatF90;\n\t#endif\n\t#ifdef USE_IRIDESCENCE\n\t\tfloat iridescence;\n\t\tfloat iridescenceIOR;\n\t\tfloat iridescenceThickness;\n\t\tvec3 iridescenceFresnel;\n\t\tvec3 iridescenceF0;\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tvec3 sheenColor;\n\t\tfloat sheenRoughness;\n\t#endif\n\t#ifdef IOR\n\t\tfloat ior;\n\t#endif\n\t#ifdef USE_TRANSMISSION\n\t\tfloat transmission;\n\t\tfloat transmissionAlpha;\n\t\tfloat thickness;\n\t\tfloat attenuationDistance;\n\t\tvec3 attenuationColor;\n\t#endif\n\t#ifdef USE_ANISOTROPY\n\t\tfloat anisotropy;\n\t\tfloat alphaT;\n\t\tvec3 anisotropyT;\n\t\tvec3 anisotropyB;\n\t#endif\n};\nvec3 clearcoatSpecularDirect = vec3( 0.0 );\nvec3 clearcoatSpecularIndirect = vec3( 0.0 );\nvec3 sheenSpecularDirect = vec3( 0.0 );\nvec3 sheenSpecularIndirect = vec3(0.0 );\nvec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {\n    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );\n    float x2 = x * x;\n    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );\n    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );\n}\nfloat V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\tfloat gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\treturn 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n\tfloat a2 = pow2( alpha );\n\tfloat denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n\treturn RECIPROCAL_PI * a2 / pow2( denom );\n}\n#ifdef USE_ANISOTROPY\n\tfloat V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {\n\t\tfloat gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );\n\t\tfloat gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );\n\t\tfloat v = 0.5 / ( gv + gl );\n\t\treturn saturate(v);\n\t}\n\tfloat D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {\n\t\tfloat a2 = alphaT * alphaB;\n\t\thighp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );\n\t\thighp float v2 = dot( v, v );\n\t\tfloat w2 = a2 / v2;\n\t\treturn RECIPROCAL_PI * a2 * pow2 ( w2 );\n\t}\n#endif\n#ifdef USE_CLEARCOAT\n\tvec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {\n\t\tvec3 f0 = material.clearcoatF0;\n\t\tfloat f90 = material.clearcoatF90;\n\t\tfloat roughness = material.clearcoatRoughness;\n\t\tfloat alpha = pow2( roughness );\n\t\tvec3 halfDir = normalize( lightDir + viewDir );\n\t\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\t\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\t\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\t\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\t\tvec3 F = F_Schlick( f0, f90, dotVH );\n\t\tfloat V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\t\tfloat D = D_GGX( alpha, dotNH );\n\t\treturn F * ( V * D );\n\t}\n#endif\nvec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {\n\tvec3 f0 = material.specularColor;\n\tfloat f90 = material.specularF90;\n\tfloat roughness = material.roughness;\n\tfloat alpha = pow2( roughness );\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat dotVH = saturate( dot( viewDir, halfDir ) );\n\tvec3 F = F_Schlick( f0, f90, dotVH );\n\t#ifdef USE_IRIDESCENCE\n\t\tF = mix( F, material.iridescenceFresnel, material.iridescence );\n\t#endif\n\t#ifdef USE_ANISOTROPY\n\t\tfloat dotTL = dot( material.anisotropyT, lightDir );\n\t\tfloat dotTV = dot( material.anisotropyT, viewDir );\n\t\tfloat dotTH = dot( material.anisotropyT, halfDir );\n\t\tfloat dotBL = dot( material.anisotropyB, lightDir );\n\t\tfloat dotBV = dot( material.anisotropyB, viewDir );\n\t\tfloat dotBH = dot( material.anisotropyB, halfDir );\n\t\tfloat V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );\n\t\tfloat D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );\n\t#else\n\t\tfloat V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\t\tfloat D = D_GGX( alpha, dotNH );\n\t#endif\n\treturn F * ( V * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n\tconst float LUT_SIZE = 64.0;\n\tconst float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n\tconst float LUT_BIAS = 0.5 / LUT_SIZE;\n\tfloat dotNV = saturate( dot( N, V ) );\n\tvec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n\tuv = uv * LUT_SCALE + LUT_BIAS;\n\treturn uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n\tfloat l = length( f );\n\treturn max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n\tfloat x = dot( v1, v2 );\n\tfloat y = abs( x );\n\tfloat a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n\tfloat b = 3.4175940 + ( 4.1616724 + y ) * y;\n\tfloat v = a / b;\n\tfloat theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n\treturn cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n\tvec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n\tvec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n\tvec3 lightNormal = cross( v1, v2 );\n\tif( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n\tvec3 T1, T2;\n\tT1 = normalize( V - N * dot( V, N ) );\n\tT2 = - cross( N, T1 );\n\tmat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );\n\tvec3 coords[ 4 ];\n\tcoords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n\tcoords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n\tcoords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n\tcoords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n\tcoords[ 0 ] = normalize( coords[ 0 ] );\n\tcoords[ 1 ] = normalize( coords[ 1 ] );\n\tcoords[ 2 ] = normalize( coords[ 2 ] );\n\tcoords[ 3 ] = normalize( coords[ 3 ] );\n\tvec3 vectorFormFactor = vec3( 0.0 );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n\tfloat result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n\treturn vec3( result );\n}\n#if defined( USE_SHEEN )\nfloat D_Charlie( float roughness, float dotNH ) {\n\tfloat alpha = pow2( roughness );\n\tfloat invAlpha = 1.0 / alpha;\n\tfloat cos2h = dotNH * dotNH;\n\tfloat sin2h = max( 1.0 - cos2h, 0.0078125 );\n\treturn ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );\n}\nfloat V_Neubelt( float dotNV, float dotNL ) {\n\treturn saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );\n}\nvec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {\n\tvec3 halfDir = normalize( lightDir + viewDir );\n\tfloat dotNL = saturate( dot( normal, lightDir ) );\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat dotNH = saturate( dot( normal, halfDir ) );\n\tfloat D = D_Charlie( sheenRoughness, dotNH );\n\tfloat V = V_Neubelt( dotNV, dotNL );\n\treturn sheenColor * ( D * V );\n}\n#endif\nfloat IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tfloat r2 = roughness * roughness;\n\tfloat a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;\n\tfloat b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;\n\tfloat DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );\n\treturn saturate( DG * RECIPROCAL_PI );\n}\nvec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n\tfloat dotNV = saturate( dot( normal, viewDir ) );\n\tconst vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );\n\tconst vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );\n\tvec4 r = roughness * c0 + c1;\n\tfloat a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;\n\tvec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;\n\treturn fab;\n}\nvec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {\n\tvec2 fab = DFGApprox( normal, viewDir, roughness );\n\treturn specularColor * fab.x + specularF90 * fab.y;\n}\n#ifdef USE_IRIDESCENCE\nvoid computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#else\nvoid computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#endif\n\tvec2 fab = DFGApprox( normal, viewDir, roughness );\n\t#ifdef USE_IRIDESCENCE\n\t\tvec3 Fr = mix( specularColor, iridescenceF0, iridescence );\n\t#else\n\t\tvec3 Fr = specularColor;\n\t#endif\n\tvec3 FssEss = Fr * fab.x + specularF90 * fab.y;\n\tfloat Ess = fab.x + fab.y;\n\tfloat Ems = 1.0 - Ess;\n\tvec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;\tvec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n\tsingleScatter += FssEss;\n\tmultiScatter += Fms * Ems;\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n\tvoid RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\t\tvec3 normal = geometryNormal;\n\t\tvec3 viewDir = geometryViewDir;\n\t\tvec3 position = geometryPosition;\n\t\tvec3 lightPos = rectAreaLight.position;\n\t\tvec3 halfWidth = rectAreaLight.halfWidth;\n\t\tvec3 halfHeight = rectAreaLight.halfHeight;\n\t\tvec3 lightColor = rectAreaLight.color;\n\t\tfloat roughness = material.roughness;\n\t\tvec3 rectCoords[ 4 ];\n\t\trectCoords[ 0 ] = lightPos + halfWidth - halfHeight;\t\trectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n\t\trectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n\t\trectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n\t\tvec2 uv = LTC_Uv( normal, viewDir, roughness );\n\t\tvec4 t1 = texture2D( ltc_1, uv );\n\t\tvec4 t2 = texture2D( ltc_2, uv );\n\t\tmat3 mInv = mat3(\n\t\t\tvec3( t1.x, 0, t1.y ),\n\t\t\tvec3(    0, 1,    0 ),\n\t\t\tvec3( t1.z, 0, t1.w )\n\t\t);\n\t\tvec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );\n\t\treflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n\t\treflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n\t}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\t#ifdef USE_CLEARCOAT\n\t\tfloat dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );\n\t\tvec3 ccIrradiance = dotNLcc * directLight.color;\n\t\tclearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tsheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );\n\t#endif\n\treflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n\treflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n\t#ifdef USE_CLEARCOAT\n\t\tclearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );\n\t#endif\n\t#ifdef USE_SHEEN\n\t\tsheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n\t#endif\n\tvec3 singleScattering = vec3( 0.0 );\n\tvec3 multiScattering = vec3( 0.0 );\n\tvec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n\t#ifdef USE_IRIDESCENCE\n\t\tcomputeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );\n\t#else\n\t\tcomputeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );\n\t#endif\n\tvec3 totalScattering = singleScattering + multiScattering;\n\tvec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );\n\treflectedLight.indirectSpecular += radiance * singleScattering;\n\treflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;\n\treflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;\n}\n#define RE_Direct\t\t\t\tRE_Direct_Physical\n#define RE_Direct_RectArea\t\tRE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular\t\tRE_IndirectSpecular_Physical\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n\treturn saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}";

var lights_fragment_begin = "\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n\tgeometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n\tfloat dotNVi = saturate( dot( normal, geometryViewDir ) );\n\tif ( material.iridescenceThickness == 0.0 ) {\n\t\tmaterial.iridescence = 0.0;\n\t} else {\n\t\tmaterial.iridescence = saturate( material.iridescence );\n\t}\n\tif ( material.iridescence > 0.0 ) {\n\t\tmaterial.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n\t\tmaterial.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );\n\t}\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\tPointLight pointLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n\tPointLightShadow pointLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tgetPointLightInfo( pointLight, geometryPosition, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )\n\t\tpointLightShadow = pointLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\tSpotLight spotLight;\n\tvec4 spotColor;\n\tvec3 spotLightCoord;\n\tbool inSpotLightMap;\n\t#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n\tSpotLightShadow spotLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tgetSpotLightInfo( spotLight, geometryPosition, directLight );\n\t\t#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n\t\t#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\t#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n\t\t#else\n\t\t#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n\t\t#endif\n\t\t#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n\t\t\tspotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n\t\t\tinSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n\t\t\tspotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n\t\t\tdirectLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n\t\t#endif\n\t\t#undef SPOT_LIGHT_MAP_INDEX\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\tspotLightShadow = spotLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\tDirectionalLight directionalLight;\n\t#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n\tDirectionalLightShadow directionalLightShadow;\n\t#endif\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tgetDirectionalLightInfo( directionalLight, directLight );\n\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n\t\tdirectionalLightShadow = directionalLightShadows[ i ];\n\t\tdirectLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\tRectAreaLight rectAreaLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\t\trectAreaLight = rectAreaLights[ i ];\n\t\tRE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n\tvec3 iblIrradiance = vec3( 0.0 );\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\t#if defined( USE_LIGHT_PROBES )\n\t\tirradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n\t#endif\n\t#if ( NUM_HEMI_LIGHTS > 0 )\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n#endif\n#if defined( RE_IndirectSpecular )\n\tvec3 radiance = vec3( 0.0 );\n\tvec3 clearcoatRadiance = vec3( 0.0 );\n#endif";

var lights_fragment_maps = "#if defined( RE_IndirectDiffuse )\n\t#ifdef USE_LIGHTMAP\n\t\tvec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n\t\tvec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;\n\t\tirradiance += lightMapIrradiance;\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )\n\t\tiblIrradiance += getIBLIrradiance( geometryNormal );\n\t#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n\t#ifdef USE_ANISOTROPY\n\t\tradiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n\t#else\n\t\tradiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );\n\t#endif\n\t#ifdef USE_CLEARCOAT\n\t\tclearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );\n\t#endif\n#endif";

var lights_fragment_end = "#if defined( RE_IndirectDiffuse )\n\tRE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n\tRE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif";

var logdepthbuf_fragment = "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n\tgl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif";

var logdepthbuf_pars_fragment = "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n\tuniform float logDepthBufFC;\n\tvarying float vFragDepth;\n\tvarying float vIsPerspective;\n#endif";

var logdepthbuf_pars_vertex = "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n\tvarying float vFragDepth;\n\tvarying float vIsPerspective;\n#endif";

var logdepthbuf_vertex = "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n\tvFragDepth = 1.0 + gl_Position.w;\n\tvIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );\n#endif";

var map_fragment = "#ifdef USE_MAP\n\tvec4 sampledDiffuseColor = texture2D( map, vMapUv );\n\t#ifdef DECODE_VIDEO_TEXTURE\n\t\tsampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n\t#endif\n\tdiffuseColor *= sampledDiffuseColor;\n#endif";

var map_pars_fragment = "#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif";

var map_particle_fragment = "#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n\t#if defined( USE_POINTS_UV )\n\t\tvec2 uv = vUv;\n\t#else\n\t\tvec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n\t#endif\n#endif\n#ifdef USE_MAP\n\tdiffuseColor *= texture2D( map, uv );\n#endif\n#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, uv ).g;\n#endif";

var map_particle_pars_fragment = "#if defined( USE_POINTS_UV )\n\tvarying vec2 vUv;\n#else\n\t#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n\t\tuniform mat3 uvTransform;\n\t#endif\n#endif\n#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif\n#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif";

var metalnessmap_fragment = "float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n\tvec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );\n\tmetalnessFactor *= texelMetalness.b;\n#endif";

var metalnessmap_pars_fragment = "#ifdef USE_METALNESSMAP\n\tuniform sampler2D metalnessMap;\n#endif";

var morphinstance_vertex = "#ifdef USE_INSTANCING_MORPH\n\tfloat morphTargetInfluences[ MORPHTARGETS_COUNT ];\n\tfloat morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tmorphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;\n\t}\n#endif";

var morphcolor_vertex = "#if defined( USE_MORPHCOLORS )\n\tvColor *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\t#if defined( USE_COLOR_ALPHA )\n\t\t\tif ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];\n\t\t#elif defined( USE_COLOR )\n\t\t\tif ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];\n\t\t#endif\n\t}\n#endif";

var morphnormal_vertex = "#ifdef USE_MORPHNORMALS\n\tobjectNormal *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tif ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];\n\t}\n#endif";

var morphtarget_pars_vertex = "#ifdef USE_MORPHTARGETS\n\t#ifndef USE_INSTANCING_MORPH\n\t\tuniform float morphTargetBaseInfluence;\n\t\tuniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n\t#endif\n\tuniform sampler2DArray morphTargetsTexture;\n\tuniform ivec2 morphTargetsTextureSize;\n\tvec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {\n\t\tint texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;\n\t\tint y = texelIndex / morphTargetsTextureSize.x;\n\t\tint x = texelIndex - y * morphTargetsTextureSize.x;\n\t\tivec3 morphUV = ivec3( x, y, morphTargetIndex );\n\t\treturn texelFetch( morphTargetsTexture, morphUV, 0 );\n\t}\n#endif";

var morphtarget_vertex = "#ifdef USE_MORPHTARGETS\n\ttransformed *= morphTargetBaseInfluence;\n\tfor ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n\t\tif ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];\n\t}\n#endif";

var normal_fragment_begin = "float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n#ifdef FLAT_SHADED\n\tvec3 fdx = dFdx( vViewPosition );\n\tvec3 fdy = dFdy( vViewPosition );\n\tvec3 normal = normalize( cross( fdx, fdy ) );\n#else\n\tvec3 normal = normalize( vNormal );\n\t#ifdef DOUBLE_SIDED\n\t\tnormal *= faceDirection;\n\t#endif\n#endif\n#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )\n\t#ifdef USE_TANGENT\n\t\tmat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\t#else\n\t\tmat3 tbn = getTangentFrame( - vViewPosition, normal,\n\t\t#if defined( USE_NORMALMAP )\n\t\t\tvNormalMapUv\n\t\t#elif defined( USE_CLEARCOAT_NORMALMAP )\n\t\t\tvClearcoatNormalMapUv\n\t\t#else\n\t\t\tvUv\n\t\t#endif\n\t\t);\n\t#endif\n\t#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\t\ttbn[0] *= faceDirection;\n\t\ttbn[1] *= faceDirection;\n\t#endif\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\t#ifdef USE_TANGENT\n\t\tmat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\t#else\n\t\tmat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n\t#endif\n\t#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\t\ttbn2[0] *= faceDirection;\n\t\ttbn2[1] *= faceDirection;\n\t#endif\n#endif\nvec3 nonPerturbedNormal = normal;";

var normal_fragment_maps = "#ifdef USE_NORMALMAP_OBJECTSPACE\n\tnormal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n\t#ifdef FLIP_SIDED\n\t\tnormal = - normal;\n\t#endif\n\t#ifdef DOUBLE_SIDED\n\t\tnormal = normal * faceDirection;\n\t#endif\n\tnormal = normalize( normalMatrix * normal );\n#elif defined( USE_NORMALMAP_TANGENTSPACE )\n\tvec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n\tmapN.xy *= normalScale;\n\tnormal = normalize( tbn * mapN );\n#elif defined( USE_BUMPMAP )\n\tnormal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif";

var normal_pars_fragment = "#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif";

var normal_pars_vertex = "#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif";

var normal_vertex = "#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n\t#ifdef USE_TANGENT\n\t\tvTangent = normalize( transformedTangent );\n\t\tvBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n\t#endif\n#endif";

var normalmap_pars_fragment = "#ifdef USE_NORMALMAP\n\tuniform sampler2D normalMap;\n\tuniform vec2 normalScale;\n#endif\n#ifdef USE_NORMALMAP_OBJECTSPACE\n\tuniform mat3 normalMatrix;\n#endif\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )\n\tmat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n\t\tvec3 q0 = dFdx( eye_pos.xyz );\n\t\tvec3 q1 = dFdy( eye_pos.xyz );\n\t\tvec2 st0 = dFdx( uv.st );\n\t\tvec2 st1 = dFdy( uv.st );\n\t\tvec3 N = surf_norm;\n\t\tvec3 q1perp = cross( q1, N );\n\t\tvec3 q0perp = cross( N, q0 );\n\t\tvec3 T = q1perp * st0.x + q0perp * st1.x;\n\t\tvec3 B = q1perp * st0.y + q0perp * st1.y;\n\t\tfloat det = max( dot( T, T ), dot( B, B ) );\n\t\tfloat scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n\t\treturn mat3( T * scale, B * scale, N );\n\t}\n#endif";

var clearcoat_normal_fragment_begin = "#ifdef USE_CLEARCOAT\n\tvec3 clearcoatNormal = nonPerturbedNormal;\n#endif";

var clearcoat_normal_fragment_maps = "#ifdef USE_CLEARCOAT_NORMALMAP\n\tvec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;\n\tclearcoatMapN.xy *= clearcoatNormalScale;\n\tclearcoatNormal = normalize( tbn2 * clearcoatMapN );\n#endif";

var clearcoat_pars_fragment = "#ifdef USE_CLEARCOATMAP\n\tuniform sampler2D clearcoatMap;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tuniform sampler2D clearcoatNormalMap;\n\tuniform vec2 clearcoatNormalScale;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tuniform sampler2D clearcoatRoughnessMap;\n#endif";

var iridescence_pars_fragment = "#ifdef USE_IRIDESCENCEMAP\n\tuniform sampler2D iridescenceMap;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tuniform sampler2D iridescenceThicknessMap;\n#endif";

var opaque_fragment = "#ifdef OPAQUE\ndiffuseColor.a = 1.0;\n#endif\n#ifdef USE_TRANSMISSION\ndiffuseColor.a *= material.transmissionAlpha;\n#endif\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );";

var packing = "vec3 packNormalToRGB( const in vec3 normal ) {\n\treturn normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n\treturn 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;\nconst float Inv255 = 1. / 255.;\nconst vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );\nconst vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );\nconst vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );\nconst vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );\nvec4 packDepthToRGBA( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec4( 0., 0., 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec4( 1., 1., 1., 1. );\n\tfloat vuf;\n\tfloat af = modf( v * PackFactors.a, vuf );\n\tfloat bf = modf( vuf * ShiftRight8, vuf );\n\tfloat gf = modf( vuf * ShiftRight8, vuf );\n\treturn vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );\n}\nvec3 packDepthToRGB( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec3( 0., 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec3( 1., 1., 1. );\n\tfloat vuf;\n\tfloat bf = modf( v * PackFactors.b, vuf );\n\tfloat gf = modf( vuf * ShiftRight8, vuf );\n\treturn vec3( vuf * Inv255, gf * PackUpscale, bf );\n}\nvec2 packDepthToRG( const in float v ) {\n\tif( v <= 0.0 )\n\t\treturn vec2( 0., 0. );\n\tif( v >= 1.0 )\n\t\treturn vec2( 1., 1. );\n\tfloat vuf;\n\tfloat gf = modf( v * 256., vuf );\n\treturn vec2( vuf * Inv255, gf );\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n\treturn dot( v, UnpackFactors4 );\n}\nfloat unpackRGBToDepth( const in vec3 v ) {\n\treturn dot( v, UnpackFactors3 );\n}\nfloat unpackRGToDepth( const in vec2 v ) {\n\treturn v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;\n}\nvec4 pack2HalfToRGBA( const in vec2 v ) {\n\tvec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );\n\treturn vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );\n}\nvec2 unpackRGBATo2Half( const in vec4 v ) {\n\treturn vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {\n\treturn depth * ( near - far ) - near;\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {\n\treturn ( near * far ) / ( ( far - near ) * depth - far );\n}";

var premultiplied_alpha_fragment = "#ifdef PREMULTIPLIED_ALPHA\n\tgl_FragColor.rgb *= gl_FragColor.a;\n#endif";

var project_vertex = "vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n\tmvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n\tmvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;";

var dithering_fragment = "#ifdef DITHERING\n\tgl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif";

var dithering_pars_fragment = "#ifdef DITHERING\n\tvec3 dithering( vec3 color ) {\n\t\tfloat grid_position = rand( gl_FragCoord.xy );\n\t\tvec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n\t\tdither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n\t\treturn color + dither_shift_RGB;\n\t}\n#endif";

var roughnessmap_fragment = "float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n\tvec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n\troughnessFactor *= texelRoughness.g;\n#endif";

var roughnessmap_pars_fragment = "#ifdef USE_ROUGHNESSMAP\n\tuniform sampler2D roughnessMap;\n#endif";

var shadowmap_pars_fragment = "#if NUM_SPOT_LIGHT_COORDS > 0\n\tvarying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#if NUM_SPOT_LIGHT_MAPS > 0\n\tuniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];\n#endif\n#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tstruct DirectionalLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n\t\tstruct SpotLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\tuniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tstruct PointLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t\tfloat shadowCameraNear;\n\t\t\tfloat shadowCameraFar;\n\t\t};\n\t\tuniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n\t#endif\n\tfloat texture2DCompare( sampler2D depths, vec2 uv, float compare ) {\n\t\tfloat depth = unpackRGBAToDepth( texture2D( depths, uv ) );\n\t\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\t\treturn step( depth, compare );\n\t\t#else\n\t\t\treturn step( compare, depth );\n\t\t#endif\n\t}\n\tvec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {\n\t\treturn unpackRGBATo2Half( texture2D( shadow, uv ) );\n\t}\n\tfloat VSMShadow( sampler2D shadow, vec2 uv, float compare ) {\n\t\tfloat occlusion = 1.0;\n\t\tvec2 distribution = texture2DDistribution( shadow, uv );\n\t\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\t\tfloat hard_shadow = step( distribution.x, compare );\n\t\t#else\n\t\t\tfloat hard_shadow = step( compare, distribution.x );\n\t\t#endif\n\t\tif ( hard_shadow != 1.0 ) {\n\t\t\tfloat distance = compare - distribution.x;\n\t\t\tfloat variance = max( 0.00000, distribution.y * distribution.y );\n\t\t\tfloat softness_probability = variance / (variance + distance * distance );\t\t\tsoftness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );\t\t\tocclusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );\n\t\t}\n\t\treturn occlusion;\n\t}\n\tfloat getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n\t\tfloat shadow = 1.0;\n\t\tshadowCoord.xyz /= shadowCoord.w;\n\t\tshadowCoord.z += shadowBias;\n\t\tbool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n\t\tbool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n\t\tif ( frustumTest ) {\n\t\t#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\tfloat dx2 = dx0 / 2.0;\n\t\t\tfloat dy2 = dy0 / 2.0;\n\t\t\tfloat dx3 = dx1 / 2.0;\n\t\t\tfloat dy3 = dy1 / 2.0;\n\t\t\tshadow = (\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 17.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx = texelSize.x;\n\t\t\tfloat dy = texelSize.y;\n\t\t\tvec2 uv = shadowCoord.xy;\n\t\t\tvec2 f = fract( uv * shadowMapSize + 0.5 );\n\t\t\tuv -= f * texelSize;\n\t\t\tshadow = (\n\t\t\t\ttexture2DCompare( shadowMap, uv, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),\n\t\t\t\t\t f.x ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),\n\t\t\t\t\t f.x ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t f.y ) +\n\t\t\t\tmix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t f.y ) +\n\t\t\t\tmix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t\t  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),\n\t\t\t\t\t\t  f.x ),\n\t\t\t\t\t mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t\t  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),\n\t\t\t\t\t\t  f.x ),\n\t\t\t\t\t f.y )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_VSM )\n\t\t\tshadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#else\n\t\t\tshadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#endif\n\t\t}\n\t\treturn mix( 1.0, shadow, shadowIntensity );\n\t}\n\tvec2 cubeToUV( vec3 v, float texelSizeY ) {\n\t\tvec3 absV = abs( v );\n\t\tfloat scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );\n\t\tabsV *= scaleToCube;\n\t\tv *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );\n\t\tvec2 planar = v.xy;\n\t\tfloat almostATexel = 1.5 * texelSizeY;\n\t\tfloat almostOne = 1.0 - almostATexel;\n\t\tif ( absV.z >= almostOne ) {\n\t\t\tif ( v.z > 0.0 )\n\t\t\t\tplanar.x = 4.0 - v.x;\n\t\t} else if ( absV.x >= almostOne ) {\n\t\t\tfloat signX = sign( v.x );\n\t\t\tplanar.x = v.z * signX + 2.0 * signX;\n\t\t} else if ( absV.y >= almostOne ) {\n\t\t\tfloat signY = sign( v.y );\n\t\t\tplanar.x = v.x + 2.0 * signY + 2.0;\n\t\t\tplanar.y = v.z * signY - 2.0;\n\t\t}\n\t\treturn vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );\n\t}\n\tfloat getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n\t\tfloat shadow = 1.0;\n\t\tvec3 lightToPosition = shadowCoord.xyz;\n\t\t\n\t\tfloat lightToPositionLength = length( lightToPosition );\n\t\tif ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {\n\t\t\tfloat dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );\t\t\tdp += shadowBias;\n\t\t\tvec3 bd3D = normalize( lightToPosition );\n\t\t\tvec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );\n\t\t\t#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )\n\t\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;\n\t\t\t\tshadow = (\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +\n\t\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )\n\t\t\t\t) * ( 1.0 / 9.0 );\n\t\t\t#else\n\t\t\t\tshadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );\n\t\t\t#endif\n\t\t}\n\t\treturn mix( 1.0, shadow, shadowIntensity );\n\t}\n#endif";

var shadowmap_pars_vertex = "#if NUM_SPOT_LIGHT_COORDS > 0\n\tuniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];\n\tvarying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\tuniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n\t\tstruct DirectionalLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\t\tstruct SpotLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t};\n\t\tuniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\tuniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n\t\tstruct PointLightShadow {\n\t\t\tfloat shadowIntensity;\n\t\t\tfloat shadowBias;\n\t\t\tfloat shadowNormalBias;\n\t\t\tfloat shadowRadius;\n\t\t\tvec2 shadowMapSize;\n\t\t\tfloat shadowCameraNear;\n\t\t\tfloat shadowCameraFar;\n\t\t};\n\t\tuniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n\t#endif\n#endif";

var shadowmap_vertex = "#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )\n\tvec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\tvec4 shadowWorldPosition;\n#endif\n#if defined( USE_SHADOWMAP )\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n\t\t\tshadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );\n\t\t\tvDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\t\t#pragma unroll_loop_start\n\t\tfor ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n\t\t\tshadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );\n\t\t\tvPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;\n\t\t}\n\t\t#pragma unroll_loop_end\n\t#endif\n#endif\n#if NUM_SPOT_LIGHT_COORDS > 0\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {\n\t\tshadowWorldPosition = worldPosition;\n\t\t#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n\t\t\tshadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;\n\t\t#endif\n\t\tvSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;\n\t}\n\t#pragma unroll_loop_end\n#endif";

var shadowmask_pars_fragment = "float getShadowMask() {\n\tfloat shadow = 1.0;\n\t#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHT_SHADOWS > 0\n\tDirectionalLightShadow directionalLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n\t\tdirectionalLight = directionalLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_SPOT_LIGHT_SHADOWS > 0\n\tSpotLightShadow spotLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {\n\t\tspotLight = spotLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#if NUM_POINT_LIGHT_SHADOWS > 0\n\tPointLightShadow pointLight;\n\t#pragma unroll_loop_start\n\tfor ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n\t\tpointLight = pointLightShadows[ i ];\n\t\tshadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n\t}\n\t#pragma unroll_loop_end\n\t#endif\n\t#endif\n\treturn shadow;\n}";

var skinbase_vertex = "#ifdef USE_SKINNING\n\tmat4 boneMatX = getBoneMatrix( skinIndex.x );\n\tmat4 boneMatY = getBoneMatrix( skinIndex.y );\n\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );\n\tmat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif";

var skinning_pars_vertex = "#ifdef USE_SKINNING\n\tuniform mat4 bindMatrix;\n\tuniform mat4 bindMatrixInverse;\n\tuniform highp sampler2D boneTexture;\n\tmat4 getBoneMatrix( const in float i ) {\n\t\tint size = textureSize( boneTexture, 0 ).x;\n\t\tint j = int( i ) * 4;\n\t\tint x = j % size;\n\t\tint y = j / size;\n\t\tvec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );\n\t\tvec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );\n\t\tvec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );\n\t\tvec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );\n\t\treturn mat4( v1, v2, v3, v4 );\n\t}\n#endif";

var skinning_vertex = "#ifdef USE_SKINNING\n\tvec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n\tvec4 skinned = vec4( 0.0 );\n\tskinned += boneMatX * skinVertex * skinWeight.x;\n\tskinned += boneMatY * skinVertex * skinWeight.y;\n\tskinned += boneMatZ * skinVertex * skinWeight.z;\n\tskinned += boneMatW * skinVertex * skinWeight.w;\n\ttransformed = ( bindMatrixInverse * skinned ).xyz;\n#endif";

var skinnormal_vertex = "#ifdef USE_SKINNING\n\tmat4 skinMatrix = mat4( 0.0 );\n\tskinMatrix += skinWeight.x * boneMatX;\n\tskinMatrix += skinWeight.y * boneMatY;\n\tskinMatrix += skinWeight.z * boneMatZ;\n\tskinMatrix += skinWeight.w * boneMatW;\n\tskinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;\n\tobjectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n\t#ifdef USE_TANGENT\n\t\tobjectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;\n\t#endif\n#endif";

var specularmap_fragment = "float specularStrength;\n#ifdef USE_SPECULARMAP\n\tvec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );\n\tspecularStrength = texelSpecular.r;\n#else\n\tspecularStrength = 1.0;\n#endif";

var specularmap_pars_fragment = "#ifdef USE_SPECULARMAP\n\tuniform sampler2D specularMap;\n#endif";

var tonemapping_fragment = "#if defined( TONE_MAPPING )\n\tgl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif";

var tonemapping_pars_fragment = "#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nvec3 LinearToneMapping( vec3 color ) {\n\treturn saturate( toneMappingExposure * color );\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\treturn saturate( color / ( vec3( 1.0 ) + color ) );\n}\nvec3 CineonToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tcolor = max( vec3( 0.0 ), color - 0.004 );\n\treturn pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 RRTAndODTFit( vec3 v ) {\n\tvec3 a = v * ( v + 0.0245786 ) - 0.000090537;\n\tvec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;\n\treturn a / b;\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n\tconst mat3 ACESInputMat = mat3(\n\t\tvec3( 0.59719, 0.07600, 0.02840 ),\t\tvec3( 0.35458, 0.90834, 0.13383 ),\n\t\tvec3( 0.04823, 0.01566, 0.83777 )\n\t);\n\tconst mat3 ACESOutputMat = mat3(\n\t\tvec3(  1.60475, -0.10208, -0.00327 ),\t\tvec3( -0.53108,  1.10813, -0.07276 ),\n\t\tvec3( -0.07367, -0.00605,  1.07602 )\n\t);\n\tcolor *= toneMappingExposure / 0.6;\n\tcolor = ACESInputMat * color;\n\tcolor = RRTAndODTFit( color );\n\tcolor = ACESOutputMat * color;\n\treturn saturate( color );\n}\nconst mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(\n\tvec3( 1.6605, - 0.1246, - 0.0182 ),\n\tvec3( - 0.5876, 1.1329, - 0.1006 ),\n\tvec3( - 0.0728, - 0.0083, 1.1187 )\n);\nconst mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(\n\tvec3( 0.6274, 0.0691, 0.0164 ),\n\tvec3( 0.3293, 0.9195, 0.0880 ),\n\tvec3( 0.0433, 0.0113, 0.8956 )\n);\nvec3 agxDefaultContrastApprox( vec3 x ) {\n\tvec3 x2 = x * x;\n\tvec3 x4 = x2 * x2;\n\treturn + 15.5 * x4 * x2\n\t\t- 40.14 * x4 * x\n\t\t+ 31.96 * x4\n\t\t- 6.868 * x2 * x\n\t\t+ 0.4298 * x2\n\t\t+ 0.1191 * x\n\t\t- 0.00232;\n}\nvec3 AgXToneMapping( vec3 color ) {\n\tconst mat3 AgXInsetMatrix = mat3(\n\t\tvec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),\n\t\tvec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),\n\t\tvec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )\n\t);\n\tconst mat3 AgXOutsetMatrix = mat3(\n\t\tvec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),\n\t\tvec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),\n\t\tvec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )\n\t);\n\tconst float AgxMinEv = - 12.47393;\tconst float AgxMaxEv = 4.026069;\n\tcolor *= toneMappingExposure;\n\tcolor = LINEAR_SRGB_TO_LINEAR_REC2020 * color;\n\tcolor = AgXInsetMatrix * color;\n\tcolor = max( color, 1e-10 );\tcolor = log2( color );\n\tcolor = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );\n\tcolor = clamp( color, 0.0, 1.0 );\n\tcolor = agxDefaultContrastApprox( color );\n\tcolor = AgXOutsetMatrix * color;\n\tcolor = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );\n\tcolor = LINEAR_REC2020_TO_LINEAR_SRGB * color;\n\tcolor = clamp( color, 0.0, 1.0 );\n\treturn color;\n}\nvec3 NeutralToneMapping( vec3 color ) {\n\tconst float StartCompression = 0.8 - 0.04;\n\tconst float Desaturation = 0.15;\n\tcolor *= toneMappingExposure;\n\tfloat x = min( color.r, min( color.g, color.b ) );\n\tfloat offset = x < 0.08 ? x - 6.25 * x * x : 0.04;\n\tcolor -= offset;\n\tfloat peak = max( color.r, max( color.g, color.b ) );\n\tif ( peak < StartCompression ) return color;\n\tfloat d = 1. - StartCompression;\n\tfloat newPeak = 1. - d * d / ( peak + d - StartCompression );\n\tcolor *= newPeak / peak;\n\tfloat g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );\n\treturn mix( color, vec3( newPeak ), g );\n}\nvec3 CustomToneMapping( vec3 color ) { return color; }";

var transmission_fragment = "#ifdef USE_TRANSMISSION\n\tmaterial.transmission = transmission;\n\tmaterial.transmissionAlpha = 1.0;\n\tmaterial.thickness = thickness;\n\tmaterial.attenuationDistance = attenuationDistance;\n\tmaterial.attenuationColor = attenuationColor;\n\t#ifdef USE_TRANSMISSIONMAP\n\t\tmaterial.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;\n\t#endif\n\t#ifdef USE_THICKNESSMAP\n\t\tmaterial.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;\n\t#endif\n\tvec3 pos = vWorldPosition;\n\tvec3 v = normalize( cameraPosition - pos );\n\tvec3 n = inverseTransformDirection( normal, viewMatrix );\n\tvec4 transmitted = getIBLVolumeRefraction(\n\t\tn, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,\n\t\tpos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,\n\t\tmaterial.attenuationColor, material.attenuationDistance );\n\tmaterial.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );\n\ttotalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );\n#endif";

var transmission_pars_fragment = "#ifdef USE_TRANSMISSION\n\tuniform float transmission;\n\tuniform float thickness;\n\tuniform float attenuationDistance;\n\tuniform vec3 attenuationColor;\n\t#ifdef USE_TRANSMISSIONMAP\n\t\tuniform sampler2D transmissionMap;\n\t#endif\n\t#ifdef USE_THICKNESSMAP\n\t\tuniform sampler2D thicknessMap;\n\t#endif\n\tuniform vec2 transmissionSamplerSize;\n\tuniform sampler2D transmissionSamplerMap;\n\tuniform mat4 modelMatrix;\n\tuniform mat4 projectionMatrix;\n\tvarying vec3 vWorldPosition;\n\tfloat w0( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );\n\t}\n\tfloat w1( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );\n\t}\n\tfloat w2( float a ){\n\t\treturn ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );\n\t}\n\tfloat w3( float a ) {\n\t\treturn ( 1.0 / 6.0 ) * ( a * a * a );\n\t}\n\tfloat g0( float a ) {\n\t\treturn w0( a ) + w1( a );\n\t}\n\tfloat g1( float a ) {\n\t\treturn w2( a ) + w3( a );\n\t}\n\tfloat h0( float a ) {\n\t\treturn - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );\n\t}\n\tfloat h1( float a ) {\n\t\treturn 1.0 + w3( a ) / ( w2( a ) + w3( a ) );\n\t}\n\tvec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {\n\t\tuv = uv * texelSize.zw + 0.5;\n\t\tvec2 iuv = floor( uv );\n\t\tvec2 fuv = fract( uv );\n\t\tfloat g0x = g0( fuv.x );\n\t\tfloat g1x = g1( fuv.x );\n\t\tfloat h0x = h0( fuv.x );\n\t\tfloat h1x = h1( fuv.x );\n\t\tfloat h0y = h0( fuv.y );\n\t\tfloat h1y = h1( fuv.y );\n\t\tvec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n\t\tvec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n\t\treturn g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +\n\t\t\tg1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );\n\t}\n\tvec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {\n\t\tvec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );\n\t\tvec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );\n\t\tvec2 fLodSizeInv = 1.0 / fLodSize;\n\t\tvec2 cLodSizeInv = 1.0 / cLodSize;\n\t\tvec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );\n\t\tvec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );\n\t\treturn mix( fSample, cSample, fract( lod ) );\n\t}\n\tvec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {\n\t\tvec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );\n\t\tvec3 modelScale;\n\t\tmodelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );\n\t\tmodelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );\n\t\tmodelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );\n\t\treturn normalize( refractionVector ) * thickness * modelScale;\n\t}\n\tfloat applyIorToRoughness( const in float roughness, const in float ior ) {\n\t\treturn roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );\n\t}\n\tvec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {\n\t\tfloat lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );\n\t\treturn textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );\n\t}\n\tvec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {\n\t\tif ( isinf( attenuationDistance ) ) {\n\t\t\treturn vec3( 1.0 );\n\t\t} else {\n\t\t\tvec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;\n\t\t\tvec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );\t\t\treturn transmittance;\n\t\t}\n\t}\n\tvec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,\n\t\tconst in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,\n\t\tconst in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,\n\t\tconst in vec3 attenuationColor, const in float attenuationDistance ) {\n\t\tvec4 transmittedLight;\n\t\tvec3 transmittance;\n\t\t#ifdef USE_DISPERSION\n\t\t\tfloat halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;\n\t\t\tvec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );\n\t\t\tfor ( int i = 0; i < 3; i ++ ) {\n\t\t\t\tvec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );\n\t\t\t\tvec3 refractedRayExit = position + transmissionRay;\n\t\t\t\tvec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n\t\t\t\tvec2 refractionCoords = ndcPos.xy / ndcPos.w;\n\t\t\t\trefractionCoords += 1.0;\n\t\t\t\trefractionCoords /= 2.0;\n\t\t\t\tvec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );\n\t\t\t\ttransmittedLight[ i ] = transmissionSample[ i ];\n\t\t\t\ttransmittedLight.a += transmissionSample.a;\n\t\t\t\ttransmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];\n\t\t\t}\n\t\t\ttransmittedLight.a /= 3.0;\n\t\t#else\n\t\t\tvec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );\n\t\t\tvec3 refractedRayExit = position + transmissionRay;\n\t\t\tvec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n\t\t\tvec2 refractionCoords = ndcPos.xy / ndcPos.w;\n\t\t\trefractionCoords += 1.0;\n\t\t\trefractionCoords /= 2.0;\n\t\t\ttransmittedLight = getTransmissionSample( refractionCoords, roughness, ior );\n\t\t\ttransmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );\n\t\t#endif\n\t\tvec3 attenuatedColor = transmittance * transmittedLight.rgb;\n\t\tvec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );\n\t\tfloat transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;\n\t\treturn vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );\n\t}\n#endif";

var uv_pars_fragment = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvarying vec2 vUv;\n#endif\n#ifdef USE_MAP\n\tvarying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n\tvarying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n\tvarying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n\tvarying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n\tvarying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n\tvarying vec2 vNormalMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tvarying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n\tvarying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tvarying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tvarying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tvarying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tvarying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tvarying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tvarying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tvarying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tvarying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tvarying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n\tvarying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tvarying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tvarying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tuniform mat3 transmissionMapTransform;\n\tvarying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n\tuniform mat3 thicknessMapTransform;\n\tvarying vec2 vThicknessMapUv;\n#endif";

var uv_pars_vertex = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvarying vec2 vUv;\n#endif\n#ifdef USE_MAP\n\tuniform mat3 mapTransform;\n\tvarying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n\tuniform mat3 alphaMapTransform;\n\tvarying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n\tuniform mat3 lightMapTransform;\n\tvarying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n\tuniform mat3 aoMapTransform;\n\tvarying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n\tuniform mat3 bumpMapTransform;\n\tvarying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n\tuniform mat3 normalMapTransform;\n\tvarying vec2 vNormalMapUv;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n\tuniform mat3 displacementMapTransform;\n\tvarying vec2 vDisplacementMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tuniform mat3 emissiveMapTransform;\n\tvarying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n\tuniform mat3 metalnessMapTransform;\n\tvarying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tuniform mat3 roughnessMapTransform;\n\tvarying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tuniform mat3 anisotropyMapTransform;\n\tvarying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tuniform mat3 clearcoatMapTransform;\n\tvarying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tuniform mat3 clearcoatNormalMapTransform;\n\tvarying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tuniform mat3 clearcoatRoughnessMapTransform;\n\tvarying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tuniform mat3 sheenColorMapTransform;\n\tvarying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tuniform mat3 sheenRoughnessMapTransform;\n\tvarying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tuniform mat3 iridescenceMapTransform;\n\tvarying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tuniform mat3 iridescenceThicknessMapTransform;\n\tvarying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n\tuniform mat3 specularMapTransform;\n\tvarying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tuniform mat3 specularColorMapTransform;\n\tvarying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tuniform mat3 specularIntensityMapTransform;\n\tvarying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tuniform mat3 transmissionMapTransform;\n\tvarying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n\tuniform mat3 thicknessMapTransform;\n\tvarying vec2 vThicknessMapUv;\n#endif";

var uv_vertex = "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n\tvUv = vec3( uv, 1 ).xy;\n#endif\n#ifdef USE_MAP\n\tvMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ALPHAMAP\n\tvAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_LIGHTMAP\n\tvLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_AOMAP\n\tvAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_BUMPMAP\n\tvBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_NORMALMAP\n\tvNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n\tvDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_EMISSIVEMAP\n\tvEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_METALNESSMAP\n\tvMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ROUGHNESSMAP\n\tvRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ANISOTROPYMAP\n\tvAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOATMAP\n\tvClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n\tvClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n\tvClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n\tvIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n\tvIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n\tvSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n\tvSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULARMAP\n\tvSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n\tvSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n\tvSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n\tvTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_THICKNESSMAP\n\tvThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;\n#endif";

var worldpos_vertex = "#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\n\tvec4 worldPosition = vec4( transformed, 1.0 );\n\t#ifdef USE_BATCHING\n\t\tworldPosition = batchingMatrix * worldPosition;\n\t#endif\n\t#ifdef USE_INSTANCING\n\t\tworldPosition = instanceMatrix * worldPosition;\n\t#endif\n\tworldPosition = modelMatrix * worldPosition;\n#endif";

const vertex$h = "varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n\tvUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n\tgl_Position = vec4( position.xy, 1.0, 1.0 );\n}";

const fragment$h = "uniform sampler2D t2D;\nuniform float backgroundIntensity;\nvarying vec2 vUv;\nvoid main() {\n\tvec4 texColor = texture2D( t2D, vUv );\n\t#ifdef DECODE_VIDEO_TEXTURE\n\t\ttexColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );\n\t#endif\n\ttexColor.rgb *= backgroundIntensity;\n\tgl_FragColor = texColor;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}";

const vertex$g = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\tgl_Position.z = gl_Position.w;\n}";

const fragment$g = "#ifdef ENVMAP_TYPE_CUBE\n\tuniform samplerCube envMap;\n#elif defined( ENVMAP_TYPE_CUBE_UV )\n\tuniform sampler2D envMap;\n#endif\nuniform float flipEnvMap;\nuniform float backgroundBlurriness;\nuniform float backgroundIntensity;\nuniform mat3 backgroundRotation;\nvarying vec3 vWorldDirection;\n#include <cube_uv_reflection_fragment>\nvoid main() {\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );\n\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\tvec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );\n\t#else\n\t\tvec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n\t#endif\n\ttexColor.rgb *= backgroundIntensity;\n\tgl_FragColor = texColor;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}";

const vertex$f = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\tgl_Position.z = gl_Position.w;\n}";

const fragment$f = "uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n\tvec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n\tgl_FragColor = texColor;\n\tgl_FragColor.a *= opacity;\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}";

const vertex$e = "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n\t#include <uv_vertex>\n\t#include <batching_vertex>\n\t#include <skinbase_vertex>\n\t#include <morphinstance_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvHighPrecisionZW = gl_Position.zw;\n}";

const fragment$e = "#if DEPTH_PACKING == 3200\n\tuniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#include <clipping_planes_fragment>\n\t#if DEPTH_PACKING == 3200\n\t\tdiffuseColor.a = opacity;\n\t#endif\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <logdepthbuf_fragment>\n\t#ifdef USE_REVERSED_DEPTH_BUFFER\n\t\tfloat fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];\n\t#else\n\t\tfloat fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;\n\t#endif\n\t#if DEPTH_PACKING == 3200\n\t\tgl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );\n\t#elif DEPTH_PACKING == 3201\n\t\tgl_FragColor = packDepthToRGBA( fragCoordZ );\n\t#elif DEPTH_PACKING == 3202\n\t\tgl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );\n\t#elif DEPTH_PACKING == 3203\n\t\tgl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );\n\t#endif\n}";

const vertex$d = "#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <batching_vertex>\n\t#include <skinbase_vertex>\n\t#include <morphinstance_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\tvWorldPosition = worldPosition.xyz;\n}";

const fragment$d = "#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main () {\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#include <clipping_planes_fragment>\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\tfloat dist = length( vWorldPosition - referencePosition );\n\tdist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n\tdist = saturate( dist );\n\tgl_FragColor = packDepthToRGBA( dist );\n}";

const vertex$c = "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n}";

const fragment$c = "uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvec3 direction = normalize( vWorldDirection );\n\tvec2 sampleUV = equirectUv( direction );\n\tgl_FragColor = texture2D( tEquirect, sampleUV );\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n}";

const vertex$b = "uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\tvLineDistance = scale * lineDistance;\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}";

const fragment$b = "uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\tif ( mod( vLineDistance, totalSize ) > dashSize ) {\n\t\tdiscard;\n\t}\n\tvec3 outgoingLight = vec3( 0.0 );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n}";

const vertex$a = "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinbase_vertex>\n\t\t#include <skinnormal_vertex>\n\t\t#include <defaultnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <fog_vertex>\n}";

const fragment$a = "uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <clipping_planes_fragment>\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <alphahash_fragment>\n\t#include <specularmap_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\t#ifdef USE_LIGHTMAP\n\t\tvec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n\t\treflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;\n\t#else\n\t\treflectedLight.indirectDiffuse += vec3( 1.0 );\n\t#endif\n\t#include <aomap_fragment>\n\treflectedLight.indirectDiffuse *= diffuseColor.rgb;\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\n\t#include <envmap_fragment>\n\t#include <opaque_fragment>\n\t#include <tonemapping_fragment>\n\t#include <colorspace_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}";

const vertex$9 = "#define LAMBERT\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <color_vertex>\n\t#include <morphinstance_vertex>\n\t#include <morphcolor_vertex>\n\t#include <batching_vertex>\n\t#include <beginnormal_vertex>\n\t#includm«ëŒ+Š×ž®º+º$zzb¥æRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÆVçfÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6†F÷vÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBC’Ò"6FVf–æRÄÔ$U%EÆçVæ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfV32VÖ—76—fSµÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÆF—F†W&–æu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆöÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡FÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVÖ—76—fVÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖö6öÖÖöå÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'6Fg3åÆâ6–æ6ÇVFRÆÆ–v‡G5÷'5ö&Vv–ãåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡G5öÆÖ&W'E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ7V7VÆ&Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇE&VfÆV7FVDÆ–v‡B&VfÆV7FVDÆ–v‡BÒ&VfÆV7FVDÆ–v‡B‚fV32‚ã’ÂfV32‚ã’ÂfV32‚ã’ÂfV32‚ã’“µÆåÇGfV32F÷FÄVÖ—76—fU&F–æ6RÒVÖ—76—fSµÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇB6–æ6ÇVFRÇ7V7VÆ&Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆVÖ—76—fVÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5öÆÖ&W'Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöVæCåÆåÇB6–æ6ÇVFRÆöÖög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒ&VfÆV7FVDÆ–v‡BæF—&V7DF–fgW6R²&VfÆV7FVDÆ–v‡Bæ–æF—&V7DF–fgW6R²F÷FÄVÖ—76—fU&F–æ6SµÆåÇB6–æ6ÇVFRÆVçfÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆåÇB6–æ6ÇVFRÆF—F†W&–æuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚C‚Ò"6FVf–æRÔD4Æçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆçÒ#° ¦6öç7Bg&vÖVçBC‚Ò"6FVf–æRÔD4ÆçVæ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfÆöB÷6—G“µÆçVæ–f÷&Ò6×ÆW#$BÖF6µÆçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆF—F†W&–æu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇGfV32f–WtF—"Òæ÷&ÖÆ—¦R‚ef–Wu÷6—F–öâ“µÆåÇGfV32‚Òæ÷&ÖÆ—¦R‚fV32‚f–WtF—"ç¢ÂãÂÒf–WtF—"ç‚’“µÆåÇGfV32’Ò7&÷72‚f–WtF—"Â‚“µÆåÇGfV3"WbÒfV3"‚F÷B‚‚Âæ÷&ÖÂ’ÂF÷B‚’Âæ÷&ÖÂ’’¢ãC“R²ãSµÆåÇB6–fFVbU4UôÔD4ÆåÇEÇGfV3BÖF66öÆ÷"ÒFW‡GW&S$B‚ÖF6ÂWb“µÆåÇB6VÇ6UÆåÇEÇGfV3BÖF66öÆ÷"ÒfV3B‚fV32‚Ö—‚‚ã"Âã‚ÂWbç’’’Âã“µÆåÇB6VæF–eÆåÇGfV32÷WFvö–ætÆ–v‡BÒF–fgW6T6öÆ÷"ç&v"¢ÖF66öÆ÷"ç&v#µÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆåÇB6–æ6ÇVFRÆF—F†W&–æuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚CrÒ"6FVf–æRäõ$ÔÅÆâ6–bFVf–æVB‚dÄEõ4„DTB’ÇÂFVf–æVB‚U4Uô%TÕÔ’ÇÂFVf–æVB‚U4Uôäõ$ÔÄÔõDätTåE54R•ÆåÇGf'––ærfV32ef–Wu÷6—F–öãµÆâ6VæF–eÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆâ6–bFVf–æVB‚dÄEõ4„DTB’ÇÂFVf–æVB‚U4Uô%TÕÔ’ÇÂFVf–æVB‚U4Uôäõ$ÔÄÔõDätTåE54R•ÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆâ6VæF–eÆçÒ#° ¦6öç7Bg&vÖVçBCrÒ"6FVf–æRäõ$ÔÅÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–bFVf–æVB‚dÄEõ4„DTB’ÇÂFVf–æVB‚U4Uô%TÕÔ’ÇÂFVf–æVB‚U4Uôäõ$ÔÄÔõDätTåE54R•ÆåÇGf'––ærfV32ef–Wu÷6—F–öãµÆâ6VæF–eÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚ãÂãÂãÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇFvÅôg&t6öÆ÷"ÒfV3B‚6´æ÷&ÖÅFõ$t"‚æ÷&ÖÂ’ÂF–fgW6T6öÆ÷"æ“µÆåÇB6–fFVbõTUÆåÇEÇFvÅôg&t6öÆ÷"æÒãµÆåÇB6VæF–eÆçÒ#° ¦6öç7BfW'FW‚CbÒ"6FVf–æR„ôäuÆçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆVçfÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÆVçfÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6†F÷vÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBCbÒ"6FVf–æR„ôäuÆçVæ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfV32VÖ—76—fSµÆçVæ–f÷&ÒfV327V7VÆ#µÆçVæ–f÷&ÒfÆöB6†–æ–æW73µÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÆF—F†W&–æu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆöÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡FÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVÖ—76—fVÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖö6öÖÖöå÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'6Fg3åÆâ6–æ6ÇVFRÆÆ–v‡G5÷'5ö&Vv–ãåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡G5÷†öæu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ7V7VÆ&Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇE&VfÆV7FVDÆ–v‡B&VfÆV7FVDÆ–v‡BÒ&VfÆV7FVDÆ–v‡B‚fV32‚ã’ÂfV32‚ã’ÂfV32‚ã’ÂfV32‚ã’“µÆåÇGfV32F÷FÄVÖ—76—fU&F–æ6RÒVÖ—76—fSµÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇB6–æ6ÇVFRÇ7V7VÆ&Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆVÖ—76—fVÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5÷†öæuög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöVæCåÆåÇB6–æ6ÇVFRÆöÖög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒ&VfÆV7FVDÆ–v‡BæF—&V7DF–fgW6R²&VfÆV7FVDÆ–v‡Bæ–æF—&V7DF–fgW6R²&VfÆV7FVDÆ–v‡BæF—&V7E7V7VÆ"²&VfÆV7FVDÆ–v‡Bæ–æF—&V7E7V7VÆ"²F÷FÄVÖ—76—fU&F–æ6SµÆåÇB6–æ6ÇVFRÆVçfÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆåÇB6–æ6ÇVFRÆF—F†W&–æuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚CRÒ"6FVf–æR5DäD$EÆçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–fFVbU4UõE$å4Ô•54”ôåÆåÇGf'––ærfV32ev÷&ÆE÷6—F–öãµÆâ6VæF–eÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6†F÷vÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆâ6–fFVbU4UõE$å4Ô•54”ôåÆåÇGev÷&ÆE÷6—F–öâÒv÷&ÆE÷6—F–öâç‡—£µÆâ6VæF–eÆçÒ#° ¦6öç7Bg&vÖVçBCRÒ"6FVf–æR5DäD$EÆâ6–fFVb…•4”4ÅÆåÇB6FVf–æR”õ%ÆåÇB6FVf–æRU4Uõ5T5TÄ%Æâ6VæF–eÆçVæ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfV32VÖ—76—fSµÆçVæ–f÷&ÒfÆöB&÷Vv†æW73µÆçVæ–f÷&ÒfÆöBÖWFÆæW73µÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–fFVb”õ%ÆåÇGVæ–f÷&ÒfÆöB–÷#µÆâ6VæF–eÆâ6–fFVbU4Uõ5T5TÄ%ÆåÇGVæ–f÷&ÒfÆöB7V7VÆ$–çFVç6—G“µÆåÇGVæ–f÷&ÒfV327V7VÆ$6öÆ÷#µÆåÇB6–fFVbU4Uõ5T5TÄ%ô4ôÄõ$ÔÆåÇEÇGVæ–f÷&Ò6×ÆW#$B7V7VÆ$6öÆ÷$ÖµÆåÇB6VæF–eÆåÇB6–fFVbU4Uõ5T5TÄ%ô”åDTå4•E”ÔÆåÇEÇGVæ–f÷&Ò6×ÆW#$B7V7VÆ$–çFVç6—G”ÖµÆåÇB6VæF–eÆâ6VæF–eÆâ6–fFVbU4Uô4ÄT$4ôEÆåÇGVæ–f÷&ÒfÆöB6ÆV&6öCµÆåÇGVæ–f÷&ÒfÆöB6ÆV&6öE&÷Vv†æW73µÆâ6VæF–eÆâ6–fFVbU4UôD•5U%4”ôåÆåÇGVæ–f÷&ÒfÆöBF—7W'6–öãµÆâ6VæF–eÆâ6–fFVbU4Uô•$”DU44Tä4UÆåÇGVæ–f÷&ÒfÆöB—&–FW66Væ6SµÆåÇGVæ–f÷&ÒfÆöB—&–FW66Væ6T”õ#µÆåÇGVæ–f÷&ÒfÆöB—&–FW66Væ6UF†–6¶æW74Ö–æ–×VÓµÆåÇGVæ–f÷&ÒfÆöB—&–FW66Væ6UF†–6¶æW74Ö†–×VÓµÆâ6VæF–eÆâ6–fFVbU4Uõ4„TTåÆåÇGVæ–f÷&ÒfV326†VVä6öÆ÷#µÆåÇGVæ–f÷&ÒfÆöB6†VVå&÷Vv†æW73µÆåÇB6–fFVbU4Uõ4„TTåô4ôÄõ$ÔÆåÇEÇGVæ–f÷&Ò6×ÆW#$B6†VVä6öÆ÷$ÖµÆåÇB6VæF–eÆåÇB6–fFVbU4Uõ4„TTåõ$õTt„äU54ÔÆåÇEÇGVæ–f÷&Ò6×ÆW#$B6†VVå&÷Vv†æW74ÖµÆåÇB6VæF–eÆâ6VæF–eÆâ6–fFVbU4Uôä•4õE$õ•ÆåÇGVæ–f÷&ÒfV3"æ—6÷G&÷•fV7F÷#µÆåÇB6–fFVbU4Uôä•4õE$õ”ÔÆåÇEÇGVæ–f÷&Ò6×ÆW#$Bæ—6÷G&÷”ÖµÆåÇB6VæF–eÆâ6VæF–eÆçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÆF—F†W&–æu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆöÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡FÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVÖ—76—fVÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ—&–FW66Væ6Uög&vÖVçCåÆâ6–æ6ÇVFRÆ7V&U÷We÷&VfÆV7F–öåög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖö6öÖÖöå÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVçfÖ÷‡—6–6Å÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡G5÷'5ö&Vv–ãåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡G5÷‡—6–6Å÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇG&ç6Ö—76–öå÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6ÆV&6öE÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ—&–FW66Væ6U÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ&÷Vv†æW76Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖWFÆæW76Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇE&VfÆV7FVDÆ–v‡B&VfÆV7FVDÆ–v‡BÒ&VfÆV7FVDÆ–v‡B‚fV32‚ã’ÂfV32‚ã’ÂfV32‚ã’ÂfV32‚ã’“µÆåÇGfV32F÷FÄVÖ—76—fU&F–æ6RÒVÖ—76—fSµÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&÷Vv†æW76Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖWFÆæW76Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆ6ÆV&6öEöæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆ6ÆV&6öEöæ÷&ÖÅög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆVÖ—76—fVÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5÷‡—6–6Åög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöVæCåÆåÇB6–æ6ÇVFRÆöÖög&vÖVçCåÆåÇGfV32F÷FÄF–fgW6RÒ&VfÆV7FVDÆ–v‡BæF—&V7DF–fgW6R²&VfÆV7FVDÆ–v‡Bæ–æF—&V7DF–fgW6SµÆåÇGfV32F÷FÅ7V7VÆ"Ò&VfÆV7FVDÆ–v‡BæF—&V7E7V7VÆ"²&VfÆV7FVDÆ–v‡Bæ–æF—&V7E7V7VÆ#µÆåÇB6–æ6ÇVFRÇG&ç6Ö—76–öåög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒF÷FÄF–fgW6R²F÷FÅ7V7VÆ"²F÷FÄVÖ—76—fU&F–æ6SµÆåÇB6–fFVbU4Uõ4„TTåÆåÇEÇFfÆöB6†VVäVæW&w”6ö×ÒãÒãSr¢Öƒ2‚ÖFW&–Âç6†VVä6öÆ÷"“µÆåÇEÇF÷WFvö–ætÆ–v‡BÒ÷WFvö–ætÆ–v‡B¢6†VVäVæW&w”6ö×²6†VVå7V7VÆ$F—&V7B²6†VVå7V7VÆ$–æF—&V7CµÆåÇB6VæF–eÆåÇB6–fFVbU4Uô4ÄT$4ôEÆåÇEÇFfÆöBF÷Dåf62Ò6GW&FR‚F÷B‚vVöÖWG'”6ÆV&6öDæ÷&ÖÂÂvVöÖWG'•f–WtF—"’“µÆåÇEÇGfV32f62Òeõ66†Æ–6²‚ÖFW&–Âæ6ÆV&6öDcÂÖFW&–Âæ6ÆV&6öDc“ÂF÷Dåf62“µÆåÇEÇF÷WFvö–ætÆ–v‡BÒ÷WFvö–ætÆ–v‡B¢‚ãÒÖFW&–Âæ6ÆV&6öB¢f62’²‚6ÆV&6öE7V7VÆ$F—&V7B²6ÆV&6öE7V7VÆ$–æF—&V7B’¢ÖFW&–Âæ6ÆV&6öCµÆåÇB6VæF–eÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆåÇB6–æ6ÇVFRÆF—F†W&–æuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚CBÒ"6FVf–æRDôôåÆçf'––ærfV32ef–Wu÷6—F–öãµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆF—7Æ6VÖVçFÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇGef–Wu÷6—F–öâÒÒ×e÷6—F–öâç‡—£µÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6†F÷vÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBCBÒ"6FVf–æRDôôåÆçVæ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfV32VÖ—76—fSµÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÆF—F†W&–æu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆöÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡FÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆVÖ—76—fVÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆw&F–VçFÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'6Fg3åÆâ6–æ6ÇVFRÆÆ–v‡G5÷'5ö&Vv–ãåÆâ6–æ6ÇVFRÆæ÷&ÖÅ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆ–v‡G5÷Fööå÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'V×Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆæ÷&ÖÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇE&VfÆV7FVDÆ–v‡B&VfÆV7FVDÆ–v‡BÒ&VfÆV7FVDÆ–v‡B‚fV32‚ã’ÂfV32‚ã’ÂfV32‚ã’ÂfV32‚ã’“µÆåÇGfV32F÷FÄVÖ—76—fU&F–æ6RÒVÖ—76—fSµÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆæ÷&ÖÅög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆVÖ—76—fVÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5÷Fööåög&vÖVçCåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEö&Vv–ãåÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöÖ3åÆåÇB6–æ6ÇVFRÆÆ–v‡G5ög&vÖVçEöVæCåÆåÇB6–æ6ÇVFRÆöÖög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒ&VfÆV7FVDÆ–v‡BæF—&V7DF–fgW6R²&VfÆV7FVDÆ–v‡Bæ–æF—&V7DF–fgW6R²F÷FÄVÖ—76—fU&F–æ6SµÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆåÇB6–æ6ÇVFRÆF—F†W&–æuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚C2Ò'Væ–f÷&ÒfÆöB6—¦SµÆçVæ–f÷&ÒfÆöB66ÆSµÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆâ6–fFVbU4Uõô”åE5õUeÆåÇGf'––ærfV3"eWcµÆåÇGVæ–f÷&ÒÖC2WeG&ç6f÷&ÓµÆâ6VæF–eÆçfö–BÖ–â‚’µÆåÇB6–fFVbU4Uõô”åE5õUeÆåÇEÇGeWbÒ‚WeG&ç6f÷&Ò¢fV32‚WbÂ’’ç‡“µÆåÇB6VæF–eÆåÇB6–æ6ÇVFRÆ6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†6öÆ÷%÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇFvÅõö–çE6—¦RÒ6—¦SµÆåÇB6–fFVbU4Uõ4•¤TEDTåTD”ôåÆåÇEÇF&ööÂ—5W'7V7F—fRÒ—5W'7V7F—fTÖG&—‚‚&ö¦V7F–öäÖG&—‚“µÆåÇEÇF–b‚—5W'7V7F—fR’vÅõö–çE6—¦R£Ò‚66ÆRòÒ×e÷6—F–öâç¢“µÆåÇB6VæF–eÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBC2Ò'Væ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ6öÆ÷%÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'F–6ÆU÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒfV32‚ã“µÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖ÷'F–6ÆUög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷%ög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇF÷WFvö–ætÆ–v‡BÒF–fgW6T6öÆ÷"ç&v#µÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆåÇB6–æ6ÇVFRÇ&V×VÇF—Æ–VEöÇ†ög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚C"Ò"6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÆ&F6†–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÖ÷'‡F&vWE÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6¶–ææ–æu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÆ&F6†–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†–ç7Fæ6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'†æ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–æ&6U÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆFVfVÇFæ÷&ÖÅ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ&Vv–å÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÖ÷'‡F&vWE÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6¶–ææ–æu÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ&ö¦V7E÷fW'FWƒåÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÇv÷&ÆG÷5÷fW'FWƒåÆåÇB6–æ6ÇVFRÇ6†F÷vÖ÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBC"Ò'Væ–f÷&ÒfV326öÆ÷#µÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇ6¶–æsåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ'6Fg3åÆâ6–æ6ÇVFRÆÆ–v‡G5÷'5ö&Vv–ãåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÇ6†F÷vÖ6µ÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇFvÅôg&t6öÆ÷"ÒfV3B‚6öÆ÷"Â÷6—G’¢‚ãÒvWE6†F÷tÖ6²‚’’“µÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆçÒ#° ¦6öç7BfW'FW‚CÒ'Væ–f÷&ÒfÆöB&÷FF–öãµÆçVæ–f÷&ÒfV3"6VçFW#µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇWe÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆföu÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5÷fW'FWƒåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5÷fW'FWƒåÆçfö–BÖ–â‚’µÆåÇB6–æ6ÇVFRÇWe÷fW'FWƒåÆåÇGfV3B×e÷6—F–öâÒÖöFVÅf–WtÖG&—…²2ÓµÆåÇGfV3"66ÆRÒfV3"‚ÆVæwF‚‚ÖöFVÄÖG&—…²Òç‡—¢’ÂÆVæwF‚‚ÖöFVÄÖG&—…²Òç‡—¢’“µÆåÇB6–fæFVbU4Uõ4•¤TEDTåTD”ôåÆåÇEÇF&ööÂ—5W'7V7F—fRÒ—5W'7V7F—fTÖG&—‚‚&ö¦V7F–öäÖG&—‚“µÆåÇEÇF–b‚—5W'7V7F—fR’66ÆR£ÒÒ×e÷6—F–öâç£µÆåÇB6VæF–eÆåÇGfV3"Æ–væVE÷6—F–öâÒ‚÷6—F–öâç‡’Ò‚6VçFW"ÒfV3"‚ãR’’’¢66ÆSµÆåÇGfV3"&÷FFVE÷6—F–öãµÆåÇG&÷FFVE÷6—F–öâç‚Ò6÷2‚&÷FF–öâ’¢Æ–væVE÷6—F–öâç‚Ò6–â‚&÷FF–öâ’¢Æ–væVE÷6—F–öâç“µÆåÇG&÷FFVE÷6—F–öâç’Ò6–â‚&÷FF–öâ’¢Æ–væVE÷6—F–öâç‚²6÷2‚&÷FF–öâ’¢Æ–væVE÷6—F–öâç“µÆåÇF×e÷6—F–öâç‡’³Ò&÷FFVE÷6—F–öãµÆåÇFvÅõ÷6—F–öâÒ&ö¦V7F–öäÖG&—‚¢×e÷6—F–öãµÆåÇB6–æ6ÇVFRÆÆövFWF†'Ve÷fW'FWƒåÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷fW'FWƒåÆåÇB6–æ6ÇVFRÆföu÷fW'FWƒåÆçÒ#° ¦6öç7Bg&vÖVçBCÒ'Væ–f÷&ÒfV32F–fgW6SµÆçVæ–f÷&ÒfÆöB÷6—G“µÆâ6–æ6ÇVFRÆ6öÖÖöãåÆâ6–æ6ÇVFRÇWe÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÖ÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†Ö÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ†FW7E÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÇ††6…÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆföu÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆÆövFWF†'Ve÷'5ög&vÖVçCåÆâ6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5÷'5ög&vÖVçCåÆçfö–BÖ–â‚’µÆåÇGfV3BF–fgW6T6öÆ÷"ÒfV3B‚F–fgW6RÂ÷6—G’“µÆåÇB6–æ6ÇVFRÆ6Æ—–æu÷ÆæW5ög&vÖVçCåÆåÇGfV32÷WFvö–ætÆ–v‡BÒfV32‚ã“µÆåÇB6–æ6ÇVFRÆÆövFWF†'Veög&vÖVçCåÆåÇB6–æ6ÇVFRÆÖög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†Öög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ†FW7Eög&vÖVçCåÆåÇB6–æ6ÇVFRÆÇ††6…ög&vÖVçCåÆåÇF÷WFvö–ætÆ–v‡BÒF–fgW6T6öÆ÷"ç&v#µÆåÇB6–æ6ÇVFRÆ÷VUög&vÖVçCåÆåÇB6–æ6ÇVFRÇFöæVÖ–æuög&vÖVçCåÆåÇB6–æ6ÇVFRÆ6öÆ÷'76Uög&vÖVçCåÆåÇB6–æ6ÇVFRÆföuög&vÖVçCåÆçÒ#° ¦6öç7B6†FW$6‡Væ²Ò° –Ç††6…ög&vÖVçC¢Ç††6…ög&vÖVçBÀ –Ç††6…÷'5ög&vÖVçC¢Ç††6…÷'5ög&vÖVçBÀ –Ç†Öög&vÖVçC¢Ç†Öög&vÖVçBÀ –Ç†Ö÷'5ög&vÖVçC¢Ç†Ö÷'5ög&vÖVçBÀ –Ç†FW7Eög&vÖVçC¢Ç†FW7Eög&vÖVçBÀ –Ç†FW7E÷'5ög&vÖVçC¢Ç†FW7E÷'5ög&vÖVçBÀ –öÖög&vÖVçC¢öÖög&vÖVçBÀ –öÖ÷'5ög&vÖVçC¢öÖ÷'5ög&vÖVçBÀ –&F6†–æu÷'5÷fW'FWƒ¢&F6†–æu÷'5÷fW'FW‚À –&F6†–æu÷fW'FWƒ¢&F6†–æu÷fW'FW‚À –&Vv–å÷fW'FWƒ¢&Vv–å÷fW'FW‚À –&Vv–ææ÷&ÖÅ÷fW'FWƒ¢&Vv–ææ÷&ÖÅ÷fW'FW‚À –'6Fg3¢'6Fg2À –—&–FW66Væ6Uög&vÖVçC¢—&–FW66Væ6Uög&vÖVçBÀ –'V×Ö÷'5ög&vÖVçC¢'V×Ö÷'5ög&vÖVçBÀ –6Æ—–æu÷ÆæW5ög&vÖVçC¢6Æ—–æu÷ÆæW5ög&vÖVçBÀ –6Æ—–æu÷ÆæW5÷'5ög&vÖVçC¢6Æ—–æu÷ÆæW5÷'5ög&vÖVçBÀ –6Æ—–æu÷ÆæW5÷'5÷fW'FWƒ¢6Æ—–æu÷ÆæW5÷'5÷fW'FW‚À –6Æ—–æu÷ÆæW5÷fW'FWƒ¢6Æ—–æu÷ÆæW5÷fW'FW‚À –6öÆ÷%ög&vÖVçC¢6öÆ÷%ög&vÖVçBÀ –6öÆ÷%÷'5ög&vÖVçC¢6öÆ÷%÷'5ög&vÖVçBÀ –6öÆ÷%÷'5÷fW'FWƒ¢6öÆ÷%÷'5÷fW'FW‚À –6öÆ÷%÷fW'FWƒ¢6öÆ÷%÷fW'FW‚À –6öÖÖöã¢6öÖÖöâÀ –7V&U÷We÷&VfÆV7F–öåög&vÖVçC¢7V&U÷We÷&VfÆV7F–öåög&vÖVçBÀ –FVfVÇFæ÷&ÖÅ÷fW'FWƒ¢FVfVÇFæ÷&ÖÅ÷fW'FW‚À –F—7Æ6VÖVçFÖ÷'5÷fW'FWƒ¢F—7Æ6VÖVçFÖ÷'5÷fW'FW‚À –F—7Æ6VÖVçFÖ÷fW'FWƒ¢F—7Æ6VÖVçFÖ÷fW'FW‚À –VÖ—76—fVÖög&vÖVçC¢VÖ—76—fVÖög&vÖVçBÀ –VÖ—76—fVÖ÷'5ög&vÖVçC¢VÖ—76—fVÖ÷'5ög&vÖVçBÀ –6öÆ÷'76Uög&vÖVçC¢6öÆ÷'76Uög&vÖVçBÀ –6öÆ÷'76U÷'5ög&vÖVçC¢6öÆ÷'76U÷'5ög&vÖVçBÀ –VçfÖög&vÖVçC¢VçfÖög&vÖVçBÀ –VçfÖö6öÖÖöå÷'5ög&vÖVçC¢VçfÖö6öÖÖöå÷'5ög&vÖVçBÀ –VçfÖ÷'5ög&vÖVçC¢VçfÖ÷'5ög&vÖVçBÀ –VçfÖ÷'5÷fW'FWƒ¢VçfÖ÷'5÷fW'FW‚À –VçfÖ÷‡—6–6Å÷'5ög&vÖVçC¢VçfÖ÷‡—6–6Å÷'5ög&vÖVçBÀ –VçfÖ÷fW'FWƒ¢VçfÖ÷fW'FW‚À –föu÷fW'FWƒ¢föu÷fW'FW‚À –föu÷'5÷fW'FWƒ¢föu÷'5÷fW'FW‚À –föuög&vÖVçC¢föuög&vÖVçBÀ –föu÷'5ög&vÖVçC¢föu÷'5ög&vÖVçBÀ –w&F–VçFÖ÷'5ög&vÖVçC¢w&F–VçFÖ÷'5ög&vÖVçBÀ –Æ–v‡FÖ÷'5ög&vÖVçC¢Æ–v‡FÖ÷'5ög&vÖVçBÀ –Æ–v‡G5öÆÖ&W'Eög&vÖVçC¢Æ–v‡G5öÆÖ&W'Eög&vÖVçBÀ –Æ–v‡G5öÆÖ&W'E÷'5ög&vÖVçC¢Æ–v‡G5öÆÖ&W'E÷'5ög&vÖVçBÀ –Æ–v‡G5÷'5ö&Vv–ã¢Æ–v‡G5÷'5ö&Vv–âÀ –Æ–v‡G5÷Fööåög&vÖVçC¢Æ–v‡G5÷Fööåög&vÖVçBÀ –Æ–v‡G5÷Fööå÷'5ög&vÖVçC¢Æ–v‡G5÷Fööå÷'5ög&vÖVçBÀ –Æ–v‡G5÷†öæuög&vÖVçC¢Æ–v‡G5÷†öæuög&vÖVçBÀ –Æ–v‡G5÷†öæu÷'5ög&vÖVçC¢Æ–v‡G5÷†öæu÷'5ög&vÖVçBÀ –Æ–v‡G5÷‡—6–6Åög&vÖVçC¢Æ–v‡G5÷‡—6–6Åög&vÖVçBÀ –Æ–v‡G5÷‡—6–6Å÷'5ög&vÖVçC¢Æ–v‡G5÷‡—6–6Å÷'5ög&vÖVçBÀ –Æ–v‡G5ög&vÖVçEö&Vv–ã¢Æ–v‡G5ög&vÖVçEö&Vv–âÀ –Æ–v‡G5ög&vÖVçEöÖ3¢Æ–v‡G5ög&vÖVçEöÖ2À –Æ–v‡G5ög&vÖVçEöVæC¢Æ–v‡G5ög&vÖVçEöVæBÀ –ÆövFWF†'Veög&vÖVçC¢ÆövFWF†'Veög&vÖVçBÀ –ÆövFWF†'Ve÷'5ög&vÖVçC¢ÆövFWF†'Ve÷'5ög&vÖVçBÀ –ÆövFWF†'Ve÷'5÷fW'FWƒ¢ÆövFWF†'Ve÷'5÷fW'FW‚À –ÆövFWF†'Ve÷fW'FWƒ¢ÆövFWF†'Ve÷fW'FW‚À –Öög&vÖVçC¢Öög&vÖVçBÀ –Ö÷'5ög&vÖVçC¢Ö÷'5ög&vÖVçBÀ –Ö÷'F–6ÆUög&vÖVçC¢Ö÷'F–6ÆUög&vÖVçBÀ –Ö÷'F–6ÆU÷'5ög&vÖVçC¢Ö÷'F–6ÆU÷'5ög&vÖVçBÀ –ÖWFÆæW76Öög&vÖVçC¢ÖWFÆæW76Öög&vÖVçBÀ –ÖWFÆæW76Ö÷'5ög&vÖVçC¢ÖWFÆæW76Ö÷'5ög&vÖVçBÀ –Ö÷'†–ç7Fæ6U÷fW'FWƒ¢Ö÷'†–ç7Fæ6U÷fW'FW‚À –Ö÷'†6öÆ÷%÷fW'FWƒ¢Ö÷'†6öÆ÷%÷fW'FW‚À –Ö÷'†æ÷&ÖÅ÷fW'FWƒ¢Ö÷'†æ÷&ÖÅ÷fW'FW‚À –Ö÷'‡F&vWE÷'5÷fW'FWƒ¢Ö÷'‡F&vWE÷'5÷fW'FW‚À –Ö÷'‡F&vWE÷fW'FWƒ¢Ö÷'‡F&vWE÷fW'FW‚À –æ÷&ÖÅög&vÖVçEö&Vv–ã¢æ÷&ÖÅög&vÖVçEö&Vv–âÀ –æ÷&ÖÅög&vÖVçEöÖ3¢æ÷&ÖÅög&vÖVçEöÖ2À –æ÷&ÖÅ÷'5ög&vÖVçC¢æ÷&ÖÅ÷'5ög&vÖVçBÀ –æ÷&ÖÅ÷'5÷fW'FWƒ¢æ÷&ÖÅ÷'5÷fW'FW‚À –æ÷&ÖÅ÷fW'FWƒ¢æ÷&ÖÅ÷fW'FW‚À –æ÷&ÖÆÖ÷'5ög&vÖVçC¢æ÷&ÖÆÖ÷'5ög&vÖVçBÀ –6ÆV&6öEöæ÷&ÖÅög&vÖVçEö&Vv–ã¢6ÆV&6öEöæ÷&ÖÅög&vÖVçEö&Vv–âÀ –6ÆV&6öEöæ÷&ÖÅög&vÖVçEöÖ3¢6ÆV&6öEöæ÷&ÖÅög&vÖVçEöÖ2À –6ÆV&6öE÷'5ög&vÖVçC¢6ÆV&6öE÷'5ög&vÖVçBÀ –—&–FW66Væ6U÷'5ög&vÖVçC¢—&–FW66Væ6U÷'5ög&vÖVçBÀ –÷VUög&vÖVçC¢÷VUög&vÖVçBÀ —6¶–æs¢6¶–ærÀ —&V×VÇF—Æ–VEöÇ†ög&vÖVçC¢&V×VÇF—Æ–VEöÇ†ög&vÖVçBÀ —&ö¦V7E÷fW'FWƒ¢&ö¦V7E÷fW'FW‚À –F—F†W&–æuög&vÖVçC¢F—F†W&–æuög&vÖVçBÀ –F—F†W&–æu÷'5ög&vÖVçC¢F—F†W&–æu÷'5ög&vÖVçBÀ —&÷Vv†æW76Öög&vÖVçC¢&÷Vv†æW76Öög&vÖVçBÀ —&÷Vv†æW76Ö÷'5ög&vÖVçC¢&÷Vv†æW76Ö÷'5ög&vÖVçBÀ —6†F÷vÖ÷'5ög&vÖVçC¢6†F÷vÖ÷'5ög&vÖVçBÀ —6†F÷vÖ÷'5÷fW'FWƒ¢6†F÷vÖ÷'5÷fW'FW‚À —6†F÷vÖ÷fW'FWƒ¢6†F÷vÖ÷fW'FW‚À —6†F÷vÖ6µ÷'5ög&vÖVçC¢6†F÷vÖ6µ÷'5ög&vÖVçBÀ —6¶–æ&6U÷fW'FWƒ¢6¶–æ&6U÷fW'FW‚À —6¶–ææ–æu÷'5÷fW'FWƒ¢6¶–ææ–æu÷'5÷fW'FW‚À —6¶–ææ–æu÷fW'FWƒ¢6¶–ææ–æu÷fW'FW‚À —6¶–ææ÷&ÖÅ÷fW'FWƒ¢6¶–ææ÷&ÖÅ÷fW'FW‚À —7V7VÆ&Öög&vÖVçC¢7V7VÆ&Öög&vÖVçBÀ —7V7VÆ&Ö÷'5ög&vÖVçC¢7V7VÆ&Ö÷'5ög&vÖVçBÀ —FöæVÖ–æuög&vÖVçC¢FöæVÖ–æuög&vÖVçBÀ —FöæVÖ–æu÷'5ög&vÖVçC¢FöæVÖ–æu÷'5ög&vÖVçBÀ —G&ç6Ö—76–öåög&vÖVçC¢G&ç6Ö—76–öåög&vÖVçBÀ —G&ç6Ö—76–öå÷'5ög&vÖVçC¢G&ç6Ö—76–öå÷'5ög&vÖVçBÀ —We÷'5ög&vÖVçC¢We÷'5ög&vÖVçBÀ —We÷'5÷fW'FWƒ¢We÷'5÷fW'FW‚À —We÷fW'FWƒ¢We÷fW'FW‚À —v÷&ÆG÷5÷fW'FWƒ¢v÷&ÆG÷5÷fW'FW‚À  –&6¶w&÷VæE÷fW'C¢fW'FW‚F‚À –&6¶w&÷VæEög&s¢g&vÖVçBF‚À –&6¶w&÷VæD7V&U÷fW'C¢fW'FW‚FrÀ –&6¶w&÷VæD7V&Uög&s¢g&vÖVçBFrÀ –7V&U÷fW'C¢fW'FW‚FbÀ –7V&Uög&s¢g&vÖVçBFbÀ –FWF…÷fW'C¢fW'FW‚FRÀ –FWF…ög&s¢g&vÖVçBFRÀ –F—7Fæ6U$t$÷fW'C¢fW'FW‚FBÀ –F—7Fæ6U$t$ög&s¢g&vÖVçBFBÀ –WV—&V7E÷fW'C¢fW'FW‚F2À –WV—&V7Eög&s¢g&vÖVçBF2À –Æ–æVF6†VE÷fW'C¢fW'FW‚F"À –Æ–æVF6†VEög&s¢g&vÖVçBF"À –ÖW6†&6–5÷fW'C¢fW'FW‚FÀ –ÖW6†&6–5ög&s¢g&vÖVçBFÀ –ÖW6†ÆÖ&W'E÷fW'C¢fW'FW‚C’À –ÖW6†ÆÖ&W'Eög&s¢g&vÖVçBC’À –ÖW6†ÖF6÷fW'C¢fW'FW‚C‚À –ÖW6†ÖF6ög&s¢g&vÖVçBC‚À –ÖW6†æ÷&ÖÅ÷fW'C¢fW'FW‚CrÀ –ÖW6†æ÷&ÖÅög&s¢g&vÖVçBCrÀ –ÖW6‡†öæu÷fW'C¢fW'FW‚CbÀ –ÖW6‡†öæuög&s¢g&vÖVçBCbÀ –ÖW6‡‡—6–6Å÷fW'C¢fW'FW‚CRÀ –ÖW6‡‡—6–6Åög&s¢g&vÖVçBCRÀ –ÖW6‡Fööå÷fW'C¢fW'FW‚CBÀ –ÖW6‡Fööåög&s¢g&vÖVçBCBÀ —ö–çG5÷fW'C¢fW'FW‚C2À —ö–çG5ög&s¢g&vÖVçBC2À —6†F÷u÷fW'C¢fW'FW‚C"À —6†F÷uög&s¢g&vÖVçBC"À —7&—FU÷fW'C¢fW'FW‚CÀ —7&—FUög&s¢g&vÖVçBC§Ó° ¢òòVæ–f÷&×2Æ–'&'’f÷"6†&VBvV&vÂ6†FW'0¦6öç7BVæ–f÷&×4Æ–"Ò°  –6öÖÖöã¢°  –F–fgW6S¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚†fffffb’ÒÀ –÷6—G“¢²fÇVS¢ãÒÀ  –Ö¢²fÇVS¢çVÆÂÒÀ –ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ  –Ç†Ö¢²fÇVS¢çVÆÂÒÀ –Ç†ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ  –Ç†FW7C¢²fÇVS¢Ð  —ÒÀ  —7V7VÆ&Ö¢°  —7V7VÆ$Ö¢²fÇVS¢çVÆÂÒÀ —7V7VÆ$ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  –VçfÖ¢°  –VçdÖ¢²fÇVS¢çVÆÂÒÀ –VçdÖ&÷FF–öã¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –fÆ—VçdÖ¢²fÇVS¢ÓÒÀ —&VfÆV7F—f—G“¢²fÇVS¢ãÒÂòò&6–2ÂÆÖ&W'BÂ†öæp ––÷#¢²fÇVS¢ãRÒÂòò‡—6–6À —&Vg&7F–öå&F–ó¢²fÇVS¢ã“‚ÒÂòò&6–2ÂÆÖ&W'BÂ†öæp  —ÒÀ  –öÖ¢°  –ôÖ¢²fÇVS¢çVÆÂÒÀ –ôÖ–çFVç6—G“¢²fÇVS¢ÒÀ –ôÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  –Æ–v‡FÖ¢°  –Æ–v‡DÖ¢²fÇVS¢çVÆÂÒÀ –Æ–v‡DÖ–çFVç6—G“¢²fÇVS¢ÒÀ –Æ–v‡DÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  –'V×Ö¢°  –'V×Ö¢²fÇVS¢çVÆÂÒÀ –'V×ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –'V×66ÆS¢²fÇVS¢Ð  —ÒÀ  –æ÷&ÖÆÖ¢°  –æ÷&ÖÄÖ¢²fÇVS¢çVÆÂÒÀ –æ÷&ÖÄÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –æ÷&ÖÅ66ÆS¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#"‚Â’Ð  —ÒÀ  –F—7Æ6VÖVçFÖ¢°  –F—7Æ6VÖVçDÖ¢²fÇVS¢çVÆÂÒÀ –F—7Æ6VÖVçDÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –F—7Æ6VÖVçE66ÆS¢²fÇVS¢ÒÀ –F—7Æ6VÖVçD&–3¢²fÇVS¢Ð  —ÒÀ  –VÖ—76—fVÖ¢°  –VÖ—76—fTÖ¢²fÇVS¢çVÆÂÒÀ –VÖ—76—fTÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  –ÖWFÆæW76Ö¢°  –ÖWFÆæW74Ö¢²fÇVS¢çVÆÂÒÀ –ÖWFÆæW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  —&÷Vv†æW76Ö¢°  —&÷Vv†æW74Ö¢²fÇVS¢çVÆÂÒÀ —&÷Vv†æW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  –w&F–VçFÖ¢°  –w&F–VçDÖ¢²fÇVS¢çVÆÂÐ  —ÒÀ  –fös¢°  –fötFVç6—G“¢²fÇVS¢ã#RÒÀ –fötæV#¢²fÇVS¢ÒÀ –fötf#¢²fÇVS¢#ÒÀ –föt6öÆ÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚†fffffb’Ð  —ÒÀ  –Æ–v‡G3¢°  –Ö&–VçDÆ–v‡D6öÆ÷#¢²fÇVS¢µÒÒÀ  –Æ–v‡E&ö&S¢²fÇVS¢µÒÒÀ  –F—&V7F–öæÄÆ–v‡G3¢²fÇVS¢µÒÂ&÷W'F–W3¢° –F—&V7F–öã¢·ÒÀ –6öÆ÷#¢·Ð —ÒÒÀ  –F—&V7F–öæÄÆ–v‡E6†F÷w3¢²fÇVS¢µÒÂ&÷W'F–W3¢° —6†F÷t–çFVç6—G“¢À —6†F÷t&–3¢·ÒÀ —6†F÷tæ÷&ÖÄ&–3¢·ÒÀ —6†F÷u&F—W3¢·ÒÀ —6†F÷tÖ6—¦S¢·Ð —ÒÒÀ  –F—&V7F–öæÅ6†F÷tÖ¢²fÇVS¢µÒÒÀ –F—&V7F–öæÅ6†F÷tÖG&—ƒ¢²fÇVS¢µÒÒÀ  —7÷DÆ–v‡G3¢²fÇVS¢µÒÂ&÷W'F–W3¢° –6öÆ÷#¢·ÒÀ —÷6—F–öã¢·ÒÀ –F—&V7F–öã¢·ÒÀ –F—7Fæ6S¢·ÒÀ –6öæT6÷3¢·ÒÀ —VçVÖ'&6÷3¢·ÒÀ –FV6“¢·Ð —ÒÒÀ  —7÷DÆ–v‡E6†F÷w3¢²fÇVS¢µÒÂ&÷W'F–W3¢° —6†F÷t–çFVç6—G“¢À —6†F÷t&–3¢·ÒÀ —6†F÷tæ÷&ÖÄ&–3¢·ÒÀ —6†F÷u&F—W3¢·ÒÀ —6†F÷tÖ6—¦S¢·Ð —ÒÒÀ  —7÷DÆ–v‡DÖ¢²fÇVS¢µÒÒÀ —7÷E6†F÷tÖ¢²fÇVS¢µÒÒÀ —7÷DÆ–v‡DÖG&—ƒ¢²fÇVS¢µÒÒÀ  —ö–çDÆ–v‡G3¢²fÇVS¢µÒÂ&÷W'F–W3¢° –6öÆ÷#¢·ÒÀ —÷6—F–öã¢·ÒÀ –FV6“¢·ÒÀ –F—7Fæ6S¢·Ð —ÒÒÀ  —ö–çDÆ–v‡E6†F÷w3¢²fÇVS¢µÒÂ&÷W'F–W3¢° —6†F÷t–çFVç6—G“¢À —6†F÷t&–3¢·ÒÀ —6†F÷tæ÷&ÖÄ&–3¢·ÒÀ —6†F÷u&F—W3¢·ÒÀ —6†F÷tÖ6—¦S¢·ÒÀ —6†F÷t6ÖW&æV#¢·ÒÀ —6†F÷t6ÖW&f#¢·Ð —ÒÒÀ  —ö–çE6†F÷tÖ¢²fÇVS¢µÒÒÀ —ö–çE6†F÷tÖG&—ƒ¢²fÇVS¢µÒÒÀ  –†VÖ—7†W&TÆ–v‡G3¢²fÇVS¢µÒÂ&÷W'F–W3¢° –F—&V7F–öã¢·ÒÀ —6·”6öÆ÷#¢·ÒÀ –w&÷VæD6öÆ÷#¢·Ð —ÒÒÀ  ’òòDôDò†&VÆæF–öâ“¢&V7D&VÆ–v‡B%$DbFFæVVG2Fò&RÖ÷fVBg&öÒW†×ÆRFòÖ–â7&0 —&V7D&VÆ–v‡G3¢²fÇVS¢µÒÂ&÷W'F–W3¢° –6öÆ÷#¢·ÒÀ —÷6—F–öã¢·ÒÀ —v–GFƒ¢·ÒÀ –†V–v‡C¢·Ð —ÒÒÀ  –ÇF5ó¢²fÇVS¢çVÆÂÒÀ –ÇF5ó#¢²fÇVS¢çVÆÂÐ  —ÒÀ  —ö–çG3¢°  –F–fgW6S¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚†fffffb’ÒÀ –÷6—G“¢²fÇVS¢ãÒÀ —6—¦S¢²fÇVS¢ãÒÀ —66ÆS¢²fÇVS¢ãÒÀ –Ö¢²fÇVS¢çVÆÂÒÀ –Ç†Ö¢²fÇVS¢çVÆÂÒÀ –Ç†ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –Ç†FW7C¢²fÇVS¢ÒÀ —WeG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð  —ÒÀ  —7&—FS¢°  –F–fgW6S¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚†fffffb’ÒÀ –÷6—G“¢²fÇVS¢ãÒÀ –6VçFW#¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#"‚ãRÂãR’ÒÀ —&÷FF–öã¢²fÇVS¢ãÒÀ –Ö¢²fÇVS¢çVÆÂÒÀ –ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –Ç†Ö¢²fÇVS¢çVÆÂÒÀ –Ç†ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –Ç†FW7C¢²fÇVS¢Ð  —Ð §Ó° ¦6öç7B6†FW$Æ–"Ò°  –&6–3¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"ç7V7VÆ&ÖÀ •Væ–f÷&×4Æ–"æVçfÖÀ •Væ–f÷&×4Æ–"æöÖÀ •Væ–f÷&×4Æ–"æÆ–v‡FÖÀ •Væ–f÷&×4Æ–"æföp •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6†&6–5÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6†&6–5ög&p  —ÒÀ  –ÆÖ&W'C¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"ç7V7VÆ&ÖÀ •Væ–f÷&×4Æ–"æVçfÖÀ •Væ–f÷&×4Æ–"æöÖÀ •Væ–f÷&×4Æ–"æÆ–v‡FÖÀ •Væ–f÷&×4Æ–"æVÖ—76—fVÖÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ •Væ–f÷&×4Æ–"æförÀ •Væ–f÷&×4Æ–"æÆ–v‡G2À —° –VÖ—76—fS¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6†ÆÖ&W'E÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6†ÆÖ&W'Eög&p  —ÒÀ  —†öæs¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"ç7V7VÆ&ÖÀ •Væ–f÷&×4Æ–"æVçfÖÀ •Væ–f÷&×4Æ–"æöÖÀ •Væ–f÷&×4Æ–"æÆ–v‡FÖÀ •Væ–f÷&×4Æ–"æVÖ—76—fVÖÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ •Væ–f÷&×4Æ–"æförÀ •Væ–f÷&×4Æ–"æÆ–v‡G2À —° –VÖ—76—fS¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ —7V7VÆ#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ —6†–æ–æW73¢²fÇVS¢3Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6‡†öæu÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6‡†öæuög&p  —ÒÀ  —7FæF&C¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æVçfÖÀ •Væ–f÷&×4Æ–"æöÖÀ •Væ–f÷&×4Æ–"æÆ–v‡FÖÀ •Væ–f÷&×4Æ–"æVÖ—76—fVÖÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ •Væ–f÷&×4Æ–"ç&÷Vv†æW76ÖÀ •Væ–f÷&×4Æ–"æÖWFÆæW76ÖÀ •Væ–f÷&×4Æ–"æförÀ •Væ–f÷&×4Æ–"æÆ–v‡G2À —° –VÖ—76—fS¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ —&÷Vv†æW73¢²fÇVS¢ãÒÀ –ÖWFÆæW73¢²fÇVS¢ãÒÀ –VçdÖ–çFVç6—G“¢²fÇVS¢Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6‡‡—6–6Å÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6‡‡—6–6Åög&p  —ÒÀ  —Fööã¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æöÖÀ •Væ–f÷&×4Æ–"æÆ–v‡FÖÀ •Væ–f÷&×4Æ–"æVÖ—76—fVÖÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ •Væ–f÷&×4Æ–"æw&F–VçFÖÀ •Væ–f÷&×4Æ–"æförÀ •Væ–f÷&×4Æ–"æÆ–v‡G2À —° –VÖ—76—fS¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6‡Fööå÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6‡Fööåög&p  —ÒÀ  –ÖF6¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ •Væ–f÷&×4Æ–"æförÀ —° –ÖF6¢²fÇVS¢çVÆÂÐ —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6†ÖF6÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6†ÖF6ög&p  —ÒÀ  —ö–çG3¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"çö–çG2À •Væ–f÷&×4Æ–"æföp •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²çö–çG5÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²çö–çG5ög&p  —ÒÀ  –F6†VC¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æförÀ —° —66ÆS¢²fÇVS¢ÒÀ –F6…6—¦S¢²fÇVS¢ÒÀ —F÷FÅ6—¦S¢²fÇVS¢"Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÆ–æVF6†VE÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÆ–æVF6†VEög&p  —ÒÀ  –FWFƒ¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖ  •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æFWF…÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æFWF…ög&p  —ÒÀ  –æ÷&ÖÃ¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æ'V×ÖÀ •Væ–f÷&×4Æ–"ææ÷&ÖÆÖÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ —° –÷6—G“¢²fÇVS¢ãÐ —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6†æ÷&ÖÅ÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6†æ÷&ÖÅög&p  —ÒÀ  —7&—FS¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"ç7&—FRÀ •Væ–f÷&×4Æ–"æföp •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²ç7&—FU÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²ç7&—FUög&p  —ÒÀ  –&6¶w&÷VæC¢°  —Væ–f÷&×3¢° —WeG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —C$C¢²fÇVS¢çVÆÂÒÀ –&6¶w&÷VæD–çFVç6—G“¢²fÇVS¢Ð —ÒÀ  —fW'FW…6†FW#¢6†FW$6‡Væ²æ&6¶w&÷VæE÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æ&6¶w&÷VæEög&p  —ÒÀ  –&6¶w&÷VæD7V&S¢°  —Væ–f÷&×3¢° –VçdÖ¢²fÇVS¢çVÆÂÒÀ –fÆ—VçdÖ¢²fÇVS¢ÓÒÀ –&6¶w&÷VæD&ÇW'&–æW73¢²fÇVS¢ÒÀ –&6¶w&÷VæD–çFVç6—G“¢²fÇVS¢ÒÀ –&6¶w&÷VæE&÷FF–öã¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’Ð —ÒÀ  —fW'FW…6†FW#¢6†FW$6‡Væ²æ&6¶w&÷VæD7V&U÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æ&6¶w&÷VæD7V&Uög&p  —ÒÀ  –7V&S¢°  —Væ–f÷&×3¢° —D7V&S¢²fÇVS¢çVÆÂÒÀ —DfÆ—¢²fÇVS¢ÓÒÀ –÷6—G“¢²fÇVS¢ãÐ —ÒÀ  —fW'FW…6†FW#¢6†FW$6‡Væ²æ7V&U÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æ7V&Uög&p  —ÒÀ  –WV—&V7C¢°  —Væ–f÷&×3¢° —DWV—&V7C¢²fÇVS¢çVÆÂÒÀ —ÒÀ  —fW'FW…6†FW#¢6†FW$6‡Væ²æWV—&V7E÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æWV—&V7Eög&p  —ÒÀ  –F—7Fæ6U$t$¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æ6öÖÖöâÀ •Væ–f÷&×4Æ–"æF—7Æ6VÖVçFÖÀ —° —&VfW&Væ6U÷6—F–öã¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#2‚’ÒÀ –æV$F—7Fæ6S¢²fÇVS¢ÒÀ –f$F—7Fæ6S¢²fÇVS¢Ð —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æF—7Fæ6U$t$÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æF—7Fæ6U$t$ög&p  —ÒÀ  —6†F÷s¢°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •Væ–f÷&×4Æ–"æÆ–v‡G2À •Væ–f÷&×4Æ–"æförÀ —° –6öÆ÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ –÷6—G“¢²fÇVS¢ãÐ —ÒÀ •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²ç6†F÷u÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²ç6†F÷uög&p  —Ð §Ó° ¥6†FW$Æ–"ç‡—6–6ÂÒ°  —Væ–f÷&×3¢ò¤õõU$Uõò¢òÖW&vUVæ–f÷&×2‚° •6†FW$Æ–"ç7FæF&BçVæ–f÷&×2À —° –6ÆV&6öC¢²fÇVS¢ÒÀ –6ÆV&6öDÖ¢²fÇVS¢çVÆÂÒÀ –6ÆV&6öDÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –6ÆV&6öDæ÷&ÖÄÖ¢²fÇVS¢çVÆÂÒÀ –6ÆV&6öDæ÷&ÖÄÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –6ÆV&6öDæ÷&ÖÅ66ÆS¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#"‚Â’ÒÀ –6ÆV&6öE&÷Vv†æW73¢²fÇVS¢ÒÀ –6ÆV&6öE&÷Vv†æW74Ö¢²fÇVS¢çVÆÂÒÀ –6ÆV&6öE&÷Vv†æW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –F—7W'6–öã¢²fÇVS¢ÒÀ –—&–FW66Væ6S¢²fÇVS¢ÒÀ –—&–FW66Væ6TÖ¢²fÇVS¢çVÆÂÒÀ –—&–FW66Væ6TÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –—&–FW66Væ6T”õ#¢²fÇVS¢ã2ÒÀ –—&–FW66Væ6UF†–6¶æW74Ö–æ–×VÓ¢²fÇVS¢ÒÀ –—&–FW66Væ6UF†–6¶æW74Ö†–×VÓ¢²fÇVS¢CÒÀ –—&–FW66Væ6UF†–6¶æW74Ö¢²fÇVS¢çVÆÂÒÀ –—&–FW66Væ6UF†–6¶æW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —6†VVã¢²fÇVS¢ÒÀ —6†VVä6öÆ÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ —6†VVä6öÆ÷$Ö¢²fÇVS¢çVÆÂÒÀ —6†VVä6öÆ÷$ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —6†VVå&÷Vv†æW73¢²fÇVS¢ÒÀ —6†VVå&÷Vv†æW74Ö¢²fÇVS¢çVÆÂÒÀ —6†VVå&÷Vv†æW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —G&ç6Ö—76–öã¢²fÇVS¢ÒÀ —G&ç6Ö—76–öäÖ¢²fÇVS¢çVÆÂÒÀ —G&ç6Ö—76–öäÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —G&ç6Ö—76–öå6×ÆW%6—¦S¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#"‚’ÒÀ —G&ç6Ö—76–öå6×ÆW$Ö¢²fÇVS¢çVÆÂÒÀ —F†–6¶æW73¢²fÇVS¢ÒÀ —F†–6¶æW74Ö¢²fÇVS¢çVÆÂÒÀ —F†–6¶æW74ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –GFVçVF–öäF—7Fæ6S¢²fÇVS¢ÒÀ –GFVçVF–öä6öÆ÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ƒ’ÒÀ —7V7VÆ$6öÆ÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWr6öÆ÷"‚ÂÂ’ÒÀ —7V7VÆ$6öÆ÷$Ö¢²fÇVS¢çVÆÂÒÀ —7V7VÆ$6öÆ÷$ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —7V7VÆ$–çFVç6—G“¢²fÇVS¢ÒÀ —7V7VÆ$–çFVç6—G”Ö¢²fÇVS¢çVÆÂÒÀ —7V7VÆ$–çFVç6—G”ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ –æ—6÷G&÷•fV7F÷#¢²fÇVS¢ò¤õõU$Uõò¢òæWrfV7F÷#"‚’ÒÀ –æ—6÷G&÷”Ö¢²fÇVS¢çVÆÂÒÀ –æ—6÷G&÷”ÖG&ç6f÷&Ó¢²fÇVS¢ò¤õõU$Uõò¢òæWrÖG&—ƒ2‚’ÒÀ —Ð •Ò’À  —fW'FW…6†FW#¢6†FW$6‡Væ²æÖW6‡‡—6–6Å÷fW'BÀ –g&vÖVçE6†FW#¢6†FW$6‡Væ²æÖW6‡‡—6–6Åög&p §Ó° ¦6öç7B÷&v"Ò²#¢Â#¢Âs¢Ó°¦6öç7BöSCÒò¤õõU$Uõò¢òæWrWVÆW"‚“°¦6öç7BöÓCÒò¤õõU$Uõò¢òæWrÖG&—ƒB‚“° ¦gVæ7F–öâvV$tÄ&6¶w&÷VæB‚&VæFW&W"Â7V&VÖ2Â7V&WWfÖ2Â7FFRÂö&¦V7G2ÂÇ†Â&V×VÇF—Æ–VDÇ†’°  –6öç7B6ÆV$6öÆ÷"ÒæWr6öÆ÷"‚ƒ“° –ÆWB6ÆV$Ç†ÒÇ†ÓÓÒG'VRò¢°  –ÆWBÆæTÖW6ƒ° –ÆWB&÷„ÖW6ƒ°  –ÆWB7W'&VçD&6¶w&÷VæBÒçVÆÃ° –ÆWB7W'&VçD&6¶w&÷VæEfW'6–öâÒ° –ÆWB7W'&VçEFöæVÖ–ærÒçVÆÃ°  –gVæ7F–öâvWD&6¶w&÷VæB‚66VæR’°  –ÆWB&6¶w&÷VæBÒ66VæRæ—566VæRÓÓÒG'VRò66VæRæ&6¶w&÷VæB¢çVÆÃ°  ––b‚&6¶w&÷VæBbb&6¶w&÷VæBæ—5FW‡GW&R’°  –6öç7BW6UÕ$TÒÒ66VæRæ&6¶w&÷VæD&ÇW'&–æW72â²òòW6RÕ$TÒ–bF†RW6W"vçG2Fò&ÇW"F†R&6¶w&÷Væ@ –&6¶w&÷VæBÒ‚W6UÕ$TÒò7V&WWfÖ2¢7V&VÖ2’ævWB‚&6¶w&÷VæB“°  —Ð  —&WGW&â&6¶w&÷VæC°  —Ð  –gVæ7F–öâ&VæFW"‚66VæR’°  –ÆWBf÷&6T6ÆV"ÒfÇ6S° –6öç7B&6¶w&÷VæBÒvWD&6¶w&÷VæB‚66VæR“°  ––b‚&6¶w&÷VæBÓÓÒçVÆÂ’°  —6WD6ÆV"‚6ÆV$6öÆ÷"Â6ÆV$Ç†“°  —ÒVÇ6R–b‚&6¶w&÷VæBbb&6¶w&÷VæBæ—46öÆ÷"’°  —6WD6ÆV"‚&6¶w&÷VæBÂ“° –f÷&6T6ÆV"ÒG'VS°  —Ð  –6öç7BVçf—&öæÖVçD&ÆVæDÖöFRÒ&VæFW&W"ç‡"ævWDVçf—&öæÖVçD&ÆVæDÖöFR‚“°  ––b‚Vçf—&öæÖVçD&ÆVæDÖöFRÓÓÒvFF—F—fRr’°  —7FFRæ'VffW'2æ6öÆ÷"ç6WD6ÆV"‚ÂÂÂÂ&V×VÇF—Æ–VDÇ†“°  —ÒVÇ6R–b‚Vçf—&öæÖVçD&ÆVæDÖöFRÓÓÒvÇ†Ö&ÆVæBr’°  —7FFRæ'VffW'2æ6öÆ÷"ç6WD6ÆV"‚ÂÂÂÂ&V×VÇF—Æ–VDÇ†“°  —Ð  ––b‚&VæFW&W"æWFô6ÆV"ÇÂf÷&6T6ÆV"’°  ’òò'VffW'2Ö–v‡Bæ÷B&Rw&—F&ÆRv†–6‚—2&WV—&VBFòVç7W&R6÷'&V7B6ÆV   —7FFRæ'VffW'2æFWF‚ç6WEFW7B‚G'VR“° —7FFRæ'VffW'2æFWF‚ç6WDÖ6²‚G'VR“° —7FFRæ'VffW'2æ6öÆ÷"ç6WDÖ6²‚G'VR“°  —&VæFW&W"æ6ÆV"‚&VæFW&W"æWFô6ÆV$6öÆ÷"Â&VæFW&W"æWFô6ÆV$FWF‚Â&VæFW&W"æWFô6ÆV%7FVæ6–Â“°  —Ð  —Ð  –gVæ7F–öâFEFõ&VæFW$Æ—7B‚&VæFW$Æ—7BÂ66VæR’°  –6öç7B&6¶w&÷VæBÒvWD&6¶w&÷VæB‚66VæR“°  ––b‚&6¶w&÷VæBbb‚&6¶w&÷VæBæ—47V&UFW‡GW&RÇÂ&6¶w&÷VæBæÖ–ærÓÓÒ7V&UUe&VfÆV7F–öäÖ–ær’’°  ––b‚&÷„ÖW6‚ÓÓÒVæFVf–æVB’°  –&÷„ÖW6‚ÒæWrÖW6‚€ –æWr&÷„vVöÖWG'’‚ÂÂ’À –æWr6†FW$ÖFW&–Â‚° –æÖS¢t&6¶w&÷VæD7V&TÖFW&–ÂrÀ —Væ–f÷&×3¢6ÆöæUVæ–f÷&×2‚6†FW$Æ–"æ&6¶w&÷VæD7V&RçVæ–f÷&×2’À —fW'FW…6†FW#¢6†FW$Æ–"æ&6¶w&÷VæD7V&RçfW'FW…6†FW"À –g&vÖVçE6†FW#¢6†FW$Æ–"æ&6¶w&÷VæD7V&Ræg&vÖVçE6†FW"À —6–FS¢&6µ6–FRÀ –FWF…FW7C¢fÇ6RÀ –FWF…w&—FS¢fÇ6RÀ –fös¢fÇ6RÀ –ÆÆ÷t÷fW'&–FS¢fÇ6P —Ò ’“°  –&÷„ÖW6‚ævVöÖWG'’æFVÆWFTGG&–'WFR‚væ÷&ÖÂr“° –&÷„ÖW6‚ævVöÖWG'’æFVÆWFTGG&–'WFR‚wWbr“°  –&÷„ÖW6‚æöä&Vf÷&U&VæFW"ÒgVæ7F–öâ‚&VæFW&W"Â66VæRÂ6ÖW&’°  —F†—2æÖG&—…v÷&ÆBæ6÷•÷6—F–öâ‚6ÖW&æÖG&—…v÷&ÆB“°  —Ó°  ’òòFB&VçdÖ"ÖFW&–Â&÷W'G’6òF†R&VæFW&W"6âWfÇVFR—BÆ–¶Rf÷"'V–ÇBÖ–âÖFW&–Ç0 ”ö&¦V7BæFVf–æU&÷W'G’‚&÷„ÖW6‚æÖFW&–ÂÂvVçdÖrÂ°  –vWC¢gVæ7F–öâ‚’°  —&WGW&âF†—2çVæ–f÷&×2æVçdÖçfÇVS°  —Ð  —Ò“°  –ö&¦V7G2çWFFR‚&÷„ÖW6‚“°  —Ð  •öSCæ6÷’‚66VæRæ&6¶w&÷VæE&÷FF–öâ“°  ’òò66öÖÖöFFRÆVgBÖ†æFVBg&ÖP •öSCç‚£ÒÓ²öSCç’£ÒÓ²öSCç¢£ÒÓ°  ––b‚&6¶w&÷VæBæ—47V&UFW‡GW&Rbb&6¶w&÷VæBæ—5&VæFW%F&vWEFW‡GW&RÓÓÒfÇ6R’°  ’òòVçf—&öæÖVçBÖ2v†–6‚&Ræ÷B7V&R&VæFW"F&vWG2÷"Õ$T×2föÆÆ÷rF–ffW&VçB6öçfVçF–öà •öSCç’£ÒÓ° •öSCç¢£ÒÓ°  —Ð  –&÷„ÖW6‚æÖFW&–ÂçVæ–f÷&×2æVçdÖçfÇVRÒ&6¶w&÷VæC° –&÷„ÖW6‚æÖFW&–ÂçVæ–f÷&×2æfÆ—VçdÖçfÇVRÒ‚&6¶w&÷VæBæ—47V&UFW‡GW&Rbb&6¶w&÷VæBæ—5&VæFW%F&vWEFW‡GW&RÓÓÒfÇ6R’òÓ¢° –&÷„ÖW6‚æÖFW&–ÂçVæ–f÷&×2æ&6¶w&÷VæD&ÇW'&–æW72çfÇVRÒ66VæRæ&6¶w&÷VæD&ÇW'&–æW73° –&÷„ÖW6‚æÖFW&–ÂçVæ–f÷&×2æ&6¶w&÷VæD–çFVç6—G’çfÇVRÒ66VæRæ&6¶w&÷VæD–çFVç6—G“° –&÷„ÖW6‚æÖFW&–ÂçVæ–f÷&×2æ&6¶w&÷VæE&÷FF–öâçfÇVRç6WDg&öÔÖG&—ƒB‚öÓCæÖ¶U&÷FF–öäg&öÔWVÆW"‚öSC’“° –&÷„ÖW6‚æÖFW&–ÂçFöæTÖVBÒ6öÆ÷$ÖævVÖVçBævWEG&ç6fW"‚&6¶w&÷VæBæ6öÆ÷%76R’ÓÒ5$t%G&ç6fW#°  ––b‚7W'&VçD&6¶w&÷VæBÓÒ&6¶w&÷VæBÇÀ –7W'&VçD&6¶w&÷VæEfW'6–öâÓÒ&6¶w&÷VæBçfW'6–öâÇÀ –7W'&VçEFöæVÖ–ærÓÒ&VæFW&W"çFöæTÖ–ær’°  –&÷„ÖW6‚æÖFW&–ÂææVVG5WFFRÒG'VS°  –7W'&VçD&6¶w&÷VæBÒ&6¶w&÷VæC° –7W'&VçD&6¶w&÷VæEfW'6–öâÒ&6¶w&÷VæBçfW'6–öã° –7W'&VçEFöæVÖ–ærÒ&VæFW&W"çFöæTÖ–æs°  —Ð  –&÷„ÖW6‚æÆ–W'2æVæ&ÆTÆÂ‚“°  ’òòW6‚FòF†R&R×6÷'FVB÷VR&VæFW"Æ—7@ —&VæFW$Æ—7BçVç6†–gB‚&÷„ÖW6‚Â&÷„ÖW6‚ævVöÖWG'’Â&÷„ÖW6‚æÖFW&–ÂÂÂÂçVÆÂ“°  —ÒVÇ6R–b‚&6¶w&÷VæBbb&6¶w&÷VæBæ—5FW‡GW&R’°  ––b‚ÆæTÖW6‚ÓÓÒVæFVf–æVB’°  —ÆæTÖW6‚ÒæWrÖW6‚€ –æWrÆæTvVöÖWG'’‚"Â"’À –æWr6†FW$ÖFW&–Â‚° –æÖS¢t&6¶w&÷VæDÖFW&–ÂrÀ —Væ–f÷&×3¢6ÆöæUVæ–f÷&×2‚6†FW$Æ–"æ&6¶w&÷VæBçVæ–f÷&×2’À —fW'FW…6†FW#¢6†FW$Æ–"æ&6¶w&÷VæBçfW'FW…6†FW"À –g&vÖVçE6†FW#¢6†FW$Æ–"æ&6¶w&÷VæBæg&vÖVçE6†FW"À —6–FS¢g&öçE6–FRÀ –FWF…FW7C¢fÇ6RÀ –FWF…w&—FS¢fÇ6RÀ –fös¢fÇ6RÀ –ÆÆ÷t÷fW'&–FS¢fÇ6P —Ò ’“°  —ÆæTÖW6‚ævVöÖWG'’æFVÆWFTGG&–'WFR‚væ÷&ÖÂr“°  ’òòFB&Ö"ÖFW&–Â&÷W'G’6òF†R&VæFW&W"6âWfÇVFR—BÆ–¶Rf÷"'V–ÇBÖ–âÖFW&–Ç0 ”ö&¦V7BæFVf–æU&÷W'G’‚ÆæTÖW6‚æÖFW&–ÂÂvÖrÂ°  –vWC¢gVæ7F–öâ‚’°  —&WGW&âF†—2çVæ–f÷&×2çC$BçfÇVS°  —Ð  —Ò“°  –ö&¦V7G2çWFFR‚ÆæTÖW6‚“°  —Ð  —ÆæTÖW6‚æÖFW&–ÂçVæ–f÷&×2çC$BçfÇVRÒ&6¶w&÷VæC° —ÆæTÖW6‚æÖFW&–ÂçVæ–f÷&×2æ&6¶w&÷VæD–çFVç6—G’çfÇVRÒ66VæRæ&6¶w&÷VæD–çFVç6—G“° —ÆæTÖW6‚æÖFW&–ÂçFöæTÖVBÒ6öÆ÷$ÖævVÖVçBævWEG&ç6fW"‚&6¶w&÷VæBæ6öÆ÷%76R’ÓÒ5$t%G&ç6fW#°  ––b‚&6¶w&÷VæBæÖG&—„WFõWFFRÓÓÒG'VR’°  –&6¶w&÷VæBçWFFTÖG&—‚‚“°  —Ð  —ÆæTÖW6‚æÖFW&–ÂçVæ–f÷&×2çWeG&ç6f÷&ÒçfÇVRæ6÷’‚&6¶w&÷VæBæÖG&—‚“°  ––b‚7W'&VçD&6¶w&÷VæBÓÒ&6¶w&÷VæBÇÀ –7W'&VçD&6¶w&÷VæEfW'6–öâÓÒ&6¶w&÷VæBçfW'6–öâÇÀ –7W'&VçEFöæVÖ–ærÓÒ&VæFW&W"çFöæTÖ–ær’°  —ÆæTÖW6‚æÖFW&–ÂææVVG5WFFRÒG'VS°  –7W'&VçD&6¶w&÷VæBÒ&6¶w&÷VæC° –7W'&VçD&6¶w&÷VæEfW'6–öâÒ&6¶w&÷VæBçfW'6–öã° –7W'&VçEFöæVÖ–ærÒ&VæFW&W"çFöæTÖ–æs°  —Ð  —ÆæTÖW6‚æÆ–W'2æVæ&ÆTÆÂ‚“°  ’òòW6‚FòF†R&R×6÷'FVB÷VR&VæFW"Æ—7@ —&VæFW$Æ—7BçVç6†–gB‚ÆæTÖW6‚ÂÆæTÖW6‚ævVöÖWG'’ÂÆæTÖW6‚æÖFW&–ÂÂÂÂçVÆÂ“°  —Ð  —Ð  –gVæ7F–öâ6WD6ÆV"‚6öÆ÷"ÂÇ†’°  –6öÆ÷"ævWE$t"‚÷&v"ÂvWEVæÆ—EVæ–f÷&Ô6öÆ÷%76R‚&VæFW&W"’“°  —7FFRæ'VffW'2æ6öÆ÷"ç6WD6ÆV"‚÷&v"ç"Â÷&v"ærÂ÷&v"æ"ÂÇ†Â&V×VÇF—Æ–VDÇ†“°  —Ð  –gVæ7F–öâF—7÷6R‚’°  ––b‚&÷„ÖW6‚ÓÒVæFVf–æVB’°  –&÷„ÖW6‚ævVöÖWG'’æF—7÷6R‚“° –&÷„ÖW6‚æÖFW&–ÂæF—7÷6R‚“°  –&÷„ÖW6‚ÒVæFVf–æVC°  —Ð  ––b‚ÆæTÖW6‚ÓÒVæFVf–æVB’°  —ÆæTÖW6‚ævVöÖWG'’æF—7÷6R‚“° —ÆæTÖW6‚æÖFW&–ÂæF—7÷6R‚“°  —ÆæTÖW6‚ÒVæFVf–æVC°  —Ð  —Ð  —&WGW&â°  –vWD6ÆV$6öÆ÷#¢gVæ7F–öâ‚’°  —&WGW&â6ÆV$6öÆ÷#°  —ÒÀ —6WD6ÆV$6öÆ÷#¢gVæ7F–öâ‚6öÆ÷"ÂÇ†Ò’°  –6ÆV$6öÆ÷"ç6WB‚6öÆ÷"“° –6ÆV$Ç†ÒÇ†° —6WD6ÆV"‚6ÆV$6öÆ÷"Â6ÆV$Ç†“°  —ÒÀ –vWD6ÆV$Ç†¢gVæ7F–öâ‚’°  —&WGW&â6ÆV$Ç†°  —ÒÀ —6WD6ÆV$Ç†¢gVæ7F–öâ‚Ç†’°  –6ÆV$Ç†ÒÇ†° —6WD6ÆV"‚6ÆV$6öÆ÷"Â6ÆV$Ç†“°  —ÒÀ —&VæFW#¢&VæFW"À –FEFõ&VæFW$Æ—7C¢FEFõ&VæFW$Æ—7BÀ –F—7÷6S¢F—7÷6P  —Ó° §Ð ¦gVæ7F–öâvV$tÄ&–æF–æu7FFW2‚vÂÂGG&–'WFW2’°  –6öç7BÖ…fW'FW„GG&–'WFW2ÒvÂævWE&ÖWFW"‚vÂäÔ…õdU%DU…ôEE$”%2“°  –6öç7B&–æF–æu7FFW2Ò·Ó°  –6öç7BFVfVÇE7FFRÒ7&VFT&–æF–æu7FFR‚çVÆÂ“° –ÆWB7W'&VçE7FFRÒFVfVÇE7FFS° –ÆWBf÷&6UWFFRÒfÇ6S°  –gVæ7F–öâ6WGW‚ö&¦V7BÂÖFW&–ÂÂ&öw&ÒÂvVöÖWG'’Â–æFW‚’°  –ÆWBWFFT'VffW'2ÒfÇ6S°  –6öç7B7FFRÒvWD&–æF–æu7FFR‚vVöÖWG'’Â&öw&ÒÂÖFW&–Â“°  ––b‚7W'&VçE7FFRÓÒ7FFR’°  –7W'&VçE7FFRÒ7FFS° –&–æEfW'FW„'&”ö&¦V7B‚7W'&VçE7FFRæö&¦V7B“°  —Ð  —WFFT'VffW'2ÒæVVG5WFFR‚ö&¦V7BÂvVöÖWG'’Â&öw&ÒÂ–æFW‚“°  ––b‚WFFT'VffW'2’6fT66†R‚ö&¦V7BÂvVöÖWG'’Â&öw&ÒÂ–æFW‚“°  ––b‚–æFW‚ÓÒçVÆÂ’°  –GG&–'WFW2çWFFR‚–æFW‚ÂvÂäTÄTÔTåEô%$•ô%TddU"“°  —Ð  ––b‚WFFT'VffW'2ÇÂf÷&6UWFFR’°  –f÷&6UWFFRÒfÇ6S°  —6WGWfW'FW„GG&–'WFW2‚ö&¦V7BÂÖFW&–ÂÂ&öw&ÒÂvVöÖWG'’“°  ––b‚–æFW‚ÓÒçVÆÂ’°  –vÂæ&–æD'VffW"‚vÂäTÄTÔTåEô%$•ô%TddU"ÂGG&–'WFW2ævWB‚–æFW‚’æ'VffW"“°  —Ð  —Ð  —Ð  –gVæ7F–öâ7&VFUfW'FW„'&”ö&¦V7B‚’°  —&WGW&âvÂæ7&VFUfW'FW„'&’‚“°  —Ð  –gVæ7F–öâ&–æEfW'FW„'&”ö&¦V7B‚fò’°  —&WGW&âvÂæ&–æEfW'FW„'&’‚fò“°  —Ð  –gVæ7F–öâFVÆWFUfW'FW„'&”ö&¦V7B‚fò’°  —&WGW&âvÂæFVÆWFUfW'FW„'&’‚fò“°  —Ð  –gVæ7F–öâvWD&–æF–æu7FFR‚vVöÖWG'’Â&öw&ÒÂÖFW&–Â’°  –6öç7Bv—&Vg&ÖRÒ‚ÖFW&–Âçv—&Vg&ÖRÓÓÒG'VR“°  –ÆWB&öw&ÔÖÒ&–æF–æu7FFW5²vVöÖWG'’æ–BÓ°  ––b‚&öw&ÔÖÓÓÒVæFVf–æVB’°  —&öw&ÔÖÒ·Ó° –&–æF–æu7FFW5²vVöÖWG'’æ–BÒÒ&öw&ÔÖ°  —Ð  –ÆWB7FFTÖÒ&öw&ÔÖ²&öw&Òæ–BÓ°  ––b‚7FFTÖÓÓÒVæFVf–æVB’°  —7FFTÖÒ·Ó° —&öw&ÔÖ²&öw&Òæ–BÒÒ7FFTÖ°  —Ð  –ÆWB7FFRÒ7FFTÖ²v—&Vg&ÖRÓ°  ––b‚7FFRÓÓÒVæFVf–æVB’°  —7FFRÒ7&VFT&–æF–æu7FFR‚7&VFUfW'FW„'&”ö&¦V7B‚’“° —7FFTÖ²v—&Vg&ÖRÒÒ7FFS°  —Ð  —&WGW&â7FFS°  —Ð  –gVæ7F–öâ7&VFT&–æF–æu7FFR‚fò’°  –6öç7BæWtGG&–'WFW2ÒµÓ° –6öç7BVæ&ÆVDGG&–'WFW2ÒµÓ° –6öç7BGG&–'WFTF—f—6÷'2ÒµÓ°  –f÷"‚ÆWB’Ò²’ÂÖ…fW'FW„GG&–'WFW3²’²²’°  –æWtGG&–'WFW5²’ÒÒ° –Væ&ÆVDGG&–'WFW5²’ÒÒ° –GG&–'WFTF—f—6÷'5²’ÒÒ°  —Ð  —&WGW&â°  ’òòf÷"&6·v&B6ö×F–&–Æ—G’öâæöâÕdò7W÷'B'&÷w6W  –vVöÖWG'“¢çVÆÂÀ —&öw&Ó¢çVÆÂÀ —v—&Vg&ÖS¢fÇ6RÀ  –æWtGG&–'WFW3¢æWtGG&–'WFW2À –Væ&ÆVDGG&–'WFW3¢Væ&ÆVDGG&–'WFW2À –GG&–'WFTF—f—6÷'3¢GG&–'WFTF—f—6÷'2À –ö&¦V7C¢fòÀ –GG&–'WFW3¢·ÒÀ ––æFWƒ¢çVÆÀ  —Ó°  —Ð  –gVæ7F–öâæVVG5WFFR‚ö&¦V7BÂvVöÖWG'’Â&öw&ÒÂ–æFW‚’°  –6öç7B66†VDGG&–'WFW2Ò7W'&VçE7FFRæGG&–'WFW3° –6öç7BvVöÖWG'”GG&–'WFW2ÒvVöÖWG'’æGG&–'WFW3°  –ÆWBGG&–'WFW4çVÒÒ°  –6öç7B&öw&ÔGG&–'WFW2Ò&öw&ÒævWDGG&–'WFW2‚“°  –f÷"‚6öç7BæÖR–â&öw&ÔGG&–'WFW2’°  –6öç7B&öw&ÔGG&–'WFRÒ&öw&ÔGG&–'WFW5²æÖRÓ°  ––b‚&öw&ÔGG&–'WFRæÆö6F–öâãÒ’°  –6öç7B66†VDGG&–'WFRÒ66†VDGG&–'WFW5²æÖRÓ° –ÆWBvVöÖWG'”GG&–'WFRÒvVöÖWG'”GG&–'WFW5²æÖRÓ°  ––b‚vVöÖWG'”GG&–'WFRÓÓÒVæFVf–æVB’°  ––b‚æÖRÓÓÒv–ç7Fæ6TÖG&—‚rbbö&¦V7Bæ–ç7Fæ6TÖG&—‚’vVöÖWG'”GG&–'WFRÒö&¦V7Bæ–ç7Fæ6TÖG&—ƒ° ––b‚æÖRÓÓÒv–ç7Fæ6T6öÆ÷"rbbö&¦V7Bæ–ç7Fæ6T6öÆ÷"’vVöÖWG'”GG&–'WFRÒö&¦V7Bæ–ç7Fæ6T6öÆ÷#°  —Ð  ––b‚66†VDGG&–'WFRÓÓÒVæFVf–æVB’&WGW&âG'VS°  ––b‚66†VDGG&–'WFRæGG&–'WFRÓÒvVöÖWG'”GG&–'WFR’&WGW&âG'VS°  ––b‚vVöÖWG'”GG&–'WFRbb66†VDGG&–'WFRæFFÓÒvVöÖWG'”GG&–'WFRæFF’&WGW&âG'VS°  –GG&–'WFW4çVÒ²³°  —Ð  —Ð  ––b‚7W'&VçE7FFRæGG&–'WFW4çVÒÓÒGG&–'WFW4çVÒ’&WGW&âG'VS°  ––b‚7W'&VçE7FFRæ–æFW‚ÓÒ–æFW‚’&WGW&âG'VS°  —&WGW&âfÇ6S°  —Ð  –gVæ7F–öâ6fT66†R‚ö&¦V7BÂvVöÖWG'’Â&öw&ÒÂ–æFW‚’°  –6öç7B66†RÒ·Ó° –6öç7BGG&–'WFW2ÒvVöÖWG'’æGG&–'WFW3° –ÆWBGG&–'WFW4çVÒÒ°  –6öç7B&öw&ÔGG&–'WFW2Ò&öw&ÒævWDGG&–'WFW2‚“°  –f÷"‚6öç7BæÖR–â&öw&ÔGG&–'WFW2’°  –6öç7B&öw&ÔGG&–'WFRÒ&öw&ÔGG&–'WFW5²æÖRÓ°  ––b‚&öw&ÔGG&–'WFRæÆö6F–öâãÒ’°  –ÆWBGG&–'WFRÒGG&–'WFW5²æÖRÓ°  ––b‚GG&–'WFRÓÓÒVæFVf–æVB’°  ––b‚æÖRÓÓÒv–ç7Fæ6TÖG&—‚rbbö&¦V7Bæ–ç7Fæ6TÖG&—‚’GG&–'WFRÒö&¦V7Bæ–ç7Fæ6TÖG&—ƒ° ––b‚æÖRÓÓÒv–ç7Fæ6T6öÆ÷"rbbö&¦V7Bæ–ç7Fæ6T6öÆ÷"’GG&–'WFRÒö&¦V7Bæ–ç7Fæ6T6öÆ÷#°  —Ð  –6öç7BFFÒ·Ó° –FFæGG&–'WFRÒGG&–'WFS°  ––b‚GG&–'WFRbbGG&–'WFRæFF’°  –FFæFFÒGG&–'WFRæFF°  —Ð  –66†U²æÖRÒÒFF°  –GG&–'WFW4çVÒ²³°  —Ð  —Ð  –7W'&VçE7FFRæGG&–'WFW2Ò66†S° –7W'&VçE7FFRæGG&–'WFW4çVÒÒGG&–'WFW4çVÓ°  –7W'&VçE7FFRæ–æFW‚Ò–æFWƒ°  —Ð  –gVæ7F–öâ–æ—DGG&–'WFW2‚’°  –6öç7BæWtGG&–'WFW2Ò7W'&VçE7FFRææWtGG&–'WFW3°  –f÷"‚ÆWB’ÒÂ–ÂÒæWtGG&–'WFW2æÆVæwFƒ²’Â–Ã²’²²’°  –æWtGG&–'WFW5²’ÒÒ°  —Ð  —Ð  –gVæ7F–öâVæ&ÆTGG&–'WFR‚GG&–'WFR’°  –Væ&ÆTGG&–'WFTæDF—f—6÷"‚GG&–'WFRÂ“°  —Ð  –gVæ7F–öâVæ&ÆTGG&–'WFTæDF—f—6÷"‚GG&–'WFRÂÖW6…W$GG&–'WFR’°  –6öç7BæWtGG&–'WFW2Ò7W'&VçE7FFRææWtGG&–'WFW3° –6öç7BVæ&ÆVDGG&–'WFW2Ò7W'&VçE7FFRæVæ&ÆVDGG&–'WFW3° –6öç7BGG&–'WFTF—f—6÷'2Ò7W'&VçE7FFRæGG&–'WFTF—f—6÷'3°  –æWtGG&–'WFW5²GG&–'WFRÒÒ°  ––b‚Væ&ÆVDGG&–'WFW5²GG&–'WFRÒÓÓÒ’°  –vÂæVæ&ÆUfW'FW„GG&–$'&’‚GG&–'WFR“° –Væ&ÆVDGG&–'WFW5²GG&–'WFRÒÒ°  —Ð  ––b‚GG&–'WFTF—f—6÷'5²GG&–'WFRÒÓÒÖW6…W$GG&–'WFR’°  –vÂçfW'FW„GG&–$F—f—6÷"‚GG&–'WFRÂÖW6…W$GG&–'WFR“° –GG&–'WFTF—f—6÷'5²GG&–'WFRÒÒÖW6…W$GG&–'WFS°  —Ð  —Ð  –gVæ7F–öâF—6&ÆUVçW6VDGG&–'WFW2‚’°  –6öç7BæWtGG&–'WFW2Ò7W'&VçE7FFRææWtGG&–'WFW3° –6öç7BVæ&ÆVDGG&–'WFW2Ò7W'&VçE7FFRæVæ&ÆVDGG&–'WFW3°  –f÷"‚ÆWB’ÒÂ–ÂÒVæ&ÆVDGG&–'WFW2æÆVæwFƒ²’Â–Ã²’²²’°  ––b‚Væ&ÆVDGG&–'WFW5²’ÒÓÒæWtGG&–'WFW5²’Ò’°  –vÂæF—6&ÆUfW'FW„GG&–$'&’‚’“° –Væ&ÆVDGG&–'WFW5²’ÒÒ°  —Ð  —Ð  —Ð  –gVæ7F–öâfW'FW„GG&–%ö–çFW"‚–æFW‚Â6—¦RÂG—RÂæ÷&ÖÆ—¦VBÂ7G&–FRÂöfg6WBÂ–çFVvW"’°  ––b‚–çFVvW"ÓÓÒG'VR’°  –vÂçfW'FW„GG&–$•ö–çFW"‚–æFW‚Â6—¦RÂG—RÂ7G&–FRÂöfg6WB“°  —ÒVÇ6R°  –vÂçfW'FW„GG&–%ö–çFW"‚–æFW‚Â6—¦RÂG—RÂæ÷&ÖÆ—¦VBÂ7G&–FRÂöfg6WB“°  —Ð  —Ð  –gVæ7F–öâ6WGWfW'FW„GG&–'WFW2‚ö&¦V7BÂÖFW&–ÂÂ&öw&ÒÂvVöÖWG'’’°  ––æ—DGG&–'WFW2‚“°  –6öç7BvVöÖWG'”GG&–'WFW2ÒvVöÖWG'’æGG&–'WFW3°  –6öç7B&öw&ÔGG&–'WFW2Ò&öw&ÒævWDGG&–'WFW2‚“°  –6öç7BÖFW&–ÄFVfVÇDGG&–'WFUfÇVW2ÒÖFW&–ÂæFVfVÇDGG&–'WFUfÇVW3°  –f÷"‚6öç7BæÖR–â&öw&ÔGG&–'WFW2’°  –6öç7B&öw&ÔGG&–'WFRÒ&öw&ÔGG&–'WFW5²æÖRÓ°  ––b‚&öw&ÔGG&–'WFRæÆö6F–öâãÒ’°  –ÆWBvVöÖWG'”GG&–'WFRÒvVöÖWG'”GG&–'WFW5²æÖRÓ°  ––b‚vVöÖWG'”GG&–'WFRÓÓÒVæFVf–æVB’°  ––b‚æÖRÓÓÒv–ç7Fæ6TÖG&—‚rbbö&¦V7Bæ–ç7Fæ6TÖG&—‚’vVöÖWG'”GG&–'WFRÒö&¦V7Bæ–ç7Fæ6TÖG&—ƒ° ––b‚æÖRÓÓÒv–ç7Fæ6T6öÆ÷"rbbö&¦V7Bæ–ç7Fæ6T6öÆ÷"’vVöÖWG'”GG&–'WFRÒö&¦V7Bæ–ç7Fæ6T6öÆ÷#°  —Ð  ––b‚vVöÖWG'”GG&–'WFRÓÒVæFVf–æVB’°  –6öç7Bæ÷&ÖÆ—¦VBÒvVöÖWG'”GG&–'WFRææ÷&ÖÆ—¦VC° –6öç7B6—¦RÒvVöÖWG'”GG&–'WFRæ—FVÕ6—¦S°  –6öç7BGG&–'WFRÒGG&–'WFW2ævWB‚vVöÖWG'”GG&–'WFR“°  ’òòDôDòGG&–'WFRÖ’æ÷B&Rf–Æ&ÆRöâ6öçFW‡B&W7F÷&P  ––b‚GG&–'WFRÓÓÒVæFVf–æVB’6öçF–çVS°  –6öç7B'VffW"ÒGG&–'WFRæ'VffW#° –6öç7BG—RÒGG&–'WFRçG—S° –6öç7B'—FW5W$VÆVÖVçBÒGG&–'WFRæ'—FW5W$VÆVÖVçC°  ’òò6†V6²f÷"–çFVvW"GG&–'WFW0  –6öç7B–çFVvW"Ò‚G—RÓÓÒvÂä”åBÇÂG—RÓÓÒvÂåTå4”täTEô”åBÇÂvVöÖWG'”GG&–'WFRæwUG—RÓÓÒ–çEG—R“°  ––b‚vVöÖWG'”GG&–'WFRæ—4–çFW&ÆVfVD'VffW$GG&–'WFR’°  –6öç7BFFÒvVöÖWG'”GG&–'WFRæFF° –6öç7B7G&–FRÒFFç7G&–FS° –6öç7Böfg6WBÒvVöÖWG'”GG&–'WFRæöfg6WC°  ––b‚FFæ—4–ç7Fæ6VD–çFW&ÆVfVD'VffW"’°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  –Væ&ÆTGG&–'WFTæDF—f—6÷"‚&öw&ÔGG&–'WFRæÆö6F–öâ²’ÂFFæÖW6…W$GG&–'WFR“°  —Ð  ––b‚ö&¦V7Bæ—4–ç7Fæ6VDÖW6‚ÓÒG'VRbbvVöÖWG'’åöÖ„–ç7Fæ6T6÷VçBÓÓÒVæFVf–æVB’°  –vVöÖWG'’åöÖ„–ç7Fæ6T6÷VçBÒFFæÖW6…W$GG&–'WFR¢FFæ6÷VçC°  —Ð  —ÒVÇ6R°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  –Væ&ÆTGG&–'WFR‚&öw&ÔGG&–'WFRæÆö6F–öâ²’“°  —Ð  —Ð  –vÂæ&–æD'VffW"‚vÂä%$•ô%TddU"Â'VffW"“°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  —fW'FW„GG&–%ö–çFW"€ —&öw&ÔGG&–'WFRæÆö6F–öâ²’À —6—¦Rò&öw&ÔGG&–'WFRæÆö6F–öå6—¦RÀ —G—RÀ –æ÷&ÖÆ—¦VBÀ —7G&–FR¢'—FW5W$VÆVÖVçBÀ ’‚öfg6WB²‚6—¦Rò&öw&ÔGG&–'WFRæÆö6F–öå6—¦R’¢’’¢'—FW5W$VÆVÖVçBÀ ––çFVvW  ’“°  —Ð  —ÒVÇ6R°  ––b‚vVöÖWG'”GG&–'WFRæ—4–ç7Fæ6VD'VffW$GG&–'WFR’°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  –Væ&ÆTGG&–'WFTæDF—f—6÷"‚&öw&ÔGG&–'WFRæÆö6F–öâ²’ÂvVöÖWG'”GG&–'WFRæÖW6…W$GG&–'WFR“°  —Ð  ––b‚ö&¦V7Bæ—4–ç7Fæ6VDÖW6‚ÓÒG'VRbbvVöÖWG'’åöÖ„–ç7Fæ6T6÷VçBÓÓÒVæFVf–æVB’°  –vVöÖWG'’åöÖ„–ç7Fæ6T6÷VçBÒvVöÖWG'”GG&–'WFRæÖW6…W$GG&–'WFR¢vVöÖWG'”GG&–'WFRæ6÷VçC°  —Ð  —ÒVÇ6R°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  –Væ&ÆTGG&–'WFR‚&öw&ÔGG&–'WFRæÆö6F–öâ²’“°  —Ð  —Ð  –vÂæ&–æD'VffW"‚vÂä%$•ô%TddU"Â'VffW"“°  –f÷"‚ÆWB’Ò²’Â&öw&ÔGG&–'WFRæÆö6F–öå6—¦S²’²²’°  —fW'FW„GG&–%ö–çFW"€ —&öw&ÔGG&–'WFRæÆö6F–öâ²’À —6—¦Rò&öw&ÔGG&–'WFRæÆö6F–öå6—¦RÀ —G—RÀ –æ÷&ÖÆ—¦VBÀ —6—¦R¢'—FW5W$VÆVÖVçBÀ ’‚6—¦Rò&öw&ÔGG&–'WFRæÆö6F–öå6—¦R’¢’¢'—FW5W$VÆVÖVçBÀ ––çFVvW  ’“°  —Ð  —Ð  —ÒVÇ6R–b‚ÖFW&–ÄFVfVÇDGG&–'WFUfÇVW2ÓÒVæFVf–æVB’°  –6öç7BfÇVRÒÖFW&–ÄFVfVÇDGG&–'WFUfÇVW5²æÖRÓ°  ––b‚fÇVRÓÒVæFVf–æVB’°  —7v—F6‚‚fÇVRæÆVæwF‚’°  –66R#  –vÂçfW'FW„GG&–#&gb‚&öw&ÔGG&–'WFRæÆö6F–öâÂfÇVR“° –'&V³°  –66R3  –vÂçfW'FW„GG&–#6gb‚&öw&ÔGG&–'WFRæÆö6F–öâÂfÇVR“° –'&V³°  –66RC  –vÂçfW'FW„GG&–#Fgb‚&öw&ÔGG&–'WFRæÆö6F–öâÂfÇVR“° –'&V³°  –FVfVÇC  –vÂçfW'FW„GG&–#gb‚&öw&ÔGG&–'WFRæÆö6F–öâÂfÇVR“°  —Ð  —Ð  —Ð  —Ð  —Ð  –F—6&ÆUVçW6VDGG&–'WFW2‚“°  —Ð  –gVæ7F–öâF—7÷6R‚’°  —&W6WB‚“°  –f÷"‚6öç7BvVöÖWG'”–B–â&–æF–æu7FFW2’°  –6öç7B&öw&ÔÖÒ&–æF–æu7FFW5²vVöÖWG'”–BÓ°  –f÷"‚6öç7B&öw&Ô–B–â&öw&ÔÖ’°  –6öç7B7FFTÖÒ&öw&ÔÖ²&öw&Ô–BÓ°  –f÷"‚6öç7Bv—&Vg&ÖR–â7FFTÖ’°  –FVÆWFUfW'FW„'&”ö&¦V7B‚7FFTÖ²v—&Vg&ÖRÒæö&¦V7B“°  –FVÆWFR7FFTÖ²v—&Vg&ÖRÓ°  —Ð  –FVÆWFR&öw&ÔÖ²&öw&Ô–BÓ°  —Ð  –FVÆWFR&–æF–æu7FFW5²vVöÖWG'”–BÓ°  —Ð  —Ð  –gVæ7F–öâ&VÆV6U7FFW4ödvVöÖWG'’‚vVöÖWG'’’°  ––b‚&–æF–æu7FFW5²vVöÖWG'’æ–BÒÓÓÒVæFVf–æVB’&WGW&ã°  –6öç7B&öw&ÔÖÒ&–æF–æu7FFW5²vVöÖWG'’æ–BÓ°  –f÷"‚6öç7B&öw&Ô–B–â&öw&ÔÖ’°  –6öç7B7FFTÖÒ&öw&ÔÖ²&öw&Ô–BÓ°  –f÷"‚6öç7Bv—&Vg&ÖR–â7FFTÖ’°  –FVÆWFUfW'FW„'&”ö&¦V7B‚7FFTÖ²v—&Vg&ÖRÒæö&¦V7B“°  –FVÆWFR7FFTÖ²v—&Vg&ÖRÓ°  —Ð  –FVÆWFR&öw&ÔÖ²&öw&Ô–BÓ°  —Ð  –FVÆWFR&–æF–æu7FFW5²vVöÖWG'’æ–BÓ°  —Ð  –gVæ7F–öâ&VÆV6U7FFW4öe&öw&Ò‚&öw&Ò’°  –f÷"‚6öç7BvVöÖWG'”–B–â&–æF–æu7FFW2’°  –6öç7B&öw&ÔÖÒ&–æF–æu7FFW5²vVöÖWG'”–BÓ°  ––b‚&öw&ÔÖ²&öw&Òæ–BÒÓÓÒVæFVf–æVB’6öçF–çVS°  –6öç7B7FFTÖÒ&öw&ÔÖ²&öw&Òæ–BÓ°  –f÷"‚6öç7Bv—&Vg&ÖR–â7FFTÖ’°  –FVÆWFUfW'FW„'&”ö&¦V7B‚7FFTÖ²v—&Vg&ÖRÒæö&¦V7B“°  –FVÆWFR7FFTÖ²v—&Vg&ÖRÓ°  —Ð  –FVÆWFR&öw&ÔÖ²&öw&Òæ–BÓ°  —Ð  —Ð  –gVæ7F–öâ&W6WB‚’°  —&W6WDFVfVÇE7FFR‚“° –f÷&6UWFFRÒG'VS°  ––b‚7W'&VçE7FFRÓÓÒFVfVÇE7FFR’&WGW&ã°  –7W'&VçE7FFRÒFVfVÇE7FFS° –&–æEfW'FW„'&”ö&¦V7B‚7W'&VçE7FFRæö&¦V7B“°  —Ð  ’òòf÷"&6·v&BÖ6ö×F–&–Æ—G  –gVæ7F–öâ&W6WDFVfVÇE7FFR‚’°  –FVfVÇE7FFRævVöÖWG'’ÒçVÆÃ° –FVfVÇE7FFRç&öw&ÒÒçVÆÃ° –FVfVÇE7FFRçv—&Vg&ÖRÒfÇ6S°  —Ð  —&WGW&â°  —6WGW¢6WGWÀ —&W6WC¢&W6WBÀ —&W6WDFVfVÇE7FFS¢&W6WDFVfVÇE7FFRÀ –F—7÷6S¢F—7÷6RÀ —&VÆV6U7FFW4ödvVöÖWG'“¢&VÆV6U7FFW4ödvVöÖWG'’À —&VÆV6U7FFW4öe&öw&Ó¢&VÆV6U7FFW4öe&öw&ÒÀ  ––æ—DGG&–'WFW3¢–æ—DGG&–'WFW2À –Væ&ÆTGG&–'WFS¢Væ&ÆTGG&–'WFRÀ –F—6&ÆUVçW6VDGG&–'WFW3¢F—6&ÆUVçW6VDGG&–'WFW0  —Ó° §Ð ¦gVæ7F–öâvV$tÄ'VffW%&VæFW&W"‚vÂÂW‡FVç6–öç2Â–æfò’°  –ÆWBÖöFS°  –gVæ7F–öâ6WDÖöFR‚fÇVR’°  –ÖöFRÒfÇVS°  —Ð  –gVæ7F–öâ&VæFW"‚7F'BÂ6÷VçB’°  –vÂæG&t'&—2‚ÖöFRÂ7F'BÂ6÷VçB“°  ––æfòçWFFR‚6÷VçBÂÖöFRÂ“°  —Ð  –gVæ7F–öâ&VæFW$–ç7Fæ6W2‚7F'BÂ6÷VçBÂ&–Ö6÷VçB’°  ––b‚&–Ö6÷VçBÓÓÒ’&WGW&ã°  –vÂæG&t'&—4–ç7Fæ6VB‚ÖöFRÂ7F'BÂ6÷VçBÂ&–Ö6÷VçB“°  ––æfòçWFFR‚6÷VçBÂÖöFRÂ&–Ö6÷VçB“°  —Ð  –gVæ7F–öâ&VæFW$×VÇF”G&r‚7F'G2Â6÷VçG2ÂG&t6÷VçB’°  ––b‚G&t6÷VçBÓÓÒ’&WGW&ã°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö×VÇF•öG&rr“° –W‡FVç6–öâæ×VÇF”G&t'&—5tT$tÂ‚ÖöFRÂ7F'G2ÂÂ6÷VçG2ÂÂG&t6÷VçB“°  –ÆWBVÆVÖVçD6÷VçBÒ° –f÷"‚ÆWB’Ò²’ÂG&t6÷VçC²’²²’°  –VÆVÖVçD6÷VçB³Ò6÷VçG5²’Ó°  —Ð  ––æfòçWFFR‚VÆVÖVçD6÷VçBÂÖöFRÂ“°  —Ð  –gVæ7F–öâ&VæFW$×VÇF”G&t–ç7Fæ6W2‚7F'G2Â6÷VçG2ÂG&t6÷VçBÂ&–Ö6÷VçB’°  ––b‚G&t6÷VçBÓÓÒ’&WGW&ã°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö×VÇF•öG&rr“°  ––b‚W‡FVç6–öâÓÓÒçVÆÂ’°  –f÷"‚ÆWB’Ò²’Â7F'G2æÆVæwFƒ²’²²’°  —&VæFW$–ç7Fæ6W2‚7F'G5²’ÒÂ6÷VçG5²’ÒÂ&–Ö6÷VçE²’Ò“°  —Ð  —ÒVÇ6R°  –W‡FVç6–öâæ×VÇF”G&t'&—4–ç7Fæ6VEtT$tÂ‚ÖöFRÂ7F'G2ÂÂ6÷VçG2ÂÂ&–Ö6÷VçBÂÂG&t6÷VçB“°  –ÆWBVÆVÖVçD6÷VçBÒ° –f÷"‚ÆWB’Ò²’ÂG&t6÷VçC²’²²’°  –VÆVÖVçD6÷VçB³Ò6÷VçG5²’Ò¢&–Ö6÷VçE²’Ó°  —Ð  ––æfòçWFFR‚VÆVÖVçD6÷VçBÂÖöFRÂ“°  —Ð  —Ð  ’òð  —F†—2ç6WDÖöFRÒ6WDÖöFS° —F†—2ç&VæFW"Ò&VæFW#° —F†—2ç&VæFW$–ç7Fæ6W2Ò&VæFW$–ç7Fæ6W3° —F†—2ç&VæFW$×VÇF”G&rÒ&VæFW$×VÇF”G&s° —F†—2ç&VæFW$×VÇF”G&t–ç7Fæ6W2Ò&VæFW$×VÇF”G&t–ç7Fæ6W3° §Ð ¦gVæ7F–öâvV$tÄ6&–Æ—F–W2‚vÂÂW‡FVç6–öç2Â&ÖWFW'2ÂWF–Ç2’°  –ÆWBÖ„æ—6÷G&÷“°  –gVæ7F–öâvWDÖ„æ—6÷G&÷’‚’°  ––b‚Ö„æ—6÷G&÷’ÓÒVæFVf–æVB’&WGW&âÖ„æ—6÷G&÷“°  ––b‚W‡FVç6–öç2æ†2‚tU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2r’ÓÓÒG'VR’°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚tU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2r“°  –Ö„æ—6÷G&÷’ÒvÂævWE&ÖWFW"‚W‡FVç6–öâäÔ…õDU…EU$UôÔ…ôä•4õE$õ•ôU…B“°  —ÒVÇ6R°  –Ö„æ—6÷G&÷’Ò°  —Ð  —&WGW&âÖ„æ—6÷G&÷“°  —Ð  –gVæ7F–öâFW‡GW&Tf÷&ÖE&VF&ÆR‚FW‡GW&Tf÷&ÖB’°  ––b‚FW‡GW&Tf÷&ÖBÓÒ$t$f÷&ÖBbbWF–Ç2æ6öçfW'B‚FW‡GW&Tf÷&ÖB’ÓÒvÂævWE&ÖWFW"‚vÂä”ÕÄTÔTåDD”ôåô4ôÄõ%õ$TEôdõ$ÔB’’°  —&WGW&âfÇ6S°  —Ð  —&WGW&âG'VS°  —Ð  –gVæ7F–öâFW‡GW&UG—U&VF&ÆR‚FW‡GW&UG—R’°  –6öç7B†ÆdfÆöE7W÷'FVD'”W‡BÒ‚FW‡GW&UG—RÓÓÒ†ÆdfÆöEG—R’bb‚W‡FVç6–öç2æ†2‚tU…Eö6öÆ÷%ö'VffW%ö†ÆeöfÆöBr’ÇÂW‡FVç6–öç2æ†2‚tU…Eö6öÆ÷%ö'VffW%öfÆöBr’“°  ––b‚FW‡GW&UG—RÓÒVç6–væVD'—FUG—RbbWF–Ç2æ6öçfW'B‚FW‡GW&UG—R’ÓÒvÂævWE&ÖWFW"‚vÂä”ÕÄTÔTåDD”ôåô4ôÄõ%õ$TEõE•R’bbòòVFvRæB6‡&öÖRÖ2ÂS"‚3“S2 —FW‡GW&UG—RÓÒfÆöEG—Rbb†ÆdfÆöE7W÷'FVD'”W‡B’°  —&WGW&âfÇ6S°  —Ð  —&WGW&âG'VS°  —Ð  –gVæ7F–öâvWDÖ…&V6—6–öâ‚&V6—6–öâ’°  ––b‚&V6—6–öâÓÓÒv†–v‡r’°  ––b‚vÂævWE6†FW%&V6—6–öäf÷&ÖB‚vÂådU%DU…õ4„DU"ÂvÂä„”t…ôdÄôB’ç&V6—6–öââb` –vÂævWE6†FW%&V6—6–öäf÷&ÖB‚vÂäe$tÔTåEõ4„DU"ÂvÂä„”t…ôdÄôB’ç&V6—6–öââ’°  —&WGW&âv†–v‡s°  —Ð  —&V6—6–öâÒvÖVF—V×s°  —Ð  ––b‚&V6—6–öâÓÓÒvÖVF—V×r’°  ––b‚vÂævWE6†FW%&V6—6–öäf÷&ÖB‚vÂådU%DU…õ4„DU"ÂvÂäÔTD•TÕôdÄôB’ç&V6—6–öââb` –vÂævWE6†FW%&V6—6–öäf÷&ÖB‚vÂäe$tÔTåEõ4„DU"ÂvÂäÔTD•TÕôdÄôB’ç&V6—6–öââ’°  —&WGW&âvÖVF—V×s°  —Ð  —Ð  —&WGW&âvÆ÷ws°  —Ð  –ÆWB&V6—6–öâÒ&ÖWFW'2ç&V6—6–öâÓÒVæFVf–æVBò&ÖWFW'2ç&V6—6–öâ¢v†–v‡s° –6öç7BÖ…&V6—6–öâÒvWDÖ…&V6—6–öâ‚&V6—6–öâ“°  ––b‚Ö…&V6—6–öâÓÒ&V6—6–öâ’°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢rÂ&V6—6–öâÂvæ÷B7W÷'FVBÂW6–ærrÂÖ…&V6—6–öâÂv–ç7FVBâr“° —&V6—6–öâÒÖ…&V6—6–öã°  —Ð  –6öç7BÆöv&—F†Ö–4FWF„'VffW"Ò&ÖWFW'2æÆöv&—F†Ö–4FWF„'VffW"ÓÓÒG'VS° –6öç7B&WfW'6VDFWF„'VffW"Ò&ÖWFW'2ç&WfW'6VDFWF„'VffW"ÓÓÒG'VRbbW‡FVç6–öç2æ†2‚tU…Eö6Æ—ö6öçG&öÂr“°  –6öç7BÖ…FW‡GW&W2ÒvÂævWE&ÖWFW"‚vÂäÔ…õDU…EU$Uô”ÔtUõTä•E2“° –6öç7BÖ…fW'FW…FW‡GW&W2ÒvÂævWE&ÖWFW"‚vÂäÔ…õdU%DU…õDU…EU$Uô”ÔtUõTä•E2“° –6öç7BÖ…FW‡GW&U6—¦RÒvÂævWE&ÖWFW"‚vÂäÔ…õDU…EU$Uõ4•¤R“° –6öç7BÖ„7V&VÖ6—¦RÒvÂævWE&ÖWFW"‚vÂäÔ…ô5T$UôÔõDU…EU$Uõ4•¤R“°  –6öç7BÖ„GG&–'WFW2ÒvÂævWE&ÖWFW"‚vÂäÔ…õdU%DU…ôEE$”%2“° –6öç7BÖ…fW'FW…Væ–f÷&×2ÒvÂævWE&ÖWFW"‚vÂäÔ…õdU%DU…õTä”dõ$ÕõdT5Dõ%2“° –6öç7BÖ…f'––æw2ÒvÂævWE&ÖWFW"‚vÂäÔ…õd%””äuõdT5Dõ%2“° –6öç7BÖ„g&vÖVçEVæ–f÷&×2ÒvÂævWE&ÖWFW"‚vÂäÔ…ôe$tÔTåEõTä”dõ$ÕõdT5Dõ%2“°  –6öç7BfW'FW…FW‡GW&W2ÒÖ…fW'FW…FW‡GW&W2â°  –6öç7BÖ…6×ÆW2ÒvÂævWE&ÖWFW"‚vÂäÔ…õ4ÕÄU2“°  —&WGW&â°  –—5vV$tÃ#¢G'VRÂòò¶VW–ærF†—2f÷"&6·v&G26ö×F–&–Æ—G  –vWDÖ„æ—6÷G&÷“¢vWDÖ„æ—6÷G&÷’À –vWDÖ…&V6—6–öã¢vWDÖ…&V6—6–öâÀ  —FW‡GW&Tf÷&ÖE&VF&ÆS¢FW‡GW&Tf÷&ÖE&VF&ÆRÀ —FW‡GW&UG—U&VF&ÆS¢FW‡GW&UG—U&VF&ÆRÀ  —&V6—6–öã¢&V6—6–öâÀ –Æöv&—F†Ö–4FWF„'VffW#¢Æöv&—F†Ö–4FWF„'VffW"À —&WfW'6VDFWF„'VffW#¢&WfW'6VDFWF„'VffW"À  –Ö…FW‡GW&W3¢Ö…FW‡GW&W2À –Ö…fW'FW…FW‡GW&W3¢Ö…fW'FW…FW‡GW&W2À –Ö…FW‡GW&U6—¦S¢Ö…FW‡GW&U6—¦RÀ –Ö„7V&VÖ6—¦S¢Ö„7V&VÖ6—¦RÀ  –Ö„GG&–'WFW3¢Ö„GG&–'WFW2À –Ö…fW'FW…Væ–f÷&×3¢Ö…fW'FW…Væ–f÷&×2À –Ö…f'––æw3¢Ö…f'––æw2À –Ö„g&vÖVçEVæ–f÷&×3¢Ö„g&vÖVçEVæ–f÷&×2À  —fW'FW…FW‡GW&W3¢fW'FW…FW‡GW&W2À  –Ö…6×ÆW3¢Ö…6×ÆW0  —Ó° §Ð ¦gVæ7F–öâvV$tÄ6Æ—–ær‚&÷W'F–W2’°  –6öç7B66÷RÒF†—3°  –ÆWBvÆö&Å7FFRÒçVÆÂÀ –çVÔvÆö&ÅÆæW2ÒÀ –Æö6Ä6Æ—–ætVæ&ÆVBÒfÇ6RÀ —&VæFW&–æu6†F÷w2ÒfÇ6S°  –6öç7BÆæRÒæWrÆæR‚’À —f–Wtæ÷&ÖÄÖG&—‚ÒæWrÖG&—ƒ2‚’À  —Væ–f÷&ÒÒ²fÇVS¢çVÆÂÂæVVG5WFFS¢fÇ6RÓ°  —F†—2çVæ–f÷&ÒÒVæ–f÷&Ó° —F†—2æçVÕÆæW2Ò° —F†—2æçVÔ–çFW'6V7F–öâÒ°  —F†—2æ–æ—BÒgVæ7F–öâ‚ÆæW2ÂVæ&ÆTÆö6Ä6Æ—–ær’°  –6öç7BVæ&ÆVBÐ —ÆæW2æÆVæwF‚ÓÒÇÀ –Væ&ÆTÆö6Ä6Æ—–ærÇÀ ’òòVæ&ÆR7FFRöb&Wf–÷W2g&ÖRÒF†R6Æ—–ær6öFR†2Fð ’òò'Vâæ÷F†W"g&ÖR–â÷&FW"Fò&W6WBF†R7FFS  –çVÔvÆö&ÅÆæW2ÓÒÇÀ –Æö6Ä6Æ—–ætVæ&ÆVC°  –Æö6Ä6Æ—–ætVæ&ÆVBÒVæ&ÆTÆö6Ä6Æ—–æs°  –çVÔvÆö&ÅÆæW2ÒÆæW2æÆVæwFƒ°  —&WGW&âVæ&ÆVC°  —Ó°  —F†—2æ&Vv–å6†F÷w2ÒgVæ7F–öâ‚’°  —&VæFW&–æu6†F÷w2ÒG'VS° —&ö¦V7EÆæW2‚çVÆÂ“°  —Ó°  —F†—2æVæE6†F÷w2ÒgVæ7F–öâ‚’°  —&VæFW&–æu6†F÷w2ÒfÇ6S°  —Ó°  —F†—2ç6WDvÆö&Å7FFRÒgVæ7F–öâ‚ÆæW2Â6ÖW&’°  –vÆö&Å7FFRÒ&ö¦V7EÆæW2‚ÆæW2Â6ÖW&Â“°  —Ó°  —F†—2ç6WE7FFRÒgVæ7F–öâ‚ÖFW&–ÂÂ6ÖW&ÂW6T66†R’°  –6öç7BÆæW2ÒÖFW&–Âæ6Æ—–æuÆæW2À –6Æ—–çFW'6V7F–öâÒÖFW&–Âæ6Æ—–çFW'6V7F–öâÀ –6Æ—6†F÷w2ÒÖFW&–Âæ6Æ—6†F÷w3°  –6öç7BÖFW&–Å&÷W'F–W2Ò&÷W'F–W2ævWB‚ÖFW&–Â“°  ––b‚Æö6Ä6Æ—–ætVæ&ÆVBÇÂÆæW2ÓÓÒçVÆÂÇÂÆæW2æÆVæwF‚ÓÓÒÇÂ&VæFW&–æu6†F÷w2bb6Æ—6†F÷w2’°  ’òòF†W&Rw2æòÆö6Â6Æ—–æp  ––b‚&VæFW&–æu6†F÷w2’°  ’òòF†W&Rw2æòvÆö&Â6Æ—–æp  —&ö¦V7EÆæW2‚çVÆÂ“°  —ÒVÇ6R°  —&W6WDvÆö&Å7FFR‚“°  —Ð  —ÒVÇ6R°  –6öç7BävÆö&ÂÒ&VæFW&–æu6†F÷w2ò¢çVÔvÆö&ÅÆæW2À –ÄvÆö&ÂÒävÆö&Â¢C°  –ÆWBG7D'&’ÒÖFW&–Å&÷W'F–W2æ6Æ—–æu7FFRÇÂçVÆÃ°  —Væ–f÷&ÒçfÇVRÒG7D'&“²òòVç7W&RVæ—VR7FFP  –G7D'&’Ò&ö¦V7EÆæW2‚ÆæW2Â6ÖW&ÂÄvÆö&ÂÂW6T66†R“°  –f÷"‚ÆWB’Ò²’ÓÒÄvÆö&Ã²²²’’°  –G7D'&•²’ÒÒvÆö&Å7FFU²’Ó°  —Ð  –ÖFW&–Å&÷W'F–W2æ6Æ—–æu7FFRÒG7D'&“° —F†—2æçVÔ–çFW'6V7F–öâÒ6Æ—–çFW'6V7F–öâòF†—2æçVÕÆæW2¢° —F†—2æçVÕÆæW2³ÒävÆö&Ã°  —Ð   —Ó°  –gVæ7F–öâ&W6WDvÆö&Å7FFR‚’°  ––b‚Væ–f÷&ÒçfÇVRÓÒvÆö&Å7FFR’°  —Væ–f÷&ÒçfÇVRÒvÆö&Å7FFS° —Væ–f÷&ÒææVVG5WFFRÒçVÔvÆö&ÅÆæW2â°  —Ð  —66÷RæçVÕÆæW2ÒçVÔvÆö&ÅÆæW3° —66÷RæçVÔ–çFW'6V7F–öâÒ°  —Ð  –gVæ7F–öâ&ö¦V7EÆæW2‚ÆæW2Â6ÖW&ÂG7Döfg6WBÂ6¶—G&ç6f÷&Ò’°  –6öç7BåÆæW2ÒÆæW2ÓÒçVÆÂòÆæW2æÆVæwF‚¢° –ÆWBG7D'&’ÒçVÆÃ°  ––b‚åÆæW2ÓÒ’°  –G7D'&’ÒVæ–f÷&ÒçfÇVS°  ––b‚6¶—G&ç6f÷&ÒÓÒG'VRÇÂG7D'&’ÓÓÒçVÆÂ’°  –6öç7BfÆE6—¦RÒG7Döfg6WB²åÆæW2¢BÀ —f–WtÖG&—‚Ò6ÖW&æÖG&—…v÷&ÆD–çfW'6S°  —f–Wtæ÷&ÖÄÖG&—‚ævWDæ÷&ÖÄÖG&—‚‚f–WtÖG&—‚“°  ––b‚G7D'&’ÓÓÒçVÆÂÇÂG7D'&’æÆVæwF‚ÂfÆE6—¦R’°  –G7D'&’ÒæWrfÆöC3$'&’‚fÆE6—¦R“°  —Ð  –f÷"‚ÆWB’ÒÂ“BÒG7Döfg6WC²’ÓÒåÆæW3²²²’Â“B³ÒB’°  —ÆæRæ6÷’‚ÆæW5²’Ò’æÇ”ÖG&—ƒB‚f–WtÖG&—‚Âf–Wtæ÷&ÖÄÖG&—‚“°  —ÆæRææ÷&ÖÂçFô'&’‚G7D'&’Â“B“° –G7D'&•²“B²2ÒÒÆæRæ6öç7FçC°  —Ð  —Ð  —Væ–f÷&ÒçfÇVRÒG7D'&“° —Væ–f÷&ÒææVVG5WFFRÒG'VS°  —Ð  —66÷RæçVÕÆæW2ÒåÆæW3° —66÷RæçVÔ–çFW'6V7F–öâÒ°  —&WGW&âG7D'&“°  —Ð §Ð ¦gVæ7F–öâvV$tÄ7V&TÖ2‚&VæFW&W"’°  –ÆWB7V&VÖ2ÒæWrvV´Ö‚“°  –gVæ7F–öâÖFW‡GW&TÖ–ær‚FW‡GW&RÂÖ–ær’°  ––b‚Ö–ærÓÓÒWV—&V7FæwVÆ%&VfÆV7F–öäÖ–ær’°  —FW‡GW&RæÖ–ærÒ7V&U&VfÆV7F–öäÖ–æs°  —ÒVÇ6R–b‚Ö–ærÓÓÒWV—&V7FæwVÆ%&Vg&7F–öäÖ–ær’°  —FW‡GW&RæÖ–ærÒ7V&U&Vg&7F–öäÖ–æs°  —Ð  —&WGW&âFW‡GW&S°  —Ð  –gVæ7F–öâvWB‚FW‡GW&R’°  ––b‚FW‡GW&RbbFW‡GW&Ræ—5FW‡GW&R’°  –6öç7BÖ–ærÒFW‡GW&RæÖ–æs°  ––b‚Ö–ærÓÓÒWV—&V7FæwVÆ%&VfÆV7F–öäÖ–ærÇÂÖ–ærÓÓÒWV—&V7FæwVÆ%&Vg&7F–öäÖ–ær’°  ––b‚7V&VÖ2æ†2‚FW‡GW&R’’°  –6öç7B7V&VÖÒ7V&VÖ2ævWB‚FW‡GW&R’çFW‡GW&S° —&WGW&âÖFW‡GW&TÖ–ær‚7V&VÖÂFW‡GW&RæÖ–ær“°  —ÒVÇ6R°  –6öç7B–ÖvRÒFW‡GW&Ræ–ÖvS°  ––b‚–ÖvRbb–ÖvRæ†V–v‡Bâ’°  –6öç7B&VæFW%F&vWBÒæWrvV$tÄ7V&U&VæFW%F&vWB‚–ÖvRæ†V–v‡B“° —&VæFW%F&vWBæg&öÔWV—&V7FæwVÆ%FW‡GW&R‚&VæFW&W"ÂFW‡GW&R“° –7V&VÖ2ç6WB‚FW‡GW&RÂ&VæFW%F&vWB“°  —FW‡GW&RæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåFW‡GW&TF—7÷6R“°  —&WGW&âÖFW‡GW&TÖ–ær‚&VæFW%F&vWBçFW‡GW&RÂFW‡GW&RæÖ–ær“°  —ÒVÇ6R°  ’òò–ÖvRæ÷B–WB&VG’âG'’F†R6öçfW'6–öâæW‡Bg&ÖP  —&WGW&âçVÆÃ°  —Ð  —Ð  —Ð  —Ð  —&WGW&âFW‡GW&S°  —Ð  –gVæ7F–öâöåFW‡GW&TF—7÷6R‚WfVçB’°  –6öç7BFW‡GW&RÒWfVçBçF&vWC°  —FW‡GW&Rç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåFW‡GW&TF—7÷6R“°  –6öç7B7V&VÖÒ7V&VÖ2ævWB‚FW‡GW&R“°  ––b‚7V&VÖÓÒVæFVf–æVB’°  –7V&VÖ2æFVÆWFR‚FW‡GW&R“° –7V&VÖæF—7÷6R‚“°  —Ð  —Ð  –gVæ7F–öâF—7÷6R‚’°  –7V&VÖ2ÒæWrvV´Ö‚“°  —Ð  —&WGW&â° –vWC¢vWBÀ –F—7÷6S¢F—7÷6P —Ó° §Ð ¦6öç7BÄôEôÔ”âÒC° ¢òòF†R7FæF&BFWf–F–öç2‡&F–ç2’76ö6–FVBv—F‚F†RW‡G&Ö—2âF†W6R&P¢òò6†÷6VâFò&÷†–ÖFRG&÷v'&–FvRÕ&V—G¢F—7G&–'WF–öâgVæ7F–öâF–ÖW2F†P¢òòvVöÖWG&–26†F÷v–ærgVæ7F–öââF†W6R6–vÖfÇVW27V&VB×W7BÖF6‚F†P¢òòf&–æ6R6FVf–æW2–â7V&U÷We÷&VfÆV7F–öåög&vÖVçBævÇ6Âæ§2à¦6öç7BU…E$ôÄôEõ4”tÔÒ²ã#RÂã#RÂã3RÂãCCbÂãS#bÂãSƒ"Ó° ¢òòF†RÖ†–×VÒÆVæwF‚öbF†R&ÇW"f÷"Æö÷â6ÖÆÆW"6–vÖ2v–ÆÂW6RfWvW ¢òò6×ÆW2æBW†—BV&Ç’Â'WBæ÷B&V6ö×–ÆRF†R6†FW"à¦6öç7BÔ…õ4ÕÄU2Ò#° ¦6öç7BöfÆD6ÖW&Òò¤õõU$Uõò¢òæWr÷'F†öw&†–46ÖW&‚“°¦6öç7Bö6ÆV$6öÆ÷"Òò¤õõU$Uõò¢òæWr6öÆ÷"‚“°¦ÆWBööÆEF&vWBÒçVÆÃ°¦ÆWBööÆD7F—fT7V&Tf6RÒ°¦ÆWBööÆD7F—fTÖ—ÖÆWfVÂÒ°¦ÆWBööÆE‡$Væ&ÆVBÒfÇ6S° ¢òòvöÆFVâ&F–ð¦6öç7B„’Ò‚²ÖF‚ç7'B‚R’’ò#°¦6öç7B”åeõ„’Òò„“° ¢òòfW'F–6W2öbFöFV6†VG&öâ†W†6WBF†R÷÷6—FW2Âv†–6‚&W&W6VçBF†P¢òò6ÖR†—2’ÂW6VB2†—2F—&V7F–öç2WfVæÇ’7&VBöâ7†W&Rà¦6öç7Bö†—4F—&V7F–öç2Ò° ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚Ò„’Â”åeõ„’Â’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚„’Â”åeõ„’Â’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚Ò”åeõ„’ÂÂ„’’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚”åeõ„’ÂÂ„’’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚Â„’ÂÒ”åeõ„’’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚Â„’Â”åeõ„’’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚ÓÂÂÓ’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚ÂÂÓ’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚ÓÂÂ’À ’ò¤õõU$Uõò¢òæWrfV7F÷#2‚ÂÂ’Ó° ¦6öç7Bö÷&–v–âÒò¤õõU$Uõò¢òæWrfV7F÷#2‚“° ¢ò¢ ¢¢F†—26Æ72vVæW&FW2&Vf–ÇFW&VBÂÖ—ÖVB&F–æ6RVçf—&öæÖVçBÖ ¢¢…Õ$TÒ’g&öÒ7V&TÖVçf—&öæÖVçBFW‡GW&RâF†—2ÆÆ÷w2F–ffW&VçBÆWfVÇ2ö`¢¢&ÇW"Fò&RV–6¶Ç’66W76VB&6VBöâÖFW&–Â&÷Vv†æW72â—B—26¶VB–çFò¢¢7V6–Â7V&UUbf÷&ÖBF†BÆÆ÷w2W2FòW&f÷&Ò7W7FöÒ–çFW'öÆF–öâ6òF†@¢¢vR6â7W÷'BæöæÆ–æV"f÷&ÖG27V6‚2$t$RâVæÆ–¶RG&F—F–öæÂÖ—Ö ¢¢6†–âÂ—BöæÇ’vöW2F÷vâFòF†RÄôEôÔ”âÆWfVÂ†&÷fR’ÂæBF†Vâ7&VFW2W‡G&¢¢WfVâÖ÷&Rf–ÇFW&VBvÖ—2rBF†R6ÖRÄôEôÔ”â&W6öÇWF–öâÂ76ö6–FVBv—F€¢¢†–v†W"&÷Vv†æW72ÆWfVÇ2â–âF†—2v’vRÖ–çF–â&W6öÇWF–öâFò6Öö÷F†Ç¢¢–çFW'öÆFRF–fgW6RÆ–v‡F–ærv†–ÆRÆ–Ö—F–ær6×Æ–ær6ö×WFF–öâà¢ ¢¢W#¢f7BÂ67W&FR–ÖvRÔ&6VBÆ–v‡F–æs ¢¢´Æ–æ²‡GG3¢òöG&—fRævöövÆRæ6öÒöf–ÆRöBóW“‡%õW¶ÅS•7ecD”Æ#375V53‡dÇ¢÷f–WwÐ¢¢ð¦6Æ72Õ$TÔvVæW&F÷"°  ’ò¢  ’¢6öç7G'V7G2æWrÕ$TÒvVæW&F÷"à ’  ’¢&ÒµvV$tÅ&VæFW&W'Ò&VæFW&W"ÒF†R&VæFW&W"à ’¢ð –6öç7G'V7F÷"‚&VæFW&W"’°  —F†—2å÷&VæFW&W"Ò&VæFW&W#° —F†—2å÷–æuöæu&VæFW%F&vWBÒçVÆÃ°  —F†—2åöÆöDÖ‚Ò° —F†—2åö7V&U6—¦RÒ° —F†—2åöÆöEÆæW2ÒµÓ° —F†—2å÷6—¦TÆöG2ÒµÓ° —F†—2å÷6–vÖ2ÒµÓ°  —F†—2åö&ÇW$ÖFW&–ÂÒçVÆÃ° —F†—2åö7V&VÖÖFW&–ÂÒçVÆÃ° —F†—2åöWV—&V7DÖFW&–ÂÒçVÆÃ°  —F†—2åö6ö×–ÆTÖFW&–Â‚F†—2åö&ÇW$ÖFW&–Â“°  —Ð  ’ò¢  ’¢vVæW&FW2Õ$TÒg&öÒ7WÆ–VB66VæRÂv†–6‚6â&Rf7FW"F†âW6–ærà ’¢–ÖvR–bæWGv÷&¶–ær&æGv–GF‚—2Æ÷râ÷F–öæÂ6–vÖ7V6–f–W2&ÇW"&F—W0 ’¢–â&F–ç2Fò&RÆ–VBFòF†R66VæR&Vf÷&RÕ$TÒvVæW&F–öââ÷F–öæÂæV  ’¢æBf"ÆæW2Vç7W&RF†R66VæR—2&VæFW&VB–â—G2VçF—&WG’à ’  ’¢&Òµ66VæWÒ66VæRÒF†R66VæRFò&R6GW&VBà ’¢&Ò¶çVÖ&W'Ò·6–vÖÓÒÒF†R&ÇW"&F—W2–â&F–ç2à ’¢&Ò¶çVÖ&W'Ò¶æV#ÓãÒÒF†RæV"ÆæRF—7Fæ6Rà ’¢&Ò¶çVÖ&W'Ò¶f#ÓÒÒF†Rf"ÆæRF—7Fæ6Rà ’¢&Ò´ö&¦V7GÒ¶÷F–öç3×·ÕÒÒF†R6öæf–wW&F–öâ÷F–öç2à ’¢&Ò¶çVÖ&W'Ò¶÷F–öç2ç6—¦SÓ#SeÒÒF†RFW‡GW&R6—¦RöbF†RÕ$TÒà ’¢&ÒµfV7F÷#7Ò¶÷F–öç2ç&VæFW%F&vWCÖ÷&–v–åÒÒF†R÷6—F–öâöbF†R–çFW&æÂ7V&R6ÖW&F†B&VæFW'2F†R66VæRà ’¢&WGW&âµvV$tÅ&VæFW%F&vWGÒF†R&W7VÇF–ærÕ$TÒà ’¢ð –g&öÕ66VæR‚66VæRÂ6–vÖÒÂæV"ÒãÂf"ÒÂ÷F–öç2Ò·Ò’°  –6öç7B° —6—¦RÒ#SbÀ —÷6—F–öâÒö÷&–v–âÀ —ÒÒ÷F–öç3°  •ööÆEF&vWBÒF†—2å÷&VæFW&W"ævWE&VæFW%F&vWB‚“° •ööÆD7F—fT7V&Tf6RÒF†—2å÷&VæFW&W"ævWD7F—fT7V&Tf6R‚“° •ööÆD7F—fTÖ—ÖÆWfVÂÒF†—2å÷&VæFW&W"ævWD7F—fTÖ—ÖÆWfVÂ‚“° •ööÆE‡$Væ&ÆVBÒF†—2å÷&VæFW&W"ç‡"æVæ&ÆVC°  —F†—2å÷&VæFW&W"ç‡"æVæ&ÆVBÒfÇ6S°  —F†—2å÷6WE6—¦R‚6—¦R“°  –6öç7B7V&UUe&VæFW%F&vWBÒF†—2åöÆÆö6FUF&vWG2‚“° –7V&UUe&VæFW%F&vWBæFWF„'VffW"ÒG'VS°  —F†—2å÷66VæUFô7V&UUb‚66VæRÂæV"Âf"Â7V&UUe&VæFW%F&vWBÂ÷6—F–öâ“°  ––b‚6–vÖâ’°  —F†—2åö&ÇW"‚7V&UUe&VæFW%F&vWBÂÂÂ6–vÖ“°  —Ð  —F†—2åöÇ•Õ$TÒ‚7V&UUe&VæFW%F&vWB“° —F†—2åö6ÆVçW‚7V&UUe&VæFW%F&vWB“°  —&WGW&â7V&UUe&VæFW%F&vWC°  —Ð  ’ò¢  ’¢vVæW&FW2Õ$TÒg&öÒâWV—&V7FæwVÆ"FW‡GW&RÂv†–6‚6â&RV—F†W"ÄE  ’¢÷"„E"âF†R–FVÂ–çWB–ÖvR6—¦R—2²ƒ#B‚S"’À ’¢2F†—2ÖF6†W2&W7Bv—F‚F†R#Sb‚#Sb7V&VÖ÷WGWBà ’  ’¢&ÒµFW‡GW&WÒWV—&V7FæwVÆ"ÒF†RWV—&V7FæwVÆ"FW‡GW&RFò&R6öçfW'FVBà ’¢&Ò³õvV$tÅ&VæFW%F&vWGÒ·&VæFW%F&vWCÖçVÆÅÒÒF†R&VæFW"F&vWBFòW6Rà ’¢&WGW&âµvV$tÅ&VæFW%F&vWGÒF†R&W7VÇF–ærÕ$TÒà ’¢ð –g&öÔWV—&V7FæwVÆ"‚WV—&V7FæwVÆ"Â&VæFW%F&vWBÒçVÆÂ’°  —&WGW&âF†—2åög&öÕFW‡GW&R‚WV—&V7FæwVÆ"Â&VæFW%F&vWB“°  —Ð  ’ò¢  ’¢vVæW&FW2Õ$TÒg&öÒâ7V&VÖFW‡GW&RÂv†–6‚6â&RV—F†W"ÄE  ’¢÷"„E"âF†R–FVÂ–çWB7V&R6—¦R—2#Sb‚#SbÀ ’¢2F†—2ÖF6†W2&W7Bv—F‚F†R#Sb‚#Sb7V&VÖ÷WGWBà ’  ’¢&ÒµFW‡GW&WÒ7V&VÖÒF†R7V&VÖFW‡GW&RFò&R6öçfW'FVBà ’¢&Ò³õvV$tÅ&VæFW%F&vWGÒ·&VæFW%F&vWCÖçVÆÅÒÒF†R&VæFW"F&vWBFòW6Rà ’¢&WGW&âµvV$tÅ&VæFW%F&vWGÒF†R&W7VÇF–ærÕ$TÒà ’¢ð –g&öÔ7V&VÖ‚7V&VÖÂ&VæFW%F&vWBÒçVÆÂ’°  —&WGW&âF†—2åög&öÕFW‡GW&R‚7V&VÖÂ&VæFW%F&vWB“°  —Ð  ’ò¢  ’¢&RÖ6ö×–ÆW2F†R7V&VÖ6†FW"â–÷R6âvWBf7FW"7F'B×W'’–çfö¶–ærF†—2ÖWF†öBGW&–æp ’¢–÷W"FW‡GW&Rw2æWGv÷&²fWF6‚f÷"–æ7&V6VB6öæ7W'&Væ7’à ’¢ð –6ö×–ÆT7V&VÖ6†FW"‚’°  ––b‚F†—2åö7V&VÖÖFW&–ÂÓÓÒçVÆÂ’°  —F†—2åö7V&VÖÖFW&–ÂÒövWD7V&VÖÖFW&–Â‚“° —F†—2åö6ö×–ÆTÖFW&–Â‚F†—2åö7V&VÖÖFW&–Â“°  —Ð  —Ð  ’ò¢  ’¢&RÖ6ö×–ÆW2F†RWV—&V7FæwVÆ"6†FW"â–÷R6âvWBf7FW"7F'B×W'’–çfö¶–ærF†—2ÖWF†öBGW&–æp ’¢–÷W"FW‡GW&Rw2æWGv÷&²fWF6‚f÷"–æ7&V6VB6öæ7W'&Væ7’à ’¢ð –6ö×–ÆTWV—&V7FæwVÆ%6†FW"‚’°  ––b‚F†—2åöWV—&V7DÖFW&–ÂÓÓÒçVÆÂ’°  —F†—2åöWV—&V7DÖFW&–ÂÒövWDWV—&V7DÖFW&–Â‚“° —F†—2åö6ö×–ÆTÖFW&–Â‚F†—2åöWV—&V7DÖFW&–Â“°  —Ð  —Ð  ’ò¢  ’¢F—7÷6W2öbF†RÕ$TÔvVæW&F÷"w2–çFW&æÂÖVÖ÷'’âæ÷FRF†BÕ$TÔvVæW&F÷"—27FF–26Æ72À ’¢6ò–÷R6†÷VÆBæ÷BæVVBÖ÷&RF†âöæRÕ$TÔvVæW&F÷"ö&¦V7Bâ–b–÷RFòÂ6ÆÆ–ærF—7÷6R‚’öà ’¢öæRöbF†VÒv–ÆÂ6W6Rç’÷F†W'2FòÇ6ò&V6öÖRVçW6&ÆRà ’¢ð –F—7÷6R‚’°  —F†—2åöF—7÷6R‚“°  ––b‚F†—2åö7V&VÖÖFW&–ÂÓÒçVÆÂ’F†—2åö7V&VÖÖFW&–ÂæF—7÷6R‚“° ––b‚F†—2åöWV—&V7DÖFW&–ÂÓÒçVÆÂ’F†—2åöWV—&V7DÖFW&–ÂæF—7÷6R‚“°  —Ð  ’òò&—fFR–çFW&f6P  •÷6WE6—¦R‚7V&U6—¦R’°  —F†—2åöÆöDÖ‚ÒÖF‚æfÆö÷"‚ÖF‚æÆös"‚7V&U6—¦R’“° —F†—2åö7V&U6—¦RÒÖF‚ç÷r‚"ÂF†—2åöÆöDÖ‚“°  —Ð  •öF—7÷6R‚’°  ––b‚F†—2åö&ÇW$ÖFW&–ÂÓÒçVÆÂ’F†—2åö&ÇW$ÖFW&–ÂæF—7÷6R‚“°  ––b‚F†—2å÷–æuöæu&VæFW%F&vWBÓÒçVÆÂ’F†—2å÷–æuöæu&VæFW%F&vWBæF—7÷6R‚“°  –f÷"‚ÆWB’Ò²’ÂF†—2åöÆöEÆæW2æÆVæwFƒ²’²²’°  —F†—2åöÆöEÆæW5²’ÒæF—7÷6R‚“°  —Ð  —Ð  •ö6ÆVçW‚÷WGWEF&vWB’°  —F†—2å÷&VæFW&W"ç6WE&VæFW%F&vWB‚ööÆEF&vWBÂööÆD7F—fT7V&Tf6RÂööÆD7F—fTÖ—ÖÆWfVÂ“° —F†—2å÷&VæFW&W"ç‡"æVæ&ÆVBÒööÆE‡$Væ&ÆVC°  –÷WGWEF&vWBç66—76÷%FW7BÒfÇ6S° •÷6WEf–Ww÷'B‚÷WGWEF&vWBÂÂÂ÷WGWEF&vWBçv–GF‚Â÷WGWEF&vWBæ†V–v‡B“°  —Ð  •ög&öÕFW‡GW&R‚FW‡GW&RÂ&VæFW%F&vWB’°  ––b‚FW‡GW&RæÖ–ærÓÓÒ7V&U&VfÆV7F–öäÖ–ærÇÂFW‡GW&RæÖ–ærÓÓÒ7V&U&Vg&7F–öäÖ–ær’°  —F†—2å÷6WE6—¦R‚FW‡GW&Ræ–ÖvRæÆVæwF‚ÓÓÒòb¢‚FW‡GW&Ræ–ÖvU²Òçv–GF‚ÇÂFW‡GW&Ræ–ÖvU²Òæ–ÖvRçv–GF‚’“°  —ÒVÇ6R²òòWV—&V7FæwVÆ   —F†—2å÷6WE6—¦R‚FW‡GW&Ræ–ÖvRçv–GF‚òB“°  —Ð  •ööÆEF&vWBÒF†—2å÷&VæFW&W"ævWE&VæFW%F&vWB‚“° •ööÆD7F—fT7V&Tf6RÒF†—2å÷&VæFW&W"ævWD7F—fT7V&Tf6R‚“° •ööÆD7F—fTÖ—ÖÆWfVÂÒF†—2å÷&VæFW&W"ævWD7F—fTÖ—ÖÆWfVÂ‚“° •ööÆE‡$Væ&ÆVBÒF†—2å÷&VæFW&W"ç‡"æVæ&ÆVC°  —F†—2å÷&VæFW&W"ç‡"æVæ&ÆVBÒfÇ6S°  –6öç7B7V&UUe&VæFW%F&vWBÒ&VæFW%F&vWBÇÂF†—2åöÆÆö6FUF&vWG2‚“° —F†—2å÷FW‡GW&UFô7V&UUb‚FW‡GW&RÂ7V&UUe&VæFW%F&vWB“° —F†—2åöÇ•Õ$TÒ‚7V&UUe&VæFW%F&vWB“° —F†—2åö6ÆVçW‚7V&UUe&VæFW%F&vWB“°  —&WGW&â7V&UUe&VæFW%F&vWC°  —Ð  •öÆÆö6FUF&vWG2‚’°  –6öç7Bv–GF‚Ò2¢ÖF‚æÖ‚‚F†—2åö7V&U6—¦RÂb¢r“° –6öç7B†V–v‡BÒB¢F†—2åö7V&U6—¦S°  –6öç7B&×2Ò° –Ötf–ÇFW#¢Æ–æV$f–ÇFW"À –Ö–äf–ÇFW#¢Æ–æV$f–ÇFW"À –vVæW&FTÖ—Ö3¢fÇ6RÀ —G—S¢†ÆdfÆöEG—RÀ –f÷&ÖC¢$t$f÷&ÖBÀ –6öÆ÷%76S¢Æ–æV%5$t$6öÆ÷%76RÀ –FWF„'VffW#¢fÇ6P —Ó°  –6öç7B7V&UUe&VæFW%F&vWBÒö7&VFU&VæFW%F&vWB‚v–GF‚Â†V–v‡BÂ&×2“°  ––b‚F†—2å÷–æuöæu&VæFW%F&vWBÓÓÒçVÆÂÇÂF†—2å÷–æuöæu&VæFW%F&vWBçv–GF‚ÓÒv–GF‚ÇÂF†—2å÷–æuöæu&VæFW%F&vWBæ†V–v‡BÓÒ†V–v‡B’°  ––b‚F†—2å÷–æuöæu&VæFW%F&vWBÓÒçVÆÂ’°  —F†—2åöF—7÷6R‚“°  —Ð  —F†—2å÷–æuöæu&VæFW%F&vWBÒö7&VFU&VæFW%F&vWB‚v–GF‚Â†V–v‡BÂ&×2“°  –6öç7B²öÆöDÖ‚ÒÒF†—3° ’‚²6—¦TÆöG3¢F†—2å÷6—¦TÆöG2ÂÆöEÆæW3¢F†—2åöÆöEÆæW2Â6–vÖ3¢F†—2å÷6–vÖ2ÒÒö7&VFUÆæW2‚öÆöDÖ‚’“°  —F†—2åö&ÇW$ÖFW&–ÂÒövWD&ÇW%6†FW"‚öÆöDÖ‚Âv–GF‚Â†V–v‡B“°  —Ð  —&WGW&â7V&UUe&VæFW%F&vWC°  —Ð  •ö6ö×–ÆTÖFW&–Â‚ÖFW&–Â’°  –6öç7BF×ÖW6‚ÒæWrÖW6‚‚F†—2åöÆöEÆæW5²ÒÂÖFW&–Â“° —F†—2å÷&VæFW&W"æ6ö×–ÆR‚F×ÖW6‚ÂöfÆD6ÖW&“°  —Ð  •÷66VæUFô7V&UUb‚66VæRÂæV"Âf"Â7V&UUe&VæFW%F&vWBÂ÷6—F–öâ’°  –6öç7Bf÷bÒ“° –6öç7B7V7BÒ° –6öç7B7V&T6ÖW&ÒæWrW'7V7F—fT6ÖW&‚f÷bÂ7V7BÂæV"Âf"“° –6öç7BW6–vâÒ²ÂÓÂÂÂÂÓ° –6öç7Bf÷'v&E6–vâÒ²ÂÂÂÓÂÓÂÓÓ° –6öç7B&VæFW&W"ÒF†—2å÷&VæFW&W#°  –6öç7B÷&–v–æÄWFô6ÆV"Ò&VæFW&W"æWFô6ÆV#° –6öç7BFöæTÖ–ærÒ&VæFW&W"çFöæTÖ–æs° —&VæFW&W"ævWD6ÆV$6öÆ÷"‚ö6ÆV$6öÆ÷"“°  —&VæFW&W"çFöæTÖ–ærÒæõFöæTÖ–æs° —&VæFW&W"æWFô6ÆV"ÒfÇ6S°  ’òò‡GG3¢òöv—F‡V"æ6öÒö×&Föö"÷F‡&VRæ§2ö—77VW2ó3C26—77VV6öÖÖVçBÓ3“S“ccƒ  –6öç7B&WfW'6VDFWF„'VffW"Ò&VæFW&W"ç7FFRæ'VffW'2æFWF‚ævWE&WfW'6VB‚“°  ––b‚&WfW'6VDFWF„'VffW"’°  —&VæFW&W"ç6WE&VæFW%F&vWB‚7V&UUe&VæFW%F&vWB“° —&VæFW&W"æ6ÆV$FWF‚‚“° —&VæFW&W"ç6WE&VæFW%F&vWB‚çVÆÂ“°  —Ð  –6öç7B&6¶w&÷VæDÖFW&–ÂÒæWrÖW6„&6–4ÖFW&–Â‚° –æÖS¢uÕ$TÒä&6¶w&÷VæBrÀ —6–FS¢&6µ6–FRÀ –FWF…w&—FS¢fÇ6RÀ –FWF…FW7C¢fÇ6RÀ —Ò“°  –6öç7B&6¶w&÷VæD&÷‚ÒæWrÖW6‚‚æWr&÷„vVöÖWG'’‚’Â&6¶w&÷VæDÖFW&–Â“°  –ÆWBW6U6öÆ–D6öÆ÷"ÒfÇ6S° –6öç7B&6¶w&÷VæBÒ66VæRæ&6¶w&÷VæC°  ––b‚&6¶w&÷VæB’°  ––b‚&6¶w&÷VæBæ—46öÆ÷"’°  –&6¶w&÷VæDÖFW&–Âæ6öÆ÷"æ6÷’‚&6¶w&÷VæB“° —66VæRæ&6¶w&÷VæBÒçVÆÃ° —W6U6öÆ–D6öÆ÷"ÒG'VS°  —Ð  —ÒVÇ6R°  –&6¶w&÷VæDÖFW&–Âæ6öÆ÷"æ6÷’‚ö6ÆV$6öÆ÷"“° —W6U6öÆ–D6öÆ÷"ÒG'VS°  —Ð  –f÷"‚ÆWB’Ò²’Âc²’²²’°  –6öç7B6öÂÒ’R3°  ––b‚6öÂÓÓÒ’°  –7V&T6ÖW&çWç6WB‚ÂW6–vå²’ÒÂ“° –7V&T6ÖW&ç÷6—F–öâç6WB‚÷6—F–öâç‚Â÷6—F–öâç’Â÷6—F–öâç¢“° –7V&T6ÖW&æÆöö´B‚÷6—F–öâç‚²f÷'v&E6–vå²’ÒÂ÷6—F–öâç’Â÷6—F–öâç¢“°  —ÒVÇ6R–b‚6öÂÓÓÒ’°  –7V&T6ÖW&çWç6WB‚ÂÂW6–vå²’Ò“° –7V&T6ÖW&ç÷6—F–öâç6WB‚÷6—F–öâç‚Â÷6—F–öâç’Â÷6—F–öâç¢“° –7V&T6ÖW&æÆöö´B‚÷6—F–öâç‚Â÷6—F–öâç’²f÷'v&E6–vå²’ÒÂ÷6—F–öâç¢“°   —ÒVÇ6R°  –7V&T6ÖW&çWç6WB‚ÂW6–vå²’ÒÂ“° –7V&T6ÖW&ç÷6—F–öâç6WB‚÷6—F–öâç‚Â÷6—F–öâç’Â÷6—F–öâç¢“° –7V&T6ÖW&æÆöö´B‚÷6—F–öâç‚Â÷6—F–öâç’Â÷6—F–öâç¢²f÷'v&E6–vå²’Ò“°  —Ð  –6öç7B6—¦RÒF†—2åö7V&U6—¦S°  •÷6WEf–Ww÷'B‚7V&UUe&VæFW%F&vWBÂ6öÂ¢6—¦RÂ’â"ò6—¦R¢Â6—¦RÂ6—¦R“°  —&VæFW&W"ç6WE&VæFW%F&vWB‚7V&UUe&VæFW%F&vWB“°  ––b‚W6U6öÆ–D6öÆ÷"’°  —&VæFW&W"ç&VæFW"‚&6¶w&÷VæD&÷‚Â7V&T6ÖW&“°  —Ð  —&VæFW&W"ç&VæFW"‚66VæRÂ7V&T6ÖW&“°  —Ð  –&6¶w&÷VæD&÷‚ævVöÖWG'’æF—7÷6R‚“° –&6¶w&÷VæD&÷‚æÖFW&–ÂæF—7÷6R‚“°  —&VæFW&W"çFöæTÖ–ærÒFöæTÖ–æs° —&VæFW&W"æWFô6ÆV"Ò÷&–v–æÄWFô6ÆV#° —66VæRæ&6¶w&÷VæBÒ&6¶w&÷VæC°  —Ð  •÷FW‡GW&UFô7V&UUb‚FW‡GW&RÂ7V&UUe&VæFW%F&vWB’°  –6öç7B&VæFW&W"ÒF†—2å÷&VæFW&W#°  –6öç7B—47V&UFW‡GW&RÒ‚FW‡GW&RæÖ–ærÓÓÒ7V&U&VfÆV7F–öäÖ–ærÇÂFW‡GW&RæÖ–ærÓÓÒ7V&U&Vg&7F–öäÖ–ær“°  ––b‚—47V&UFW‡GW&R’°  ––b‚F†—2åö7V&VÖÖFW&–ÂÓÓÒçVÆÂ’°  —F†—2åö7V&VÖÖFW&–ÂÒövWD7V&VÖÖFW&–Â‚“°  —Ð  —F†—2åö7V&VÖÖFW&–ÂçVæ–f÷&×2æfÆ—VçdÖçfÇVRÒ‚FW‡GW&Ræ—5&VæFW%F&vWEFW‡GW&RÓÓÒfÇ6R’òÓ¢°  —ÒVÇ6R°  ––b‚F†—2åöWV—&V7DÖFW&–ÂÓÓÒçVÆÂ’°  —F†—2åöWV—&V7DÖFW&–ÂÒövWDWV—&V7DÖFW&–Â‚“°  —Ð  —Ð  –6öç7BÖFW&–ÂÒ—47V&UFW‡GW&RòF†—2åö7V&VÖÖFW&–Â¢F†—2åöWV—&V7DÖFW&–Ã° –6öç7BÖW6‚ÒæWrÖW6‚‚F†—2åöÆöEÆæW5²ÒÂÖFW&–Â“°  –6öç7BVæ–f÷&×2ÒÖFW&–ÂçVæ–f÷&×3°  —Væ–f÷&×5²vVçdÖrÒçfÇVRÒFW‡GW&S°  –6öç7B6—¦RÒF†—2åö7V&U6—¦S°  •÷6WEf–Ww÷'B‚7V&UUe&VæFW%F&vWBÂÂÂ2¢6—¦RÂ"¢6—¦R“°  —&VæFW&W"ç6WE&VæFW%F&vWB‚7V&UUe&VæFW%F&vWB“° —&VæFW&W"ç&VæFW"‚ÖW6‚ÂöfÆD6ÖW&“°  —Ð  •öÇ•Õ$TÒ‚7V&UUe&VæFW%F&vWB’°  –6öç7B&VæFW&W"ÒF†—2å÷&VæFW&W#° –6öç7BWFô6ÆV"Ò&VæFW&W"æWFô6ÆV#° —&VæFW&W"æWFô6ÆV"ÒfÇ6S° –6öç7BâÒF†—2åöÆöEÆæW2æÆVæwFƒ°  –f÷"‚ÆWB’Ò²’Âã²’²²’°  –6öç7B6–vÖÒÖF‚ç7'B‚F†—2å÷6–vÖ5²’Ò¢F†—2å÷6–vÖ5²’ÒÒF†—2å÷6–vÖ5²’ÒÒ¢F†—2å÷6–vÖ5²’ÒÒ“°  –6öç7BöÆT†—2Òö†—4F—&V7F–öç5²‚âÒ’Ò’Rö†—4F—&V7F–öç2æÆVæwF‚Ó°  —F†—2åö&ÇW"‚7V&UUe&VæFW%F&vWBÂ’ÒÂ’Â6–vÖÂöÆT†—2“°  —Ð  —&VæFW&W"æWFô6ÆV"ÒWFô6ÆV#°  —Ð  ’ò¢  ’¢F†—2—2Gvò×72vW76–â&ÇW"f÷"7V&VÖâæ÷&ÖÆÇ’F†—2—2FöæP ’¢fW'F–6ÆÇ’æB†÷&—¦öçFÆÇ’Â'WBF†—2'&V·2F÷vâöâ7V&Râ†W&RvRÇ ’¢F†R&ÇW"ÆF—GVF–æÆÇ’†&÷VæBF†RöÆW2’ÂæBF†VâÆöæv—GVF–æÆÇ’‡F÷v&G0 ’¢F†RöÆW2’Fò&÷†–ÖFRF†R÷'F†övöæÆÇ’×6W&&ÆR&ÇW"â—B—2ÆV7@ ’¢67W&FRBF†RöÆW2Â'WB7F–ÆÂFöW2FV6VçB¦ö"à ’  ’¢&—fFP ’¢&ÒµvV$tÅ&VæFW%F&vWGÒ7V&UUe&VæFW%F&vW@ ’¢&Ò¶çVÖ&W'ÒÆöD–à ’¢&Ò¶çVÖ&W'ÒÆöD÷W@ ’¢&Ò¶çVÖ&W'Ò6–vÖ ’¢&ÒµfV7F÷#7Ò·öÆT†—5Ð ’¢ð •ö&ÇW"‚7V&UUe&VæFW%F&vWBÂÆöD–âÂÆöD÷WBÂ6–vÖÂöÆT†—2’°  –6öç7B–æuöæu&VæFW%F&vWBÒF†—2å÷–æuöæu&VæFW%F&vWC°  —F†—2åö†Æd&ÇW"€ –7V&UUe&VæFW%F&vWBÀ —–æuöæu&VæFW%F&vWBÀ –ÆöD–âÀ –ÆöD÷WBÀ —6–vÖÀ ’vÆF—GVF–æÂrÀ —öÆT†—2“°  —F†—2åö†Æd&ÇW"€ —–æuöæu&VæFW%F&vWBÀ –7V&UUe&VæFW%F&vWBÀ –ÆöD÷WBÀ –ÆöD÷WBÀ —6–vÖÀ ’vÆöæv—GVF–æÂrÀ —öÆT†—2“°  —Ð  •ö†Æd&ÇW"‚F&vWD–âÂF&vWD÷WBÂÆöD–âÂÆöD÷WBÂ6–vÖ&F–ç2ÂF—&V7F–öâÂöÆT†—2’°  –6öç7B&VæFW&W"ÒF†—2å÷&VæFW&W#° –6öç7B&ÇW$ÖFW&–ÂÒF†—2åö&ÇW$ÖFW&–Ã°  ––b‚F—&V7F–öâÓÒvÆF—GVF–æÂrbbF—&V7F–öâÓÒvÆöæv—GVF–æÂr’°  –6öç6öÆRæW'&÷"€ ’v&ÇW"F—&V7F–öâ×W7B&RV—F†W"ÆF—GVF–æÂ÷"Æöæv—GVF–æÂr“°  —Ð  ’òòçVÖ&W"öb7FæF&BFWf–F–öç2Bv†–6‚Fò7WBöfbF†RF—67&WFR&÷†–ÖF–öâà –6öç7B5DäD$EôDUd”D”ôå2Ò3°  –6öç7B&ÇW$ÖW6‚ÒæWrÖW6‚‚F†—2åöÆöEÆæW5²ÆöD÷WBÒÂ&ÇW$ÖFW&–Â“° –6öç7B&ÇW%Væ–f÷&×2Ò&ÇW$ÖFW&–ÂçVæ–f÷&×3°  –6öç7B—†VÇ2ÒF†—2å÷6—¦TÆöG5²ÆöD–âÒÒ° –6öç7B&F–ç5W%—†VÂÒ—4f–æ—FR‚6–vÖ&F–ç2’òÖF‚å’ò‚"¢—†VÇ2’¢"¢ÖF‚å’ò‚"¢Ô…õ4ÕÄU2Ò“° –6öç7B6–vÖ—†VÇ2Ò6–vÖ&F–ç2ò&F–ç5W%—†VÃ° –6öç7B6×ÆW2Ò—4f–æ—FR‚6–vÖ&F–ç2’ò²ÖF‚æfÆö÷"‚5DäD$EôDUd”D”ôå2¢6–vÖ—†VÇ2’¢Ô…õ4ÕÄU3°  ––b‚6×ÆW2âÔ…õ4ÕÄU2’°  –6öç6öÆRçv&â‚6–vÖ&F–ç2ÂG° —6–vÖ&F–ç7ÒÂ—2FöòÆ&vRæBv–ÆÂ6Æ—Â2—B&WVW7FVBG° —6×ÆW7Ò6×ÆW2v†VâF†RÖ†–×VÒ—26WBFòG´Ô…õ4ÕÄU7Ö“°  —Ð  –6öç7BvV–v‡G2ÒµÓ° –ÆWB7VÒÒ°  –f÷"‚ÆWB’Ò²’ÂÔ…õ4ÕÄU3²²²’’°  –6öç7B‚Ò’ò6–vÖ—†VÇ3° –6öç7BvV–v‡BÒÖF‚æW‡‚Ò‚¢‚ò"“° —vV–v‡G2çW6‚‚vV–v‡B“°  ––b‚’ÓÓÒ’°  —7VÒ³ÒvV–v‡C°  —ÒVÇ6R–b‚’Â6×ÆW2’°  —7VÒ³Ò"¢vV–v‡C°  —Ð  —Ð  –f÷"‚ÆWB’Ò²’ÂvV–v‡G2æÆVæwFƒ²’²²’°  —vV–v‡G5²’ÒÒvV–v‡G5²’Òò7VÓ°  —Ð  –&ÇW%Væ–f÷&×5²vVçdÖrÒçfÇVRÒF&vWD–âçFW‡GW&S° –&ÇW%Væ–f÷&×5²w6×ÆW2rÒçfÇVRÒ6×ÆW3° –&ÇW%Væ–f÷&×5²wvV–v‡G2rÒçfÇVRÒvV–v‡G3° –&ÇW%Væ–f÷&×5²vÆF—GVF–æÂrÒçfÇVRÒF—&V7F–öâÓÓÒvÆF—GVF–æÂs°  ––b‚öÆT†—2’°  –&ÇW%Væ–f÷&×5²wöÆT†—2rÒçfÇVRÒöÆT†—3°  —Ð  –6öç7B²öÆöDÖ‚ÒÒF†—3° –&ÇW%Væ–f÷&×5²vEF†WFrÒçfÇVRÒ&F–ç5W%—†VÃ° –&ÇW%Væ–f÷&×5²vÖ—–çBrÒçfÇVRÒöÆöDÖ‚ÒÆöD–ã°  –6öç7B÷WGWE6—¦RÒF†—2å÷6—¦TÆöG5²ÆöD÷WBÓ° –6öç7B‚Ò2¢÷WGWE6—¦R¢‚ÆöD÷WBâöÆöDÖ‚ÒÄôEôÔ”âòÆöD÷WBÒöÆöDÖ‚²ÄôEôÔ”â¢“° –6öç7B’ÒB¢‚F†—2åö7V&U6—¦RÒ÷WGWE6—¦R“°  •÷6WEf–Ww÷'B‚F&vWD÷WBÂ‚Â’Â2¢÷WGWE6—¦RÂ"¢÷WGWE6—¦R“° —&VæFW&W"ç6WE&VæFW%F&vWB‚F&vWD÷WB“° —&VæFW&W"ç&VæFW"‚&ÇW$ÖW6‚ÂöfÆD6ÖW&“°  —Ð §Ð   ¦gVæ7F–öâö7&VFUÆæW2‚ÆöDÖ‚’°  –6öç7BÆöEÆæW2ÒµÓ° –6öç7B6—¦TÆöG2ÒµÓ° –6öç7B6–vÖ2ÒµÓ°  –ÆWBÆöBÒÆöDÖƒ°  –6öç7BF÷FÄÆöG2ÒÆöDÖ‚ÒÄôEôÔ”â²²U…E$ôÄôEõ4”tÔæÆVæwFƒ°  –f÷"‚ÆWB’Ò²’ÂF÷FÄÆöG3²’²²’°  –6öç7B6—¦TÆöBÒÖF‚ç÷r‚"ÂÆöB“° —6—¦TÆöG2çW6‚‚6—¦TÆöB“° –ÆWB6–vÖÒãò6—¦TÆöC°  ––b‚’âÆöDÖ‚ÒÄôEôÔ”â’°  —6–vÖÒU…E$ôÄôEõ4”tÔ²’ÒÆöDÖ‚²ÄôEôÔ”âÒÓ°  —ÒVÇ6R–b‚’ÓÓÒ’°  —6–vÖÒ°  —Ð  —6–vÖ2çW6‚‚6–vÖ“°  –6öç7BFW†VÅ6—¦RÒãò‚6—¦TÆöBÒ"“° –6öç7BÖ–âÒÒFW†VÅ6—¦S° –6öç7BÖ‚Ò²FW†VÅ6—¦S° –6öç7BWcÒ²Ö–âÂÖ–âÂÖ‚ÂÖ–âÂÖ‚ÂÖ‚ÂÖ–âÂÖ–âÂÖ‚ÂÖ‚ÂÖ–âÂÖ‚Ó°  –6öç7B7V&Tf6W2Òc° –6öç7BfW'F–6W2Òc° –6öç7B÷6—F–öå6—¦RÒ3° –6öç7BWe6—¦RÒ#° –6öç7Bf6T–æFW…6—¦RÒ°  –6öç7B÷6—F–öâÒæWrfÆöC3$'&’‚÷6—F–öå6—¦R¢fW'F–6W2¢7V&Tf6W2“° –6öç7BWbÒæWrfÆöC3$'&’‚We6—¦R¢fW'F–6W2¢7V&Tf6W2“° –6öç7Bf6T–æFW‚ÒæWrfÆöC3$'&’‚f6T–æFW…6—¦R¢fW'F–6W2¢7V&Tf6W2“°  –f÷"‚ÆWBf6RÒ²f6RÂ7V&Tf6W3²f6R²²’°  –6öç7B‚Ò‚f6RR2’¢"ò2Ò° –6öç7B’Òf6Râ"ò¢Ó° –6öç7B6ö÷&F–æFW2Ò° —‚Â’ÂÀ —‚²"ò2Â’ÂÀ —‚²"ò2Â’²ÂÀ —‚Â’ÂÀ —‚²"ò2Â’²ÂÀ —‚Â’²Â  •Ó° —÷6—F–öâç6WB‚6ö÷&F–æFW2Â÷6—F–öå6—¦R¢fW'F–6W2¢f6R“° —Wbç6WB‚WcÂWe6—¦R¢fW'F–6W2¢f6R“° –6öç7Bf–ÆÂÒ²f6RÂf6RÂf6RÂf6RÂf6RÂf6RÓ° –f6T–æFW‚ç6WB‚f–ÆÂÂf6T–æFW…6—¦R¢fW'F–6W2¢f6R“°  —Ð  –6öç7BÆæW2ÒæWr'VffW$vVöÖWG'’‚“° —ÆæW2ç6WDGG&–'WFR‚w÷6—F–öârÂæWr'VffW$GG&–'WFR‚÷6—F–öâÂ÷6—F–öå6—¦R’“° —ÆæW2ç6WDGG&–'WFR‚wWbrÂæWr'VffW$GG&–'WFR‚WbÂWe6—¦R’“° —ÆæW2ç6WDGG&–'WFR‚vf6T–æFW‚rÂæWr'VffW$GG&–'WFR‚f6T–æFW‚Âf6T–æFW…6—¦R’“° –ÆöEÆæW2çW6‚‚ÆæW2“°  ––b‚ÆöBâÄôEôÔ”â’°  –ÆöBÒÓ°  —Ð  —Ð  —&WGW&â²ÆöEÆæW2Â6—¦TÆöG2Â6–vÖ2Ó° §Ð ¦gVæ7F–öâö7&VFU&VæFW%F&vWB‚v–GF‚Â†V–v‡BÂ&×2’°  –6öç7B7V&UUe&VæFW%F&vWBÒæWrvV$tÅ&VæFW%F&vWB‚v–GF‚Â†V–v‡BÂ&×2“° –7V&UUe&VæFW%F&vWBçFW‡GW&RæÖ–ærÒ7V&UUe&VfÆV7F–öäÖ–æs° –7V&UUe&VæFW%F&vWBçFW‡GW&RææÖRÒuÕ$TÒæ7V&UWbs° –7V&UUe&VæFW%F&vWBç66—76÷%FW7BÒG'VS° —&WGW&â7V&UUe&VæFW%F&vWC° §Ð ¦gVæ7F–öâ÷6WEf–Ww÷'B‚F&vWBÂ‚Â’Âv–GF‚Â†V–v‡B’°  —F&vWBçf–Ww÷'Bç6WB‚‚Â’Âv–GF‚Â†V–v‡B“° —F&vWBç66—76÷"ç6WB‚‚Â’Âv–GF‚Â†V–v‡B“° §Ð ¦gVæ7F–öâövWD&ÇW%6†FW"‚ÆöDÖ‚Âv–GF‚Â†V–v‡B’°  –6öç7BvV–v‡G2ÒæWrfÆöC3$'&’‚Ô…õ4ÕÄU2“° –6öç7BöÆT†—2ÒæWrfV7F÷#2‚ÂÂ“° –6öç7B6†FW$ÖFW&–ÂÒæWr6†FW$ÖFW&–Â‚°  –æÖS¢u7†W&–6ÄvW76–ä&ÇW"rÀ  –FVf–æW3¢° ’vâs¢Ô…õ4ÕÄU2À ’t5T$UUeõDU„TÅõt”ED‚s¢ãòv–GF‚À ’t5T$UUeõDU„TÅô„T”t…Bs¢ãò†V–v‡BÀ ’t5T$UUeôÔ…ôÔ•s¢G¶ÆöDÖ‡ÒãÀ —ÒÀ  —Væ–f÷&×3¢° ’vVçdÖs¢²fÇVS¢çVÆÂÒÀ ’w6×ÆW2s¢²fÇVS¢ÒÀ ’wvV–v‡G2s¢²fÇVS¢vV–v‡G2ÒÀ ’vÆF—GVF–æÂs¢²fÇVS¢fÇ6RÒÀ ’vEF†WFs¢²fÇVS¢ÒÀ ’vÖ—–çBs¢²fÇVS¢ÒÀ ’wöÆT†—2s¢²fÇVS¢öÆT†—2Ð —ÒÀ  —fW'FW…6†FW#¢övWD6öÖÖöåfW'FW…6†FW"‚’À  –g&vÖVçE6†FW#¢ò¢vÇ6Â¢ö   —&V6—6–öâÖVF—V×fÆöC° —&V6—6–öâÖVF—V×–çC°  —f'––ærfV32d÷WGWDF—&V7F–öã°  —Væ–f÷&Ò6×ÆW#$BVçdÖ° —Væ–f÷&Ò–çB6×ÆW3° —Væ–f÷&ÒfÆöBvV–v‡G5²âÓ° —Væ–f÷&Ò&ööÂÆF—GVF–æÃ° —Væ–f÷&ÒfÆöBEF†WF° —Væ–f÷&ÒfÆöBÖ—–çC° —Væ–f÷&ÒfV32öÆT†—3°  ’6FVf–æRTådÔõE•Uô5T$UõU` ’6–æ6ÇVFRÆ7V&U÷We÷&VfÆV7F–öåög&vÖVçCà  —fV32vWE6×ÆR‚fÆöBF†WFÂfV32†—2’°  –fÆöB6÷5F†WFÒ6÷2‚F†WF“° ’òò&öG&–wVW2r†—2ÖævÆR&÷FF–öà —fV326×ÆTF—&V7F–öâÒd÷WGWDF—&V7F–öâ¢6÷5F†WF ’²7&÷72‚†—2Âd÷WGWDF—&V7F–öâ’¢6–â‚F†WF ’²†—2¢F÷B‚†—2Âd÷WGWDF—&V7F–öâ’¢‚ãÒ6÷5F†WF“°  —&WGW&â&–Æ–æV$7V&UUb‚VçdÖÂ6×ÆTF—&V7F–öâÂÖ—–çB“°  —Ð  —fö–BÖ–â‚’°  —fV32†—2ÒÆF—GVF–æÂòöÆT†—2¢7&÷72‚öÆT†—2Âd÷WGWDF—&V7F–öâ“°  ––b‚ÆÂ‚WVÂ‚†—2ÂfV32‚ã’’’’°  –†—2ÒfV32‚d÷WGWDF—&V7F–öâç¢ÂãÂÒd÷WGWDF—&V7F–öâç‚“°  —Ð  –†—2Òæ÷&ÖÆ—¦R‚†—2“°  –vÅôg&t6öÆ÷"ÒfV3B‚ãÂãÂãÂã“° –vÅôg&t6öÆ÷"ç&v"³ÒvV–v‡G5²Ò¢vWE6×ÆR‚ãÂ†—2“°  –f÷"‚–çB’Ò²’Âã²’²²’°  ––b‚’ãÒ6×ÆW2’°  –'&V³°  —Ð  –fÆöBF†WFÒEF†WF¢fÆöB‚’“° –vÅôg&t6öÆ÷"ç&v"³ÒvV–v‡G5²’Ò¢vWE6×ÆR‚Óã¢F†WFÂ†—2“° –vÅôg&t6öÆ÷"ç&v"³ÒvV–v‡G5²’Ò¢vWE6×ÆR‚F†WFÂ†—2“°  —Ð  —Ð –À  –&ÆVæF–æs¢æô&ÆVæF–ærÀ –FWF…FW7C¢fÇ6RÀ –FWF…w&—FS¢fÇ6P  —Ò“°  —&WGW&â6†FW$ÖFW&–Ã° §Ð ¦gVæ7F–öâövWDWV—&V7DÖFW&–Â‚’°  —&WGW&âæWr6†FW$ÖFW&–Â‚°  –æÖS¢tWV—&V7FæwVÆ%Fô7V&UUbrÀ  —Væ–f÷&×3¢° ’vVçdÖs¢²fÇVS¢çVÆÂÐ —ÒÀ  —fW'FW…6†FW#¢övWD6öÖÖöåfW'FW…6†FW"‚’À  –g&vÖVçE6†FW#¢ò¢vÇ6Â¢ö   —&V6—6–öâÖVF—V×fÆöC° —&V6—6–öâÖVF—V×–çC°  —f'––ærfV32d÷WGWDF—&V7F–öã°  —Væ–f÷&Ò6×ÆW#$BVçdÖ°  ’6–æ6ÇVFRÆ6öÖÖöãà  —fö–BÖ–â‚’°  —fV32÷WGWDF—&V7F–öâÒæ÷&ÖÆ—¦R‚d÷WGWDF—&V7F–öâ“° —fV3"WbÒWV—&V7EWb‚÷WGWDF—&V7F–öâ“°  –vÅôg&t6öÆ÷"ÒfV3B‚FW‡GW&S$B‚VçdÖÂWb’ç&v"Âã“°  —Ð –À  –&ÆVæF–æs¢æô&ÆVæF–ærÀ –FWF…FW7C¢fÇ6RÀ –FWF…w&—FS¢fÇ6P  —Ò“° §Ð ¦gVæ7F–öâövWD7V&VÖÖFW&–Â‚’°  —&WGW&âæWr6†FW$ÖFW&–Â‚°  –æÖS¢t7V&VÖFô7V&UUbrÀ  —Væ–f÷&×3¢° ’vVçdÖs¢²fÇVS¢çVÆÂÒÀ ’vfÆ—VçdÖs¢²fÇVS¢ÓÐ —ÒÀ  —fW'FW…6†FW#¢övWD6öÖÖöåfW'FW…6†FW"‚’À  –g&vÖVçE6†FW#¢ò¢vÇ6Â¢ö   —&V6—6–öâÖVF—V×fÆöC° —&V6—6–öâÖVF—V×–çC°  —Væ–f÷&ÒfÆöBfÆ—VçdÖ°  —f'––ærfV32d÷WGWDF—&V7F–öã°  —Væ–f÷&Ò6×ÆW$7V&RVçdÖ°  —fö–BÖ–â‚’°  –vÅôg&t6öÆ÷"ÒFW‡GW&T7V&R‚VçdÖÂfV32‚fÆ—VçdÖ¢d÷WGWDF—&V7F–öâç‚Âd÷WGWDF—&V7F–öâç—¢’“°  —Ð –À  –&ÆVæF–æs¢æô&ÆVæF–ærÀ –FWF…FW7C¢fÇ6RÀ –FWF…w&—FS¢fÇ6P  —Ò“° §Ð ¦gVæ7F–öâövWD6öÖÖöåfW'FW…6†FW"‚’°  —&WGW&âò¢vÇ6Â¢ö   —&V6—6–öâÖVF—V×fÆöC° —&V6—6–öâÖVF—V×–çC°  –GG&–'WFRfÆöBf6T–æFWƒ°  —f'––ærfV32d÷WGWDF—&V7F–öã°  ’òò$‚6ö÷&F–æFR7—7FVÓ²Õ$TÒf6RÖ–æFW†–ær6öçfVçF–öà —fV32vWDF—&V7F–öâ‚fV3"WbÂfÆöBf6R’°  —WbÒ"ã¢WbÒã°  —fV32F—&V7F–öâÒfV32‚WbÂã“°  ––b‚f6RÓÒã’°  –F—&V7F–öâÒF—&V7F–öâç§—ƒ²òò‚ÂbÂR’÷2€  —ÒVÇ6R–b‚f6RÓÒã’°  –F—&V7F–öâÒF—&V7F–öâç‡§“° –F—&V7F–öâç‡¢£ÒÓã²òò‚×RÂÂ×b’÷2  —ÒVÇ6R–b‚f6RÓÒ"ã’°  –F—&V7F–öâç‚£ÒÓã²òò‚×RÂbÂ’÷2   —ÒVÇ6R–b‚f6RÓÒ2ã’°  –F—&V7F–öâÒF—&V7F–öâç§—ƒ° –F—&V7F–öâç‡¢£ÒÓã²òò‚ÓÂbÂ×R’æVr€  —ÒVÇ6R–b‚f6RÓÒBã’°  –F—&V7F–öâÒF—&V7F–öâç‡§“° –F—&V7F–öâç‡’£ÒÓã²òò‚×RÂÓÂb’æVr  —ÒVÇ6R–b‚f6RÓÒRã’°  –F—&V7F–öâç¢£ÒÓã²òò‚RÂbÂÓ’æVr   —Ð  —&WGW&âF—&V7F–öã°  —Ð  —fö–BÖ–â‚’°  —d÷WGWDF—&V7F–öâÒvWDF—&V7F–öâ‚WbÂf6T–æFW‚“° –vÅõ÷6—F–öâÒfV3B‚÷6—F–öâÂã“°  —Ð –° §Ð ¦gVæ7F–öâvV$tÄ7V&UUdÖ2‚&VæFW&W"’°  –ÆWB7V&UUfÖ2ÒæWrvV´Ö‚“°  –ÆWB×&VÔvVæW&F÷"ÒçVÆÃ°  –gVæ7F–öâvWB‚FW‡GW&R’°  ––b‚FW‡GW&RbbFW‡GW&Ræ—5FW‡GW&R’°  –6öç7BÖ–ærÒFW‡GW&RæÖ–æs°  –6öç7B—4WV—&V7DÖÒ‚Ö–ærÓÓÒWV—&V7FæwVÆ%&VfÆV7F–öäÖ–ærÇÂÖ–ærÓÓÒWV—&V7FæwVÆ%&Vg&7F–öäÖ–ær“° –6öç7B—47V&TÖÒ‚Ö–ærÓÓÒ7V&U&VfÆV7F–öäÖ–ærÇÂÖ–ærÓÓÒ7V&U&Vg&7F–öäÖ–ær“°  ’òòWV—&V7Bö7V&RÖFò7V&UUb6öçfW'6–öà  ––b‚—4WV—&V7DÖÇÂ—47V&TÖ’°  –ÆWB&VæFW%F&vWBÒ7V&UUfÖ2ævWB‚FW‡GW&R“°  –6öç7B7W'&VçEÕ$TÕfW'6–öâÒ&VæFW%F&vWBÓÒVæFVf–æVBò&VæFW%F&vWBçFW‡GW&Rç×&VÕfW'6–öâ¢°  ––b‚FW‡GW&Ræ—5&VæFW%F&vWEFW‡GW&RbbFW‡GW&Rç×&VÕfW'6–öâÓÒ7W'&VçEÕ$TÕfW'6–öâ’°  ––b‚×&VÔvVæW&F÷"ÓÓÒçVÆÂ’×&VÔvVæW&F÷"ÒæWrÕ$TÔvVæW&F÷"‚&VæFW&W"“°  —&VæFW%F&vWBÒ—4WV—&V7DÖò×&VÔvVæW&F÷"æg&öÔWV—&V7FæwVÆ"‚FW‡GW&RÂ&VæFW%F&vWB’¢×&VÔvVæW&F÷"æg&öÔ7V&VÖ‚FW‡GW&RÂ&VæFW%F&vWB“° —&VæFW%F&vWBçFW‡GW&Rç×&VÕfW'6–öâÒFW‡GW&Rç×&VÕfW'6–öã°  –7V&UUfÖ2ç6WB‚FW‡GW&RÂ&VæFW%F&vWB“°  —&WGW&â&VæFW%F&vWBçFW‡GW&S°  —ÒVÇ6R°  ––b‚&VæFW%F&vWBÓÒVæFVf–æVB’°  —&WGW&â&VæFW%F&vWBçFW‡GW&S°  —ÒVÇ6R°  –6öç7B–ÖvRÒFW‡GW&Ræ–ÖvS°  ––b‚‚—4WV—&V7DÖbb–ÖvRbb–ÖvRæ†V–v‡Bâ’ÇÂ‚—47V&TÖbb–ÖvRbb—47V&UFW‡GW&T6ö×ÆWFR‚–ÖvR’’’°  ––b‚×&VÔvVæW&F÷"ÓÓÒçVÆÂ’×&VÔvVæW&F÷"ÒæWrÕ$TÔvVæW&F÷"‚&VæFW&W"“°  —&VæFW%F&vWBÒ—4WV—&V7DÖò×&VÔvVæW&F÷"æg&öÔWV—&V7FæwVÆ"‚FW‡GW&R’¢×&VÔvVæW&F÷"æg&öÔ7V&VÖ‚FW‡GW&R“° —&VæFW%F&vWBçFW‡GW&Rç×&VÕfW'6–öâÒFW‡GW&Rç×&VÕfW'6–öã°  –7V&UUfÖ2ç6WB‚FW‡GW&RÂ&VæFW%F&vWB“°  —FW‡GW&RæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåFW‡GW&TF—7÷6R“°  —&WGW&â&VæFW%F&vWBçFW‡GW&S°  —ÒVÇ6R°  ’òò–ÖvRæ÷B–WB&VG’âG'’F†R6öçfW'6–öâæW‡Bg&ÖP  —&WGW&âçVÆÃ°  —Ð  —Ð  —Ð  —Ð  —Ð  —&WGW&âFW‡GW&S°  —Ð  –gVæ7F–öâ—47V&UFW‡GW&T6ö×ÆWFR‚–ÖvR’°  –ÆWB6÷VçBÒ° –6öç7BÆVæwF‚Òc°  –f÷"‚ÆWB’Ò²’ÂÆVæwFƒ²’²²’°  ––b‚–ÖvU²’ÒÓÒVæFVf–æVB’6÷VçB²³°  —Ð  —&WGW&â6÷VçBÓÓÒÆVæwFƒ°   —Ð  –gVæ7F–öâöåFW‡GW&TF—7÷6R‚WfVçB’°  –6öç7BFW‡GW&RÒWfVçBçF&vWC°  —FW‡GW&Rç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåFW‡GW&TF—7÷6R“°  –6öç7B7V&VÖUbÒ7V&UUfÖ2ævWB‚FW‡GW&R“°  ––b‚7V&VÖUbÓÒVæFVf–æVB’°  –7V&UUfÖ2æFVÆWFR‚FW‡GW&R“° –7V&VÖUbæF—7÷6R‚“°  —Ð  —Ð  –gVæ7F–öâF—7÷6R‚’°  –7V&UUfÖ2ÒæWrvV´Ö‚“°  ––b‚×&VÔvVæW&F÷"ÓÒçVÆÂ’°  —×&VÔvVæW&F÷"æF—7÷6R‚“° —×&VÔvVæW&F÷"ÒçVÆÃ°  —Ð  —Ð  —&WGW&â° –vWC¢vWBÀ –F—7÷6S¢F—7÷6P —Ó° §Ð ¦gVæ7F–öâvV$tÄW‡FVç6–öç2‚vÂ’°  –6öç7BW‡FVç6–öç2Ò·Ó°  –gVæ7F–öâvWDW‡FVç6–öâ‚æÖR’°  ––b‚W‡FVç6–öç5²æÖRÒÓÒVæFVf–æVB’°  —&WGW&âW‡FVç6–öç5²æÖRÓ°  —Ð  –ÆWBW‡FVç6–öã°  —7v—F6‚‚æÖR’°  –66RutT$tÅöFWF…÷FW‡GW&Rs  –W‡FVç6–öâÒvÂævWDW‡FVç6–öâ‚utT$tÅöFWF…÷FW‡GW&Rr’ÇÂvÂævWDW‡FVç6–öâ‚tÔõ¥õtT$tÅöFWF…÷FW‡GW&Rr’ÇÂvÂævWDW‡FVç6–öâ‚utT$´•EõtT$tÅöFWF…÷FW‡GW&Rr“° –'&V³°  –66RtU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2s  –W‡FVç6–öâÒvÂævWDW‡FVç6–öâ‚tU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2r’ÇÂvÂævWDW‡FVç6–öâ‚tÔõ¥ôU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2r’ÇÂvÂævWDW‡FVç6–öâ‚utT$´•EôU…E÷FW‡GW&Uöf–ÇFW%öæ—6÷G&÷–2r“° –'&V³°  –66RutT$tÅö6ö×&W76VE÷FW‡GW&U÷37F2s  –W‡FVç6–öâÒvÂævWDW‡FVç6–öâ‚utT$tÅö6ö×&W76VE÷FW‡GW&U÷37F2r’ÇÂvÂævWDW‡FVç6–öâ‚tÔõ¥õtT$tÅö6ö×&W76VE÷FW‡GW&U÷37F2r’ÇÂvÂævWDW‡FVç6–öâ‚utT$´•EõtT$tÅö6ö×&W76VE÷FW‡GW&U÷37F2r“° –'&V³°  –66RutT$tÅö6ö×&W76VE÷FW‡GW&U÷g'F2s  –W‡FVç6–öâÒvÂævWDW‡FVç6–öâ‚utT$tÅö6ö×&W76VE÷FW‡GW&U÷g'F2r’ÇÂvÂævWDW‡FVç6–öâ‚utT$´•EõtT$tÅö6ö×&W76VE÷FW‡GW&U÷g'F2r“° –'&V³°  –FVfVÇC  –W‡FVç6–öâÒvÂævWDW‡FVç6–öâ‚æÖR“°  —Ð  –W‡FVç6–öç5²æÖRÒÒW‡FVç6–öã°  —&WGW&âW‡FVç6–öã°  —Ð  —&WGW&â°  –†3¢gVæ7F–öâ‚æÖR’°  —&WGW&âvWDW‡FVç6–öâ‚æÖR’ÓÒçVÆÃ°  —ÒÀ  ––æ—C¢gVæ7F–öâ‚’°  –vWDW‡FVç6–öâ‚tU…Eö6öÆ÷%ö'VffW%öfÆöBr“° –vWDW‡FVç6–öâ‚utT$tÅö6Æ—ö7VÆÅöF—7Fæ6Rr“° –vWDW‡FVç6–öâ‚tôU5÷FW‡GW&UöfÆöEöÆ–æV"r“° –vWDW‡FVç6–öâ‚tU…Eö6öÆ÷%ö'VffW%ö†ÆeöfÆöBr“° –vWDW‡FVç6–öâ‚utT$tÅö×VÇF—6×ÆVE÷&VæFW%÷Fõ÷FW‡GW&Rr“° –vWDW‡FVç6–öâ‚utT$tÅ÷&VæFW%÷6†&VEöW‡öæVçBr“°  —ÒÀ  –vWC¢gVæ7F–öâ‚æÖR’°  –6öç7BW‡FVç6–öâÒvWDW‡FVç6–öâ‚æÖR“°  ––b‚W‡FVç6–öâÓÓÒçVÆÂ’°  —v&äöæ6R‚uD…$TRåvV$tÅ&VæFW&W#¢r²æÖR²rW‡FVç6–öâæ÷B7W÷'FVBâr“°  —Ð  —&WGW&âW‡FVç6–öã°  —Ð  —Ó° §Ð ¦gVæ7F–öâvV$tÄvVöÖWG&–W2‚vÂÂGG&–'WFW2Â–æfòÂ&–æF–æu7FFW2’°  –6öç7BvVöÖWG&–W2Ò·Ó° –6öç7Bv—&Vg&ÖTGG&–'WFW2ÒæWrvV´Ö‚“°  –gVæ7F–öâöävVöÖWG'”F—7÷6R‚WfVçB’°  –6öç7BvVöÖWG'’ÒWfVçBçF&vWC°  ––b‚vVöÖWG'’æ–æFW‚ÓÒçVÆÂ’°  –GG&–'WFW2ç&VÖ÷fR‚vVöÖWG'’æ–æFW‚“°  —Ð  –f÷"‚6öç7BæÖR–âvVöÖWG'’æGG&–'WFW2’°  –GG&–'WFW2ç&VÖ÷fR‚vVöÖWG'’æGG&–'WFW5²æÖRÒ“°  —Ð  –vVöÖWG'’ç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöävVöÖWG'”F—7÷6R“°  –FVÆWFRvVöÖWG&–W5²vVöÖWG'’æ–BÓ°  –6öç7BGG&–'WFRÒv—&Vg&ÖTGG&–'WFW2ævWB‚vVöÖWG'’“°  ––b‚GG&–'WFR’°  –GG&–'WFW2ç&VÖ÷fR‚GG&–'WFR“° —v—&Vg&ÖTGG&–'WFW2æFVÆWFR‚vVöÖWG'’“°  —Ð  –&–æF–æu7FFW2ç&VÆV6U7FFW4ödvVöÖWG'’‚vVöÖWG'’“°  ––b‚vVöÖWG'’æ—4–ç7Fæ6VD'VffW$vVöÖWG'’ÓÓÒG'VR’°  –FVÆWFRvVöÖWG'’åöÖ„–ç7Fæ6T6÷VçC°  —Ð  ’òð  ––æfòæÖVÖ÷'’ævVöÖWG&–W2ÒÓ°  —Ð  –gVæ7F–öâvWB‚ö&¦V7BÂvVöÖWG'’’°  ––b‚vVöÖWG&–W5²vVöÖWG'’æ–BÒÓÓÒG'VR’&WGW&âvVöÖWG'“°  –vVöÖWG'’æFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöävVöÖWG'”F—7÷6R“°  –vVöÖWG&–W5²vVöÖWG'’æ–BÒÒG'VS°  ––æfòæÖVÖ÷'’ævVöÖWG&–W2²³°  —&WGW&âvVöÖWG'“°  —Ð  –gVæ7F–öâWFFR‚vVöÖWG'’’°  –6öç7BvVöÖWG'”GG&–'WFW2ÒvVöÖWG'’æGG&–'WFW3°  ’òòWFF–ær–æFW‚'VffW"–âdòæ÷râ6VRvV$tÄ&–æF–æu7FFW2à  –f÷"‚6öç7BæÖR–âvVöÖWG'”GG&–'WFW2’°  –GG&–'WFW2çWFFR‚vVöÖWG'”GG&–'WFW5²æÖRÒÂvÂä%$•ô%TddU"“°  —Ð  —Ð  –gVæ7F–öâWFFUv—&Vg&ÖTGG&–'WFR‚vVöÖWG'’’°  –6öç7B–æF–6W2ÒµÓ°  –6öç7BvVöÖWG'”–æFW‚ÒvVöÖWG'’æ–æFWƒ° –6öç7BvVöÖWG'•÷6—F–öâÒvVöÖWG'’æGG&–'WFW2ç÷6—F–öã° –ÆWBfW'6–öâÒ°  ––b‚vVöÖWG'”–æFW‚ÓÒçVÆÂ’°  –6öç7B'&’ÒvVöÖWG'”–æFW‚æ'&“° —fW'6–öâÒvVöÖWG'”–æFW‚çfW'6–öã°  –f÷"‚ÆWB’ÒÂÂÒ'&’æÆVæwFƒ²’ÂÃ²’³Ò2’°  –6öç7BÒ'&•²’²Ó° –6öç7B"Ò'&•²’²Ó° –6öç7B2Ò'&•²’²"Ó°  ––æF–6W2çW6‚‚Â"Â"Â2Â2Â“°  —Ð  —ÒVÇ6R–b‚vVöÖWG'•÷6—F–öâÓÒVæFVf–æVB’°  –6öç7B'&’ÒvVöÖWG'•÷6—F–öâæ'&“° —fW'6–öâÒvVöÖWG'•÷6—F–öâçfW'6–öã°  –f÷"‚ÆWB’ÒÂÂÒ‚'&’æÆVæwF‚ò2’Ò²’ÂÃ²’³Ò2’°  –6öç7BÒ’²° –6öç7B"Ò’²° –6öç7B2Ò’²#°  ––æF–6W2çW6‚‚Â"Â"Â2Â2Â“°  —Ð  —ÒVÇ6R°  —&WGW&ã°  —Ð  –6öç7BGG&–'WFRÒæWr‚'&”æVVG5V–çC3"‚–æF–6W2’òV–çC3$'VffW$GG&–'WFR¢V–çCd'VffW$GG&–'WFR’‚–æF–6W2Â“° –GG&–'WFRçfW'6–öâÒfW'6–öã°  ’òòWFF–ær–æFW‚'VffW"–âdòæ÷râ6VRvV$tÄ&–æF–æu7FFW0  ’òð  –6öç7B&Wf–÷W4GG&–'WFRÒv—&Vg&ÖTGG&–'WFW2ævWB‚vVöÖWG'’“°  ––b‚&Wf–÷W4GG&–'WFR’GG&–'WFW2ç&VÖ÷fR‚&Wf–÷W4GG&–'WFR“°  ’òð  —v—&Vg&ÖTGG&–'WFW2ç6WB‚vVöÖWG'’ÂGG&–'WFR“°  —Ð  –gVæ7F–öâvWEv—&Vg&ÖTGG&–'WFR‚vVöÖWG'’’°  –6öç7B7W'&VçDGG&–'WFRÒv—&Vg&ÖTGG&–'WFW2ævWB‚vVöÖWG'’“°  ––b‚7W'&VçDGG&–'WFR’°  –6öç7BvVöÖWG'”–æFW‚ÒvVöÖWG'’æ–æFWƒ°  ––b‚vVöÖWG'”–æFW‚ÓÒçVÆÂ’°  ’òò–bF†RGG&–'WFR—2ö'6öÆWFRÂ7&VFRæWröæP  ––b‚7W'&VçDGG&–'WFRçfW'6–öâÂvVöÖWG'”–æFW‚çfW'6–öâ’°  —WFFUv—&Vg&ÖTGG&–'WFR‚vVöÖWG'’“°  —Ð  —Ð  —ÒVÇ6R°  —WFFUv—&Vg&ÖTGG&–'WFR‚vVöÖWG'’“°  —Ð  —&WGW&âv—&Vg&ÖTGG&–'WFW2ævWB‚vVöÖWG'’“°  —Ð  —&WGW&â°  –vWC¢vWBÀ —WFFS¢WFFRÀ  –vWEv—&Vg&ÖTGG&–'WFS¢vWEv—&Vg&ÖTGG&–'WFP  —Ó° §Ð ¦gVæ7F–öâvV$tÄ–æFW†VD'VffW%&VæFW&W"‚vÂÂW‡FVç6–öç2Â–æfò’°  –ÆWBÖöFS°  –gVæ7F–öâ6WDÖöFR‚fÇVR’°  –ÖöFRÒfÇVS°  —Ð  –ÆWBG—RÂ'—FW5W$VÆVÖVçC°  –gVæ7F–öâ6WD–æFW‚‚fÇVR’°  —G—RÒfÇVRçG—S° –'—FW5W$VÆVÖVçBÒfÇVRæ'—FW5W$VÆVÖVçC°  —Ð  –gVæ7F–öâ&VæFW"‚7F'BÂ6÷VçB’°  –vÂæG&tVÆVÖVçG2‚ÖöFRÂ6÷VçBÂG—RÂ7F'B¢'—FW5W$VÆVÖVçB“°  ––æfòçWFFR‚6÷VçBÂÖöFRÂ“°  —Ð  –gVæ7F–öâ&VæFW$–ç7Fæ6W2‚7F'BÂ6÷VçBÂ&–Ö6÷VçB’°  ––b‚&–Ö6÷VçBÓÓÒ’&WGW&ã°  –vÂæG&tVÆVÖVçG4–ç7Fæ6VB‚ÖöFRÂ6÷VçBÂG—RÂ7F'B¢'—FW5W$VÆVÖVçBÂ&–Ö6÷VçB“°  ––æfòçWFFR‚6÷VçBÂÖöFRÂ&–Ö6÷VçB“°  —Ð  –gVæ7F–öâ&VæFW$×VÇF”G&r‚7F'G2Â6÷VçG2ÂG&t6÷VçB’°  ––b‚G&t6÷VçBÓÓÒ’&WGW&ã°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö×VÇF•öG&rr“° –W‡FVç6–öâæ×VÇF”G&tVÆVÖVçG5tT$tÂ‚ÖöFRÂ6÷VçG2ÂÂG—RÂ7F'G2ÂÂG&t6÷VçB“°  –ÆWBVÆVÖVçD6÷VçBÒ° –f÷"‚ÆWB’Ò²’ÂG&t6÷VçC²’²²’°  –VÆVÖVçD6÷VçB³Ò6÷VçG5²’Ó°  —Ð  ––æfòçWFFR‚VÆVÖVçD6÷VçBÂÖöFRÂ“°   —Ð  –gVæ7F–öâ&VæFW$×VÇF”G&t–ç7Fæ6W2‚7F'G2Â6÷VçG2ÂG&t6÷VçBÂ&–Ö6÷VçB’°  ––b‚G&t6÷VçBÓÓÒ’&WGW&ã°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö×VÇF•öG&rr“°  ––b‚W‡FVç6–öâÓÓÒçVÆÂ’°  –f÷"‚ÆWB’Ò²’Â7F'G2æÆVæwFƒ²’²²’°  —&VæFW$–ç7Fæ6W2‚7F'G5²’Òò'—FW5W$VÆVÖVçBÂ6÷VçG5²’ÒÂ&–Ö6÷VçE²’Ò“°  —Ð  —ÒVÇ6R°  –W‡FVç6–öâæ×VÇF”G&tVÆVÖVçG4–ç7Fæ6VEtT$tÂ‚ÖöFRÂ6÷VçG2ÂÂG—RÂ7F'G2ÂÂ&–Ö6÷VçBÂÂG&t6÷VçB“°  –ÆWBVÆVÖVçD6÷VçBÒ° –f÷"‚ÆWB’Ò²’ÂG&t6÷VçC²’²²’°  –VÆVÖVçD6÷VçB³Ò6÷VçG5²’Ò¢&–Ö6÷VçE²’Ó°  —Ð  ––æfòçWFFR‚VÆVÖVçD6÷VçBÂÖöFRÂ“°  —Ð  —Ð  ’òð  —F†—2ç6WDÖöFRÒ6WDÖöFS° —F†—2ç6WD–æFW‚Ò6WD–æFWƒ° —F†—2ç&VæFW"Ò&VæFW#° —F†—2ç&VæFW$–ç7Fæ6W2Ò&VæFW$–ç7Fæ6W3° —F†—2ç&VæFW$×VÇF”G&rÒ&VæFW$×VÇF”G&s° —F†—2ç&VæFW$×VÇF”G&t–ç7Fæ6W2Ò&VæFW$×VÇF”G&t–ç7Fæ6W3° §Ð ¦gVæ7F–öâvV$tÄ–æfò‚vÂ’°  –6öç7BÖVÖ÷'’Ò° –vVöÖWG&–W3¢À —FW‡GW&W3¢  —Ó°  –6öç7B&VæFW"Ò° –g&ÖS¢À –6ÆÇ3¢À —G&–ævÆW3¢À —ö–çG3¢À –Æ–æW3¢  —Ó°  –gVæ7F–öâWFFR‚6÷VçBÂÖöFRÂ–ç7Fæ6T6÷VçB’°  —&VæFW"æ6ÆÇ2²³°  —7v—F6‚‚ÖöFR’°  –66RvÂåE$”ätÄU3  —&VæFW"çG&–ævÆW2³Ò–ç7Fæ6T6÷VçB¢‚6÷VçBò2“° –'&V³°  –66RvÂäÄ”äU3  —&VæFW"æÆ–æW2³Ò–ç7Fæ6T6÷VçB¢‚6÷VçBò"“° –'&V³°  –66RvÂäÄ”äUõ5E$•  —&VæFW"æÆ–æW2³Ò–ç7Fæ6T6÷VçB¢‚6÷VçBÒ“° –'&V³°  –66RvÂäÄ”äUôÄôõ  —&VæFW"æÆ–æW2³Ò–ç7Fæ6T6÷VçB¢6÷VçC° –'&V³°  –66RvÂåô”åE3  —&VæFW"çö–çG2³Ò–ç7Fæ6T6÷VçB¢6÷VçC° –'&V³°  –FVfVÇC  –6öç6öÆRæW'&÷"‚uD…$TRåvV$tÄ–æfó¢Væ¶æ÷vâG&rÖöFS¢rÂÖöFR“° –'&V³°  —Ð  —Ð  –gVæ7F–öâ&W6WB‚’°  —&VæFW"æ6ÆÇ2Ò° —&VæFW"çG&–ævÆW2Ò° —&VæFW"çö–çG2Ò° —&VæFW"æÆ–æW2Ò°  —Ð  —&WGW&â° –ÖVÖ÷'“¢ÖVÖ÷'’À —&VæFW#¢&VæFW"À —&öw&×3¢çVÆÂÀ –WFõ&W6WC¢G'VRÀ —&W6WC¢&W6WBÀ —WFFS¢WFFP —Ó° §Ð ¦gVæ7F–öâvV$tÄÖ÷'‡F&vWG2‚vÂÂ6&–Æ—F–W2ÂFW‡GW&W2’°  –6öç7BÖ÷'…FW‡GW&W2ÒæWrvV´Ö‚“° –6öç7BÖ÷'‚ÒæWrfV7F÷#B‚“°  –gVæ7F–öâWFFR‚ö&¦V7BÂvVöÖWG'’Â&öw&Ò’°  –6öç7Bö&¦V7D–æfÇVVæ6W2Òö&¦V7BæÖ÷'…F&vWD–æfÇVVæ6W3°  ’òòF†RföÆÆ÷v–ærVæ6öFW2Ö÷'‚F&vWG2–çFòâ'&’öbFFFW‡GW&W2âV6‚Æ–W"&W&W6VçG26–ævÆRÖ÷'‚F&vWBà  –6öç7BÖ÷'„GG&–'WFRÒvVöÖWG'’æÖ÷'„GG&–'WFW2ç÷6—F–öâÇÂvVöÖWG'’æÖ÷'„GG&–'WFW2ææ÷&ÖÂÇÂvVöÖWG'’æÖ÷'„GG&–'WFW2æ6öÆ÷#° –6öç7BÖ÷'…F&vWG46÷VçBÒ‚Ö÷'„GG&–'WFRÓÒVæFVf–æVB’òÖ÷'„GG&–'WFRæÆVæwF‚¢°  –ÆWBVçG'’ÒÖ÷'…FW‡GW&W2ævWB‚vVöÖWG'’“°  ––b‚VçG'’ÓÓÒVæFVf–æVBÇÂVçG'’æ6÷VçBÓÒÖ÷'…F&vWG46÷VçB’°  ––b‚VçG'’ÓÒVæFVf–æVB’VçG'’çFW‡GW&RæF—7÷6R‚“°  –6öç7B†4Ö÷'…÷6—F–öâÒvVöÖWG'’æÖ÷'„GG&–'WFW2ç÷6—F–öâÓÒVæFVf–æVC° –6öç7B†4Ö÷'„æ÷&ÖÇ2ÒvVöÖWG'’æÖ÷'„GG&–'WFW2ææ÷&ÖÂÓÒVæFVf–æVC° –6öç7B†4Ö÷'„6öÆ÷'2ÒvVöÖWG'’æÖ÷'„GG&–'WFW2æ6öÆ÷"ÓÒVæFVf–æVC°  –6öç7BÖ÷'…F&vWG2ÒvVöÖWG'’æÖ÷'„GG&–'WFW2ç÷6—F–öâÇÂµÓ° –6öç7BÖ÷'„æ÷&ÖÇ2ÒvVöÖWG'’æÖ÷'„GG&–'WFW2ææ÷&ÖÂÇÂµÓ° –6öç7BÖ÷'„6öÆ÷'2ÒvVöÖWG'’æÖ÷'„GG&–'WFW2æ6öÆ÷"ÇÂµÓ°  –ÆWBfW'FW„FF6÷VçBÒ°  ––b‚†4Ö÷'…÷6—F–öâÓÓÒG'VR’fW'FW„FF6÷VçBÒ° ––b‚†4Ö÷'„æ÷&ÖÇ2ÓÓÒG'VR’fW'FW„FF6÷VçBÒ#° ––b‚†4Ö÷'„6öÆ÷'2ÓÓÒG'VR’fW'FW„FF6÷VçBÒ3°  –ÆWBv–GF‚ÒvVöÖWG'’æGG&–'WFW2ç÷6—F–öâæ6÷VçB¢fW'FW„FF6÷VçC° –ÆWB†V–v‡BÒ°  ––b‚v–GF‚â6&–Æ—F–W2æÖ…FW‡GW&U6—¦R’°  –†V–v‡BÒÖF‚æ6V–Â‚v–GF‚ò6&–Æ—F–W2æÖ…FW‡GW&U6—¦R“° —v–GF‚Ò6&–Æ—F–W2æÖ…FW‡GW&U6—¦S°  —Ð  –6öç7B'VffW"ÒæWrfÆöC3$'&’‚v–GF‚¢†V–v‡B¢B¢Ö÷'…F&vWG46÷VçB“°  –6öç7BFW‡GW&RÒæWrFF'&•FW‡GW&R‚'VffW"Âv–GF‚Â†V–v‡BÂÖ÷'…F&vWG46÷VçB“° —FW‡GW&RçG—RÒfÆöEG—S° —FW‡GW&RææVVG5WFFRÒG'VS°  ’òòf–ÆÂ'VffW   –6öç7BfW'FW„FF7G&–FRÒfW'FW„FF6÷VçB¢C°  –f÷"‚ÆWB’Ò²’ÂÖ÷'…F&vWG46÷VçC²’²²’°  –6öç7BÖ÷'…F&vWBÒÖ÷'…F&vWG5²’Ó° –6öç7BÖ÷'„æ÷&ÖÂÒÖ÷'„æ÷&ÖÇ5²’Ó° –6öç7BÖ÷'„6öÆ÷"ÒÖ÷'„6öÆ÷'5²’Ó°  –6öç7Böfg6WBÒv–GF‚¢†V–v‡B¢B¢“°  –f÷"‚ÆWB¢Ò²¢ÂÖ÷'…F&vWBæ6÷VçC²¢²²’°  –6öç7B7G&–FRÒ¢¢fW'FW„FF7G&–FS°  ––b‚†4Ö÷'…÷6—F–öâÓÓÒG'VR’°  –Ö÷'‚æg&öÔ'VffW$GG&–'WFR‚Ö÷'…F&vWBÂ¢“°  –'VffW%²öfg6WB²7G&–FR²ÒÒÖ÷'‚çƒ° –'VffW%²öfg6WB²7G&–FR²ÒÒÖ÷'‚ç“° –'VffW%²öfg6WB²7G&–FR²"ÒÒÖ÷'‚ç£° –'VffW%²öfg6WB²7G&–FR²2ÒÒ°  —Ð  ––b‚†4Ö÷'„æ÷&ÖÇ2ÓÓÒG'VR’°  –Ö÷'‚æg&öÔ'VffW$GG&–'WFR‚Ö÷'„æ÷&ÖÂÂ¢“°  –'VffW%²öfg6WB²7G&–FR²BÒÒÖ÷'‚çƒ° –'VffW%²öfg6WB²7G&–FR²RÒÒÖ÷'‚ç“° –'VffW%²öfg6WB²7G&–FR²bÒÒÖ÷'‚ç£° –'VffW%²öfg6WB²7G&–FR²rÒÒ°  —Ð  ––b‚†4Ö÷'„6öÆ÷'2ÓÓÒG'VR’°  –Ö÷'‚æg&öÔ'VffW$GG&–'WFR‚Ö÷'„6öÆ÷"Â¢“°  –'VffW%²öfg6WB²7G&–FR²‚ÒÒÖ÷'‚çƒ° –'VffW%²öfg6WB²7G&–FR²’ÒÒÖ÷'‚ç“° –'VffW%²öfg6WB²7G&–FR²ÒÒÖ÷'‚ç£° –'VffW%²öfg6WB²7G&–FR²ÒÒ‚Ö÷'„6öÆ÷"æ—FVÕ6—¦RÓÓÒB’òÖ÷'‚çr¢°  —Ð  —Ð  —Ð  –VçG'’Ò° –6÷VçC¢Ö÷'…F&vWG46÷VçBÀ —FW‡GW&S¢FW‡GW&RÀ —6—¦S¢æWrfV7F÷#"‚v–GF‚Â†V–v‡B —Ó°  –Ö÷'…FW‡GW&W2ç6WB‚vVöÖWG'’ÂVçG'’“°  –gVæ7F–öâF—7÷6UFW‡GW&R‚’°  —FW‡GW&RæF—7÷6R‚“°  –Ö÷'…FW‡GW&W2æFVÆWFR‚vVöÖWG'’“°  –vVöÖWG'’ç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂF—7÷6UFW‡GW&R“°  —Ð  –vVöÖWG'’æFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂF—7÷6UFW‡GW&R“°  —Ð  ’òð ––b‚ö&¦V7Bæ—4–ç7Fæ6VDÖW6‚ÓÓÒG'VRbbö&¦V7BæÖ÷'…FW‡GW&RÓÒçVÆÂ’°  —&öw&ÒævWEVæ–f÷&×2‚’ç6WEfÇVR‚vÂÂvÖ÷'…FW‡GW&RrÂö&¦V7BæÖ÷'…FW‡GW&RÂFW‡GW&W2“°  —ÒVÇ6R°  –ÆWBÖ÷'„–æfÇVVæ6W57VÒÒ°  –f÷"‚ÆWB’Ò²’Âö&¦V7D–æfÇVVæ6W2æÆVæwFƒ²’²²’°  –Ö÷'„–æfÇVVæ6W57VÒ³Òö&¦V7D–æfÇVVæ6W5²’Ó°  —Ð  –6öç7BÖ÷'„&6T–æfÇVVæ6RÒvVöÖWG'’æÖ÷'…F&vWG5&VÆF—fRò¢ÒÖ÷'„–æfÇVVæ6W57VÓ°   —&öw&ÒævWEVæ–f÷&×2‚’ç6WEfÇVR‚vÂÂvÖ÷'…F&vWD&6T–æfÇVVæ6RrÂÖ÷'„&6T–æfÇVVæ6R“° —&öw&ÒævWEVæ–f÷&×2‚’ç6WEfÇVR‚vÂÂvÖ÷'…F&vWD–æfÇVVæ6W2rÂö&¦V7D–æfÇVVæ6W2“°  —Ð  —&öw&ÒævWEVæ–f÷&×2‚’ç6WEfÇVR‚vÂÂvÖ÷'…F&vWG5FW‡GW&RrÂVçG'’çFW‡GW&RÂFW‡GW&W2“° —&öw&ÒævWEVæ–f÷&×2‚’ç6WEfÇVR‚vÂÂvÖ÷'…F&vWG5FW‡GW&U6—¦RrÂVçG'’ç6—¦R“°  —Ð  —&WGW&â°  —WFFS¢WFFP  —Ó° §Ð ¦gVæ7F–öâvV$tÄö&¦V7G2‚vÂÂvVöÖWG&–W2ÂGG&–'WFW2Â–æfò’°  –ÆWBWFFTÖÒæWrvV´Ö‚“°  –gVæ7F–öâWFFR‚ö&¦V7B’°  –6öç7Bg&ÖRÒ–æfòç&VæFW"æg&ÖS°  –6öç7BvVöÖWG'’Òö&¦V7BævVöÖWG'“° –6öç7B'VffW&vVöÖWG'’ÒvVöÖWG&–W2ævWB‚ö&¦V7BÂvVöÖWG'’“°  ’òòWFFRöæ6RW"g&ÖP  ––b‚WFFTÖævWB‚'VffW&vVöÖWG'’’ÓÒg&ÖR’°  –vVöÖWG&–W2çWFFR‚'VffW&vVöÖWG'’“°  —WFFTÖç6WB‚'VffW&vVöÖWG'’Âg&ÖR“°  —Ð  ––b‚ö&¦V7Bæ—4–ç7Fæ6VDÖW6‚’°  ––b‚ö&¦V7Bæ†4WfVçDÆ—7FVæW"‚vF—7÷6RrÂöä–ç7Fæ6VDÖW6„F—7÷6R’ÓÓÒfÇ6R’°  –ö&¦V7BæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöä–ç7Fæ6VDÖW6„F—7÷6R“°  —Ð  ––b‚WFFTÖævWB‚ö&¦V7B’ÓÒg&ÖR’°  –GG&–'WFW2çWFFR‚ö&¦V7Bæ–ç7Fæ6TÖG&—‚ÂvÂä%$•ô%TddU"“°  ––b‚ö&¦V7Bæ–ç7Fæ6T6öÆ÷"ÓÒçVÆÂ’°  –GG&–'WFW2çWFFR‚ö&¦V7Bæ–ç7Fæ6T6öÆ÷"ÂvÂä%$•ô%TddU"“°  —Ð  —WFFTÖç6WB‚ö&¦V7BÂg&ÖR“°  —Ð  —Ð  ––b‚ö&¦V7Bæ—56¶–ææVDÖW6‚’°  –6öç7B6¶VÆWFöâÒö&¦V7Bç6¶VÆWFöã°  ––b‚WFFTÖævWB‚6¶VÆWFöâ’ÓÒg&ÖR’°  —6¶VÆWFöâçWFFR‚“°  —WFFTÖç6WB‚6¶VÆWFöâÂg&ÖR“°  —Ð  —Ð  —&WGW&â'VffW&vVöÖWG'“°  —Ð  –gVæ7F–öâF—7÷6R‚’°  —WFFTÖÒæWrvV´Ö‚“°  —Ð  –gVæ7F–öâöä–ç7Fæ6VDÖW6„F—7÷6R‚WfVçB’°  –6öç7B–ç7Fæ6VDÖW6‚ÒWfVçBçF&vWC°  ––ç7Fæ6VDÖW6‚ç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöä–ç7Fæ6VDÖW6„F—7÷6R“°  –GG&–'WFW2ç&VÖ÷fR‚–ç7Fæ6VDÖW6‚æ–ç7Fæ6TÖG&—‚“°  ––b‚–ç7Fæ6VDÖW6‚æ–ç7Fæ6T6öÆ÷"ÓÒçVÆÂ’GG&–'WFW2ç&VÖ÷fR‚–ç7Fæ6VDÖW6‚æ–ç7Fæ6T6öÆ÷"“°  —Ð  —&WGW&â°  —WFFS¢WFFRÀ –F—7÷6S¢F—7÷6P  —Ó° §Ð ¢ò¢ ¢¢Væ–f÷&×2öb&öw&Òà¢¢F†÷6Rf÷&ÒG&VR7G'V7GW&Rv—F‚7V6–ÂF÷ÖÆWfVÂ6öçF–æW"f÷"F†R&ö÷BÀ¢¢v†–6‚–÷RvWB'’6ÆÆ–ærvæWrvV$tÅVæ–f÷&×2‚vÂÂ&öw&Ò’rà¢ ¢ ¢¢&÷W'F–W2öb–ææW"æöFW2–æ6ÇVF–ærF†RF÷ÖÆWfVÂ6öçF–æW# ¢ ¢¢ç6WÒ'&’öbæW7FVBVæ–f÷&×0¢¢æÖÒæW7FVBVæ–f÷&×2'’æÖP¢ ¢ ¢¢ÖWF†öG2öbÆÂæöFW2W†6WBF†RF÷ÖÆWfVÂ6öçF–æW# ¢ ¢¢ç6WEfÇVR‚vÂÂfÇVRÂ·FW‡GW&W5Ò¢ ¢¢ —WÆöG2Væ–f÷&ÒfÇVR‡2¢¢ —F†RwFW‡GW&W2r&ÖWFW"—2æVVFVBf÷"6×ÆW"Væ–f÷&×0¢ ¢ ¢¢7FF–2ÖWF†öG2öbF†RF÷ÖÆWfVÂ6öçF–æW"‡FW‡GW&W2f7F÷&—¦F–öç2“ ¢ ¢¢çWÆöB‚vÂÂ6WÂfÇVW2ÂFW‡GW&W2¢ ¢¢ —6WG2Væ–f÷&×2–âw6WrFòwfÇVW5¶–EÒçfÇVRp¢ ¢¢ç6Wv—F…fÇVR‚6WÂfÇVW2’¢f–ÇFW&VE6W¢ ¢¢ –f–ÇFW'2w6WrVçG&–W2v—F‚6÷'&W7öæF–ærVçG'’–âfÇVW0¢ ¢ ¢¢ÖWF†öG2öbF†RF÷ÖÆWfVÂ6öçF–æW"‡FW‡GW&W2f7F÷&—¦F–öç2“ ¢ ¢¢ç6WEfÇVR‚vÂÂæÖRÂfÇVRÂFW‡GW&W2¢ ¢¢ —6WG2Væ–f÷&Òv—F‚æÖRvæÖRrFòwfÇVRp¢ ¢¢ç6WD÷F–öæÂ‚vÂÂö&¢Â&÷¢ ¢¢ –Æ–¶Rç6WBf÷"â÷F–öæÂ&÷W'G’öbF†Rö&¦V7@¢ ¢¢ð  ¦6öç7BV×G•FW‡GW&RÒò¤õõU$Uõò¢òæWrFW‡GW&R‚“° ¦6öç7BV×G•6†F÷uFW‡GW&RÒò¤õõU$Uõò¢òæWrFWF…FW‡GW&R‚Â“° ¦6öç7BV×G”'&•FW‡GW&RÒò¤õõU$Uõò¢òæWrFF'&•FW‡GW&R‚“°¦6öç7BV×G“6EFW‡GW&RÒò¤õõU$Uõò¢òæWrFF4EFW‡GW&R‚“°¦6öç7BV×G”7V&UFW‡GW&RÒò¤õõU$Uõò¢òæWr7V&UFW‡GW&R‚“° ¢òòÒÒÒWF–Æ—F–W2ÒÒÐ ¢òò'&’66†W2‡&÷f–FRG—VB'&—2f÷"FV×÷&'’'’6—¦R ¦6öç7B'&”66†Tc3"ÒµÓ°¦6öç7B'&”66†T“3"ÒµÓ° ¢òòfÆöC3$'&’66†W2W6VBf÷"WÆöF–ærÖG&—‚Væ–f÷&×0 ¦6öç7BÖCF'&’ÒæWrfÆöC3$'&’‚b“°¦6öç7BÖC6'&’ÒæWrfÆöC3$'&’‚’“°¦6öç7BÖC&'&’ÒæWrfÆöC3$'&’‚B“° ¢òòfÆGFVæ–ærf÷"'&—2öbfV7F÷'2æBÖG&–6W0 ¦gVæ7F–öâfÆGFVâ‚'&’Âä&Æö6·2Â&Æö6µ6—¦R’°  –6öç7Bf—'7DVÆVÒÒ'&•²Ó°  ––b‚f—'7DVÆVÒÃÒÇÂf—'7DVÆVÒâ’&WGW&â'&“° ’òòVæ÷F–Ö—¦VC¢—4æâ‚f—'7DVÆVÒ ’òò6VR‡GG¢òö¦6·6öæGVç7Fâæ6öÒö'F–6ÆW2ó“ƒ0  –6öç7BâÒä&Æö6·2¢&Æö6µ6—¦S° –ÆWB"Ò'&”66†Tc3%²âÓ°  ––b‚"ÓÓÒVæFVf–æVB’°  —"ÒæWrfÆöC3$'&’‚â“° –'&”66†Tc3%²âÒÒ#°  —Ð  ––b‚ä&Æö6·2ÓÒ’°  –f—'7DVÆVÒçFô'&’‚"Â“°  –f÷"‚ÆWB’ÒÂöfg6WBÒ²’ÓÒä&Æö6·3²²²’’°  –öfg6WB³Ò&Æö6µ6—¦S° –'&•²’ÒçFô'&’‚"Âöfg6WB“°  —Ð  —Ð  —&WGW&â#° §Ð ¦gVæ7F–öâ'&—4WVÂ‚Â"’°  ––b‚æÆVæwF‚ÓÒ"æÆVæwF‚’&WGW&âfÇ6S°  –f÷"‚ÆWB’ÒÂÂÒæÆVæwFƒ²’ÂÃ²’²²’°  ––b‚²’ÒÓÒ%²’Ò’&WGW&âfÇ6S°  —Ð  —&WGW&âG'VS° §Ð ¦gVæ7F–öâ6÷”'&’‚Â"’°  –f÷"‚ÆWB’ÒÂÂÒ"æÆVæwFƒ²’ÂÃ²’²²’°  –²’ÒÒ%²’Ó°  —Ð §Ð ¢òòFW‡GW&RVæ—BÆÆö6F–öà ¦gVæ7F–öâÆÆö5FW…Væ—G2‚FW‡GW&W2Ââ’°  –ÆWB"Ò'&”66†T“3%²âÓ°  ––b‚"ÓÓÒVæFVf–æVB’°  —"ÒæWr–çC3$'&’‚â“° –'&”66†T“3%²âÒÒ#°  —Ð  –f÷"‚ÆWB’Ò²’ÓÒã²²²’’°  —%²’ÒÒFW‡GW&W2æÆÆö6FUFW‡GW&UVæ—B‚“°  —Ð  —&WGW&â#° §Ð ¢òòÒÒÒ6WGFW'2ÒÒÐ ¢òòæ÷FS¢FVf–æ–ærF†W6RÖWF†öG2W‡FW&æÆÇ’Â&V6W6RF†W’6öÖR–â'Væ6€¢òòæBF†—2v’F†V—"æÖW2Ö–æ–g’à ¢òò6–ævÆR66Æ  ¦gVæ7F–öâ6WEfÇVUcb‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚66†U²ÒÓÓÒb’&WGW&ã°  –vÂçVæ–f÷&Ób‚F†—2æFG"Âb“°  –66†U²ÒÒc° §Ð ¢òò6–ævÆRfÆöBfV7F÷"†g&öÒfÆB'&’÷"D…$TRåfV7F÷$â ¦gVæ7F–öâ6WEfÇVUc&b‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’’°  –vÂçVæ–f÷&Ó&b‚F†—2æFG"Âbç‚Âbç’“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó&gb‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUc6b‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢’°  –vÂçVæ–f÷&Ó6b‚F†—2æFG"Âbç‚Âbç’Âbç¢“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£°  —Ð  —ÒVÇ6R–b‚bç"ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç"ÇÂ66†U²ÒÓÒbærÇÂ66†U²"ÒÓÒbæ"’°  –vÂçVæ–f÷&Ó6b‚F†—2æFG"Âbç"ÂbærÂbæ"“°  –66†U²ÒÒbç#° –66†U²ÒÒbæs° –66†U²"ÒÒbæ#°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó6gb‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUcFb‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢ÇÂ66†U²2ÒÓÒbçr’°  –vÂçVæ–f÷&ÓFb‚F†—2æFG"Âbç‚Âbç’Âbç¢Âbçr“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£° –66†U²2ÒÒbçs°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÓFgb‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¢òò6–ævÆRÖG&—‚†g&öÒfÆB'&’÷"D…$TRäÖG&—„â ¦gVæ7F–öâ6WEfÇVTÓ"‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVÆVÖVçG2ÒbæVÆVÖVçG3°  ––b‚VÆVÖVçG2ÓÓÒVæFVf–æVB’°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÔÖG&—ƒ&gb‚F†—2æFG"ÂfÇ6RÂb“°  –6÷”'&’‚66†RÂb“°  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂVÆVÖVçG2’’&WGW&ã°  –ÖC&'&’ç6WB‚VÆVÖVçG2“°  –vÂçVæ–f÷&ÔÖG&—ƒ&gb‚F†—2æFG"ÂfÇ6RÂÖC&'&’“°  –6÷”'&’‚66†RÂVÆVÖVçG2“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVTÓ2‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVÆVÖVçG2ÒbæVÆVÖVçG3°  ––b‚VÆVÖVçG2ÓÓÒVæFVf–æVB’°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÔÖG&—ƒ6gb‚F†—2æFG"ÂfÇ6RÂb“°  –6÷”'&’‚66†RÂb“°  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂVÆVÖVçG2’’&WGW&ã°  –ÖC6'&’ç6WB‚VÆVÖVçG2“°  –vÂçVæ–f÷&ÔÖG&—ƒ6gb‚F†—2æFG"ÂfÇ6RÂÖC6'&’“°  –6÷”'&’‚66†RÂVÆVÖVçG2“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVTÓB‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVÆVÖVçG2ÒbæVÆVÖVçG3°  ––b‚VÆVÖVçG2ÓÓÒVæFVf–æVB’°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÔÖG&—ƒFgb‚F†—2æFG"ÂfÇ6RÂb“°  –6÷”'&’‚66†RÂb“°  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂVÆVÖVçG2’’&WGW&ã°  –ÖCF'&’ç6WB‚VÆVÖVçG2“°  –vÂçVæ–f÷&ÔÖG&—ƒFgb‚F†—2æFG"ÂfÇ6RÂÖCF'&’“°  –6÷”'&’‚66†RÂVÆVÖVçG2“°  —Ð §Ð ¢òò6–ævÆR–çFVvW"ò&ööÆVà ¦gVæ7F–öâ6WEfÇVUc’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚66†U²ÒÓÓÒb’&WGW&ã°  –vÂçVæ–f÷&Ó’‚F†—2æFG"Âb“°  –66†U²ÒÒc° §Ð ¢òò6–ævÆR–çFVvW"ò&ööÆVâfV7F÷"†g&öÒfÆB'&’÷"D…$TRåfV7F÷$â ¦gVæ7F–öâ6WEfÇVUc&’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’’°  –vÂçVæ–f÷&Ó&’‚F†—2æFG"Âbç‚Âbç’“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó&—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUc6’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢’°  –vÂçVæ–f÷&Ó6’‚F†—2æFG"Âbç‚Âbç’Âbç¢“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó6—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUcF’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢ÇÂ66†U²2ÒÓÒbçr’°  –vÂçVæ–f÷&ÓF’‚F†—2æFG"Âbç‚Âbç’Âbç¢Âbçr“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£° –66†U²2ÒÒbçs°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÓF—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¢òò6–ævÆRVç6–væVB–çFVvW  ¦gVæ7F–öâ6WEfÇVUcV’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚66†U²ÒÓÓÒb’&WGW&ã°  –vÂçVæ–f÷&ÓV’‚F†—2æFG"Âb“°  –66†U²ÒÒc° §Ð ¢òò6–ævÆRVç6–væVB–çFVvW"fV7F÷"†g&öÒfÆB'&’÷"D…$TRåfV7F÷$â ¦gVæ7F–öâ6WEfÇVUc'V’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’’°  –vÂçVæ–f÷&Ó'V’‚F†—2æFG"Âbç‚Âbç’“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó'V—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUc7V’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢’°  –vÂçVæ–f÷&Ó7V’‚F†—2æFG"Âbç‚Âbç’Âbç¢“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&Ó7V—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUcGV’‚vÂÂb’°  –6öç7B66†RÒF†—2æ66†S°  ––b‚bç‚ÓÒVæFVf–æVB’°  ––b‚66†U²ÒÓÒbç‚ÇÂ66†U²ÒÓÒbç’ÇÂ66†U²"ÒÓÒbç¢ÇÂ66†U²2ÒÓÒbçr’°  –vÂçVæ–f÷&ÓGV’‚F†—2æFG"Âbç‚Âbç’Âbç¢Âbçr“°  –66†U²ÒÒbçƒ° –66†U²ÒÒbç“° –66†U²"ÒÒbç£° –66†U²2ÒÒbçs°  —Ð  —ÒVÇ6R°  ––b‚'&—4WVÂ‚66†RÂb’’&WGW&ã°  –vÂçVæ–f÷&ÓGV—b‚F†—2æFG"Âb“°  –6÷”'&’‚66†RÂb“°  —Ð §Ð  ¢òò6–ævÆRFW‡GW&Rƒ$Bò7V&R ¦gVæ7F–öâ6WEfÇVUC‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVæ—BÒFW‡GW&W2æÆÆö6FUFW‡GW&UVæ—B‚“°  ––b‚66†U²ÒÓÒVæ—B’°  –vÂçVæ–f÷&Ó’‚F†—2æFG"ÂVæ—B“° –66†U²ÒÒVæ—C°  —Ð  –ÆWBV×G•FW‡GW&S$C°  ––b‚F†—2çG—RÓÓÒvÂå4ÕÄU%ó$Eõ4„Dõr’°  –V×G•6†F÷uFW‡GW&Ræ6ö×&TgVæ7F–öâÒÆW74WVÄ6ö×&S²òò3#ƒcs  –V×G•FW‡GW&S$BÒV×G•6†F÷uFW‡GW&S°  —ÒVÇ6R°  –V×G•FW‡GW&S$BÒV×G•FW‡GW&S°  —Ð  —FW‡GW&W2ç6WEFW‡GW&S$B‚bÇÂV×G•FW‡GW&S$BÂVæ—B“° §Ð ¦gVæ7F–öâ6WEfÇVUC4C‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVæ—BÒFW‡GW&W2æÆÆö6FUFW‡GW&UVæ—B‚“°  ––b‚66†U²ÒÓÒVæ—B’°  –vÂçVæ–f÷&Ó’‚F†—2æFG"ÂVæ—B“° –66†U²ÒÒVæ—C°  —Ð  —FW‡GW&W2ç6WEFW‡GW&S4B‚bÇÂV×G“6EFW‡GW&RÂVæ—B“° §Ð ¦gVæ7F–öâ6WEfÇVUCb‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVæ—BÒFW‡GW&W2æÆÆö6FUFW‡GW&UVæ—B‚“°  ––b‚66†U²ÒÓÒVæ—B’°  –vÂçVæ–f÷&Ó’‚F†—2æFG"ÂVæ—B“° –66†U²ÒÒVæ—C°  —Ð  —FW‡GW&W2ç6WEFW‡GW&T7V&R‚bÇÂV×G”7V&UFW‡GW&RÂVæ—B“° §Ð ¦gVæ7F–öâ6WEfÇVUC$D'&“‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S° –6öç7BVæ—BÒFW‡GW&W2æÆÆö6FUFW‡GW&UVæ—B‚“°  ––b‚66†U²ÒÓÒVæ—B’°  –vÂçVæ–f÷&Ó’‚F†—2æFG"ÂVæ—B“° –66†U²ÒÒVæ—C°  —Ð  —FW‡GW&W2ç6WEFW‡GW&S$D'&’‚bÇÂV×G”'&•FW‡GW&RÂVæ—B“° §Ð ¢òò†VÇW"Fò–6²F†R&–v‡B6WGFW"f÷"F†R6–æwVÆ"66P ¦gVæ7F–öâvWE6–æwVÆ%6WGFW"‚G—R’°  —7v—F6‚‚G—R’°  –66RƒCc¢&WGW&â6WEfÇVUcc²òòdÄô@ –66Rƒ†#S¢&WGW&â6WEfÇVUc&c²òòõdT3  –66Rƒ†#S¢&WGW&â6WEfÇVUc6c²òòõdT30 –66Rƒ†#S#¢&WGW&â6WEfÇVUcFc²òòõdT3@  –66Rƒ†#V¢&WGW&â6WEfÇVTÓ#²òòôÔC  –66Rƒ†#V#¢&WGW&â6WEfÇVTÓ3²òòôÔC0 –66Rƒ†#V3¢&WGW&â6WEfÇVTÓC²òòôÔC@  –66RƒCC¢66Rƒ†#Sc¢&WGW&â6WEfÇVUc“²òò”åBÂ$ôôÀ –66Rƒ†#S3¢66Rƒ†#Ss¢&WGW&â6WEfÇVUc&“²òòõdT3  –66Rƒ†#SC¢66Rƒ†#Sƒ¢&WGW&â6WEfÇVUc6“²òòõdT30 –66Rƒ†#SS¢66Rƒ†#S“¢&WGW&â6WEfÇVUcF“²òòõdT3@  –66RƒCS¢&WGW&â6WEfÇVUcV“²òòT”å@ –66Rƒ†F3c¢&WGW&â6WEfÇVUc'V“²òòõdT3  –66Rƒ†F3s¢&WGW&â6WEfÇVUc7V“²òòõdT30 –66Rƒ†F3ƒ¢&WGW&â6WEfÇVUcGV“²òòõdT3@  –66Rƒ†#VS¢òò4ÕÄU%ó$@ –66Rƒ†Ccc¢òò4ÕÄU%ôU…DU$äÅôôU0 –66Rƒ†F6¢òò”åEõ4ÕÄU%ó$@ –66Rƒ†FC#¢òòTå4”täTEô”åEõ4ÕÄU%ó$@ –66Rƒ†#c#¢òò4ÕÄU%ó$Eõ4„Dõp —&WGW&â6WEfÇVUC°  –66Rƒ†#Vc¢òò4ÕÄU%ó4@ –66Rƒ†F6#¢òò”åEõ4ÕÄU%ó4@ –66Rƒ†FC3¢òòTå4”täTEô”åEõ4ÕÄU%ó4@ —&WGW&â6WEfÇVUC4C°  –66Rƒ†#c¢òò4ÕÄU%ô5T$P –66Rƒ†F63¢òò”åEõ4ÕÄU%ô5T$P –66Rƒ†FCC¢òòTå4”täTEô”åEõ4ÕÄU%ô5T$P –66Rƒ†F3S¢òò4ÕÄU%ô5T$Uõ4„Dõp —&WGW&â6WEfÇVUCc°  –66Rƒ†F3¢òò4ÕÄU%ó$Eô%$ –66Rƒ†F6c¢òò”åEõ4ÕÄU%ó$Eô%$ –66Rƒ†FCs¢òòTå4”täTEô”åEõ4ÕÄU%ó$Eô%$ –66Rƒ†F3C¢òò4ÕÄU%ó$Eô%$•õ4„Dõp —&WGW&â6WEfÇVUC$D'&“°  —Ð §Ð  ¢òò'&’öb66Æ'0 ¦gVæ7F–öâ6WEfÇVUcd'&’‚vÂÂb’°  –vÂçVæ–f÷&Ógb‚F†—2æFG"Âb“° §Ð ¢òò'&’öbfV7F÷'2†g&öÒfÆB'&’÷"'&’öbD…$TRåfV7F÷$â ¦gVæ7F–öâ6WEfÇVUc&d'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂ"“°  –vÂçVæ–f÷&Ó&gb‚F†—2æFG"ÂFF“° §Ð ¦gVæ7F–öâ6WEfÇVUc6d'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂ2“°  –vÂçVæ–f÷&Ó6gb‚F†—2æFG"ÂFF“° §Ð ¦gVæ7F–öâ6WEfÇVUcFd'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂB“°  –vÂçVæ–f÷&ÓFgb‚F†—2æFG"ÂFF“° §Ð ¢òò'&’öbÖG&–6W2†g&öÒfÆB'&’÷"'&’öbD…$TRäÖG&—„â ¦gVæ7F–öâ6WEfÇVTÓ$'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂB“°  –vÂçVæ–f÷&ÔÖG&—ƒ&gb‚F†—2æFG"ÂfÇ6RÂFF“° §Ð ¦gVæ7F–öâ6WEfÇVTÓ4'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂ’“°  –vÂçVæ–f÷&ÔÖG&—ƒ6gb‚F†—2æFG"ÂfÇ6RÂFF“° §Ð ¦gVæ7F–öâ6WEfÇVTÓD'&’‚vÂÂb’°  –6öç7BFFÒfÆGFVâ‚bÂF†—2ç6—¦RÂb“°  –vÂçVæ–f÷&ÔÖG&—ƒFgb‚F†—2æFG"ÂfÇ6RÂFF“° §Ð ¢òò'&’öb–çFVvW"ò&ööÆVà ¦gVæ7F–öâ6WEfÇVUc”'&’‚vÂÂb’°  –vÂçVæ–f÷&Ó—b‚F†—2æFG"Âb“° §Ð ¢òò'&’öb–çFVvW"ò&ööÆVâfV7F÷'2†g&öÒfÆB'&’ ¦gVæ7F–öâ6WEfÇVUc&”'&’‚vÂÂb’°  –vÂçVæ–f÷&Ó&—b‚F†—2æFG"Âb“° §Ð ¦gVæ7F–öâ6WEfÇVUc6”'&’‚vÂÂb’°  –vÂçVæ–f÷&Ó6—b‚F†—2æFG"Âb“° §Ð ¦gVæ7F–öâ6WEfÇVUcF”'&’‚vÂÂb’°  –vÂçVæ–f÷&ÓF—b‚F†—2æFG"Âb“° §Ð ¢òò'&’öbVç6–væVB–çFVvW  ¦gVæ7F–öâ6WEfÇVUcV”'&’‚vÂÂb’°  –vÂçVæ–f÷&ÓV—b‚F†—2æFG"Âb“° §Ð ¢òò'&’öbVç6–væVB–çFVvW"fV7F÷'2†g&öÒfÆB'&’ ¦gVæ7F–öâ6WEfÇVUc'V”'&’‚vÂÂb’°  –vÂçVæ–f÷&Ó'V—b‚F†—2æFG"Âb“° §Ð ¦gVæ7F–öâ6WEfÇVUc7V”'&’‚vÂÂb’°  –vÂçVæ–f÷&Ó7V—b‚F†—2æFG"Âb“° §Ð ¦gVæ7F–öâ6WEfÇVUcGV”'&’‚vÂÂb’°  –vÂçVæ–f÷&ÓGV—b‚F†—2æFG"Âb“° §Ð  ¢òò'&’öbFW‡GW&W2ƒ$Bò4Bò7V&Rò$D'&’ ¦gVæ7F–öâ6WEfÇVUC'&’‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S°  –6öç7BâÒbæÆVæwFƒ°  –6öç7BVæ—G2ÒÆÆö5FW…Væ—G2‚FW‡GW&W2Ââ“°  ––b‚'&—4WVÂ‚66†RÂVæ—G2’’°  –vÂçVæ–f÷&Ó—b‚F†—2æFG"ÂVæ—G2“°  –6÷”'&’‚66†RÂVæ—G2“°  —Ð  –f÷"‚ÆWB’Ò²’ÓÒã²²²’’°  —FW‡GW&W2ç6WEFW‡GW&S$B‚e²’ÒÇÂV×G•FW‡GW&RÂVæ—G5²’Ò“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUC4D'&’‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S°  –6öç7BâÒbæÆVæwFƒ°  –6öç7BVæ—G2ÒÆÆö5FW…Væ—G2‚FW‡GW&W2Ââ“°  ––b‚'&—4WVÂ‚66†RÂVæ—G2’’°  –vÂçVæ–f÷&Ó—b‚F†—2æFG"ÂVæ—G2“°  –6÷”'&’‚66†RÂVæ—G2“°  —Ð  –f÷"‚ÆWB’Ò²’ÓÒã²²²’’°  —FW‡GW&W2ç6WEFW‡GW&S4B‚e²’ÒÇÂV×G“6EFW‡GW&RÂVæ—G5²’Ò“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUCd'&’‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S°  –6öç7BâÒbæÆVæwFƒ°  –6öç7BVæ—G2ÒÆÆö5FW…Væ—G2‚FW‡GW&W2Ââ“°  ––b‚'&—4WVÂ‚66†RÂVæ—G2’’°  –vÂçVæ–f÷&Ó—b‚F†—2æFG"ÂVæ—G2“°  –6÷”'&’‚66†RÂVæ—G2“°  —Ð  –f÷"‚ÆWB’Ò²’ÓÒã²²²’’°  —FW‡GW&W2ç6WEFW‡GW&T7V&R‚e²’ÒÇÂV×G”7V&UFW‡GW&RÂVæ—G5²’Ò“°  —Ð §Ð ¦gVæ7F–öâ6WEfÇVUC$D'&”'&’‚vÂÂbÂFW‡GW&W2’°  –6öç7B66†RÒF†—2æ66†S°  –6öç7BâÒbæÆVæwFƒ°  –6öç7BVæ—G2ÒÆÆö5FW…Væ—G2‚FW‡GW&W2Ââ“°  ––b‚'&—4WVÂ‚66†RÂVæ—G2’’°  –vÂçVæ–f÷&Ó—b‚F†—2æFG"ÂVæ—G2“°  –6÷”'&’‚66†RÂVæ—G2“°  —Ð  –f÷"‚ÆWB’Ò²’ÓÒã²²²’’°  —FW‡GW&W2ç6WEFW‡GW&S$D'&’‚e²’ÒÇÂV×G”'&•FW‡GW&RÂVæ—G5²’Ò“°  —Ð §Ð  ¢òò†VÇW"Fò–6²F†R&–v‡B6WGFW"f÷"W&R†&÷GFöÒÖÆWfVÂ’'& ¦gVæ7F–öâvWEW&T'&•6WGFW"‚G—R’°  —7v—F6‚‚G—R’°  –66RƒCc¢&WGW&â6WEfÇVUcd'&“²òòdÄô@ –66Rƒ†#S¢&WGW&â6WEfÇVUc&d'&“²òòõdT3  –66Rƒ†#S¢&WGW&â6WEfÇVUc6d'&“²òòõdT30 –66Rƒ†#S#¢&WGW&â6WEfÇVUcFd'&“²òòõdT3@  –66Rƒ†#V¢&WGW&â6WEfÇVTÓ$'&“²òòôÔC  –66Rƒ†#V#¢&WGW&â6WEfÇVTÓ4'&“²òòôÔC0 –66Rƒ†#V3¢&WGW&â6WEfÇVTÓD'&“²òòôÔC@  –66RƒCC¢66Rƒ†#Sc¢&WGW&â6WEfÇVUc”'&“²òò”åBÂ$ôôÀ –66Rƒ†#S3¢66Rƒ†#Ss¢&WGW&â6WEfÇVUc&”'&“²òòõdT3  –66Rƒ†#SC¢66Rƒ†#Sƒ¢&WGW&â6WEfÇVUc6”'&“²òòõdT30 –66Rƒ†#SS¢66Rƒ†#S“¢&WGW&â6WEfÇVUcF”'&“²òòõdT3@  –66RƒCS¢&WGW&â6WEfÇVUcV”'&“²òòT”å@ –66Rƒ†F3c¢&WGW&â6WEfÇVUc'V”'&“²òòõdT3  –66Rƒ†F3s¢&WGW&â6WEfÇVUc7V”'&“²òòõdT30 –66Rƒ†F3ƒ¢&WGW&â6WEfÇVUcGV”'&“²òòõdT3@  –66Rƒ†#VS¢òò4ÕÄU%ó$@ –66Rƒ†Ccc¢òò4ÕÄU%ôU…DU$äÅôôU0 –66Rƒ†F6¢òò”åEõ4ÕÄU%ó$@ –66Rƒ†FC#¢òòTå4”täTEô”åEõ4ÕÄU%ó$@ –66Rƒ†#c#¢òò4ÕÄU%ó$Eõ4„Dõp —&WGW&â6WEfÇVUC'&“°  –66Rƒ†#Vc¢òò4ÕÄU%ó4@ –66Rƒ†F6#¢òò”åEõ4ÕÄU%ó4@ –66Rƒ†FC3¢òòTå4”täTEô”åEõ4ÕÄU%ó4@ —&WGW&â6WEfÇVUC4D'&“°  –66Rƒ†#c¢òò4ÕÄU%ô5T$P –66Rƒ†F63¢òò”åEõ4ÕÄU%ô5T$P –66Rƒ†FCC¢òòTå4”täTEô”åEõ4ÕÄU%ô5T$P –66Rƒ†F3S¢òò4ÕÄU%ô5T$Uõ4„Dõp —&WGW&â6WEfÇVUCd'&“°  –66Rƒ†F3¢òò4ÕÄU%ó$Eô%$ –66Rƒ†F6c¢òò”åEõ4ÕÄU%ó$Eô%$ –66Rƒ†FCs¢òòTå4”täTEô”åEõ4ÕÄU%ó$Eô%$ –66Rƒ†F3C¢òò4ÕÄU%ó$Eô%$•õ4„Dõp —&WGW&â6WEfÇVUC$D'&”'&“°  —Ð §Ð ¢òòÒÒÒVæ–f÷&Ò6Æ76W2ÒÒÐ ¦6Æ726–ævÆUVæ–f÷&Ò°  –6öç7G'V7F÷"‚–BÂ7F—fT–æfòÂFG"’°  —F†—2æ–BÒ–C° —F†—2æFG"ÒFG#° —F†—2æ66†RÒµÓ° —F†—2çG—RÒ7F—fT–æfòçG—S° —F†—2ç6WEfÇVRÒvWE6–æwVÆ%6WGFW"‚7F—fT–æfòçG—R“°  ’òòF†—2çF‚Ò7F—fT–æfòææÖS²òòDT%Tp  —Ð §Ð ¦6Æ72W&T'&•Væ–f÷&Ò°  –6öç7G'V7F÷"‚–BÂ7F—fT–æfòÂFG"’°  —F†—2æ–BÒ–C° —F†—2æFG"ÒFG#° —F†—2æ66†RÒµÓ° —F†—2çG—RÒ7F—fT–æfòçG—S° —F†—2ç6—¦RÒ7F—fT–æfòç6—¦S° —F†—2ç6WEfÇVRÒvWEW&T'&•6WGFW"‚7F—fT–æfòçG—R“°  ’òòF†—2çF‚Ò7F—fT–æfòææÖS²òòDT%Tp  —Ð §Ð ¦6Æ727G'V7GW&VEVæ–f÷&Ò°  –6öç7G'V7F÷"‚–B’°  —F†—2æ–BÒ–C°  —F†—2ç6WÒµÓ° —F†—2æÖÒ·Ó°  —Ð  —6WEfÇVR‚vÂÂfÇVRÂFW‡GW&W2’°  –6öç7B6WÒF†—2ç6W°  –f÷"‚ÆWB’ÒÂâÒ6WæÆVæwFƒ²’ÓÒã²²²’’°  –6öç7BRÒ6W²’Ó° —Rç6WEfÇVR‚vÂÂfÇVU²Ræ–BÒÂFW‡GW&W2“°  —Ð  —Ð §Ð ¢òòÒÒÒF÷ÖÆWfVÂÒÒÐ ¢òò'6W"Ò'V–ÆG2WF†R&÷W'G’G&VRg&öÒF†RF‚7G&–æw0 ¦6öç7B&UF…'BÒò…Çr²’…ÅÒ“ò…Å·ÅÂâ“òös° ¢òòW‡G&7G0¢òò ’ÒF†R–FVçF–f–W"†ÖVÖ&W"æÖR÷"'&’–æFW‚¢òòÒföÆÆ÷vVB'’â÷F–öæÂ&–v‡B'&6¶WB†f÷VæBv†Vâ'&’–æFW‚¢òòÒföÆÆ÷vVB'’â÷F–öæÂÆVgB'&6¶WB÷"F÷B‡G—Röb7V'67&—B¢òð¢òòæ÷FS¢F†W6R÷'F–öç26â&R&VB–âæöâÖ÷fW&Æ–ærf6†–öâæ@¢òòÆÆ÷r7G&–v‡Ff÷'v&B'6–æröbF†R†–W&&6‡’F†BvV$tÂVæ6öFW0¢òò–âF†RVæ–f÷&ÒæÖW2à ¦gVæ7F–öâFEVæ–f÷&Ò‚6öçF–æW"ÂVæ–f÷&Ôö&¦V7B’°  –6öçF–æW"ç6WçW6‚‚Væ–f÷&Ôö&¦V7B“° –6öçF–æW"æÖ²Væ–f÷&Ôö&¦V7Bæ–BÒÒVæ–f÷&Ôö&¦V7C° §Ð ¦gVæ7F–öâ'6UVæ–f÷&Ò‚7F—fT–æfòÂFG"Â6öçF–æW"’°  –6öç7BF‚Ò7F—fT–æfòææÖRÀ —F„ÆVæwF‚ÒF‚æÆVæwFƒ°  ’òò&W6WB&VtW‡ö&¦V7BÂ&V6W6RöbF†RV&Ç’W†—Böb&Wf–÷W2'Và •&UF…'BæÆ7D–æFW‚Ò°  —v†–ÆR‚G'VR’°  –6öç7BÖF6‚Ò&UF…'BæW†V2‚F‚’À –ÖF6„VæBÒ&UF…'BæÆ7D–æFWƒ°  –ÆWB–BÒÖF6…²Ó° –6öç7B–D—4–æFW‚ÒÖF6…²"ÒÓÓÒuÒrÀ —7V'67&—BÒÖF6…²2Ó°  ––b‚–D—4–æFW‚’–BÒ–BÂ²òò6öçfW'BFò–çFVvW   ––b‚7V'67&—BÓÓÒVæFVf–æVBÇÂ7V'67&—BÓÓÒu²rbbÖF6„VæB²"ÓÓÒF„ÆVæwF‚’°  ’òò&&RæÖR÷"'W&R"&÷GFöÒÖÆWfVÂ'&’%³Ò"7Vff—€  –FEVæ–f÷&Ò‚6öçF–æW"Â7V'67&—BÓÓÒVæFVf–æVBð –æWr6–ævÆUVæ–f÷&Ò‚–BÂ7F—fT–æfòÂFG"’  –æWrW&T'&•Væ–f÷&Ò‚–BÂ7F—fT–æfòÂFG"’“°  –'&V³°  —ÒVÇ6R°  ’òò7FW–çFò–ææW"æöFRò7&VFR—B–â66R—BFöW6âwBW†—7@  –6öç7BÖÒ6öçF–æW"æÖ° –ÆWBæW‡BÒÖ²–BÓ°  ––b‚æW‡BÓÓÒVæFVf–æVB’°  –æW‡BÒæWr7G'V7GW&VEVæ–f÷&Ò‚–B“° –FEVæ–f÷&Ò‚6öçF–æW"ÂæW‡B“°  —Ð  –6öçF–æW"ÒæW‡C°  —Ð  —Ð §Ð ¢òò&ö÷B6öçF–æW  ¦6Æ72vV$tÅVæ–f÷&×2°  –6öç7G'V7F÷"‚vÂÂ&öw&Ò’°  —F†—2ç6WÒµÓ° —F†—2æÖÒ·Ó°  –6öç7BâÒvÂævWE&öw&Õ&ÖWFW"‚&öw&ÒÂvÂä5D•dUõTä”dõ$Õ2“°  –f÷"‚ÆWB’Ò²’Âã²²²’’°  –6öç7B–æfòÒvÂævWD7F—fUVæ–f÷&Ò‚&öw&ÒÂ’’À –FG"ÒvÂævWEVæ–f÷&ÔÆö6F–öâ‚&öw&ÒÂ–æfòææÖR“°  —'6UVæ–f÷&Ò‚–æfòÂFG"ÂF†—2“°  —Ð  —Ð  —6WEfÇVR‚vÂÂæÖRÂfÇVRÂFW‡GW&W2’°  –6öç7BRÒF†—2æÖ²æÖRÓ°  ––b‚RÓÒVæFVf–æVB’Rç6WEfÇVR‚vÂÂfÇVRÂFW‡GW&W2“°  —Ð  —6WD÷F–öæÂ‚vÂÂö&¦V7BÂæÖR’°  –6öç7BbÒö&¦V7E²æÖRÓ°  ––b‚bÓÒVæFVf–æVB’F†—2ç6WEfÇVR‚vÂÂæÖRÂb“°  —Ð  —7FF–2WÆöB‚vÂÂ6WÂfÇVW2ÂFW‡GW&W2’°  –f÷"‚ÆWB’ÒÂâÒ6WæÆVæwFƒ²’ÓÒã²²²’’°  –6öç7BRÒ6W²’ÒÀ —bÒfÇVW5²Ræ–BÓ°  ––b‚bææVVG5WFFRÓÒfÇ6R’°  ’òòæ÷FS¢Çv—2WFF–ærv†VâææVVG5WFFR—2VæFVf–æV@ —Rç6WEfÇVR‚vÂÂbçfÇVRÂFW‡GW&W2“°  —Ð  —Ð  —Ð  —7FF–26Wv—F…fÇVR‚6WÂfÇVW2’°  –6öç7B"ÒµÓ°  –f÷"‚ÆWB’ÒÂâÒ6WæÆVæwFƒ²’ÓÒã²²²’’°  –6öç7BRÒ6W²’Ó° ––b‚Ræ–B–âfÇVW2’"çW6‚‚R“°  —Ð  —&WGW&â#°  —Ð §Ð ¦gVæ7F–öâvV$tÅ6†FW"‚vÂÂG—RÂ7G&–ær’°  –6öç7B6†FW"ÒvÂæ7&VFU6†FW"‚G—R“°  –vÂç6†FW%6÷W&6R‚6†FW"Â7G&–ær“° –vÂæ6ö×–ÆU6†FW"‚6†FW"“°  —&WGW&â6†FW#° §Ð ¢òòg&öÒ‡GG3¢ò÷wwræ¶‡&öæ÷2æ÷&r÷&Vv—7G'’÷vV&vÂöW‡FVç6–öç2ô´…%÷&ÆÆVÅ÷6†FW%ö6ö×–ÆRð¦6öç7B4ôÕÄUD”ôåõ5DEU5ô´…"Òƒ“#° ¦ÆWB&öw&Ô–D6÷VçBÒ° ¦gVæ7F–öâ†æFÆU6÷W&6R‚7G&–ærÂW'&÷$Æ–æR’°  –6öç7BÆ–æW2Ò7G&–ærç7Æ—B‚uÆâr“° –6öç7BÆ–æW3"ÒµÓ°  –6öç7Bg&öÒÒÖF‚æÖ‚‚W'&÷$Æ–æRÒbÂ“° –6öç7BFòÒÖF‚æÖ–â‚W'&÷$Æ–æR²bÂÆ–æW2æÆVæwF‚“°  –f÷"‚ÆWB’Òg&öÓ²’ÂFó²’²²’°  –6öç7BÆ–æRÒ’²° –Æ–æW3"çW6‚‚G¶Æ–æRÓÓÒW'&÷$Æ–æRòsâr¢rwÒG¶Æ–æWÓ¢G¶Æ–æW5²’×Ö“°  —Ð  —&WGW&âÆ–æW3"æ¦ö–â‚uÆâr“° §Ð ¦6öç7BöÓÒò¤õõU$Uõò¢òæWrÖG&—ƒ2‚“° ¦gVæ7F–öâvWDVæ6öF–æt6ö×öæVçG2‚6öÆ÷%76R’°  ”6öÆ÷$ÖævVÖVçBåövWDÖG&—‚‚öÓÂ6öÆ÷$ÖævVÖVçBçv÷&¶–æt6öÆ÷%76RÂ6öÆ÷%76R“°  –6öç7BVæ6öF–ætÖG&—‚ÒÖC2‚G²öÓæVÆVÖVçG2æÖ‚‚b’ÓâbçFôf—†VB‚B’’Ò–°  —7v—F6‚‚6öÆ÷$ÖævVÖVçBævWEG&ç6fW"‚6öÆ÷%76R’’°  –66RÆ–æV%G&ç6fW#  —&WGW&â²Væ6öF–ætÖG&—‚ÂtÆ–æV%G&ç6fW$ôUDbrÓ°  –66R5$t%G&ç6fW#  —&WGW&â²Væ6öF–ætÖG&—‚Âw5$t%G&ç6fW$ôUDbrÓ°  –FVfVÇC  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&öw&Ó¢Vç7W÷'FVB6öÆ÷"76S¢rÂ6öÆ÷%76R“° —&WGW&â²Væ6öF–ætÖG&—‚ÂtÆ–æV%G&ç6fW$ôUDbrÓ°  —Ð §Ð ¦gVæ7F–öâvWE6†FW$W'&÷'2‚vÂÂ6†FW"ÂG—R’°  –6öç7B7FGW2ÒvÂævWE6†FW%&ÖWFW"‚6†FW"ÂvÂä4ôÕ”ÄUõ5DEU2“°  –6öç7B6†FW$–æfôÆörÒvÂævWE6†FW$–æfôÆör‚6†FW"’ÇÂrs° –6öç7BW'&÷'2Ò6†FW$–æfôÆörçG&–Ò‚“°  ––b‚7FGW2bbW'&÷'2ÓÓÒrr’&WGW&ârs°  –6öç7BW'&÷$ÖF6†W2ÒôU%$õ#¢¢…ÆB²’òæW†V2‚W'&÷'2“° ––b‚W'&÷$ÖF6†W2’°  ’òòÒÖVæ&ÆR×&—f–ÆVvVB×vV&vÂÖW‡FVç6–öà ’òò6öç6öÆRæÆör‚r¢¢r²G—R²r¢¢rÂvÂævWDW‡FVç6–öâ‚utT$tÅöFV'Vu÷6†FW'2r’ævWEG&ç6ÆFVE6†FW%6÷W&6R‚6†FW"’“°  –6öç7BW'&÷$Æ–æRÒ'6T–çB‚W'&÷$ÖF6†W5²Ò“° —&WGW&âG—RçFõWW$66R‚’²uÆåÆâr²W'&÷'2²uÆåÆâr²†æFÆU6÷W&6R‚vÂævWE6†FW%6÷W&6R‚6†FW"’ÂW'&÷$Æ–æR“°  —ÒVÇ6R°  —&WGW&âW'&÷'3°  —Ð §Ð ¦gVæ7F–öâvWEFW†VÄVæ6öF–ætgVæ7F–öâ‚gVæ7F–öäæÖRÂ6öÆ÷%76R’°  –6öç7B6ö×öæVçG2ÒvWDVæ6öF–æt6ö×öæVçG2‚6öÆ÷%76R“°  —&WGW&â°  –fV3BG¶gVæ7F–öäæÖWÒ‚fV3BfÇVR’¶À  – —&WGW&âG¶6ö×öæVçG5²×Ò‚fV3B‚fÇVRç&v"¢G¶6ö×öæVçG5²×ÒÂfÇVRæ’“¶À  ’wÒrÀ  •Òæ¦ö–â‚uÆâr“° §Ð ¦gVæ7F–öâvWEFöæTÖ–ætgVæ7F–öâ‚gVæ7F–öäæÖRÂFöæTÖ–ær’°  –ÆWBFöæTÖ–ætæÖS°  —7v—F6‚‚FöæTÖ–ær’°  –66RÆ–æV%FöæTÖ–æs  —FöæTÖ–ætæÖRÒtÆ–æV"s° –'&V³°  –66R&V–æ†&EFöæTÖ–æs  —FöæTÖ–ætæÖRÒu&V–æ†&Bs° –'&V³°  –66R6–æVöåFöæTÖ–æs  —FöæTÖ–ætæÖRÒt6–æVöâs° –'&V³°  –66R4U4f–ÆÖ–5FöæTÖ–æs  —FöæTÖ–ætæÖÚ±î¸Â¸­yêë¢°k¢G§¦*^e = 'ACESFilmic';
			break;

		case AgXToneMapping:
			toneMappingName = 'AgX';
			break;

		case NeutralToneMapping:
			toneMappingName = 'Neutral';
			break;

		case CustomToneMapping:
			toneMappingName = 'Custom';
			break;

		default:
			console.warn( 'THREE.WebGLProgram: Unsupported toneMapping:', toneMapping );
			toneMappingName = 'Linear';

	}

	return 'vec3 ' + functionName + '( vec3 color ) { return ' + toneMappingName + 'ToneMapping( color ); }';

}

const _v0 = /*@__PURE__*/ new Vector3();

function getLuminanceFunction() {

	ColorManagement.getLuminanceCoefficients( _v0 );

	const r = _v0.x.toFixed( 4 );
	const g = _v0.y.toFixed( 4 );
	const b = _v0.z.toFixed( 4 );

	return [

		'float luminance( const in vec3 rgb ) {',

		`	const vec3 weights = vec3( ${ r }, ${ g }, ${ b } );`,

		'	return dot( weights, rgb );',

		'}'

	].join( '\n' );

}

function generateVertexExtensions( parameters ) {

	const chunks = [
		parameters.extensionClipCullDistance ? '#extension GL_ANGLE_clip_cull_distance : require' : '',
		parameters.extensionMultiDraw ? '#extension GL_ANGLE_multi_draw : require' : '',
	];

	return chunks.filter( filterEmptyLine ).join( '\n' );

}

function generateDefines( defines ) {

	const chunks = [];

	for ( const name in defines ) {

		const value = defines[ name ];

		if ( value === false ) continue;

		chunks.push( '#define ' + name + ' ' + value );

	}

	return chunks.join( '\n' );

}

function fetchAttributeLocations( gl, program ) {

	const attributes = {};

	const n = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );

	for ( let i = 0; i < n; i ++ ) {

		const info = gl.getActiveAttrib( program, i );
		const name = info.name;

		let locationSize = 1;
		if ( info.type === gl.FLOAT_MAT2 ) locationSize = 2;
		if ( info.type === gl.FLOAT_MAT3 ) locationSize = 3;
		if ( info.type === gl.FLOAT_MAT4 ) locationSize = 4;

		// console.log( 'THREE.WebGLProgram: ACTIVE VERTEX ATTRIBUTE:', name, i );

		attributes[ name ] = {
			type: info.type,
			location: gl.getAttribLocation( program, name ),
			locationSize: locationSize
		};

	}

	return attributes;

}

function filterEmptyLine( string ) {

	return string !== '';

}

function replaceLightNums( string, parameters ) {

	const numSpotLightCoords = parameters.numSpotLightShadows + parameters.numSpotLightMaps - parameters.numSpotLightShadowsWithMaps;

	return string
		.replace( /NUM_DIR_LIGHTS/g, parameters.numDirLights )
		.replace( /NUM_SPOT_LIGHTS/g, parameters.numSpotLights )
		.replace( /NUM_SPOT_LIGHT_MAPS/g, parameters.numSpotLightMaps )
		.replace( /NUM_SPOT_LIGHT_COORDS/g, numSpotLightCoords )
		.replace( /NUM_RECT_AREA_LIGHTS/g, parameters.numRectAreaLights )
		.replace( /NUM_POINT_LIGHTS/g, parameters.numPointLights )
		.replace( /NUM_HEMI_LIGHTS/g, parameters.numHemiLights )
		.replace( /NUM_DIR_LIGHT_SHADOWS/g, parameters.numDirLightShadows )
		.replace( /NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, parameters.numSpotLightShadowsWithMaps )
		.replace( /NUM_SPOT_LIGHT_SHADOWS/g, parameters.numSpotLightShadows )
		.replace( /NUM_POINT_LIGHT_SHADOWS/g, parameters.numPointLightShadows );

}

function replaceClippingPlaneNums( string, parameters ) {

	return string
		.replace( /NUM_CLIPPING_PLANES/g, parameters.numClippingPlanes )
		.replace( /UNION_CLIPPING_PLANES/g, ( parameters.numClippingPlanes - parameters.numClipIntersection ) );

}

// Resolve Includes

const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

function resolveIncludes( string ) {

	return string.replace( includePattern, includeReplacer );

}

const shaderChunkMap = new Map();

function includeReplacer( match, include ) {

	let string = ShaderChunk[ include ];

	if ( string === undefined ) {

		const newInclude = shaderChunkMap.get( include );

		if ( newInclude !== undefined ) {

			string = ShaderChunk[ newInclude ];
			console.warn( 'THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.', include, newInclude );

		} else {

			throw new Error( 'Can not resolve #include <' + include + '>' );

		}

	}

	return resolveIncludes( string );

}

// Unroll Loops

const unrollLoopPattern = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;

function unrollLoops( string ) {

	return string.replace( unrollLoopPattern, loopReplacer );

}

function loopReplacer( match, start, end, snippet ) {

	let string = '';

	for ( let i = parseInt( start ); i < parseInt( end ); i ++ ) {

		string += snippet
			.replace( /\[\s*i\s*\]/g, '[ ' + i + ' ]' )
			.replace( /UNROLLED_LOOP_INDEX/g, i );

	}

	return string;

}

//

function generatePrecision( parameters ) {

	let precisionstring = `precision ${parameters.precision} float;
	precision ${parameters.precision} int;
	precision ${parameters.precision} sampler2D;
	precision ${parameters.precision} samplerCube;
	precision ${parameters.precision} sampler3D;
	precision ${parameters.precision} sampler2DArray;
	precision ${parameters.precision} sampler2DShadow;
	precision ${parameters.precision} samplerCubeShadow;
	precision ${parameters.precision} sampler2DArrayShadow;
	precision ${parameters.precision} isampler2D;
	precision ${parameters.precision} isampler3D;
	precision ${parameters.precision} isamplerCube;
	precision ${parameters.precision} isampler2DArray;
	precision ${parameters.precision} usampler2D;
	precision ${parameters.precision} usampler3D;
	precision ${parameters.precision} usamplerCube;
	precision ${parameters.precision} usampler2DArray;
	`;

	if ( parameters.precision === 'highp' ) {

		precisionstring += '\n#define HIGH_PRECISION';

	} else if ( parameters.precision === 'mediump' ) {

		precisionstring += '\n#define MEDIUM_PRECISION';

	} else if ( parameters.precision === 'lowp' ) {

		precisionstring += '\n#define LOW_PRECISION';

	}

	return precisionstring;

}

function generateShadowMapTypeDefine( parameters ) {

	let shadowMapTypeDefine = 'SHADOWMAP_TYPE_BASIC';

	if ( parameters.shadowMapType === PCFShadowMap ) {

		shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF';

	} else if ( parameters.shadowMapType === PCFSoftShadowMap ) {

		shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF_SOFT';

	} else if ( parameters.shadowMapType === VSMShadowMap ) {

		shadowMapTypeDefine = 'SHADOWMAP_TYPE_VSM';

	}

	return shadowMapTypeDefine;

}

function generateEnvMapTypeDefine( parameters ) {

	let envMapTypeDefine = 'ENVMAP_TYPE_CUBE';

	if ( parameters.envMap ) {

		switch ( parameters.envMapMode ) {

			case CubeReflectionMapping:
			case CubeRefractionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
				break;

			case CubeUVReflectionMapping:
				envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
				break;

		}

	}

	return envMapTypeDefine;

}

function generateEnvMapModeDefine( parameters ) {

	let envMapModeDefine = 'ENVMAP_MODE_REFLECTION';

	if ( parameters.envMap ) {

		switch ( parameters.envMapMode ) {

			case CubeRefractionMapping:

				envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
				break;

		}

	}

	return envMapModeDefine;

}

function generateEnvMapBlendingDefine( parameters ) {

	let envMapBlendingDefine = 'ENVMAP_BLENDING_NONE';

	if ( parameters.envMap ) {

		switch ( parameters.combine ) {

			case MultiplyOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
				break;

			case MixOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
				break;

			case AddOperation:
				envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
				break;

		}

	}

	return envMapBlendingDefine;

}

function generateCubeUVSize( parameters ) {

	const imageHeight = parameters.envMapCubeUVHeight;

	if ( imageHeight === null ) return null;

	const maxMip = Math.log2( imageHeight ) - 2;

	const texelHeight = 1.0 / imageHeight;

	const texelWidth = 1.0 / ( 3 * Math.max( Math.pow( 2, maxMip ), 7 * 16 ) );

	return { texelWidth, texelHeight, maxMip };

}

function WebGLProgram( renderer, cacheKey, parameters, bindingStates ) {

	// TODO Send this event to Three.js DevTools
	// console.log( 'WebGLProgram', cacheKey );

	const gl = renderer.getContext();

	const defines = parameters.defines;

	let vertexShader = parameters.vertexShader;
	let fragmentShader = parameters.fragmentShader;

	const shadowMapTypeDefine = generateShadowMapTypeDefine( parameters );
	const envMapTypeDefine = generateEnvMapTypeDefine( parameters );
	const envMapModeDefine = generateEnvMapModeDefine( parameters );
	const envMapBlendingDefine = generateEnvMapBlendingDefine( parameters );
	const envMapCubeUVSize = generateCubeUVSize( parameters );

	const customVertexExtensions = generateVertexExtensions( parameters );

	const customDefines = generateDefines( defines );

	const program = gl.createProgram();

	let prefixVertex, prefixFragment;
	let versionString = parameters.glslVersion ? '#version ' + parameters.glslVersion + '\n' : '';

	if ( parameters.isRawShaderMaterial ) {

		prefixVertex = [

			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,

			customDefines

		].filter( filterEmptyLine ).join( '\n' );

		if ( prefixVertex.length > 0 ) {

			prefixVertex += '\n';

		}

		prefixFragment = [

			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,

			customDefines

		].filter( filterEmptyLine ).join( '\n' );

		if ( prefixFragment.length > 0 ) {

			prefixFragment += '\n';

		}

	} else {

		prefixVertex = [

			generatePrecision( parameters ),

			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,

			customDefines,

			parameters.extensionClipCullDistance ? '#define USE_CLIP_DISTANCE' : '',
			parameters.batching ? '#define USE_BATCHING' : '',
			parameters.batchingColor ? '#define USE_BATCHING_COLOR' : '',
			parameters.instancing ? '#define USE_INSTANCING' : '',
			parameters.instancingColor ? '#define USE_INSTANCING_COLOR' : '',
			parameters.instancingMorph ? '#define USE_INSTANCING_MORPH' : '',

			parameters.useFog && parameters.fog ? '#define USE_FOG' : '',
			parameters.useFog && parameters.fogExp2 ? '#define FOG_EXP2' : '',

			parameters.map ? '#define USE_MAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
			parameters.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
			parameters.displacementMap ? '#define USE_DISPLACEMENTMAP' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',

			parameters.anisotropy ? '#define USE_ANISOTROPY' : '',
			parameters.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',

			parameters.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
			parameters.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
			parameters.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',

			parameters.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
			parameters.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',

			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
			parameters.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',

			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.alphaHash ? '#define USE_ALPHAHASH' : '',

			parameters.transmission ? '#define USE_TRANSMISSION' : '',
			parameters.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
			parameters.thicknessMap ? '#define USE_THICKNESSMAP' : '',

			parameters.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
			parameters.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',

			//

			parameters.mapUv ? '#define MAP_UV ' + parameters.mapUv : '',
			parameters.alphaMapUv ? '#define ALPHAMAP_UV ' + parameters.alphaMapUv : '',
			parameters.lightMapUv ? '#define LIGHTMAP_UV ' + parameters.lightMapUv : '',
			parameters.aoMapUv ? '#define AOMAP_UV ' + parameters.aoMapUv : '',
			parameters.emissiveMapUv ? '#define EMISSIVEMAP_UV ' + parameters.emissiveMapUv : '',
			parameters.bumpMapUv ? '#define BUMPMAP_UV ' + parameters.bumpMapUv : '',
			parameters.normalMapUv ? '#define NORMALMAP_UV ' + parameters.normalMapUv : '',
			parameters.displacementMapUv ? '#define DISPLACEMENTMAP_UV ' + parameters.displacementMapUv : '',

			parameters.metalnessMapUv ? '#define METALNESSMAP_UV ' + parameters.metalnessMapUv : '',
			parameters.roughnessMapUv ? '#define ROUGHNESSMAP_UV ' + parameters.roughnessMapUv : '',

			parameters.anisotropyMapUv ? '#define ANISOTROPYMAP_UV ' + parameters.anisotropyMapUv : '',

			parameters.clearcoatMapUv ? '#define CLEARCOATMAP_UV ' + parameters.clearcoatMapUv : '',
			parameters.clearcoatNormalMapUv ? '#define CLEARCOAT_NORMALMAP_UV ' + parameters.clearcoatNormalMapUv : '',
			parameters.clearcoatRoughnessMapUv ? '#define CLEARCOAT_ROUGHNESSMAP_UV ' + parameters.clearcoatRoughnessMapUv : '',

			parameters.iridescenceMapUv ? '#define IRIDESCENCEMAP_UV ' + parameters.iridescenceMapUv : '',
			parameters.iridescenceThicknessMapUv ? '#define IRIDESCENCE_THICKNESSMAP_UV ' + parameters.iridescenceThicknessMapUv : '',

			parameters.sheenColorMapUv ? '#define SHEEN_COLORMAP_UV ' + parameters.sheenColorMapUv : '',
			parameters.sheenRoughnessMapUv ? '#define SHEEN_ROUGHNESSMAP_UV ' + parameters.sheenRoughnessMapUv : '',

			parameters.specularMapUv ? '#define SPECULARMAP_UV ' + parameters.specularMapUv : '',
			parameters.specularColorMapUv ? '#define SPECULAR_COLORMAP_UV ' + parameters.specularColorMapUv : '',
			parameters.specularIntensityMapUv ? '#define SPECULAR_INTENSITYMAP_UV ' + parameters.specularIntensityMapUv : '',

			parameters.transmissionMapUv ? '#define TRANSMISSIONMAP_UV ' + parameters.transmissionMapUv : '',
			parameters.thicknessMapUv ? '#define THICKNESSMAP_UV ' + parameters.thicknessMapUv : '',

			//

			parameters.vertexTangents && parameters.flatShading === false ? '#define USE_TANGENT' : '',
			parameters.vertexColors ? '#define USE_COLOR' : '',
			parameters.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
			parameters.vertexUv1s ? '#define USE_UV1' : '',
			parameters.vertexUv2s ? '#define USE_UV2' : '',
			parameters.vertexUv3s ? '#define USE_UV3' : '',

			parameters.pointsUvs ? '#define USE_POINTS_UV' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.skinning ? '#define USE_SKINNING' : '',

			parameters.morphTargets ? '#define USE_MORPHTARGETS' : '',
			parameters.morphNormals && parameters.flatShading === false ? '#define USE_MORPHNORMALS' : '',
			( parameters.morphColors ) ? '#define USE_MORPHCOLORS' : '',
			( parameters.morphTargetsCount > 0 ) ? '#define MORPHTARGETS_TEXTURE_STRIDE ' + parameters.morphTextureStride : '',
			( parameters.morphTargetsCount > 0 ) ? '#define MORPHTARGETS_COUNT ' + parameters.morphTargetsCount : '',
			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.sizeAttenuation ? '#define USE_SIZEATTENUATION' : '',

			parameters.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGARITHMIC_DEPTH_BUFFER' : '',
			parameters.reversedDepthBuffer ? '#define USE_REVERSED_DEPTH_BUFFER' : '',

			'uniform mat4 modelMatrix;',
			'uniform mat4 modelViewMatrix;',
			'uniform mat4 projectionMatrix;',
			'uniform mat4 viewMatrix;',
			'uniform mat3 normalMatrix;',
			'uniform vec3 cameraPosition;',
			'uniform bool isOrthographic;',

			'#ifdef USE_INSTANCING',

			'	attribute mat4 instanceMatrix;',

			'#endif',

			'#ifdef USE_INSTANCING_COLOR',

			'	attribute vec3 instanceColor;',

			'#endif',

			'#ifdef USE_INSTANCING_MORPH',

			'	uniform sampler2D morphTexture;',

			'#endif',

			'attribute vec3 position;',
			'attribute vec3 normal;',
			'attribute vec2 uv;',

			'#ifdef USE_UV1',

			'	attribute vec2 uv1;',

			'#endif',

			'#ifdef USE_UV2',

			'	attribute vec2 uv2;',

			'#endif',

			'#ifdef USE_UV3',

			'	attribute vec2 uv3;',

			'#endif',

			'#ifdef USE_TANGENT',

			'	attribute vec4 tangent;',

			'#endif',

			'#if defined( USE_COLOR_ALPHA )',

			'	attribute vec4 color;',

			'#elif defined( USE_COLOR )',

			'	attribute vec3 color;',

			'#endif',

			'#ifdef USE_SKINNING',

			'	attribute vec4 skinIndex;',
			'	attribute vec4 skinWeight;',

			'#endif',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

		prefixFragment = [

			generatePrecision( parameters ),

			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,

			customDefines,

			parameters.useFog && parameters.fog ? '#define USE_FOG' : '',
			parameters.useFog && parameters.fogExp2 ? '#define FOG_EXP2' : '',

			parameters.alphaToCoverage ? '#define ALPHA_TO_COVERAGE' : '',
			parameters.map ? '#define USE_MAP' : '',
			parameters.matcap ? '#define USE_MATCAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapTypeDefine : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.envMap ? '#define ' + envMapBlendingDefine : '',
			envMapCubeUVSize ? '#define CUBEUV_TEXEL_WIDTH ' + envMapCubeUVSize.texelWidth : '',
			envMapCubeUVSize ? '#define CUBEUV_TEXEL_HEIGHT ' + envMapCubeUVSize.texelHeight : '',
			envMapCubeUVSize ? '#define CUBEUV_MAX_MIP ' + envMapCubeUVSize.maxMip + '.0' : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
			parameters.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',

			parameters.anisotropy ? '#define USE_ANISOTROPY' : '',
			parameters.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',

			parameters.clearcoat ? '#define USE_CLEARCOAT' : '',
			parameters.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
			parameters.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
			parameters.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',

			parameters.dispersion ? '#define USE_DISPERSION' : '',

			parameters.iridescence ? '#define USE_IRIDESCENCE' : '',
			parameters.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
			parameters.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',

			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
			parameters.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',

			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',

			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.alphaTest ? '#define USE_ALPHATEST' : '',
			parameters.alphaHash ? '#define USE_ALPHAHASH' : '',

			parameters.sheen ? '#define USE_SHEEN' : '',
			parameters.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
			parameters.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',

			parameters.transmission ? '#define USE_TRANSMISSION' : '',
			parameters.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
			parameters.thicknessMap ? '#define USE_THICKNESSMAP' : '',

			parameters.vertexTangents && parameters.flatShading === false ? '#define USE_TANGENT' : '',
			parameters.vertexColors || parameters.instancingColor || parameters.batchingColor ? '#define USE_COLOR' : '',
			parameters.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
			parameters.vertexUv1s ? '#define USE_UV1' : '',
			parameters.vertexUv2s ? '#define USE_UV2' : '',
			parameters.vertexUv3s ? '#define USE_UV3' : '',

			parameters.pointsUvs ? '#define USE_POINTS_UV' : '',

			parameters.gradientMap ? '#define USE_GRADIENTMAP' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.premultipliedAlpha ? '#define PREMULTIPLIED_ALPHA' : '',

			parameters.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',

			parameters.decodeVideoTexture ? '#define DECODE_VIDEO_TEXTURE' : '',
			parameters.decodeVideoTextureEmissive ? '#define DECODE_VIDEO_TEXTURE_EMISSIVE' : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGARITHMIC_DEPTH_BUFFER' : '',
			parameters.reversedDepthBuffer ? '#define USE_REVERSED_DEPTH_BUFFER' : '',

			'uniform mat4 viewMatrix;',
			'uniform vec3 cameraPosition;',
			'uniform bool isOrthographic;',

			( parameters.toneMapping !== NoToneMapping ) ? '#define TONE_MAPPING' : '',
			( parameters.toneMapping !== NoToneMapping ) ? ShaderChunk[ 'tonemapping_pars_fragment' ] : '', // this code is required here because it is used by the toneMapping() function defined below
			( parameters.toneMapping !== NoToneMapping ) ? getToneMappingFunction( 'toneMapping', parameters.toneMapping ) : '',

			parameters.dithering ? '#define DITHERING' : '',
			parameters.opaque ? '#define OPAQUE' : '',

			ShaderChunk[ 'colorspace_pars_fragment' ], // this code is required here because it is used by the various encoding/decoding function defined below
			getTexelEncodingFunction( 'linearToOutputTexel', parameters.outputColorSpace ),
			getLuminanceFunction(),

			parameters.useDepthPacking ? '#define DEPTH_PACKING ' + parameters.depthPacking : '',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

	}

	vertexShader = resolveIncludes( vertexShader );
	vertexShader = replaceLightNums( vertexShader, parameters );
	vertexShader = replaceClippingPlaneNums( vertexShader, parameters );

	fragmentShader = resolveIncludes( fragmentShader );
	fragmentShader = replaceLightNums( fragmentShader, parameters );
	fragmentShader = replaceClippingPlaneNums( fragmentShader, parameters );

	vertexShader = unrollLoops( vertexShader );
	fragmentShader = unrollLoops( fragmentShader );

	if ( parameters.isRawShaderMaterial !== true ) {

		// GLSL 3.0 conversion for built-in materials and ShaderMaterial

		versionString = '#version 300 es\n';

		prefixVertex = [
			customVertexExtensions,
			'#define attribute in',
			'#define varying out',
			'#define texture2D texture'
		].join( '\n' ) + '\n' + prefixVertex;

		prefixFragment = [
			'#define varying in',
			( parameters.glslVersion === GLSL3 ) ? '' : 'layout(location = 0) out highp vec4 pc_fragColor;',
			( parameters.glslVersion === GLSL3 ) ? '' : '#define gl_FragColor pc_fragColor',
			'#define gl_FragDepthEXT gl_FragDepth',
			'#define texture2D texture',
			'#define textureCube texture',
			'#define texture2DProj textureProj',
			'#define texture2DLodEXT textureLod',
			'#define texture2DProjLodEXT textureProjLod',
			'#define textureCubeLodEXT textureLod',
			'#define texture2DGradEXT textureGrad',
			'#define texture2DProjGradEXT textureProjGrad',
			'#define textureCubeGradEXT textureGrad'
		].join( '\n' ) + '\n' + prefixFragment;

	}

	const vertexGlsl = versionString + prefixVertex + vertexShader;
	const fragmentGlsl = versionString + prefixFragment + fragmentShader;

	// console.log( '*VERTEX*', vertexGlsl );
	// console.log( '*FRAGMENT*', fragmentGlsl );

	const glVertexShader = WebGLShader( gl, gl.VERTEX_SHADER, vertexGlsl );
	const glFragmentShader = WebGLShader( gl, gl.FRAGMENT_SHADER, fragmentGlsl );

	gl.attachShader( program, glVertexShader );
	gl.attachShader( program, glFragmentShader );

	// Force a particular attribute to index 0.

	if ( parameters.index0AttributeName !== undefined ) {

		gl.bindAttribLocation( program, 0, parameters.index0AttributeName );

	} else if ( parameters.morphTargets === true ) {

		// programs with morphTargets displace position out of attribute 0
		gl.bindAttribLocation( program, 0, 'position' );

	}

	gl.linkProgram( program );

	function onFirstUse( self ) {

		// check for link errors
		if ( renderer.debug.checkShaderErrors ) {

			const programInfoLog = gl.getProgramInfoLog( program ) || '';
			const vertexShaderInfoLog = gl.getShaderInfoLog( glVertexShader ) || '';
			const fragmentShaderInfoLog = gl.getShaderInfoLog( glFragmentShader ) || '';

			const programLog = programInfoLog.trim();
			const vertexLog = vertexShaderInfoLog.trim();
			const fragmentLog = fragmentShaderInfoLog.trim();

			let runnable = true;
			let haveDiagnostics = true;

			if ( gl.getProgramParameter( program, gl.LINK_STATUS ) === false ) {

				runnable = false;

				if ( typeof renderer.debug.onShaderError === 'function' ) {

					renderer.debug.onShaderError( gl, program, glVertexShader, glFragmentShader );

				} else {

					// default error reporting

					const vertexErrors = getShaderErrors( gl, glVertexShader, 'vertex' );
					const fragmentErrors = getShaderErrors( gl, glFragmentShader, 'fragment' );

					console.error(
						'THREE.WebGLProgram: Shader Error ' + gl.getError() + ' - ' +
						'VALIDATE_STATUS ' + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + '\n\n' +
						'Material Name: ' + self.name + '\n' +
						'Material Type: ' + self.type + '\n\n' +
						'Program Info Log: ' + programLog + '\n' +
						vertexErrors + '\n' +
						fragmentErrors
					);

				}

			} else if ( programLog !== '' ) {

				console.warn( 'THREE.WebGLProgram: Program Info Log:', programLog );

			} else if ( vertexLog === '' || fragmentLog === '' ) {

				haveDiagnostics = false;

			}

			if ( haveDiagnostics ) {

				self.diagnostics = {

					runnable: runnable,

					programLog: programLog,

					vertexShader: {

						log: vertexLog,
						prefix: prefixVertex

					},

					fragmentShader: {

						log: fragmentLog,
						prefix: prefixFragment

					}

				};

			}

		}

		// Clean up

		// Crashes in iOS9 and iOS10. #18402
		// gl.detachShader( program, glVertexShader );
		// gl.detachShader( program, glFragmentShader );

		gl.deleteShader( glVertexShader );
		gl.deleteShader( glFragmentShader );

		cachedUniforms = new WebGLUniforms( gl, program );
		cachedAttributes = fetchAttributeLocations( gl, program );

	}

	// set up caching for uniform locations

	let cachedUniforms;

	this.getUniforms = function () {

		if ( cachedUniforms === undefined ) {

			// Populates cachedUniforms and cachedAttributes
			onFirstUse( this );

		}

		return cachedUniforms;

	};

	// set up caching for attribute locations

	let cachedAttributes;

	this.getAttributes = function () {

		if ( cachedAttributes === undefined ) {

			// Populates cachedAttributes and cachedUniforms
			onFirstUse( this );

		}

		return cachedAttributes;

	};

	// indicate when the program is ready to be used. if the KHR_parallel_shader_compile extension isn't supported,
	// flag the program as ready immediately. It may cause a stall when it's first used.

	let programReady = ( parameters.rendererExtensionParallelShaderCompile === false );

	this.isReady = function () {

		if ( programReady === false ) {

			programReady = gl.getProgramParameter( program, COMPLETION_STATUS_KHR );

		}

		return programReady;

	};

	// free resource

	this.destroy = function () {

		bindingStates.releaseStatesOfProgram( this );

		gl.deleteProgram( program );
		this.program = undefined;

	};

	//

	this.type = parameters.shaderType;
	this.name = parameters.shaderName;
	this.id = programIdCount ++;
	this.cacheKey = cacheKey;
	this.usedTimes = 1;
	this.program = program;
	this.vertexShader = glVertexShader;
	this.fragmentShader = glFragmentShader;

	return this;

}

let _id = 0;

class WebGLShaderCache {

	constructor() {

		this.shaderCache = new Map();
		this.materialCache = new Map();

	}

	update( material ) {

		const vertexShader = material.vertexShader;
		const fragmentShader = material.fragmentShader;

		const vertexShaderStage = this._getShaderStage( vertexShader );
		const fragmentShaderStage = this._getShaderStage( fragmentShader );

		const materialShaders = this._getShaderCacheForMaterial( material );

		if ( materialShaders.has( vertexShaderStage ) === false ) {

			materialShaders.add( vertexShaderStage );
			vertexShaderStage.usedTimes ++;

		}

		if ( materialShaders.has( fragmentShaderStage ) === false ) {

			materialShaders.add( fragmentShaderStage );
			fragmentShaderStage.usedTimes ++;

		}

		return this;

	}

	remove( material ) {

		const materialShaders = this.materialCache.get( material );

		for ( const shaderStage of materialShaders ) {

			shaderStage.usedTimes --;

			if ( shaderStage.usedTimes === 0 ) this.shaderCache.delete( shaderStage.code );

		}

		this.materialCache.delete( material );

		return this;

	}

	getVertexShaderID( material ) {

		return this._getShaderStage( material.vertexShader ).id;

	}

	getFragmentShaderID( material ) {

		return this._getShaderStage( material.fragmentShader ).id;

	}

	dispose() {

		this.shaderCache.clear();
		this.materialCache.clear();

	}

	_getShaderCacheForMaterial( material ) {

		const cache = this.materialCache;
		let set = cache.get( material );

		if ( set === undefined ) {

			set = new Set();
			cache.set( material, set );

		}

		return set;

	}

	_getShaderStage( code ) {

		const cache = this.shaderCache;
		let stage = cache.get( code );

		if ( stage === undefined ) {

			stage = new WebGLShaderStage( code );
			cache.set( code, stage );

		}

		return stage;

	}

}

class WebGLShaderStage {

	constructor( code ) {

		this.id = _id ++;

		this.code = code;
		this.usedTimes = 0;

	}

}

function WebGLPrograms( renderer, cubemaps, cubeuvmaps, extensions, capabilities, bindingStates, clipping ) {

	const _programLayers = new Layers();
	const _customShaders = new WebGLShaderCache();
	const _activeChannels = new Set();
	const programs = [];

	const logarithmicDepthBuffer = capabilities.logarithmicDepthBuffer;
	const SUPPORTS_VERTEX_TEXTURES = capabilities.vertexTextures;

	let precision = capabilities.precision;

	const shaderIDs = {
		MeshDepthMaterial: 'depth',
		MeshDistanceMaterial: 'distanceRGBA',
		MeshNormalMaterial: 'normal',
		MeshBasicMaterial: 'basic',
		MeshLambertMaterial: 'lambert',
		MeshPhongMaterial: 'phong',
		MeshToonMaterial: 'toon',
		MeshStandardMaterial: 'physical',
		MeshPhysicalMaterial: 'physical',
		MeshMatcapMaterial: 'matcap',
		LineBasicMaterial: 'basic',
		LineDashedMaterial: 'dashed',
		PointsMaterial: 'points',
		ShadowMaterial: 'shadow',
		SpriteMaterial: 'sprite'
	};

	function getChannel( value ) {

		_activeChannels.add( value );

		if ( value === 0 ) return 'uv';

		return `uv${ value }`;

	}

	function getParameters( material, lights, shadows, scene, object ) {

		const fog = scene.fog;
		const geometry = object.geometry;
		const environment = material.isMeshStandardMaterial ? scene.environment : null;

		const envMap = ( material.isMeshStandardMaterial ? cubeuvmaps : cubemaps ).get( material.envMap || environment );
		const envMapCubeUVHeight = ( !! envMap ) && ( envMap.mapping === CubeUVReflectionMapping ) ? envMap.image.height : null;

		const shaderID = shaderIDs[ material.type ];

		// heuristics to create shader parameters according to lights in the scene
		// (not to blow over maxLights budget)

		if ( material.precision !== null ) {

			precision = capabilities.getMaxPrecision( material.precision );

			if ( precision !== material.precision ) {

				console.warn( 'THREE.WebGLProgram.getParameters:', material.precision, 'not supported, using', precision, 'instead.' );

			}

		}

		//

		const morphAttribute = geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color;
		const morphTargetsCount = ( morphAttribute !== undefined ) ? morphAttribute.length : 0;

		let morphTextureStride = 0;

		if ( geometry.morphAttributes.position !== undefined ) morphTextureStride = 1;
		if ( geometry.morphAttributes.normal !== undefined ) morphTextureStride = 2;
		if ( geometry.morphAttributes.color !== undefined ) morphTextureStride = 3;

		//

		let vertexShader, fragmentShader;
		let customVertexShaderID, customFragmentShaderID;

		if ( shaderID ) {

			const shader = ShaderLib[ shaderID ];

			vertexShader = shader.vertexShader;
			fragmentShader = shader.fragmentShader;

		} else {

			vertexShader = material.vertexShader;
			fragmentShader = material.fragmentShader;

			_customShaders.update( material );

			customVertexShaderID = _customShaders.getVertexShaderID( material );
			customFragmentShaderID = _customShaders.getFragmentShaderID( material );

		}

		const currentRenderTarget = renderer.getRenderTarget();
		const reversedDepthBuffer = renderer.state.buffers.depth.getReversed();

		const IS_INSTANCEDMESH = object.isInstancedMesh === true;
		const IS_BATCHEDMESH = object.isBatchedMesh === true;

		const HAS_MAP = !! material.map;
		const HAS_MATCAP = !! material.matcap;
		const HAS_ENVMAP = !! envMap;
		const HAS_AOMAP = !! material.aoMap;
		const HAS_LIGHTMAP = !! material.lightMap;
		const HAS_BUMPMAP = !! material.bumpMap;
		const HAS_NORMALMAP = !! material.normalMap;
		const HAS_DISPLACEMENTMAP = !! material.displacementMap;
		const HAS_EMISSIVEMAP = !! material.emissiveMap;

		const HAS_METALNESSMAP = !! material.metalnessMap;
		const HAS_ROUGHNESSMAP = !! material.roughnessMap;

		const HAS_ANISOTROPY = material.anisotropy > 0;
		const HAS_CLEARCOAT = material.clearcoat > 0;
		const HAS_DISPERSION = material.dispersion > 0;
		const HAS_IRIDESCENCE = material.iridescence > 0;
		const HAS_SHEEN = material.sheen > 0;
		const HAS_TRANSMISSION = material.transmission > 0;

		const HAS_ANISOTROPYMAP = HAS_ANISOTROPY && !! material.anisotropyMap;

		const HAS_CLEARCOATMAP = HAS_CLEARCOAT && !! material.clearcoatMap;
		const HAS_CLEARCOAT_NORMALMAP = HAS_CLEARCOAT && !! material.clearcoatNormalMap;
		const HAS_CLEARCOAT_ROUGHNESSMAP = HAS_CLEARCOAT && !! material.clearcoatRoughnessMap;

		const HAS_IRIDESCENCEMAP = HAS_IRIDESCENCE && !! material.iridescenceMap;
		const HAS_IRIDESCENCE_THICKNESSMAP = HAS_IRIDESCENCE && !! material.iridescenceThicknessMap;

		const HAS_SHEEN_COLORMAP = HAS_SHEEN && !! material.sheenColorMap;
		const HAS_SHEEN_ROUGHNESSMAP = HAS_SHEEN && !! material.sheenRoughnessMap;

		const HAS_SPECULARMAP = !! material.specularMap;
		const HAS_SPECULAR_COLORMAP = !! material.specularColorMap;
		const HAS_SPECULAR_INTENSITYMAP = !! material.specularIntensityMap;

		const HAS_TRANSMISSIONMAP = HAS_TRANSMISSION && !! material.transmissionMap;
		const HAS_THICKNESSMAP = HAS_TRANSMISSION && !! material.thicknessMap;

		const HAS_GRADIENTMAP = !! material.gradientMap;

		const HAS_ALPHAMAP = !! material.alphaMap;

		const HAS_ALPHATEST = material.alphaTest > 0;

		const HAS_ALPHAHASH = !! material.alphaHash;

		const HAS_EXTENSIONS = !! material.extensions;

		let toneMapping = NoToneMapping;

		if ( material.toneMapped ) {

			if ( currentRenderTarget === null || currentRenderTarget.isXRRenderTarget === true ) {

				toneMapping = renderer.toneMapping;

			}

		}

		const parameters = {

			shaderID: shaderID,
			shaderType: material.type,
			shaderName: material.name,

			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			defines: material.defines,

			customVertexShaderID: customVertexShaderID,
			customFragmentShaderID: customFragmentShaderID,

			isRawShaderMaterial: material.isRawShaderMaterial === true,
			glslVersion: material.glslVersion,

			precision: precision,

			batching: IS_BATCHEDMESH,
			batchingColor: IS_BATCHEDMESH && object._colorsTexture !== null,
			instancing: IS_INSTANCEDMESH,
			instancingColor: IS_INSTANCEDMESH && object.instanceColor !== null,
			instancingMorph: IS_INSTANCEDMESH && object.morphTexture !== null,

			supportsVertexTextures: SUPPORTS_VERTEX_TEXTURES,
			outputColorSpace: ( currentRenderTarget === null ) ? renderer.outputColorSpace : ( currentRenderTarget.isXRRenderTarget === true ? currentRenderTarget.texture.colorSpace : LinearSRGBColorSpace ),
			alphaToCoverage: !! material.alphaToCoverage,

			map: HAS_MAP,
			matcap: HAS_MATCAP,
			envMap: HAS_ENVMAP,
			envMapMode: HAS_ENVMAP && envMap.mapping,
			envMapCubeUVHeight: envMapCubeUVHeight,
			aoMap: HAS_AOMAP,
			lightMap: HAS_LIGHTMAP,
			bumpMap: HAS_BUMPMAP,
			normalMap: HAS_NORMALMAP,
			displacementMap: SUPPORTS_VERTEX_TEXTURES && HAS_DISPLACEMENTMAP,
			emissiveMap: HAS_EMISSIVEMAP,

			normalMapObjectSpace: HAS_NORMALMAP && material.normalMapType === ObjectSpaceNormalMap,
			normalMapTangentSpace: HAS_NORMALMAP && material.normalMapType === TangentSpaceNormalMap,

			metalnessMap: HAS_METALNESSMAP,
			roughnessMap: HAS_ROUGHNESSMAP,

			anisotropy: HAS_ANISOTROPY,
			anisotropyMap: HAS_ANISOTROPYMAP,

			clearcoat: HAS_CLEARCOAT,
			clearcoatMap: HAS_CLEARCOATMAP,
			clearcoatNormalMap: HAS_CLEARCOAT_NORMALMAP,
			clearcoatRoughnessMap: HAS_CLEARCOAT_ROUGHNESSMAP,

			dispersion: HAS_DISPERSION,

			iridescence: HAS_IRIDESCENCE,
			iridescenceMap: HAS_IRIDESCENCEMAP,
			iridescenceThicknessMap: HAS_IRIDESCENCE_THICKNESSMAP,

			sheen: HAS_SHEEN,
			sheenColorMap: HAS_SHEEN_COLORMAP,
			sheenRoughnessMap: HAS_SHEEN_ROUGHNESSMAP,

			specularMap: HAS_SPECULARMAP,
			specularColorMap: HAS_SPECULAR_COLORMAP,
			specularIntensityMap: HAS_SPECULAR_INTENSITYMAP,

			transmission: HAS_TRANSMISSION,
			transmissionMap: HAS_TRANSMISSIONMAP,
			thicknessMap: HAS_THICKNESSMAP,

			gradientMap: HAS_GRADIENTMAP,

			opaque: material.transparent === false && material.blending === NormalBlending && material.alphaToCoverage === false,

			alphaMap: HAS_ALPHAMAP,
			alphaTest: HAS_ALPHATEST,
			alphaHash: HAS_ALPHAHASH,

			combine: material.combine,

			//

			mapUv: HAS_MAP && getChannel( material.map.channel ),
			aoMapUv: HAS_AOMAP && getChannel( material.aoMap.channel ),
			lightMapUv: HAS_LIGHTMAP && getChannel( material.lightMap.channel ),
			bumpMapUv: HAS_BUMPMAP && getChannel( material.bumpMap.channel ),
			normalMapUv: HAS_NORMALMAP && getChannel( material.normalMap.channel ),
			displacementMapUv: HAS_DISPLACEMENTMAP && getChannel( material.displacementMap.channel ),
			emissiveMapUv: HAS_EMISSIVEMAP && getChannel( material.emissiveMap.channel ),

			metalnessMapUv: HAS_METALNESSMAP && getChannel( material.metalnessMap.channel ),
			roughnessMapUv: HAS_ROUGHNESSMAP && getChannel( material.roughnessMap.channel ),

			anisotropyMapUv: HAS_ANISOTROPYMAP && getChannel( material.anisotropyMap.channel ),

			clearcoatMapUv: HAS_CLEARCOATMAP && getChannel( material.clearcoatMap.channel ),
			clearcoatNormalMapUv: HAS_CLEARCOAT_NORMALMAP && getChannel( material.clearcoatNormalMap.channel ),
			clearcoatRoughnessMapUv: HAS_CLEARCOAT_ROUGHNESSMAP && getChannel( material.clearcoatRoughnessMap.channel ),

			iridescenceMapUv: HAS_IRIDESCENCEMAP && getChannel( material.iridescenceMap.channel ),
			iridescenceThicknessMapUv: HAS_IRIDESCENCE_THICKNESSMAP && getChannel( material.iridescenceThicknessMap.channel ),

			sheenColorMapUv: HAS_SHEEN_COLORMAP && getChannel( material.sheenColorMap.channel ),
			sheenRoughnessMapUv: HAS_SHEEN_ROUGHNESSMAP && getChannel( material.sheenRoughnessMap.channel ),

			specularMapUv: HAS_SPECULARMAP && getChannel( material.specularMap.channel ),
			specularColorMapUv: HAS_SPECULAR_COLORMAP && getChannel( material.specularColorMap.channel ),
			specularIntensityMapUv: HAS_SPECULAR_INTENSITYMAP && getChannel( material.specularIntensityMap.channel ),

			transmissionMapUv: HAS_TRANSMISSIONMAP && getChannel( material.transmissionMap.channel ),
			thicknessMapUv: HAS_THICKNESSMAP && getChannel( material.thicknessMap.channel ),

			alphaMapUv: HAS_ALPHAMAP && getChannel( material.alphaMap.channel ),

			//

			vertexTangents: !! geometry.attributes.tangent && ( HAS_NORMALMAP || HAS_ANISOTROPY ),
			vertexColors: material.vertexColors,
			vertexAlphas: material.vertexColors === true && !! geometry.attributes.color && geometry.attributes.color.itemSize === 4,

			pointsUvs: object.isPoints === true && !! geometry.attributes.uv && ( HAS_MAP || HAS_ALPHAMAP ),

			fog: !! fog,
			useFog: material.fog === true,
			fogExp2: ( !! fog && fog.isFogExp2 ),

			flatShading: ( material.flatShading === true && material.wireframe === false ),

			sizeAttenuation: material.sizeAttenuation === true,
			logarithmicDepthBuffer: logarithmicDepthBuffer,
			reversedDepthBuffer: reversedDepthBuffer,

			skinning: object.isSkinnedMesh === true,

			morphTargets: geometry.morphAttributes.position !== undefined,
			morphNormals: geometry.morphAttributes.normal !== undefined,
			morphColors: geometry.morphAttributes.color !== undefined,
			morphTargetsCount: morphTargetsCount,
			morphTextureStride: morphTextureStride,

			numDirLights: lights.directional.length,
			numPointLights: lights.point.length,
			numSpotLights: lights.spot.length,
			numSpotLightMaps: lights.spotLightMap.length,
			numRectAreaLights: lights.rectArea.length,
			numHemiLights: lights.hemi.length,

			numDirLightShadows: lights.directionalShadowMap.length,
			numPointLightShadows: lights.pointShadowMap.length,
			numSpotLightShadows: lights.spotShadowMap.length,
			numSpotLightShadowsWithMaps: lights.numSpotLightShadowsWithMaps,

			numLightProbes: lights.numLightProbes,

			numClippingPlanes: clipping.numPlanes,
			numClipIntersection: clipping.numIntersection,

			dithering: material.dithering,

			shadowMapEnabled: renderer.shadowMap.enabled && shadows.length > 0,
			shadowMapType: renderer.shadowMap.type,

			toneMapping: toneMapping,

			decodeVideoTexture: HAS_MAP && ( material.map.isVideoTexture === true ) && ( ColorManagement.getTransfer( material.map.colorSpace ) === SRGBTransfer ),
			decodeVideoTextureEmissive: HAS_EMISSIVEMAP && ( material.emissiveMap.isVideoTexture === true ) && ( ColorManagement.getTransfer( material.emissiveMap.colorSpace ) === SRGBTransfer ),

			premultipliedAlpha: material.premultipliedAlpha,

			doubleSided: material.side === DoubleSide,
			flipSided: material.side === BackSide,

			useDepthPacking: material.depthPacking >= 0,
			depthPacking: material.depthPacking || 0,

			index0AttributeName: material.index0AttributeName,

			extensionClipCullDistance: HAS_EXTENSIONS && material.extensions.clipCullDistance === true && extensions.has( 'WEBGL_clip_cull_distance' ),
			extensionMultiDraw: ( HAS_EXTENSIONS && material.extensions.multiDraw === true || IS_BATCHEDMESH ) && extensions.has( 'WEBGL_multi_draw' ),

			rendererExtensionParallelShaderCompile: extensions.has( 'KHR_parallel_shader_compile' ),

			customProgramCacheKey: material.customProgramCacheKey()

		};

		// the usage of getChannel() determines the active texture channels for this shader

		parameters.vertexUv1s = _activeChannels.has( 1 );
		parameters.vertexUv2s = _activeChannels.has( 2 );
		parameters.vertexUv3s = _activeChannels.has( 3 );

		_activeChannels.clear();

		return parameters;

	}

	function getProgramCacheKey( parameters ) {

		const array = [];

		if ( parameters.shaderID ) {

			array.push( parameters.shaderID );

		} else {

			array.push( parameters.customVertexShaderID );
			array.push( parameters.customFragmentShaderID );

		}

		if ( parameters.defines !== undefined ) {

			for ( const name in parameters.defines ) {

				array.push( name );
				array.push( parameters.defines[ name ] );

			}

		}

		if ( parameters.isRawShaderMaterial === false ) {

			getProgramCacheKeyParameters( array, parameters );
			getProgramCacheKeyBooleans( array, parameters );
			array.push( renderer.outputColorSpace );

		}

		array.push( parameters.customProgramCacheKey );

		return array.join();

	}

	function getProgramCacheKeyParameters( array, parameters ) {

		array.push( parameters.precision );
		array.push( parameters.outputColorSpace );
		array.push( parameters.envMapMode );
		array.push( parameters.envMapCubeUVHeight );
		array.push( parameters.mapUv );
		array.push( parameters.alphaMapUv );
		array.push( parameters.lightMapUv );
		array.push( parameters.aoMapUv );
		array.push( parameters.bumpMapUv );
		array.push( parameters.normalMapUv );
		array.push( parameters.displacementMapUv );
		array.push( parameters.emissiveMapUv );
		array.push( parameters.metalnessMapUv );
		array.push( parameters.roughnessMapUv );
		array.push( parameters.anisotropyMapUv );
		array.push( parameters.clearcoatMapUv );
		array.push( parameters.clearcoatNormalMapUv );
		array.push( parameters.clearcoatRoughnessMapUv );
		array.push( parameters.iridescenceMapUv );
		array.push( parameters.iridescenceThicknessMapUv );
		array.push( parameters.sheenColorMapUv );
		array.push( parameters.sheenRoughnessMapUv );
		array.push( parameters.specularMapUv );
		array.push( parameters.specularColorMapUv );
		array.push( parameters.specularIntensityMapUv );
		array.push( parameters.transmissionMapUv );
		array.push( parameters.thicknessMapUv );
		array.push( parameters.combine );
		array.push( parameters.fogExp2 );
		array.push( parameters.sizeAttenuation );
		array.push( parameters.morphTargetsCount );
		array.push( parameters.morphAttributeCount );
		array.push( parameters.numDirLights );
		array.push( parameters.numPointLights );
		array.push( parameters.numSpotLights );
		array.push( parameters.numSpotLightMaps );
		array.push( parameters.numHemiLights );
		array.push( parameters.numRectAreaLights );
		array.push( parameters.numDirLightShadows );
		array.push( parameters.numPointLightShadows );
		array.push( parameters.numSpotLightShadows );
		array.push( parameters.numSpotLightShadowsWithMaps );
		array.push( parameters.numLightProbes );
		array.push( parameters.shadowMapType );
		array.push( parameters.toneMapping );
		array.push( parameters.numClippingPlanes );
		array.push( parameters.numClipIntersection );
		array.push( parameters.depthPacking );

	}

	function getProgramCacheKeyBooleans( array, parameters ) {

		_programLayers.disableAll();

		if ( parameters.supportsVertexTextures )
			_programLayers.enable( 0 );
		if ( parameters.instancing )
			_programLayers.enable( 1 );
		if ( parameters.instancingColor )
			_programLayers.enable( 2 );
		if ( parameters.instancingMorph )
			_programLayers.enable( 3 );
		if ( parameters.matcap )
			_programLayers.enable( 4 );
		if ( parameters.envMap )
			_programLayers.enable( 5 );
		if ( parameters.normalMapObjectSpace )
			_programLayers.enable( 6 );
		if ( parameters.normalMapTangentSpace )
			_programLayers.enable( 7 );
		if ( parameters.clearcoat )
			_programLayers.enable( 8 );
		if ( parameters.iridescence )
			_programLayers.enable( 9 );
		if ( parameters.alphaTest )
			_programLayers.enable( 10 );
		if ( parameters.vertexColors )
			_programLayers.enable( 11 );
		if ( parameters.vertexAlphas )
			_programLayers.enable( 12 );
		if ( parameters.vertexUv1s )
			_programLayers.enable( 13 );
		if ( parameters.vertexUv2s )
			_programLayers.enable( 14 );
		if ( parameters.vertexUv3s )
			_programLayers.enable( 15 );
		if ( parameters.vertexTangents )
			_programLayers.enable( 16 );
		if ( parameters.anisotropy )
			_programLayers.enable( 17 );
		if ( parameters.alphaHash )
			_programLayers.enable( 18 );
		if ( parameters.batching )
			_programLayers.enable( 19 );
		if ( parameters.dispersion )
			_programLayers.enable( 20 );
		if ( parameters.batchingColor )
			_programLayers.enable( 21 );
		if ( parameters.gradientMap )
			_programLayers.enable( 22 );

		array.push( _programLayers.mask );
		_programLayers.disableAll();

		if ( parameters.fog )
			_programLayers.enable( 0 );
		if ( parameters.useFog )
			_programLayers.enable( 1 );
		if ( parameters.flatShading )
			_programLayers.enable( 2 );
		if ( parameters.logarithmicDepthBuffer )
			_programLayers.enable( 3 );
		if ( parameters.reversedDepthBuffer )
			_programLayers.enable( 4 );
		if ( parameters.skinning )
			_programLayers.enable( 5 );
		if ( parameters.morphTargets )
			_programLayers.enable( 6 );
		if ( parameters.morphNormals )
			_programLayers.enable( 7 );
		if ( parameters.morphColors )
			_programLayers.enable( 8 );
		if ( parameters.premultipliedAlpha )
			_programLayers.enable( 9 );
		if ( parameters.shadowMapEnabled )
			_programLayers.enable( 10 );
		if ( parameters.doubleSided )
			_programLayers.enable( 11 );
		if ( parameters.flipSided )
			_programLayers.enable( 12 );
		if ( parameters.useDepthPacking )
			_programLayers.enable( 13 );
		if ( parameters.dithering )
			_programLayers.enable( 14 );
		if ( parameters.transmission )
			_programLayers.enable( 15 );
		if ( parameters.sheen )
			_programLayers.enable( 16 );
		if ( parameters.opaque )
			_programLayers.enable( 17 );
		if ( parameters.pointsUvs )
			_programLayers.enable( 18 );
		if ( parameters.decodeVideoTexture )
			_programLayers.enable( 19 );
		if ( parameters.decodeVideoTextureEmissive )
			_programLayers.enable( 20 );
		if ( parameters.alphaToCoverage )
			_programLayers.enable( 21 );

		array.push( _programLayers.mask );

	}

	function getUniforms( material ) {

		const shaderID = shaderIDs[ material.type ];
		let uniforms;

		if ( shaderID ) {

			const shader = ShaderLib[ shaderID ];
			uniforms = UniformsUtils.clone( shader.uniforms );

		} else {

			uniforms = material.uniforms;

		}

		return uniforms;

	}

	function acquireProgram( parameters, cacheKey ) {

		let program;

		// Check if code has been already compiled
		for ( let p = 0, pl = programs.length; p < pl; p ++ ) {

			const preexistingProgram = programs[ p ];

			if ( preexistingProgram.cacheKey === cacheKey ) {

				program = preexistingProgram;
				++ program.usedTimes;

				break;

			}

		}

		if ( program === undefined ) {

			program = new WebGLProgram( renderer, cacheKey, parameters, bindingStates );
			programs.push( program );

		}

		return program;

	}

	function releaseProgram( program ) {

		if ( -- program.usedTimes === 0 ) {

			// Remove from unordered set
			const i = programs.indexOf( program );
			programs[ i ] = programs[ programs.length - 1 ];
			programs.pop();

			// Free WebGL resources
			program.destroy();

		}

	}

	function releaseShaderCache( material ) {

		_customShaders.remove( material );

	}

	function dispose() {

		_customShaders.dispose();

	}

	return {
		getParameters: getParameters,
		getProgramCacheKey: getProgramCacheKey,
		getUniforms: getUniforms,
		acquireProgram: acquireProgram,
		releaseProgram: releaseProgram,
		releaseShaderCache: releaseShaderCache,
		// Exposed for resource monitoring & error feedback via renderer.info:
		programs: programs,
		dispose: dispose
	};

}

function WebGLProperties() {

	let properties = new WeakMap();

	function has( object ) {

		return properties.has( object );

	}

	function get( object ) {

		let map = properties.get( object );

		if ( map === undefined ) {

			map = {};
			properties.set( object, map );

		}

		return map;

	}

	function remove( object ) {

		properties.delete( object );

	}

	function update( object, key, value ) {

		properties.get( object )[ key ] = value;

	}

	function dispose() {

		properties = new WeakMap();

	}

	return {
		has: has,
		get: get,
		remove: remove,
		update: update,
		dispose: dispose
	};

}

function painterSortStable( a, b ) {

	if ( a.groupOrder !== b.groupOrder ) {

		return a.groupOrder - b.groupOrder;

	} else if ( a.renderOrder !== b.renderOrder ) {

		return a.renderOrder - b.renderOrder;

	} else if ( a.material.id !== b.material.id ) {

		return a.material.id - b.material.id;

	} else if ( a.z !== b.z ) {

		return a.z - b.z;

	} else {

		return a.id - b.id;

	}

}

function reversePainterSortStable( a, b ) {

	if ( a.groupOrder !== b.groupOrder ) {

		return a.groupOrder - b.groupOrder;

	} else if ( a.renderOrder !== b.renderOrder ) {

		return a.renderOrder - b.renderOrder;

	} else if ( a.z !== b.z ) {

		return b.z - a.z;

	} else {

		return a.id - b.id;

	}

}


function WebGLRenderList() {

	const renderItems = [];
	let renderItemsIndex = 0;

	const opaque = [];
	const transmissive = [];
	const transparent = [];

	function init() {

		renderItemsIndex = 0;

		opaque.length = 0;
		transmissive.length = 0;
		transparent.length = 0;

	}

	function getNextRenderItem( object, geometry, material, groupOrder, z, group ) {

		let renderItem = renderItems[ renderItemsIndex ];

		if ( renderItem === undefined ) {

			renderItem = {
				id: object.id,
				object: object,
				geometry: geometry,
				material: material,
				groupOrder: groupOrder,
				renderOrder: object.renderOrder,
				z: z,
				group: group
			};

			renderItems[ renderItemsIndex ] = renderItem;

		} else {

			renderItem.id = object.id;
			renderItem.object = object;
			renderItem.geometry = geometry;
			renderItem.material = material;
			renderItem.groupOrder = groupOrder;
			renderItem.renderOrder = object.renderOrder;
			renderItem.z = z;
			renderItem.group = group;

		}

		renderItemsIndex ++;

		return renderItem;

	}

	function push( object, geometry, material, groupOrder, z, group ) {

		const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );

		if ( material.transmission > 0.0 ) {

			transmissive.push( renderItem );

		} else if ( material.transparent === true ) {

			transparent.push( renderItem );

		} else {

			opaque.push( renderItem );

		}

	}

	function unshift( object, geometry, material, groupOrder, z, group ) {

		const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );

		if ( material.transmission > 0.0 ) {

			transmissive.unshift( renderItem );

		} else if ( material.transparent === true ) {

			transparent.unshift( renderItem );

		} else {

			opaque.unshift( renderItem );

		}

	}

	function sort( customOpaqueSort, customTransparentSort ) {

		if ( opaque.length > 1 ) opaque.sort( customOpaqueSort || painterSortStable );
		if ( transmissive.length > 1 ) transmissive.sort( customTransparentSort || reversePainterSortStable );
		if ( transparent.length > 1 ) transparent.sort( customTransparentSort || reversePainterSortStable );

	}

	function finish() {

		// Clear references from inactive renderItems in the list

		for ( let i = renderItemsIndex, il = renderItems.length; i < il; i ++ ) {

			const renderItem = renderItems[ i ];

			if ( renderItem.id === null ) break;

			renderItem.id = null;
			renderItem.object = null;
			renderItem.geometry = null;
			renderItem.material = null;
			renderItem.group = null;

		}

	}

	return {

		opaque: opaque,
		transmissive: transmissive,
		transparent: transparent,

		init: init,
		push: push,
		unshift: unshift,
		finish: finish,

		sort: sort
	};

}

function WebGLRenderLists() {

	let lists = new WeakMap();

	function get( scene, renderCallDepth ) {

		const listArray = lists.get( scene );
		let list;

		if ( listArray === undefined ) {

			list = new WebGLRenderList();
			lists.set( scene, [ list ] );

		} else {

			if ( renderCallDepth >= listArray.length ) {

				list = new WebGLRenderList();
				listArray.push( list );

			} else {

				list = listArray[ renderCallDepth ];

			}

		}

		return list;

	}

	function dispose() {

		lists = new WeakMap();

	}

	return {
		get: get,
		dispose: dispose
	};

}

function UniformsCache() {

	const lights = {};

	return {

		get: function ( light ) {

			if ( lights[ light.id ] !== undefined ) {

				return lights[ light.id ];

			}

			let uniforms;

			switch ( light.type ) {

				case 'DirectionalLight':
					uniforms = {
						direction: new Vector3(),
						color: new Color()
					};
					break;

				case 'SpotLight':
					uniforms = {
						position: new Vector3(),
						direction: new Vector3(),
						color: new Color(),
						distance: 0,
						coneCos: 0,
						penumbraCos: 0,
						decay: 0
					};
					break;

				case 'PointLight':
					uniforms = {
						position: new Vector3(),
						color: new Color(),
						distance: 0,
						decay: 0
					};
					break;

				case 'HemisphereLight':
					uniforms = {
						direction: new Vector3(),
						skyColor: new Color(),
						groundColor: new Color()
					};
					break;

				case 'RectAreaLight':
					uniforms = {
						color: new Color(),
						position: new Vector3(),
						halfWidth: new Vector3(),
						halfHeight: new Vector3()
					};
					break;

			}

			lights[ light.id ] = uniforms;

			return uniforms;

		}

	};

}

function ShadowUniformsCache() {

	const lights = {};

	return {

		get: function ( light ) {

			if ( lights[ light.id ] !== undefined ) {

				return lights[ light.id ];

			}

			let uniforms;

			switch ( light.type ) {

				case 'DirectionalLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;

				case 'SpotLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;

				case 'PointLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2(),
						shadowCameraNear: 1,
						shadowCameraFar: 1000
					};
					break;

				// TODO (abelnation): set RectAreaLight shadow uniforms

			}

			lights[ light.id ] = uniforms;

			return uniforms;

		}

	};

}



let nextVersion = 0;

function shadowCastingAndTexturingLightsFirst( lightA, lightB ) {

	return ( lightB.castShadow ? 2 : 0 ) - ( lightA.castShadow ? 2 : 0 ) + ( lightB.map ? 1 : 0 ) - ( lightA.map ? 1 : 0 );

}

function WebGLLights( extensions ) {

	const cache = new UniformsCache();

	const shadowCache = ShadowUniformsCache();

	const state = {

		version: 0,

		hash: {
			directionalLength: -1,
			pointLength: -1,
			spotLength: -1,
			rectAreaLength: -1,
			hemiLength: -1,

			numDirectionalShadows: -1,
			numPointShadows: -1,
			numSpotShadows: -1,
			numSpotMaps: -1,

			numLightProbes: -1
		},

		ambient: [ 0, 0, 0 ],
		probe: [],
		directional: [],
		directionalShadow: [],
		directionalShadowMap: [],
		directionalShadowMatrix: [],
		spot: [],
		spotLightMap: [],
		spotShadow: [],
		spotShadowMap: [],
		spotLightMatrix: [],
		rectArea: [],
		rectAreaLTC1: null,
		rectAreaLTC2: null,
		point: [],
		pointShadow: [],
		pointShadowMap: [],
		pointShadowMatrix: [],
		hemi: [],
		numSpotLightShadowsWithMaps: 0,
		numLightProbes: 0

	};

	for ( let i = 0; i < 9; i ++ ) state.probe.push( new Vector3() );

	const vector3 = new Vector3();
	const matrix4 = new Matrix4();
	const matrix42 = new Matrix4();

	function setup( lights ) {

		let r = 0, g = 0, b = 0;

		for ( let i = 0; i < 9; i ++ ) state.probe[ i ].set( 0, 0, 0 );

		let directionalLength = 0;
		let pointLength = 0;
		let spotLength = 0;
		let rectAreaLength = 0;
		let hemiLength = 0;

		let numDirectionalShadows = 0;
		let numPointShadows = 0;
		let numSpotShadows = 0;
		let numSpotMaps = 0;
		let numSpotShadowsWithMaps = 0;

		let numLightProbes = 0;

		// ordering : [shadow casting + map texturing, map texturing, shadow casting, none ]
		lights.sort( shadowCastingAndTexturingLightsFirst );

		for ( let i = 0, l = lights.length; i < l; i ++ ) {

			const light = lights[ i ];

			const color = light.color;
			const intensity = light.intensity;
			const distance = light.distance;

			const shadowMap = ( light.shadow && light.shadow.map ) ? light.shadow.map.texture : null;

			if ( light.isAmbientLight ) {

				r += color.r * intensity;
				g += color.g * intensity;
				b += color.b * intensity;

			} else if ( light.isLightProbe ) {

				for ( let j = 0; j < 9; j ++ ) {

					state.probe[ j ].addScaledVector( light.sh.coefficients[ j ], intensity );

				}

				numLightProbes ++;

			} else if ( light.isDirectionalLight ) {

				const uniforms = cache.get( light );

				uniforms.color.copy( light.color ).multiplyScalar( light.intensity );

				if ( light.castShadow ) {

					const shadow = light.shadow;

					const shadowUniforms = shadowCache.get( light );

					shadowUniforms.shadowIntensity = shadow.intensity;
					shadowUniforms.shadowBias = shadow.bias;
					shadowUniforms.shadowNormalBias = shadow.normalBias;
					shadowUniforms.shadowRadius = shadow.radius;
					shadowUniforms.shadowMapSize = shadow.mapSize;

					state.directionalShadow[ directionalLength ] = shadowUniforms;
					state.directionalShadowMap[ directionalLength ] = shadowMap;
					state.directionalShadowMatrix[ directionalLength ] = light.shadow.matrix;

					numDirectionalShadows ++;

				}

				state.directional[ directionalLength ] = uniforms;

				directionalLength ++;

			} else if ( light.isSpotLight ) {

				const uniforms = cache.get( light );

				uniforms.position.setFromMatrixPosition( light.matrixWorld );

				uniforms.color.copy( color ).multiplyScalar( intensity );
				uniforms.distance = distance;

				uniforms.coneCos = Math.cos( light.angle );
				uniforms.penumbraCos = Math.cos( light.angle * ( 1 - light.penumbra ) );
				uniforms.decay = light.decay;

				state.spot[ spotLength ] = uniforms;

				const shadow = light.shadow;

				if ( light.map ) {

					state.spotLightMap[ numSpotMaps ] = light.map;
					numSpotMaps ++;

					// make sure the lightMatrix is up to date
					// TODO : do it if required only
					shadow.updateMatrices( light );

					if ( light.castShadow ) numSpotShadowsWithMaps ++;

				}

				state.spotLightMatrix[ spotLength ] = shadow.matrix;

				if ( light.castShadow ) {

					const shadowUniforms = shadowCache.get( light );

					shadowUniforms.shadowIntensity = shadow.intensity;
					shadowUniforms.shadowBias = shadow.bias;
					shadowUniforms.shadowNormalBias = shadow.normalBias;
					shadowUniforms.shadowRadius = shadow.radius;
					shadowUniforms.shadowMapSize = shadow.mapSize;

					state.spotShadow[ spotLength ] = shadowUniforms;
					state.spotShadowMap[ spotLength ] = shadowMap;

					numSpotShadows ++;

				}

				spotLength ++;

			} else if ( light.isRectAreaLight ) {

				const uniforms = cache.get( light );

				uniforms.color.copy( color ).multiplyScalar( intensity );

				uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
				uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );

				state.rectArea[ rectAreaLength ] = uniforms;

				rectAreaLength ++;

			} else if ( light.isPointLight ) {

				const uniforms = cache.get( light );

				uniforms.color.copy( light.color ).multiplyScalar( light.intensity );
				uniforms.distance = light.distance;
				uniforms.decay = light.decay;

				if ( light.castShadow ) {

					const shadow = light.shadow;

					const shadowUniforms = shadowCache.get( light );

					shadowUniforms.shadowIntensity = shadow.intensity;
					shadowUniforms.shadowBias = shadow.bias;
					shadowUniforms.shadowNormalBias = shadow.normalBias;
					shadowUniforms.shadowRadius = shadow.radius;
					shadowUniforms.shadowMapSize = shadow.mapSize;
					shadowUniforms.shadowCameraNear = shadow.camera.near;
					shadowUniforms.shadowCameraFar = shadow.camera.far;

					state.pointShadow[ pointLength ] = shadowUniforms;
					state.pointShadowMap[ pointLength ] = shadowMap;
					state.pointShadowMatrix[ pointLength ] = light.shadow.matrix;

					numPointShadows ++;

				}

				state.point[ pointLength ] = uniforms;

				pointLength ++;

			} else if ( light.isHemisphereLight ) {

				const uniforms = cache.get( light );

				uniforms.skyColor.copy( light.color ).multiplyScalar( intensity );
				uniforms.groundColor.copy( light.groundColor ).multiplyScalar( intensity );

				state.hemi[ hemiLength ] = uniforms;

				hemiLength ++;

			}

		}

		if ( rectAreaLength > 0 ) {

			if ( extensions.has( 'OES_texture_float_linear' ) === true ) {

				state.rectAreaLTC1 = UniformsLib.LTC_FLOAT_1;
				state.rectAreaLTC2 = UniformsLib.LTC_FLOAT_2;

			} else {

				state.rectAreaLTC1 = UniformsLib.LTC_HALF_1;
				state.rectAreaLTC2 = UniformsLib.LTC_HALF_2;

			}

		}

		state.ambient[ 0 ] = r;
		state.ambient[ 1 ] = g;
		state.ambient[ 2 ] = b;

		const hash = state.hash;

		if ( hash.directionalLength !== directionalLength ||
			hash.pointLength !== pointLength ||
			hash.spotLength !== spotLength ||
			hash.rectAreaLength !== rectAreaLength ||
			hash.hemiLength !== hemiLength ||
			hash.numDirectionalShadows !== numDirectionalShadows ||
			hash.numPointShadows !== numPointShadows ||
			hash.numSpotShadows !== numSpotShadows ||
			hash.numSpotMaps !== numSpotMaps ||
			hash.numLightProbes !== numLightProbes ) {

			state.directional.length = directionalLength;
			state.spot.length = spotLength;
			state.rectArea.length = rectAreaLength;
			state.point.length = pointLength;
			state.hemi.length = hemiLength;

			state.directionalShadow.length = numDirectionalShadows;
			state.directionalShadowMap.length = numDirectionalShadows;
			state.pointShadow.length = numPointShadows;
			state.pointShadowMap.length = numPointShadows;
			state.spotShadow.length = numSpotShadows;
			state.spotShadowMap.length = numSpotShadows;
			state.directionalShadowMatrix.length = numDirectionalShadows;
			state.pointShadowMatrix.length = numPointShadows;
			state.spotLightMatrix.length = numSpotShadows + numSpotMaps - numSpotShadowsWithMaps;
			state.spotLightMap.length = numSpotMaps;
			state.numSpotLightShadowsWithMaps = numSpotShadowsWithMaps;
			state.numLightProbes = numLightProbes;

			hash.directionalLength = directionalLength;
			hash.pointLength = pointLength;
			hash.spotLength = spotLength;
			hash.rectAreaLength = rectAreaLength;
			hash.hemiLength = hemiLength;

			hash.numDirectionalShadows = numDirectionalShadows;
			hash.numPointShadows = numPointShadows;
			hash.numSpotShadows = numSpotShadows;
			hash.numSpotMaps = numSpotMaps;

			hash.numLightProbes = numLightProbes;

			state.version = nextVersion ++;

		}

	}

	function setupView( lights, camera ) {

		let directionalLength = 0;
		let pointLength = 0;
		let spotLength = 0;
		let rectAreaLength = 0;
		let hemiLength = 0;

		const viewMatrix = camera.matrixWorldInverse;

		for ( let i = 0, l = lights.length; i < l; i ++ ) {

			const light = lights[ i ];

			if ( light.isDirectionalLight ) {

				const uniforms = state.directional[ directionalLength ];

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				vector3.setFromMatrixPosition( light.target.matrixWorld );
				uniforms.direction.sub( vector3 );
				uniforms.direction.transformDirection( viewMatrix );

				directionalLength ++;

			} else if ( light.isSpotLight ) {

				const uniforms = state.spot[ spotLength ];

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				vector3.setFromMatrixPosition( light.target.matrixWorld );
				uniforms.direction.sub( vector3 );
				uniforms.direction.transformDirection( viewMatrix );

				spotLength ++;

			} else if ( light.isRectAreaLight ) {

				const uniforms = state.rectArea[ rectAreaLength ];

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				// extract local rotation of light to derive width/height half vectors
				matrix42.identity();
				matrix4.copy( light.matrixWorld );
				matrix4.premultiply( viewMatrix );
				matrix42.extractRotation( matrix4 );

				uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
				uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );

				uniforms.halfWidth.applyMatrix4( matrix42 );
				uniforms.halfHeight.applyMatrix4( matrix42 );

				rectAreaLength ++;

			} else if ( light.isPointLight ) {

				const uniforms = state.point[ pointLength ];

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				pointLength ++;

			} else if ( light.isHemisphereLight ) {

				const uniforms = state.hemi[ hemiLength ];

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				uniforms.direction.transformDirection( viewMatrix );

				hemiLength ++;

			}

		}

	}

	return {
		setup: setup,
		setupView: setupView,
		state: state
	};

}

function WebGLRenderState( extensions ) {

	const lights = new WebGLLights( extensions );

	const lightsArray = [];
	const shadowsArray = [];

	function init( camera ) {

		state.camera = camera;

		lightsArray.length = 0;
		shadowsArray.length = 0;

	}

	function pushLight( light ) {

		lightsArray.push( light );

	}

	function pushShadow( shadowLight ) {

		shadowsArray.push( shadowLight );

	}

	function setupLights() {

		lights.setup( lightsArray );

	}

	function setupLightsView( camera ) {

		lights.setupView( lightsArray, camera );

	}

	const state = {
		lightsArray: lightsArray,
		shadowsArray: shadowsArray,

		camera: null,

		lights: lights,

		transmissionRenderTarget: {}
	};

	return {
		init: init,
		state: state,
		setupLights: setupLights,
		setupLightsView: setupLightsView,

		pushLight: pushLight,
		pushShadow: pushShadow
	};

}

function WebGLRenderStates( extensions ) {

	let renderStates = new WeakMap();

	function get( scene, renderCallDepth = 0 ) {

		const renderStateArray = renderStates.get( scene );
		let renderState;

		if ( renderStateArray === undefined ) {

			renderState = new WebGLRenderState( extensions );
			renderStates.set( scene, [ renderState ] );

		} else {

			if ( renderCallDepth >= renderStateArray.length ) {

				renderState = new WebGLRenderState( extensions );
				renderStateArray.push( renderState );

			} else {

				renderState = renderStateArray[ renderCallDepth ];

			}

		}

		return renderState;

	}

	function dispose() {

		renderStates = new WeakMap();

	}

	return {
		get: get,
		dispose: dispose
	};

}

const vertex = "void main() {\n\tgl_Position = vec4( position, 1.0 );\n}";

const fragment = "uniform sampler2D shadow_pass;\nuniform vec2 resolution;\nuniform float radius;\n#include <packing>\nvoid main() {\n\tconst float samples = float( VSM_SAMPLES );\n\tfloat mean = 0.0;\n\tfloat squared_mean = 0.0;\n\tfloat uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );\n\tfloat uvStart = samples <= 1.0 ? 0.0 : - 1.0;\n\tfor ( float i = 0.0; i < samples; i ++ ) {\n\t\tfloat uvOffset = uvStart + i * uvStride;\n\t\t#ifdef HORIZONTAL_PASS\n\t\t\tvec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );\n\t\t\tmean += distribution.x;\n\t\t\tsquared_mean += distribution.y * distribution.y + distribution.x * distribution.x;\n\t\t#else\n\t\t\tfloat depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );\n\t\t\tmean += depth;\n\t\t\tsquared_mean += depth * depth;\n\t\t#endif\n\t}\n\tmean = mean / samples;\n\tsquared_mean = squared_mean / samples;\n\tfloat std_dev = sqrt( squared_mean - mean * mean );\n\tgl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );\n}";

function WebGLShadowMap( renderer, objects, capabilities ) {

	let _frustum = new Frustum();

	const _shadowMapSize = new Vector2(),
		_viewportSize = new Vector2(),

		_viewport = new Vector4(),

		_depthMaterial = new MeshDepthMaterial( { depthPacking: RGBADepthPacking } ),
		_distanceMaterial = new MeshDistanceMaterial(),

		_materialCache = {},

		_maxTextureSize = capabilities.maxTextureSize;

	const shadowSide = { [ FrontSide ]: BackSide, [ BackSide ]: FrontSide, [ DoubleSide ]: DoubleSide };

	const shadowMaterialVertical = new ShaderMaterial( {
		defines: {
			VSM_SAMPLES: 8
		},
		uniforms: {
			shadow_pass: { value: null },
			resolution: { value: new Vector2() },
			radius: { value: 4.0 }
		},

		vertexShader: vertex,
		fragmentShader: fragment

	} );

	const shadowMaterialHorizontal = shadowMaterialVertical.clone();
	shadowMaterialHorizontal.defines.HORIZONTAL_PASS = 1;

	const fullScreenTri = new BufferGeometry();
	fullScreenTri.setAttribute(
		'position',
		new BufferAttribute(
			new Float32Array( [ -1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5 ] ),
			3
		)
	);

	const fullScreenMesh = new Mesh( fullScreenTri, shadowMaterialVertical );

	const scope = this;

	this.enabled = false;

	this.autoUpdate = true;
	this.needsUpdate = false;

	this.type = PCFShadowMap;
	let _previousType = this.type;

	this.render = function ( lights, scene, camera ) {

		if ( scope.enabled === false ) return;
		if ( scope.autoUpdate === false && scope.needsUpdate === false ) return;

		if ( lights.length === 0 ) return;

		const currentRenderTarget = renderer.getRenderTarget();
		const activeCubeFace = renderer.getActiveCubeFace();
		const activeMipmapLevel = renderer.getActiveMipmapLevel();

		const _state = renderer.state;

		// Set GL state for depth map.
		_state.setBlending( NoBlending );

		if ( _state.buffers.depth.getReversed() === true ) {

			_state.buffers.color.setClear( 0, 0, 0, 0 );

		} else {

			_state.buffers.color.setClear( 1, 1, 1, 1 );

		}

		_state.buffers.depth.setTest( true );
		_state.setScissorTest( false );

		// check for shadow map type changes

		const toVSM = ( _previousType !== VSMShadowMap && this.type === VSMShadowMap );
		const fromVSM = ( _previousType === VSMShadowMap && this.type !== VSMShadowMap );

		// render depth map

		for ( let i = 0, il = lights.length; i < il; i ++ ) {

			const light = lights[ i ];
			const shadow = light.shadow;

			if ( shadow === undefined ) {

				console.warn( 'THREE.WebGLShadowMap:', light, 'has no shadow.' );
				continue;

			}

			if ( shadow.autoUpdate === false && shadow.needsUpdate === false ) continue;

			_shadowMapSize.copy( shadow.mapSize );

			const shadowFrameExtents = shadow.getFrameExtents();

			_shadowMapSize.multiply( shadowFrameExtents );

			_viewportSize.copy( shadow.mapSize );

			if ( _shadowMapSize.x > _maxTextureSize || _shadowMapSize.y > _maxTextureSize ) {

				if ( _shadowMapSize.x > _maxTextureSize ) {

					_viewportSize.x = Math.floor( _maxTextureSize / shadowFrameExtents.x );
					_shadowMapSize.x = _viewportSize.x * shadowFrameExtents.x;
					shadow.mapSize.x = _viewportSize.x;

				}

				if ( _shadowMapSize.y > _maxTextureSize ) {

					_viewportSize.y = Math.floor( _maxTextureSize / shadowFrameExtents.y );
					_shadowMapSize.y = _viewportSize.y * shadowFrameExtents.y;
					shadow.mapSize.y = _viewportSize.y;

				}

			}

			if ( shadow.map === null || toVSM === true || fromVSM === true ) {

				const pars = ( this.type !== VSMShadowMap ) ? { minFilter: NearestFilter, magFilter: NearestFilter } : {};

				if ( shadow.map !== null ) {

					shadow.map.dispose();

				}

				shadow.map = new WebGLRenderTarget( _shadowMapSize.x, _shadowMapSize.y, pars );
				shadow.map.texture.name = light.name + '.shadowMap';

				shadow.camera.updateProjectionMatrix();

			}

			renderer.setRenderTarget( shadow.map );
			renderer.clear();

			const viewportCount = shadow.getViewportCount();

			for ( let vp = 0; vp < viewportCount; vp ++ ) {

				const viewport = shadow.getViewport( vp );

				_viewport.set(
					_viewportSize.x * viewport.x,
					_viewportSize.y * viewport.y,
					_viewportSize.x * viewport.z,
					_viewportSize.y * viewport.w
				);

				_state.viewport( _viewport );

				shadow.updateMatrices( light, vp );

				_frustum = shadow.getFrustum();

				renderObject( scene, camera, shadow.camera, light, this.type );

			}

			// do blur pass for VSM

			if ( shadow.isPointLightShadow !== true && this.type === VSMShadowMap ) {

				VSMPass( shadow, camera );

			}

			shadow.needsUpdate = false;

		}

		_previousType = this.type;

		scope.needsUpdate = false;

		renderer.setRenderTarget( currentRenderTarget, activeCubeFace, activeMipmapLevel );

	};

	function VSMPass( shadow, camera ) {

		const geometry = objects.update( fullScreenMesh );

		if ( shadowMaterialVertical.defines.VSM_SAMPLES !== shadow.blurSamples ) {

			shadowMaterialVertical.defines.VSM_SAMPLES = shadow.blurSamples;
			shadowMaterialHorizontal.defines.VSM_SAMPLES = shadow.blurSamples;

			shadowMaterialVertical.needsUpdate = true;
			shadowMaterialHorizontal.needsUpdate = true;

		}

		if ( shadow.mapPass === null ) {

			shadow.mapPass = new WebGLRenderTarget( _shadowMapSize.x, _shadowMapSize.y );

		}

		// vertical pass

		shadowMaterialVertical.uniforms.shadow_pass.value = shadow.map.texture;
		shadowMaterialVertical.uniforms.resolution.value = shadow.mapSize;
		shadowMaterialVertical.uniforms.radius.value = shadow.radius;
		renderer.setRenderTarget( shadow.mapPass );
		renderer.clear();
		renderer.renderBufferDirect( camera, null, geometry, shadowMaterialVertical, fullScreenMesh, null );

		// horizontal pass

		shadowMaterialHorizontal.uniforms.shadow_pass.value = shadow.mapPass.texture;
		shadowMaterialHorizontal.uniforms.resolution.value = shadow.mapSize;
		shadowMaterialHorizontal.uniforms.radius.value = shadow.radius;
		renderer.setRenderTarget( shadow.map );
		renderer.clear();
		renderer.renderBufferDirect( camera, null, geometry, shadowMaterialHorizontal, fullScreenMesh, null );

	}

	function getDepthMaterial( object, material, light, type ) {

		let result = null;

		const customMaterial = ( light.isPointLight === true ) ? object.customDistanceMaterial : object.customDepthMaterial;

		if ( customMaterial !== undefined ) {

			result = customMaterial;

		} else {

			result = ( light.isPointLight === true ) ? _distanceMaterial : _depthMaterial;

			if ( ( renderer.localClippingEnabled && material.clipShadows === true && Array.isArray( material.clippingPlanes ) && material.clippingPlanes.length !== 0 ) ||
				( material.displacementMap && material.displacementScale !== 0 ) ||
				( material.alphaMap && material.alphaTest > 0 ) ||
				( material.map && material.alphaTest > 0 ) ||
				( material.alphaToCoverage === true ) ) {

				// in this case we need a unique material instance reflecting the
				// appropriate state

				const keyA = result.uuid, keyB = material.uuid;

				let materialsForVariant = _materialCache[ keyA ];

				if ( materialsForVariant === undefined ) {

					materialsForVariant = {};
					_materialCache[ keyA ] = materialsForVariant;

				}

				let cachedMaterial = materialsForVariant[ keyB ];

				if ( cachedMaterial === undefined ) {

					cachedMaterial = result.clone();
					materialsForVariant[ keyB ] = cachedMaterial;
					material.addEventListener( 'dispose', onMaterialDispose );

				}

				result = cachedMaterial;

			}

		}

		result.visible = material.visible;
		result.wireframe = material.wireframe;

		if ( type === VSMShadowMap ) {

			result.side = ( material.shadowSide !== null ) ? material.shadowSide : material.side;

		} else {

			result.side = ( material.shadowSide !== null ) ? material.shadowSide : shadowSide[ material.side ];

		}

		result.alphaMap = material.alphaMap;
		result.alphaTest = ( material.alphaToCoverage === true ) ? 0.5 : material.alphaTest; // approximate alphaToCoverage by using a fixed alphaTest value
		result.map = material.map;

		result.clipShadows = material.clipShadows;
		result.clippingPlanes = material.clippingPlanes;
		result.clipIntersection = material.clipIntersection;

		result.displacementMap = material.displacementMap;
		result.displacementScale = material.displacementScale;
		result.displacementBias = material.displacementBias;

		result.wireframeLinewidth = material.wireframeLinewidth;
		result.linewidth = material.linewidth;

		if ( light.isPointLight === true && result.isMeshDistanceMaterial === true ) {

			const materialProperties = renderer.properties.get( result );
			materialProperties.light = light;

		}

		return result;

	}

	function renderObject( object, camera, shadowCamera, light, type ) {

		if ( object.visible === false ) return;

		const visible = object.layers.test( camera.layers );

		if ( visible && ( object.isMesh || object.isLine || object.isPoints ) ) {

			if ( ( object.castShadow || ( object.receiveShadow && type === VSMShadowMap ) ) && ( ! object.frustumCulled || _frustum.intersectsObject( object ) ) ) {

				object.modelViewMatrix.multiplyMatrices( shadowCamera.matrixWorldInverse, object.matrixWorld );

				const geometry = objects.update( object );
				const material = object.material;

				if ( Array.isArray( material ) ) {

					const groups = geometry.groups;

					for ( let k = 0, kl = groups.length; k < kl; k ++ ) {

						const group = groups[ k ];
						const groupMaterial = material[ group.materialIndex ];

						if ( groupMaterial && groupMaterial.visible ) {

							const depthMaterial = getDepthMaterial( object, groupMaterial, light, type );

							object.onBeforeShadow( renderer, object, camera, shadowCamera, geometry, depthMaterial, group );

							renderer.renderBufferDirect( shadowCamera, null, geometry, depthMaterial, object, group );

							object.onAfterShadow( renderer, object, camera, shadowCamera, geometry, depthMaterial, group );

						}

					}

				} else if ( material.visible ) {

					const depthMaterial = getDepthMaterial( object, material, light, type );

					object.onBeforeShadow( renderer, object, camera, shadowCamera, geometry, depthMaterial, null );

					renderer.renderBufferDirect( shadowCamera, null, geometry, depthMaterial, object, null );

					object.onAfterShadow( renderer, object, camera, shadowCamera, geometry, depthMaterial, null );

				}

			}

		}

		const children = object.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			renderObject( children[ i ], camera, shadowCamera, light, type );

		}

	}

	function onMaterialDispose( event ) {

		const material = event.target;

		material.removeEventListener( 'dispose', onMaterialDispose );

		// make sure to remove the unique distance/depth materials used for shadow map rendering

		for ( const id in _materialCache ) {

			const cache = _materialCache[ id ];

			const uuid = event.target.uuid;

			if ( uuid in cache ) {

				const shadowMaterial = cache[ uuid ];
				shadowMaterial.dispose();
				delete cache[ uuid ];

			}

		}

	}

}

const reversedFuncs = {
	[ NeverDepth ]: AlwaysDepth,
	[ LessDepth ]: GreaterDepth,
	[ EqualDepth ]: NotEqualDepth,
	[ LessEqualDepth ]: GreaterEqualDepth,

	[ AlwaysDepth ]: NeverDepth,
	[ GreaterDepth ]: LessDepth,
	[ NotEqualDepth ]: EqualDepth,
	[ GreaterEqualDepth ]: LessEqualDepth,
};

function WebGLState( gl, extensions ) {

	function ColorBuffer() {

		let locked = false;

		const color = new Vector4();
		let currentColorMask = null;
		const currentColorClear = new Vector4( 0, 0, 0, 0 );

		return {

			setMask: function ( colorMask ) {

				if ( currentColorMask !== colorMask && ! locked ) {

					gl.colorMask( colorMask, colorMask, colorMask, colorMask );
					currentColorMask = colorMask;

				}

			},

			setLocked: function ( lock ) {

				locked = lock;

			},

			setClear: function ( r, g, b, a, premultipliedAlpha ) {

				if ( premultipliedAlpha === true ) {

					r *= a; g *= a; b *= a;

				}

				color.set( r, g, b, a );

				if ( currentColorClear.equals( color ) === false ) {

					gl.clearColor( r, g, b, a );
					currentColorClear.copy( color );

				}

			},

			reset: function () {

				locked = false;

				currentColorMask = null;
				currentColorClear.set( -1, 0, 0, 0 ); // set to invalid state

			}

		};

	}

	function DepthBuffer() {

		let locked = false;

		let currentReversed = false;
		let currentDepthMask = null;
		let currentDepthFunc = null;
		let currentDepthClear = null;

		return {

			setReversed: function ( reversed ) {

				if ( currentReversed !== reversed ) {

					const ext = extensions.get( 'EXT_clip_control' );

					if ( reversed ) {

						ext.clipControlEXT( ext.LOWER_LEFT_EXT, ext.ZERO_TO_ONE_EXT );

					} else {

						ext.clipControlEXT( ext.LOWER_LEFT_EXT, ext.NEGATIVE_ONE_TO_ONE_EXT );

					}

					currentReversed = reversed;

					const oldDepth = currentDepthClear;
					currentDepthClear = null;
					this.setClear( oldDepth );

				}

			},

			getReversed: function () {

				return currentReversed;

			},

			setTest: function ( depthTest ) {

				if ( depthTest ) {

					enable( gl.DEPTH_TEST );

				} else {

					disable( gl.DEPTH_TEST );

				}

			},

			setMask: function ( depthMask ) {

				if ( currentDepthMask !== depthMask && ! locked ) {

					gl.depthMask( depthMask );
					currentDepthMask = depthMask;

				}

			},

			setFunc: function ( depthFunc ) {

				if ( currentReversed ) depthFunc = reversedFuncs[ depthFunc ];

				if ( currentDepthFunc !== depthFunc ) {

					switch ( depthFunc ) {

						case NeverDepth:

							gl.depthFunc( gl.NEVER );
							break;

						case AlwaysDepth:

							gl.depthFunc( gl.ALWAYS );
							break;

						case LessDepth:

							gl.depthFunc( gl.LESS );
							break;

						case LessEqualDepth:

							gl.depthFunc( gl.LEQUAL );
							break;

						case EqualDepth:

							gl.depthFunc( gl.EQUAL );
							break;

						case GreaterEqualDepth:

							gl.depthFunc( gl.GEQUAL );
							break;

						case GreaterDepth:

							gl.depthFunc( gl.GREATER );
							break;

						case NotEqualDepth:

							gl.depthFunc( gl.NOTEQUAL );
							break;

						default:

							gl.depthFunc( gl.LEQUAL );

					}

					currentDepthFunc = depthFunc;

				}

			},

			setLocked: function ( lock ) {

				locked = lock;

			},

			setClear: function ( depth ) {

				if ( currentDepthClear !== depth ) {

					if ( currentReversed ) {

						depth = 1 - depth;

					}

					gl.clearDepth( depth );
					currentDepthClear = depth;

				}

			},

			reset: function () {

				locked = false;

				currentDepthMask = null;
				currentDepthFunc = null;
				currentDepthClear = null;
				currentReversed = false;

			}

		};

	}

	function StencilBuffer() {

		let locked = false;

		let currentStencilMask = null;
		let currentStencilFunc = null;
		let currentStencilRef = null;
		let currentStencilFuncMask = null;
		let currentStencilFail = null;
		let currentStencilZFail = null;
		let currentStencilZPass = null;
		let currentStencilClear = null;

		return {

			setTest: function ( stencilTest ) {

				if ( ! locked ) {

					if ( stencilTest ) {

						enable( gl.STENCIL_TEST );

					} else {

						disable( gl.STENCIL_TEST );

					}

				}

			},

			setMask: function ( stencilMask ) {

				if ( currentStencilMask !== stencilMask && ! locked ) {

					gl.stencilMask( stencilMask );
					currentStencilMask = stencilMask;

				}

			},

			setFunc: function ( stencilFunc, stencilRef, stencilMask ) {

				if ( currentStencilFunc !== stencilFunc ||
				     currentStencilRef !== stencilRef ||
				     currentStencilFuncMask !== stencilMask ) {

					gl.stencilFunc( stencilFunc, stencilRef, stencilMask );

					currentStencilFunc = stencilFunc;
					currentStencilRef = stencilRef;
					currentStencilFuncMask = stencilMask;

				}

			},

			setOp: function ( stencilFail, stencilZFail, stencilZPass ) {

				if ( currentStencilFail !== stencilFail ||
				     currentStencilZFail !== stencilZFail ||
				     currentStencilZPass !== stencilZPass ) {

					gl.stencilOp( stencilFail, stencilZFail, stencilZPass );

					currentStencilFail = stencilFail;
					currentStencilZFail = stencilZFail;
					currentStencilZPass = stencilZPass;

				}

			},

			setLocked: function ( lock ) {

				locked = lock;

			},

			setClear: function ( stencil ) {

				if ( currentStencilClear !== stencil ) {

					gl.clearStencil( stencil );
					currentStencilClear = stencil;

				}

			},

			reset: function () {

				locked = false;

				currentStencilMask = null;
				currentStencilFunc = null;
				currentStencilRef = null;
				currentStencilFuncMask = null;
				currentStencilFail = null;
				currentStencilZFail = null;
				currentStencilZPass = null;
				currentStencilClear = null;

			}

		};

	}

	//

	const colorBuffer = new ColorBuffer();
	const depthBuffer = new DepthBuffer();
	const stencilBuffer = new StencilBuffer();

	const uboBindings = new WeakMap();
	const uboProgramMap = new WeakMap();

	let enabledCapabilities = {};

	let currentBoundFramebuffers = {};
	let currentDrawbuffers = new WeakMap();
	let defaultDrawbuffers = [];

	let currentProgram = null;

	let currentBlendingEnabled = false;
	let currentBlending = null;
	let currentBlendEquation = null;
	let currentBlendSrc = null;
	let currentBlendDst = null;
	let currentBlendEquationAlpha = null;
	let currentBlendSrcAlpha = null;
	let currentBlendDstAlpha = null;
	let currentBlendColor = new Color( 0, 0, 0 );
	let currentBlendAlpha = 0;
	let currentPremultipledAlpha = false;

	let currentFlipSided = null;
	let currentCullFace = null;

	let currentLineWidth = null;

	let currentPolygonOffsetFactor = null;
	let currentPolygonOffsetUnits = null;

	const maxTextures = gl.getParameter( gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS );

	let lineWidthAvailable = false;
	let version = 0;
	const glVersion = gl.getParameter( gl.VERSION );

	if ( glVersion.indexOf( 'WebGL' ) !== -1 ) {

		version = parseFloat( /^WebGL (\d)/.exec( glVersion )[ 1 ] );
		lineWidthAvailable = ( version >= 1.0 );

	} else if ( glVersion.indexOf( 'OpenGL ES' ) !== -1 ) {

		version = parseFloat( /^OpenGL ES (\d)/.exec( glVersion )[ 1 ] );
		lineWidthAvailable = ( version >= 2.0 );

	}

	let currentTextureSlot = null;
	let currentBoundTextures = {};

	const scissorParam = gl.getParameter( gl.SCISSOR_BOX );
	const viewportParam = gl.getParameter( gl.VIEWPORT );

	const currentScissor = new Vector4().fromArray( scissorParam );
	const currentViewport = new Vector4().fromArray( viewportParam );

	function createTexture( type, target, count, dimensions ) {

		const data = new Uint8Array( 4 ); // 4 is required to match default unpack alignment of 4.
		const texture = gl.createTexture();

		gl.bindTexture( type, texture );
		gl.texParameteri( type, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texParameteri( type, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

		for ( let i = 0; i < count; i ++ ) {

			if ( type === gl.TEXTURE_3D || type === gl.TEXTURE_2D_ARRAY ) {

				gl.texImage3D( target, 0, gl.RGBA, 1, 1, dimensions, 0, gl.RGBA, gl.UNSIGNED_BYTE, data );

			} else {

				gl.texImage2D( target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data );

			}

		}

		return texture;

	}

	const emptyTextures = {};
	emptyTextures[ gl.TEXTURE_2D ] = createTexture( gl.TEXTURE_2D, gl.TEXTURE_2D, 1 );
	emptyTextures[ gl.TEXTURE_CUBE_MAP ] = createTexture( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6 );
	emptyTextures[ gl.TEXTURE_2D_ARRAY ] = createTexture( gl.TEXTURE_2D_ARRAY, gl.TEXTURE_2D_ARRAY, 1, 1 );
	emptyTextures[ gl.TEXTURE_3D ] = createTexture( gl.TEXTURE_3D, gl.TEXTURE_3D, 1, 1 );

	// init

	colorBuffer.setClear( 0, 0, 0, 1 );
	depthBuffer.setClear( 1 );
	stencilBuffer.setClear( 0 );

	enable( gl.DEPTH_TEST );
	depthBuffer.setFunc( LessEqualDepth );

	setFlipSided( false );
	setCullFace( CullFaceBack );
	enable( gl.CULL_FACE );

	setBlending( NoBlending );

	//

	function enable( id ) {

		if ( enabledCapabilities[ id ] !== true ) {

			gl.enable( id );
			enabledCapabilities[ id ] = true;

		}

	}

	function disable( id ) {

		if ( enabledCapabilities[ id ] !== false ) {

			gl.disable( id );
			enabledCapabilities[ id ] = false;

		}

	}

	function bindFramebuffer( target, framebuffer ) {

		if ( currentBoundFramebuffers[ target ] !== framebuffer ) {

			gl.bindFramebuffer( target, framebuffer );

			currentBoundFramebuffers[ target ] = framebuffer;

			// gl.DRAW_FRAMEBUFFER is equivalent to gl.FRAMEBUFFER

			if ( target === gl.DRAW_FRAMEBUFFER ) {

				currentBoundFramebuffers[ gl.FRAMEBUFFER ] = framebuffer;

			}

			if ( target === gl.FRAMEBUFFER ) {

				currentBoundFramebuffers[ gl.DRAW_FRAMEBUFFER ] = framebuffer;

			}

			return true;

		}

		return false;

	}

	function drawBuffers( renderTarget, framebuffer ) {

		let drawBuffers = defaultDrawbuffers;

		let needsUpdate = false;

		if ( renderTarget ) {

			drawBuffers = currentDrawbuffers.get( framebuffer );

			if ( drawBuffers === undefined ) {

				drawBuffers = [];
				currentDrawbuffers.set( framebuffer, drawBuffers );

			}

			const textures = renderTarget.textures;

			if ( drawBuffers.length !== textures.length || drawBuffers[ 0 ] !== gl.COLOR_ATTACHMENT0 ) {

				for ( let i = 0, il = textures.length; i < il; i ++ ) {

					drawBuffers[ i ] = gl.COLOR_ATTACHMENT0 + i;

				}

				drawBuffers.length = textures.length;

				needsUpdate = true;

			}

		} else {

			if ( drawBuffers[ 0 ] !== gl.BACK ) {

				drawBuffers[ 0 ] = gl.BACK;

				needsUpdate = true;

			}

		}

		if ( needsUpdate ) {

			gl.drawBuffers( drawBuffers );

		}

	}

	function useProgram( program ) {

		if ( currentProgram !== program ) {

			gl.useProgram( program );

			currentProgram = program;

			return true;

		}

		return false;

	}

	const equationToGL = {
		[ AddEquation ]: gl.FUNC_ADD,
		[ SubtractEquation ]: gl.FUNC_SUBTRACT,
		[ ReverseSubtractEquation ]: gl.FUNC_REVERSE_SUBTRACT
	};

	equationToGL[ MinEquation ] = gl.MIN;
	equationToGL[ MaxEquation ] = gl.MAX;

	const factorToGL = {
		[ ZeroFactor ]: gl.ZERO,
		[ OneFactor ]: gl.ONE,
		[ SrcColorFactor ]: gl.SRC_COLOR,
		[ SrcAlphaFactor ]: gl.SRC_ALPHA,
		[ SrcAlphaSaturateFactor ]: gl.SRC_ALPHA_SATURATE,
		[ DstColorFactor ]: gl.DST_COLOR,
		[ DstAlphaFactor ]: gl.DST_ALPHA,
		[ OneMinusSrcColorFactor ]: gl.ONE_MINUS_SRC_COLOR,
		[ OneMinusSrcAlphaFactor ]: gl.ONE_MINUS_SRC_ALPHA,
		[ OneMinusDstColorFactor ]: gl.ONE_MINUS_DST_COLOR,
		[ OneMinusDstAlphaFactor ]: gl.ONE_MINUS_DST_ALPHA,
		[ ConstantColorFactor ]: gl.CONSTANT_COLOR,
		[ OneMinusConstantColorFactor ]: gl.ONE_MINUS_CONSTANT_COLOR,
		[ ConstantAlphaFactor ]: gl.CONSTANT_ALPHA,
		[ OneMinusConstantAlphaFactor ]: gl.ONE_MINUS_CONSTANT_ALPHA
	};

	function setBlending( blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, blendColor, blendAlpha, premultipliedAlpha ) {

		if ( blending === NoBlending ) {

			if ( currentBlendingEnabled === true ) {

				disable( gl.BLEND );
				currentBlendingEnabled = false;

			}

			return;

		}

		if ( currentBlendingEnabled === false ) {

			enable( gl.BLEND );
			currentBlendingEnabled = true;

		}

		if ( blending !== CustomBlending ) {

			if ( blending !== currentBlending || premultipliedAlpha !== currentPremultipledAlpha ) {

				if ( currentBlendEquation !== AddEquation || currentBlendEquationAlpha !== AddEquation ) {

					gl.blendEquation( gl.FUNC_ADD );

					currentBlendEquation = AddEquation;
					currentBlendEquationAlpha = AddEquation;

				}

				if ( premultipliedAlpha ) {

					switch ( blending ) {

						case NormalBlending:
							gl.blendFuncSeparate( gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
							break;

						case AdditiveBlending:
							gl.blendFunc( gl.ONE, gl.ONE );
							break;

						case SubtractiveBlending:
							gl.blendFuncSeparate( gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ZERO, gl.ONE );
							break;

						case MultiplyBlending:
							gl.blendFuncSeparate( gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE );
							break;

						default:
							console.error( 'THREE.WebGLState: Invalid blending: ', blending );
							break;

					}

				} else {

					switch ( blending ) {

						case NormalBlending:
							gl.blendFuncSeparate( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
							break;

						case AdditiveBlending:
							gl.blendFuncSeparate( gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE );
							break;

						case SubtractiveBlending:
							console.error( 'THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true' );
							break;

						case MultiplyBlending:
							console.error( 'THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true' );
							break;

						default:
							console.error( 'THREE.WebGLState: Invalid blending: ', blending );
							break;

					}

				}

				currentBlendSrc = null;
				currentBlendDst = null;
				currentBlendSrcAlpha = null;
				currentBlendDstAlpha = null;
				currentBlendColor.set( 0, 0, 0 );
				currentBlendAlpha = 0;

				currentBlending = blending;
				currentPremultipledAlpha = premultipliedAlpha;

			}

			return;

		}

		// custom blending

		blendEquationAlpha = blendEquationAlpha || blendEquation;
		blendSrcAlpha = blendSrcAlpha || blendSrc;
		blendDstAlpha = blendDstAlpha || blendDst;

		if ( blendEquation !== currentBlendEquation || blendEquationAlpha !== currentBlendEquationAlpha ) {

			gl.blendEquationSeparate( equationToGL[ blendEquation ], equationToGL[ blendEquationAlpha ] );

			currentBlendEquation = blendEquation;
			currentBlendEquationAlpha = blendEquationAlpha;

		}

		if ( blendSrc !== currentBlendSrc || blendDst !== currentBlendDst || blendSrcAlpha !== currentBlendSrcAlpha || blendDstAlpha !== currentBlendDstAlpha ) {

			gl.blendFuncSeparate( factorToGL[ blendSrc ], factorToGL[ blendDst ], factorToGL[ blendSrcAlpha ], factorToGL[ blendDstAlpha ] );

			currentBlendSrc = blendSrc;
			currentBlendDst = blendDst;
			currentBlendSrcAlpha = blendSrcAlpha;
			currentBlendDstAlpha = blendDstAlpha;

		}

		if ( blendColor.equals( currentBlendColor ) === false || blendAlpha !== currentBlendAlpha ) {

			gl.blendColor( blendColor.r, blendColor.g, blendColor.b, blendAlpha );

			currentBlendColor.copy( blendColor );
			currentBlendAlpha = blendAlpha;

		}

		currentBlending = blending;
		currentPremultipledAlpha = false;

	}

	function setMaterial( material, frontFaceCW ) {

		material.side === DoubleSide
			? disable( gl.CULL_FACE )
			: enable( gl.CULL_FACE );

		let flipSided = ( material.side === BackSide );
		if ( frontFaceCW ) flipSided = ! flipSided;

		setFlipSided( flipSided );

		( material.blending === NormalBlending && material.transparent === false )
			? setBlending( NoBlending )
			: setBlending( material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.blendColor, material.blendAlpha, material.premultipliedAlpha );

		depthBuffer.setFunc( material.depthFunc );
		depthBuffer.setTest( material.depthTest );
		depthBuffer.setMask( material.depthWrite );
		colorBuffer.setMask( material.colorWrite );

		const stencilWrite = material.stencilWrite;
		stencilBuffer.setTest( stencilWrite );
		if ( stencilWrite ) {

			stencilBuffer.setMask( material.stencilWriteMask );
			stencilBuffer.setFunc( material.stencilFunc, material.stencilRef, material.stencilFuncMask );
			stencilBuffer.setOp( material.stencilFail, material.stencilZFail, material.stencilZPass );

		}

		setPolygonOffset( material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits );

		material.alphaToCoverage === true
			? enable( gl.SAMPLE_ALPHA_TO_COVERAGE )
			: disable( gl.SAMPLE_ALPHA_TO_COVERAGE );

	}

	//

	function setFlipSided( flipSided ) {

		if ( currentFlipSided !== flipSided ) {

			if ( flipSided ) {

				gl.frontFace( gl.CW );

			} else {

				gl.frontFace( gl.CCW );

			}

			currentFlipSided = flipSided;

		}

	}

	function setCullFace( cullFace ) {

		if ( cullFace !== CullFaceNone ) {

			enable( gl.CULL_FACE );

			if ( cullFace !== currentCullFace ) {

				if ( cullFace === CullFaceBack ) {

					gl.cullFace( gl.BACK );

				} else if ( cullFace === CullFaceFront ) {

					gl.cullFace( gl.FRONT );

				} else {

					gl.cullFace( gl.FRONT_AND_BACK );

				}

			}

		} else {

			disable( gl.CULL_FACE );

		}

		currentCullFace = cullFace;

	}

	function setLineWidth( width ) {

		if ( width !== currentLineWidth ) {

			if ( lineWidthAvailable ) gl.lineWidth( width );

			currentLineWidth = width;

		}

	}

	function setPolygonOffset( polygonOffset, factor, units ) {

		if ( polygonOffset ) {

			enable( gl.POLYGON_OFFSET_FILL );

			if ( currentPolygonOffsetFactor !== factor || currentPolygonOffsetUnits !== units ) {

				gl.polygonOffset( factor, units );

				currentPolygonOffsetFactor = factor;
				currentPolygonOffsetUnits = units;

			}

		} else {

			disable( gl.POLYGON_OFFSET_FILL );

		}

	}

	function setScissorTest( scissorTest ) {

		if ( scissorTest ) {

			enable( gl.SCISSOR_TEST );

		} else {

			disable( gl.SCISSOR_TEST );

		}

	}

	// texture

	function activeTexture( webglSlot ) {

		if ( webglSlot === undefined ) webglSlot = gl.TEXTURE0 + maxTextures - 1;

		if ( currentTextureSlot !== webglSlot ) {

			gl.activeTexture( webglSlot );
			currentTextureSlot = webglSlot;

		}

	}

	function bindTexture( webglType, webglTexture, webglSlot ) {

		if ( webglSlot === undefined ) {

			if ( currentTextureSlot === null ) {

				webglSlot = gl.TEXTURE0 + maxTextures - 1;

			} else {

				webglSlot = currentTextureSlot;

			}

		}

		let boundTexture = currentBoundTextures[ webglSlot ];

		if ( boundTexture === undefined ) {

			boundTexture = { type: undefined, texture: undefined };
			currentBoundTextures[ webglSlot ] = boundTexture;

		}

		if ( boundTexture.type !== webglType || boundTexture.texture !== webglTexture ) {

			if ( currentTextureSlot !== webglSlot ) {

				gl.activeTexture( webglSlot );
				currentTextureSlot = webglSlot;

			}

			gl.bindTexture( webglType, webglTexture || emptyTextures[ webglType ] );

			boundTexture.type = webglType;
			boundTexture.texture = webglTexture;

		}

	}

	function unbindTexture() {

		const boundTexture = currentBoundTextures[ currentTextureSlot ];

		if ( boundTexture !== undefined && boundTexture.type !== undefined ) {

			gl.bindTexture( boundTexture.type, null );

			boundTexture.type = undefined;
			boundTexture.texture = undefined;

		}

	}

	function compressedTexImage2D() {

		try {

			gl.compressedTexImage2D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function compressedTexImage3D() {

		try {

			gl.compressedTexImage3D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texSubImage2D() {

		try {

			gl.texSubImage2D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texSubImage3D() {

		try {

			gl.texSubImage3D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function compressedTexSubImage2D() {

		try {

			gl.compressedTexSubImage2D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function compressedTexSubImage3D() {

		try {

			gl.compressedTexSubImage3D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texStorage2D() {

		try {

			gl.texStorage2D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texStorage3D() {

		try {

			gl.texStorage3D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texImage2D() {

		try {

			gl.texImage2D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	function texImage3D() {

		try {

			gl.texImage3D( ...arguments );

		} catch ( error ) {

			console.error( 'THREE.WebGLState:', error );

		}

	}

	//

	function scissor( scissor ) {

		if ( currentScissor.equals( scissor ) === false ) {

			gl.scissor( scissor.x, scissor.y, scissor.z, scissor.w );
			currentScissor.copy( scissor );

		}

	}

	function viewport( viewport ) {

		if ( currentViewport.equals( viewport ) === false ) {

			gl.viewport( viewport.x, viewport.y, viewport.z, viewport.w );
			currentViewport.copy( viewport );

		}

	}

	function updateUBOMapping( uniformsGroup, program ) {

		let mapping = uboProgramMap.get( program );

		if ( mapping === undefined ) {

			mapping = new WeakMap();

			uboProgramMap.set( program, mapping );

		}

		let blockIndex = mapping.get( uniformsGroup );

		if ( blockIndex === undefined ) {

			blockIndex = gl.getUniformBlockIndex( program, uniformsGroup.name );

			mapping.set( uniformsGroup, blockIndex );

		}

	}

	function uniformBlockBinding( uniformsGroup, program ) {

		const mapping = uboProgramMap.get( program );
		const blockIndex = mapping.get( uniformsGroup );

		if ( uboBindings.get( program ) !== blockIndex ) {

			// bind shader specific block index to global block point
			gl.uniformBlockBinding( program, blockIndex, uniformsGroup.__bindingPointIndex );

			uboBindings.set( program, blockIndex );

		}

	}

	//

	function reset() {

		// reset state

		gl.disable( gl.BLEND );
		gl.disable( gl.CULL_FACE );
		gl.disable( gl.DEPTH_TEST );
		gl.disable( gl.POLYGON_OFFSET_FILL );
		gl.disable( gl.SCISSOR_TEST );
		gl.disable( gl.STENCIL_TEST );
		gl.disable( gl.SAMPLE_ALPHA_TO_COVERAGE );

		gl.blendEquation( gl.FUNC_ADD );
		gl.blendFunc( gl.ONE, gl.ZERO );
		gl.blendFuncSeparate( gl.ONE, gl.ZERO, gl.ONE, gl.ZERO );
		gl.blendColor( 0, 0, 0, 0 );

		gl.colorMask( true, true, true, true );
		gl.clearColor( 0, 0, 0, 0 );

		gl.depthMask( true );
		gl.depthFunc( gl.LESS );

		depthBuffer.setReversed( false );

		gl.clearDepth( 1 );

		gl.stencilMask( 0xffffffff );
		gl.stencilFunc( gl.ALWAYS, 0, 0xffffffff );
		gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP );
		gl.clearStencil( 0 );

		gl.cullFace( gl.BACK );
		gl.frontFace( gl.CCW );

		gl.polygonOffset( 0, 0 );

		gl.activeTexture( gl.TEXTURE0 );

		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		gl.bindFramebuffer( gl.DRAW_FRAMEBUFFER, null );
		gl.bindFramebuffer( gl.READ_FRAMEBUFFER, null );

		gl.useProgram( null );

		gl.lineWidth( 1 );

		gl.scissor( 0, 0, gl.canvas.width, gl.canvas.height );
		gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );

		// reset internals

		enabledCapabilities = {};

		currentTextureSlot = null;
		currentBoundTextures = {};

		currentBoundFramebuffers = {};
		currentDrawbuffers = new WeakMap();
		defaultDrawbuffers = [];

		currentProgram = null;

		currentBlendingEnabled = false;
		currentBlending = null;
		currentBlendEquation = null;
		currentBlendSrc = null;
		currentBlendDst = null;
		currentBlendEquationAlpha = null;
		currentBlendSrcAlpha = null;
		currentBlendDstAlpha = null;
		currentBlendColor = new Color( 0, 0, 0 );
		currentBlendAlpha = 0;
		currentPremultipledAlpha = false;

		currentFlipSided = null;
		currentCullFace = null;

		currentLineWidth = null;

		currentPolygonOffsetFactor = null;
		currentPolygonOffsetUnits = null;

		currentScissor.set( 0, 0, gl.canvas.width, gl.canvas.height );
		currentViewport.set( 0, 0, gl.canvas.width, gl.canvas.height );

		colorBuffer.reset();
		depthBuffer.reset();
		stencilBuffer.reset();

	}

	return {

		buffers: {
			color: colorBuffer,
			depth: depthBuffer,
			stencil: stencilBuffer
		},

		enable: enable,
		disable: disable,

		bindFramebuffer: bindFramebuffer,
		drawBuffers: drawBuffers,

		useProgram: useProgram,

		setBlending: setBlending,
		setMaterial: setMaterial,

		setFlipSided: setFlipSided,
		setCullFace: setCullFace,

		setLineWidth: setLineWidth,
		setPolygonOffset: setPolygonOffset,

		setScissorTest: setScissorTest,

		activeTexture: activeTexture,
		bindTexture: bindTexture,
		unbindTexture: unbindTexture,
		compressedTexImage2D: compressedTexImage2D,
		compressedTexImage3D: compressedTexImage3D,
		texImage2D: texImage2D,
		texImage3D: texImage3D,

		updateUBOMapping: updateUBOMapping,
		uniformBlockBinding: uniformBlockBinding,

		texStorage2D: texStorage2D,
		texStorage3D: texStorage3D,
		texSubImage2D: texSubImage2D,
		texSubImage3D: texSubImage3D,
		compressedTexSubImage2D: compressedTexSubImage2D,
		compressedTexSubImage3D: compressedTexSubImage3D,

		scissor: scissor,
		viewport: viewport,

		reset: reset

	};

}

function WebGLTextures( _gl, extensions, state, properties, capabilities, utils, info ) {

	const multisampledRTTExt = extensions.has( 'WEBGL_multisampled_render_to_texture' ) ? extensions.get( 'WEBGL_multisampled_render_to_texture' ) : null;
	const supportsInvalidateFramebuffer = typeof navigator === 'undefined' ? false : /OculusBrowser/g.test( navigator.userAgent );

	const _imageDimensions = new Vector2();
	const _videoTextures = new WeakMap();
	let _canvas;

	const _sources = new WeakMap(); // maps WebglTexture objects to instances of Source

	// cordova iOS (as of 5.0) still uses UIWebView, which provides OffscreenCanvas,
	// also OffscreenCanvas.getContext("webgl"), but not OffscreenCanvas.getContext("2d")!
	// Some implementations may only implement OffscreenCanvas partially (e.g. lacking 2d).

	let useOffscreenCanvas = false;

	try {

		useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'
			// eslint-disable-next-line compat/compat
			&& ( new OffscreenCanvas( 1, 1 ).getContext( '2d' ) ) !== null;

	} catch ( err ) {

		// Ignore any errors

	}

	function createCanvas( width, height ) {

		// Use OffscreenCanvas when available. Specially needed in web workers

		return useOffscreenCanvas ?
			// eslint-disable-next-line compat/compat
			new OffscreenCanvas( width, height ) : createElementNS( 'canvas' );

	}

	function resizeImage( image, needsNewCanvas, maxSize ) {

		let scale = 1;

		const dimensions = getDimensions( image );

		// handle case if texture exceeds max size

		if ( dimensions.width > maxSize || dimensions.height > maxSize ) {

			scale = maxSize / Math.max( dimensions.width, dimensions.height );

		}

		// only perform resize if necessary

		if ( scale < 1 ) {

			// only perform resize for certain image types

			if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
				( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
				( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ||
				( typeof VideoFrame !== 'undefined' && image instanceof VideoFrame ) ) {

				const width = Math.floor( scale * dimensions.width );
				const height = Math.floor( scale * dimensions.height );

				if ( _canvas === undefined ) _canvas = createCanvas( width, height );

				// cube textures can't reuse the same canvas

				const canvas = needsNewCanvas ? createCanvas( width, height ) : _canvas;

				canvas.width = width;
				canvas.height = height;

				const context = canvas.getContext( '2d' );
				context.drawImage( image, 0, 0, width, height );

				console.warn( 'THREE.WebGLRenderer: Texture has been resized from (' + dimensions.width + 'x' + dimensions.height + ') to (' + width + 'x' + height + ').' );

				return canvas;

			} else {

				if ( 'data' in image ) {

					console.warn( 'THREE.WebGLRenderer: Image in DataTexture is too big (' + dimensions.width + 'x' + dimensions.height + ').' );

				}

				return image;

			}

		}

		return image;

	}

	function textureNeedsGenerateMipmaps( texture ) {

		return texture.generateMipmaps;

	}

	function generateMipmap( target ) {

		_gl.generateMipmap( target );

	}

	function getTargetType( texture ) {

		if ( texture.isWebGLCubeRenderTarget ) return _gl.TEXTURE_CUBE_MAP;
		if ( texture.isWebGL3DRenderTarget ) return _gl.TEXTURE_3D;
		if ( texture.isWebGLArrayRenderTarget || texture.isCompressedArrayTexture ) return _gl.TEXTURE_2D_ARRAY;
		return _gl.TEXTURE_2D;

	}

	function getInternalFormat( internalFormatName, glFormat, glType, colorSpace, forceLinearTransfer = false ) {

		if ( internalFormatName !== null ) {

			if ( _gl[ internalFormatName ] !== undefined ) return _gl[ internalFormatName ];

			console.warn( 'THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format \'' + internalFormatName + '\'' );

		}

		let internalFormat = glFormat;

		if ( glFormat === _gl.RED ) {

			if ( glType === _gl.FLOAT ) internalFormat = _gl.R32F;
			if ( glType === _gl.HALF_FLOAT ) internalFormat = _gl.R16F;
			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.R8;

		}

		if ( glFormat === _gl.RED_INTEGER ) {

			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.R8UI;
			if ( glType === _gl.UNSIGNED_SHORT ) internalFormat = _gl.R16UI;
			if ( glType === _gl.UNSIGNED_INT ) internalFormat = _gl.R32UI;
			if ( glType === _gl.BYTE ) internalFormat = _gl.R8I;
			if ( glType === _gl.SHORT ) internalFormat = _gl.R16I;
			if ( glType === _gl.INT ) internalFormat = _gl.R32I;

		}

		if ( glFormat === _gl.RG ) {

			if ( glType === _gl.FLOAT ) internalFormat = _gl.RG32F;
			if ( glType === _gl.HALF_FLOAT ) internalFormat = _gl.RG16F;
			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.RG8;

		}

		if ( glFormat === _gl.RG_INTEGER ) {

			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.RG8UI;
			if ( glType === _gl.UNSIGNED_SHORT ) internalFormat = _gl.RG16UI;
			if ( glType === _gl.UNSIGNED_INT ) internalFormat = _gl.RG32UI;
			if ( glType === _gl.BYTE ) internalFormat = _gl.RG8I;
			if ( glType === _gl.SHORT ) internalFormat = _gl.RG16I;
			if ( glType === _gl.INT ) internalFormat = _gl.RG32I;

		}

		if ( glFormat === _gl.RGB_INTEGER ) {

			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.RGB8UI;
			if ( glType === _gl.UNSIGNED_SHORT ) internalFormat = _gl.RGB16UI;
			if ( glType === _gl.UNSIGNED_INT ) internalFormat = _gl.RGB32UI;
			if ( glType === _gl.BYTE ) internalFormat = _gl.RGB8I;
			if ( glType === _gl.SHORT ) internalFormat = _gl.RGB16I;
			if ( glType === _gl.INT ) internalFormat = _gl.RGB32I;

		}

		if ( glFormat === _gl.RGBA_INTEGER ) {

			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = _gl.RGBA8UI;
			if ( glType === _gl.UNSIGNED_SHORT ) internalFormat = _gl.RGBA16UI;
			if ( glType === _gl.UNSIGNED_INT ) internalFormat = _gl.RGBA32UI;
			if ( glType === _gl.BYTE ) internalFormat = _gl.RGBA8I;
			if ( glType === _gl.SHORT ) internalFormat = _gl.RGBA16I;
			if ( glType === _gl.INT ) internalFormat = _gl.RGBA32I;

		}

		if ( glFormat === _gl.RGB ) {

			if ( glType === _gl.UNSIGNED_INT_5_9_9_9_REV ) internalFormat = _gl.RGB9_E5;
			if ( glType === _gl.UNSIGNED_INT_10F_11F_11F_REV ) internalFormat = _gl.R11F_G11F_B10F;

		}

		if ( glFormat === _gl.RGBA ) {

			const transfer = forceLinearTransfer ? LinearTransfer : ColorManagement.getTransfer( colorSpace );

			if ( glType === _gl.FLOAT ) internalFormat = _gl.RGBA32F;
			if ( glType === _gl.HALF_FLOAT ) internalFormat = _gl.RGBA16F;
			if ( glType === _gl.UNSIGNED_BYTE ) internalFormat = ( transfer === SRGBTransfer ) ? _gl.SRGB8_ALPHA8 : _gl.RGBA8;
			if ( glType === _gl.UNSIGNED_SHORT_4_4_4_4 ) internalFormat = _gl.RGBA4;
			if ( glType === _gl.UNSIGNED_SHORT_5_5_5_1 ) internalFormat = _gl.RGB5_A1;

		}

		if ( internalFormat === _gl.R16F || internalFormat === _gl.R32F ||
			internalFormat === _gl.RG16F || internalFormat === _gl.RG32F ||
			internalFormat === _gl.RGBA16F || internalFormat === _gl.RGBA32F ) {

			extensions.get( 'EXT_color_buffer_float' );

		}

		return internalFormat;

	}

	function getInternalDepthFormat( useStencil, depthType ) {

		let glInternalFormat;
		if ( useStencil ) {

			if ( depthType === null || depthType === UnsignedIntType || depthType === UnsignedInt248Type ) {

				glInternalFormat = _gl.DEPTH24_STENCIL8;

			} else if ( depthType === FloatType ) {

				glInternalFormat = _gl.DEPTH32F_STENCIL8;

			} else if ( depthType === UnsignedShortType ) {

				glInternalFormat = _gl.DEPTH24_STENCIL8;
				console.warn( 'DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.' );

			}

		} else {

			if ( depthType === null || depthType === UnsignedIntType || depthType === UnsignedInt248Type ) {

				glInternalFormat = _gl.DEPTH_COMPONENT24;

			} else if ( depthType === FloatType ) {

				glInternalFormat = _gl.DEPTH_COMPONENT32F;

			} else if ( depthType === UnsignedShortType ) {

				glInternalFormat = _gl.DEPTH_COMPONENT16;

			}

		}

		return glInternalFormat;

	}

	function getMipLevels( texture, image ) {

		if ( textureNeedsGenerateMipmaps( texture ) === true || ( texture.isFramebufferTexture && texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter ) ) {

			return Math.log2( Math.max( image.width, image.height ) ) + 1;

		} else if ( texture.mipmaps !== undefined && texture.mipmaps.length > 0 ) {

			// user-defined mipmaps

			return texture.mipmaps.length;

		} else if ( texture.isCompressedTexture && Array.isArray( texture.image ) ) {

			return image.mipmaps.length;

		} else {

			// texture without mipmaps (only base level)

			return 1;

		}

	}

	//

	function onTextureDispose( event ) {

		const texture = event.target;

		texture.removeEventListener( 'dispose', onTextureDispose );

		deallocateTexture( texture );

		if ( texture.isVideoTexture ) {

			_videoTextures.delete( texture );

		}

	}

	function onRenderTargetDispose( event ) {

		const renderTarget = event.target;

		renderTarget.removeEventListener( 'dispose', onRenderTargetDispose );

		deallocateRenderTarget( renderTarget );

	}

	//

	function deallocateTexture( texture ) {

		const textureProperties = properties.get( texture );

		if ( textureProperties.__webglInit === undefined ) return;

		// check if it's necessary to remove the WebGLTexture object

		const source = texture.source;
		const webglTextures = _sources.get( source );

		if ( webglTextures ) {

			const webglTexture = webglTextures[ textureProperties.__cacheKey ];
			webglTexture.usedTimes --;

			// the WebGLTexture object is not used anymore, remove it

			if ( webglTexture.usedTimes === 0 ) {

				deleteTexture( texture );

			}

			// remove the weak map entry if no WebGLTexture uses the source anymore

			if ( Object.keys( webglTextures ).length === 0 ) {

				_sources.delete( source );

			}

		}

		properties.remove( texture );

	}

	function deleteTexture( texture ) {

		const textureProperties = properties.get( texture );
		_gl.deleteTexture( textureProperties.__webglTexture );

		const source = texture.source;
		const webglTextures = _sources.get( source );
		delete webglTextures[ textureProperties.__cacheKey ];

		info.memory.textures --;

	}

	function deallocateRenderTarget( renderTarget ) {

		const renderTargetProperties = properties.get( renderTarget );

		if ( renderTarget.depthTexture ) {

			renderTarget.depthTexture.dispose();

			properties.remove( renderTarget.depthTexture );

		}

		if ( renderTarget.isWebGLCubeRenderTarget ) {

			for ( let i = 0; i < 6; i ++ ) {

				if ( Array.isArray( renderTargetProperties.__webglFramebuffer[ i ] ) ) {

					for ( let level = 0; level < renderTargetProperties.__webglFramebuffer[ i ].length; level ++ ) _gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer[ i ][ level ] );

				} else {

					_gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer[ i ] );

				}

				if ( renderTargetProperties.__webglDepthbuffer ) _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer[ i ] );

			}

		} else {

			if ( Array.isArray( renderTargetProperties.__webglFramebuffer ) ) {

				for ( let level = 0; level < renderTargetProperties.__webglFramebuffer.length; level ++ ) _gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer[ level ] );

			} else {

				_gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer );

			}

			if ( renderTargetProperties.__webglDepthbuffer ) _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer );
			if ( renderTargetProperties.__webglMultisampledFramebuffer ) _gl.deleteFramebuffer( renderTargetProperties.__webglMultisampledFramebuffer );

			if ( renderTargetProperties.__webglColorRenderbuffer ) {

				for ( let i = 0; i < renderTargetProperties.__webglColorRenderbuffer.length; i ++ ) {

					if ( renderTargetProperties.__webglColorRenderbuffer[ i ] ) _gl.deleteRenderbuffer( renderTargetProperties.__webglColorRenderbuffer[ i ] );

				}

			}

			if ( renderTargetProperties.__webglDepthRenderbuffer ) _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthRenderbuffer );

		}

		const textures = renderTarget.textures;

		for ( let i = 0, il = textures.length; i < il; i ++ ) {

			const attachmentProperties = properties.get( textures[ i ] );

			if ( attachmentProperties.__webglTexture ) {

				_gl.deleteTexture( attachmentProperties.__webglTexture );

				info.memory.textures --;

			}

			properties.remove( textures[ i ] );

		}

		properties.remove( renderTarget );

	}

	//

	let textureUnits = 0;

	function resetTextureUnits() {

		textureUnits = 0;

	}

	function allocateTextureUnit() {

		const textureUnit = textureUnits;

		if ( textureUnit >= capabilities.maxTextures ) {

			console.warn( 'THREE.WebGLTextures: Trying to use ' + textureUnit + ' texture units while this GPU supports only ' + capabilities.maxTextures );

		}

		textureUnits += 1;

		return textureUnit;

	}

	function getTextureCacheKey( texture ) {

		const array = [];

		array.push( texture.wrapS );
		array.push( texture.wrapT );
		array.push( texture.wrapR || 0 );
		array.push( texture.magFilter );
		array.push( texture.minFilter );
		array.push( texture.anisotropy );
		array.push( texture.internalFormat );
		array.push( texture.format );
		array.push( texture.type );
		array.push( texture.generateMipmaps );
		array.push( texture.premultiplyAlpha );
		array.push( texture.flipY );
		array.push( texture.unpackAlignment );
		array.push( texture.colorSpace );

		return array.join();

	}

	//

	function setTexture2D( texture, slot ) {

		const textureProperties = properties.get( texture );

		if ( texture.isVideoTexture ) updateVideoTexture( texture );

		if ( texture.isRenderTargetTexture === false && texture.isExternalTexture !== true && texture.version > 0 && textureProperties.__version !== texture.version ) {

			const image = texture.image;

			if ( image === null ) {

				console.warn( 'THREE.WebGLRenderer: Texture marked for update but no image data found.' );

			} else if ( image.complete === false ) {

				console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is incomplete' );

			} else {

				uploadTexture( textureProperties, texture, slot );
				return;

			}

		} else if ( texture.isExternalTexture ) {

			textureProperties.__webglTexture = texture.sourceTexture ? texture.sourceTexture : null;

		}

		state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture, _gl.TEXTURE0 + slot );

	}

	function setTexture2DArray( texture, slot ) {

		const textureProperties = properties.get( texture );

		if ( texture.isRenderTargetTexture === false && texture.version > 0 && textureProperties.__version !== texture.version ) {

			uploadTexture( textureProperties, texture, slot );
			return;

		}

		state.bindTexture( _gl.TEXTURE_2D_ARRAY, textureProperties.__webglTexture, _gl.TEXTURE0 + slot );

	}

	function setTexture3D( texture, slot ) {

		const textureProperties = properties.get( texture );

		if ( texture.isRenderTargetTexture === false && texture.version > 0 && textureProperties.__version !== texture.version ) {

			uploadTexture( textureProperties, texture, slot );
			return;

		}

		state.bindTexture( _gl.TEXTURE_3D, textureProperties.__webglTexture, _gl.TEXTURE0 + slot );

	}

	function setTextureCube( texture, slot ) {

		const textureProperties = properties.get( texture );

		if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

			uploadCubeTexture( textureProperties, texture, slot );
			return;

		}

		state.bindTexture( _gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture, _gl.TEXTURE0 + slot );

	}

	const wrappingToGL = {
		[ RepeatWrapping ]: _gl.REPEAT,
		[ ClampToEdgeWrapping ]: _gl.CLAMP_TO_EDGE,
		[ MirroredRepeatWrapping ]: _gl.MIRRORED_REPEAT
	};

	const filterToGL = {
		[ NearestFilter ]: _gl.NEAREST,
		[ NearestMipmapNearestFilter ]: _gl.NEAREST_MIPMAP_NEAREST,
		[ NearestMipmapLinearFilter ]: _gl.NEAREST_MIPMAP_LINEAR,

		[ LinearFilter ]: _gl.LINEAR,
		[ LinearMipmapNearestFilter ]: _gl.LINEAR_MIPMAP_NEAREST,
		[ LinearMipmapLinearFilter ]: _gl.LINEAR_MIPMAP_LINEAR
	};

	const compareToGL = {
		[ NeverCompare ]: _gl.NEVER,
		[ AlwaysCompare ]: _gl.ALWAYS,
		[ LessCompare ]: _gl.LESS,
		[ LessEqualCompare ]: _gl.LEQUAL,
		[ EqualCompare ]: _gl.EQUAL,
		[ GreaterEqualCompare ]: _gl.GEQUAL,
		[ GreaterCompare ]: _gl.GREATER,
		[ NotEqualCompare ]: _gl.NOTEQUAL
	};

	function setTextureParameters( textureType, texture ) {

		if ( texture.type === FloatType && extensions.has( 'OES_texture_float_linear' ) === false &&
			( texture.magFilter === LinearFilter || texture.magFilter === LinearMipmapNearestFilter || texture.magFilter === NearestMipmapLinearFilter || texture.magFilter === LinearMipmapLinearFilter ||
			texture.minFilter === LinearFilter || texture.minFilter === LinearMipmapNearestFilter || texture.minFilter === NearestMipmapLinearFilter || texture.minFilter === LinearMipmapLinearFilter ) ) {

			console.warn( 'THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.' );

		}

		_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_S, wrappingToGL[ texture.wrapS ] );
		_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_T, wrappingToGL[ texture.wrapT ] );

		if ( textureType === _gl.TEXTURE_3D || textureType === _gl.TEXTURE_2D_ARRAY ) {

			_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_R, wrappingToGL[ texture.wrapR ] );

		}

		_gl.texParameteri( textureType, _gl.TEXTURE_MAG_FILTER, filterToGL[ texture.magFilter ] );
		_gl.texParameteri( textureType, _gl.TEXTURE_MIN_FILTER, filterToGL[ texture.minFilter ] );

		if ( texture.compareFunction ) {

			_gl.texParameteri( textureType, _gl.TEXTURE_COMPARE_MODE, _gl.COMPARE_REF_TO_TEXTURE );
			_gl.texParameteri( textureType, _gl.TEXTURE_COMPARE_FUNC, compareToGL[ texture.compareFunction ] );

		}

		if ( extensions.has( 'EXT_texture_filter_anisotropic' ) === true ) {

			if ( texture.magFilter === NearestFilter ) return;
			if ( texture.minFilter !== NearestMipmapLinearFilter && texture.minFilter !== LinearMipmapLinearFilter ) return;
			if ( texture.type === FloatType && extensions.has( 'OES_texture_float_linear' ) === false ) return; // verify extension

			if ( texture.anisotropy > 1 || properties.get( texture ).__currentAnisotropy ) {

				const extension = extensions.get( 'EXT_texture_filter_anisotropic' );
				_gl.texParameterf( textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( texture.anisotropy, capabilities.getMaxAnisotropy() ) );
				properties.get( texture ).__currentAnisotropy = texture.anisotropy;

			}

		}

	}

	function initTexture( textureProperties, texture ) {

		let forceUpload = false;

		if ( textureProperties.__webglInit === undefined ) {

			textureProperties.__webglInit = true;

			texture.addEventListener( 'dispose', onTextureDispose );

		}

		// create Source <-> WebGLTextures mapping if necessary

		const source = texture.source;
		let webglTextures = _sources.get( source );

		if ( webglTextures === undefined ) {

			webglTextures = {};
			_sources.set( source, webglTextures );

		}

		// check if there is already a WebGLTexture object for the given texture parameters

		const textureCacheKey = getTextureCacheKey( texture );

		if ( textureCacheKey !== textureProperties.__cacheKey ) {

			// if not, create a new instance of WebGLTexture

			if ( webglTextures[ textureCacheKey ] === undefined ) {

				// create new entry

				webglTextures[ textureCacheKey ] = {
					texture: _gl.createTexture(),
					usedTimes: 0
				};

				info.memory.textures ++;

				// when a new instance of WebGLTexture was created, a texture upload is required
				// even if the image contents are identical

				forceUpload = true;

			}

			webglTextures[ textureCacheKey ].usedTimes ++;

			// every time the texture cache key changes, it's necessary to check if an instance of
			// WebGLTexture can be deleted in order to avoid a memory leak.

			const webglTexture = webglTextures[ textureProperties.__cacheKey ];

			if ( webglTexture !== undefined ) {

				webglTextures[ textureProperties.__cacheKey ].usedTimes --;

				if ( webglTexture.usedTimes === 0 ) {

					deleteTexture( texture );

				}

			}

			// store references to cache key and WebGLTexture object

			textureProperties.__cacheKey = textureCacheKey;
			textureProperties.__webglTexture = webglTextures[ textureCacheKey ].texture;

		}

		return forceUpload;

	}

	function getRow( index, rowLength, componentStride ) {

		return Math.floor( Math.floor( index / componentStride ) / rowLength );

	}

	function updateTexture( texture, image, glFormat, glType ) {

		const componentStride = 4; // only RGBA supported

		const updateRanges = texture.updateRanges;

		if ( updateRanges.length === 0 ) {

			state.texSubImage2D( _gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, glFormat, glType, image.data );

		} else {

			// Before applying update ranges, we merge any adjacent / overlapping
			// ranges to reduce load on `gl.texSubImage2D`. Empirically, this has led
			// to performance improvements for applications which make heavy use of
			// update ranges. Likely due to GPU command overhead.
			//
			// Note that to reduce garbage collection between frames, we merge the
			// update ranges in-place. This is safe because this method will clear the
			// update ranges once updated.

			updateRanges.sort( ( a, b ) => a.start - b.start );

			// To merge the update ranges in-place, we work from left to right in the
			// existing updateRanges array, merging ranges. This may result in a final
			// array which is smaller than the original. This index tracks the last
			// index representing a merged range, any data after this index can be
			// trimmed once the merge algorithm is completed.
			let mergeIndex = 0;

			for ( let i = 1; i < updateRanges.length; i ++ ) {

				const previousRange = updateRanges[ mergeIndex ];
				const range = updateRanges[ i ];

				// Only merge if in the same row and overlapping/adjacent
				const previousEnd = previousRange.start + previousRange.count;
				const currentRow = getRow( range.start, image.width, componentStride );
				const previousRow = getRow( previousRange.start, image.width, componentStride );

				// We add one here to merge adjacent ranges. This is safe because ranges
				// operate over positive integers.
				if (
					range.start <= previousEnd + 1 &&
					currentRow === previousRow &&
					getRow( range.start + range.count - 1, image.width, componentStride ) === currentRow // ensure range doesn't spill
				) {

					previousRange.count = Math.max(
						previousRange.count,
						range.start + range.count - previousRange.start
					);

				} else {

					++ mergeIndex;
					updateRanges[ mergeIndex ] = range;

				}


			}

			// Trim the array to only contain the merged ranges.
			updateRanges.length = mergeIndex + 1;

			const currentUnpackRowLen = _gl.getParameter( _gl.UNPACK_ROW_LENGTH );
			const currentUnpackSkipPixels = _gl.getParameter( _gl.UNPACK_SKIP_PIXELS );
			const currentUnpackSkipRows = _gl.getParameter( _gl.UNPACK_SKIP_ROWS );

			_gl.pixelStorei( _gl.UNPACK_ROW_LENGTH, image.width );

			for ( let i = 0, l = updateRanges.length; i < l; i ++ ) {

				const range = updateRanges[ i ];

				const pixelStart = Math.floor( range.start / componentStride );
				const pixelCount = Math.ceil( range.count / componentStride );

				const x = pixelStart % image.width;
				const y = Math.floor( pixelStart / image.width );

				// Assumes update ranges refer to contiguous memory
				const width = pixelCount;
				const height = 1;

				_gl.pixelStorei( _gl.UNPACK_SKIP_PIXELS, x );
				_gl.pixelStorei( _gl.UNPACK_SKIP_ROWS, y );

				state.texSubImage2D( _gl.TEXTURE_2D, 0, x, y, width, height, glFormat, glType, image.data );

			}

			texture.clearUpdateRanges();

			_gl.pixelStorei( _gl.UNPACK_ROW_LENGTH, currentUnpackRowLen );
			_gl.pixelStorei( _gl.UNPACK_SKIP_PIXELS, currentUnpackSkipPixels );
			_gl.pixelStorei( _gl.UNPACK_SKIP_ROWS, currentUnpackSkipRows );

		}

	}

	function uploadTexture( textureProperties, texture, slot ) {

		let textureType = _gl.TEXTURE_2D;

		if ( texture.isDataArrayTexture || texture.isCompressedArrayTexture ) textureType = _gl.TEXTURE_2D_ARRAY;
		if ( texture.isData3DTexture ) textureType = _gl.TEXTURE_3D;

		const forceUpload = initTexture( textureProperties, texture );
		const source = texture.source;

		state.bindTexture( textureType, textureProperties.__webglTexture, _gl.TEXTURE0 + slot );

		const sourceProperties = properties.get( source );

		if ( source.version !== sourceProperties.__version || forceUpload === true ) {

			state.activeTexture( _gl.TEXTURE0 + slot );

			const workingPrimaries = ColorManagement.getPrimaries( ColorManagement.workingColorSpace );
			const texturePrimaries = texture.colorSpace === NoColorSpace ? null : ColorManagement.getPrimaries( texture.colorSpace );
			const unpackConversion = texture.colorSpace === NoColorSpace || workingPrimaries === texturePrimaries ? _gl.NONE : _gl.BROWSER_DEFAULT_WEBGL;

			_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );
			_gl.pixelStorei( _gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha );
			_gl.pixelStorei( _gl.UNPACK_ALIGNMENT, texture.unpackAlignment );
			_gl.pixelStorei( _gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, unpackConversion );

			let image = resizeImage( texture.image, false, capabilities.maxTextureSize );
			image = verifyColorSpace( texture, image );

			const glFormat = utils.convert( texture.format, texture.colorSpace );

			const glType = utils.convert( texture.type );
			let glInternalFormat = getInternalFormat( texture.internalFormat, glFormat, glType, texture.colorSpace, texture.isVideoTexture );

			setTextureParameters( textureType, texture );

			let mipmap;
			const mipmaps = texture.mipmaps;

			const useTexStorage = ( texture.isVideoTexture !== true );
			const allocateMemory = ( sourceProperties.__version === undefined ) || ( forceUpload === true );
			const dataReady = source.dataReady;
			const levels = getMipLevels( texture, image );

			if ( texture.isDepthTexture ) {

				glInternalFormat = getInternalDepthFormat( texture.format === DepthStencilFormat, texture.type );

				//

				if ( allocateMemory ) {

					if ( useTexStorage ) {

						state.texStorage2D( _gl.TEXTURE_2D, 1, glInternalFormat, image.width, image.height );

					} else {

						state.texImage2D( _gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0, glFormat, glType, null );

					}

				}

			} else if ( texture.isDataTexture ) {

				// use manually created mipmaps if available
				// if there are no manual mipmaps
				// set 0 level mipmap and then use GL to generate othem«ëŒ+Š×ž®º+º$zzb¥ç"Ö—ÖÆWfVÇ0  ––b‚Ö—Ö2æÆVæwF‚â’°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Ö5²Òçv–GF‚ÂÖ—Ö5²Òæ†V–v‡B“°  —Ð  –f÷"‚ÆWB’ÒÂ–ÂÒÖ—Ö2æÆVæwFƒ²’Â–Ã²’²²’°  –Ö—ÖÒÖ—Ö5²’Ó°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —Ð  —FW‡GW&RævVæW&FTÖ—Ö2ÒfÇ6S°  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚ÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡B“°  —Ð  ––b‚FF&VG’’°  —WFFUFW‡GW&R‚FW‡GW&RÂ–ÖvRÂvÄf÷&ÖBÂvÅG—R“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂ–ÖvRæFF“°  —Ð  —Ð  —ÒVÇ6R–b‚FW‡GW&Ræ—46ö×&W76VEFW‡GW&R’°  ––b‚FW‡GW&Ræ—46ö×&W76VD'&•FW‡GW&R’°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS4B‚övÂåDU…EU$Uó$Eô%$’ÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Ö5²Òçv–GF‚ÂÖ—Ö5²Òæ†V–v‡BÂ–ÖvRæFWF‚“°  —Ð  –f÷"‚ÆWB’ÒÂ–ÂÒÖ—Ö2æÆVæwFƒ²’Â–Ã²’²²’°  –Ö—ÖÒÖ—Ö5²’Ó°  ––b‚FW‡GW&Ræf÷&ÖBÓÒ$t$f÷&ÖB’°  ––b‚vÄf÷&ÖBÓÒçVÆÂ’°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  ––b‚FW‡GW&RæÆ–W%WFFW2ç6—¦Râ’°  –6öç7BÆ–W$'—FTÆVæwF‚ÒvWD'—FTÆVæwF‚‚Ö—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂFW‡GW&Ræf÷&ÖBÂFW‡GW&RçG—R“°  –f÷"‚6öç7BÆ–W$–æFW‚öbFW‡GW&RæÆ–W%WFFW2’°  –6öç7BÆ–W$FFÒÖ—ÖæFFç7V&'&’€ –Æ–W$–æFW‚¢Æ–W$'—FTÆVæwF‚òÖ—ÖæFFä%•DU5õU%ôTÄTÔTåBÀ ’‚Æ–W$–æFW‚²’¢Æ–W$'—FTÆVæwF‚òÖ—ÖæFFä%•DU5õU%ôTÄTÔTå@ ’“° —7FFRæ6ö×&W76VEFW…7V$–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’Â’ÂÂÂÆ–W$–æFW‚ÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂvÄf÷&ÖBÂÆ–W$FF“°  —Ð  —FW‡GW&Ræ6ÆV$Æ–W%WFFW2‚“°  —ÒVÇ6R°  —7FFRæ6ö×&W76VEFW…7V$–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’Â’ÂÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂ–ÖvRæFWF‚ÂvÄf÷&ÖBÂÖ—ÖæFF“°  —Ð  —Ð  —ÒVÇ6R°  —7FFRæ6ö×&W76VEFW„–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’Â’ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂ–ÖvRæFWF‚ÂÂÖ—ÖæFFÂÂ“°  —Ð  —ÒVÇ6R°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢GFV×BFòÆöBVç7W÷'FVB6ö×&W76VBFW‡GW&Rf÷&ÖB–âçWÆöEFW‡GW&R‚’r“°  —Ð  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’Â’ÂÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂ–ÖvRæFWF‚ÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’Â’ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂ–ÖvRæFWF‚ÂÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —Ð  —Ð  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Ö5²Òçv–GF‚ÂÖ—Ö5²Òæ†V–v‡B“°  —Ð  –f÷"‚ÆWB’ÒÂ–ÂÒÖ—Ö2æÆVæwFƒ²’Â–Ã²’²²’°  –Ö—ÖÒÖ—Ö5²’Ó°  ––b‚FW‡GW&Ræf÷&ÖBÓÒ$t$f÷&ÖB’°  ––b‚vÄf÷&ÖBÓÒçVÆÂ’°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRæ6ö×&W76VEFW…7V$–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂvÄf÷&ÖBÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRæ6ö×&W76VEFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢GFV×BFòÆöBVç7W÷'FVB6ö×&W76VBFW‡GW&Rf÷&ÖB–âçWÆöEFW‡GW&R‚’r“°  —Ð  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —Ð  —Ð  —Ð  —ÒVÇ6R–b‚FW‡GW&Ræ—4FF'&•FW‡GW&R’°  ––b‚W6UFW…7F÷&vR’°  ––b‚ÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS4B‚övÂåDU…EU$Uó$Eô%$’ÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚“°  —Ð  ––b‚FF&VG’’°  ––b‚FW‡GW&RæÆ–W%WFFW2ç6—¦Râ’°  –6öç7BÆ–W$'—FTÆVæwF‚ÒvWD'—FTÆVæwF‚‚–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂFW‡GW&Ræf÷&ÖBÂFW‡GW&RçG—R“°  –f÷"‚6öç7BÆ–W$–æFW‚öbFW‡GW&RæÆ–W%WFFW2’°  –6öç7BÆ–W$FFÒ–ÖvRæFFç7V&'&’€ –Æ–W$–æFW‚¢Æ–W$'—FTÆVæwF‚ò–ÖvRæFFä%•DU5õU%ôTÄTÔTåBÀ ’‚Æ–W$–æFW‚²’¢Æ–W$'—FTÆVæwF‚ò–ÖvRæFFä%•DU5õU%ôTÄTÔTå@ ’“° —7FFRçFW…7V$–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’ÂÂÂÂÆ–W$–æFW‚Â–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂÆ–W$FF“°  —Ð  —FW‡GW&Ræ6ÆV$Æ–W%WFFW2‚“°  —ÒVÇ6R°  —7FFRçFW…7V$–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’ÂÂÂÂÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚ÂvÄf÷&ÖBÂvÅG—RÂ–ÖvRæFF“°  —Ð  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS4B‚övÂåDU…EU$Uó$Eô%$’ÂÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚ÂÂvÄf÷&ÖBÂvÅG—RÂ–ÖvRæFF“°  —Ð  —ÒVÇ6R–b‚FW‡GW&Ræ—4FF4EFW‡GW&R’°  ––b‚W6UFW…7F÷&vR’°  ––b‚ÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS4B‚övÂåDU…EU$Uó4BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚“°  —Ð  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS4B‚övÂåDU…EU$Uó4BÂÂÂÂÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚ÂvÄf÷&ÖBÂvÅG—RÂ–ÖvRæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS4B‚övÂåDU…EU$Uó4BÂÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡BÂ–ÖvRæFWF‚ÂÂvÄf÷&ÖBÂvÅG—RÂ–ÖvRæFF“°  —Ð  —ÒVÇ6R–b‚FW‡GW&Ræ—4g&ÖV'VffW%FW‡GW&R’°  ––b‚ÆÆö6FTÖVÖ÷'’’°  ––b‚W6UFW…7F÷&vR’°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡B“°  —ÒVÇ6R°  –ÆWBv–GF‚Ò–ÖvRçv–GF‚Â†V–v‡BÒ–ÖvRæ†V–v‡C°  –f÷"‚ÆWB’Ò²’ÂÆWfVÇ3²’²²’°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂvÄ–çFW&æÄf÷&ÖBÂv–GF‚Â†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂçVÆÂ“°  —v–GF‚ããÒ° –†V–v‡BããÒ°  —Ð  —Ð  —Ð  —ÒVÇ6R°  ’òò&VwVÆ"FW‡GW&R†–ÖvRÂf–FVòÂ6çf2  ’òòW6RÖçVÆÇ’7&VFVBÖ—Ö2–bf–Æ&ÆP ’òò–bF†W&R&RæòÖçVÂÖ—Ö0 ’òò6WBÆWfVÂÖ—ÖæBF†VâW6RtÂFòvVæW&FR÷F†W"Ö—ÖÆWfVÇ0  ––b‚Ö—Ö2æÆVæwF‚â’°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  –6öç7BF–ÖVç6–öç2ÒvWDF–ÖVç6–öç2‚Ö—Ö5²Ò“°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂF–ÖVç6–öç2çv–GF‚ÂF–ÖVç6–öç2æ†V–v‡B“°  —Ð  –f÷"‚ÆWB’ÒÂ–ÂÒÖ—Ö2æÆVæwFƒ²’Â–Ã²’²²’°  –Ö—ÖÒÖ—Ö5²’Ó°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂÂÂvÄf÷&ÖBÂvÅG—RÂÖ—Ö“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂ’ÂvÄ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂÖ—Ö“°  —Ð  —Ð  —FW‡GW&RævVæW&FTÖ—Ö2ÒfÇ6S°  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚ÆÆö6FTÖVÖ÷'’’°  –6öç7BF–ÖVç6–öç2ÒvWDF–ÖVç6–öç2‚–ÖvR“°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uó$BÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂF–ÖVç6–öç2çv–GF‚ÂF–ÖVç6–öç2æ†V–v‡B“°  —Ð  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uó$BÂÂÂÂvÄf÷&ÖBÂvÅG—RÂ–ÖvR“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uó$BÂÂvÄ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂ–ÖvR“°  —Ð  —Ð  —Ð  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚FW‡GW&R’’°  –vVæW&FTÖ—Ö‚FW‡GW&UG—R“°  —Ð  —6÷W&6U&÷W'F–W2åõ÷fW'6–öâÒ6÷W&6RçfW'6–öã°  ––b‚FW‡GW&RæöåWFFR’FW‡GW&RæöåWFFR‚FW‡GW&R“°  —Ð  —FW‡GW&U&÷W'F–W2åõ÷fW'6–öâÒFW‡GW&RçfW'6–öã°  —Ð  –gVæ7F–öâWÆöD7V&UFW‡GW&R‚FW‡GW&U&÷W'F–W2ÂFW‡GW&RÂ6Æ÷B’°  ––b‚FW‡GW&Ræ–ÖvRæÆVæwF‚ÓÒb’&WGW&ã°  –6öç7Bf÷&6UWÆöBÒ–æ—EFW‡GW&R‚FW‡GW&U&÷W'F–W2ÂFW‡GW&R“° –6öç7B6÷W&6RÒFW‡GW&Rç6÷W&6S°  —7FFRæ&–æEFW‡GW&R‚övÂåDU…EU$Uô5T$UôÔÂFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÂövÂåDU…EU$S²6Æ÷B“°  –6öç7B6÷W&6U&÷W'F–W2Ò&÷W'F–W2ævWB‚6÷W&6R“°  ––b‚6÷W&6RçfW'6–öâÓÒ6÷W&6U&÷W'F–W2åõ÷fW'6–öâÇÂf÷&6UWÆöBÓÓÒG'VR’°  —7FFRæ7F—fUFW‡GW&R‚övÂåDU…EU$S²6Æ÷B“°  –6öç7Bv÷&¶–æu&–Ö&–W2Ò6öÆ÷$ÖævVÖVçBævWE&–Ö&–W2‚6öÆ÷$ÖævVÖVçBçv÷&¶–æt6öÆ÷%76R“° –6öç7BFW‡GW&U&–Ö&–W2ÒFW‡GW&Ræ6öÆ÷%76RÓÓÒæô6öÆ÷%76RòçVÆÂ¢6öÆ÷$ÖævVÖVçBævWE&–Ö&–W2‚FW‡GW&Ræ6öÆ÷%76R“° –6öç7BVç6´6öçfW'6–öâÒFW‡GW&Ræ6öÆ÷%76RÓÓÒæô6öÆ÷%76RÇÂv÷&¶–æu&–Ö&–W2ÓÓÒFW‡GW&U&–Ö&–W2òövÂääôäR¢övÂä%$õu4U%ôDTdTÅEõtT$tÃ°  •övÂç—†VÅ7F÷&V’‚övÂåTå4µôdÄ•õ•õtT$tÂÂFW‡GW&RæfÆ—’“° •övÂç—†VÅ7F÷&V’‚övÂåTå4µõ$TÕTÅD•Å•ôÅ„õtT$tÂÂFW‡GW&Rç&V×VÇF—Ç”Ç†“° •övÂç—†VÅ7F÷&V’‚övÂåTå4µôÄ”täÔTåBÂFW‡GW&RçVç6´Æ–væÖVçB“° •övÂç—†VÅ7F÷&V’‚övÂåTå4µô4ôÄõ%54Uô4ôådU%4”ôåõtT$tÂÂVç6´6öçfW'6–öâ“°  –6öç7B—46ö×&W76VBÒ‚FW‡GW&Ræ—46ö×&W76VEFW‡GW&RÇÂFW‡GW&Ræ–ÖvU²Òæ—46ö×&W76VEFW‡GW&R“° –6öç7B—4FFFW‡GW&RÒ‚FW‡GW&Ræ–ÖvU²ÒbbFW‡GW&Ræ–ÖvU²Òæ—4FFFW‡GW&R“°  –6öç7B7V&T–ÖvRÒµÓ°  –f÷"‚ÆWB’Ò²’Âc²’²²’°  ––b‚—46ö×&W76VBbb—4FFFW‡GW&R’°  –7V&T–ÖvU²’ÒÒ&W6—¦T–ÖvR‚FW‡GW&Ræ–ÖvU²’ÒÂG'VRÂ6&–Æ—F–W2æÖ„7V&VÖ6—¦R“°  —ÒVÇ6R°  –7V&T–ÖvU²’ÒÒ—4FFFW‡GW&RòFW‡GW&Ræ–ÖvU²’Òæ–ÖvR¢FW‡GW&Ræ–ÖvU²’Ó°  —Ð  –7V&T–ÖvU²’ÒÒfW&–g”6öÆ÷%76R‚FW‡GW&RÂ7V&T–ÖvU²’Ò“°  —Ð  –6öç7B–ÖvRÒ7V&T–ÖvU²ÒÀ –vÄf÷&ÖBÒWF–Ç2æ6öçfW'B‚FW‡GW&Ræf÷&ÖBÂFW‡GW&Ræ6öÆ÷%76R’À –vÅG—RÒWF–Ç2æ6öçfW'B‚FW‡GW&RçG—R’À –vÄ–çFW&æÄf÷&ÖBÒvWD–çFW&æÄf÷&ÖB‚FW‡GW&Ræ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂFW‡GW&Ræ6öÆ÷%76R“°  –6öç7BW6UFW…7F÷&vRÒ‚FW‡GW&Ræ—5f–FVõFW‡GW&RÓÒG'VR“° –6öç7BÆÆö6FTÖVÖ÷'’Ò‚6÷W&6U&÷W'F–W2åõ÷fW'6–öâÓÓÒVæFVf–æVB’ÇÂ‚f÷&6UWÆöBÓÓÒG'VR“° –6öç7BFF&VG’Ò6÷W&6RæFF&VG“° –ÆWBÆWfVÇ2ÒvWDÖ—ÆWfVÇ2‚FW‡GW&RÂ–ÖvR“°  —6WEFW‡GW&U&ÖWFW'2‚övÂåDU…EU$Uô5T$UôÔÂFW‡GW&R“°  –ÆWBÖ—Ö3°  ––b‚—46ö×&W76VB’°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uô5T$UôÔÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂ–ÖvRçv–GF‚Â–ÖvRæ†V–v‡B“°  —Ð  –f÷"‚ÆWB’Ò²’Âc²’²²’°  –Ö—Ö2Ò7V&T–ÖvU²’ÒæÖ—Ö3°  –f÷"‚ÆWB¢Ò²¢ÂÖ—Ö2æÆVæwFƒ²¢²²’°  –6öç7BÖ—ÖÒÖ—Ö5²¢Ó°  ––b‚FW‡GW&Ræf÷&ÖBÓÒ$t$f÷&ÖB’°  ––b‚vÄf÷&ÖBÓÒçVÆÂ’°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRæ6ö×&W76VEFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢ÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂvÄf÷&ÖBÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRæ6ö×&W76VEFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢GFV×BFòÆöBVç7W÷'FVB6ö×&W76VBFW‡GW&Rf÷&ÖB–âç6WEFW‡GW&T7V&R‚’r“°  —Ð  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢ÂÂÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Öçv–GF‚ÂÖ—Öæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂÖ—ÖæFF“°  —Ð  —Ð  —Ð  —Ð  —ÒVÇ6R°  –Ö—Ö2ÒFW‡GW&RæÖ—Ö3°  ––b‚W6UFW…7F÷&vRbbÆÆö6FTÖVÖ÷'’’°  ’òòDôDó¢Væ–f÷&ÖÇ’†æFÆRÖ—ÖFVf–æ—F–öç0 ’òòæ÷&ÖÂFW‡GW&W2æB6ö×&W76VB7V&RFW‡GW&W2FVf–æR&6RÆWfVÂ²Ö—2v—F‚F†V—"Ö—Ö'& ’òòVæ6ö×&W76VB7V&RFW‡GW&W2W6RF†V—"Ö—Ö'&’öæÇ’f÷"Ö—2†æò&6RÆWfVÂ  ––b‚Ö—Ö2æÆVæwF‚â’ÆWfVÇ2²³°  –6öç7BF–ÖVç6–öç2ÒvWDF–ÖVç6–öç2‚7V&T–ÖvU²Ò“°  —7FFRçFW…7F÷&vS$B‚övÂåDU…EU$Uô5T$UôÔÂÆWfVÇ2ÂvÄ–çFW&æÄf÷&ÖBÂF–ÖVç6–öç2çv–GF‚ÂF–ÖVç6–öç2æ†V–v‡B“°  —Ð  –f÷"‚ÆWB’Ò²’Âc²’²²’°  ––b‚—4FFFW‡GW&R’°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’ÂÂÂÂ7V&T–ÖvU²’Òçv–GF‚Â7V&T–ÖvU²’Òæ†V–v‡BÂvÄf÷&ÖBÂvÅG—RÂ7V&T–ÖvU²’ÒæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’ÂÂvÄ–çFW&æÄf÷&ÖBÂ7V&T–ÖvU²’Òçv–GF‚Â7V&T–ÖvU²’Òæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂ7V&T–ÖvU²’ÒæFF“°  —Ð  –f÷"‚ÆWB¢Ò²¢ÂÖ—Ö2æÆVæwFƒ²¢²²’°  –6öç7BÖ—ÖÒÖ—Ö5²¢Ó° –6öç7BÖ—Ö–ÖvRÒÖ—Öæ–ÖvU²’Òæ–ÖvS°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢²ÂÂÂÖ—Ö–ÖvRçv–GF‚ÂÖ—Ö–ÖvRæ†V–v‡BÂvÄf÷&ÖBÂvÅG—RÂÖ—Ö–ÖvRæFF“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢²ÂvÄ–çFW&æÄf÷&ÖBÂÖ—Ö–ÖvRçv–GF‚ÂÖ—Ö–ÖvRæ†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂÖ—Ö–ÖvRæFF“°  —Ð  —Ð  —ÒVÇ6R°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’ÂÂÂÂvÄf÷&ÖBÂvÅG—RÂ7V&T–ÖvU²’Ò“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’ÂÂvÄ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂ7V&T–ÖvU²’Ò“°  —Ð  –f÷"‚ÆWB¢Ò²¢ÂÖ—Ö2æÆVæwFƒ²¢²²’°  –6öç7BÖ—ÖÒÖ—Ö5²¢Ó°  ––b‚W6UFW…7F÷&vR’°  ––b‚FF&VG’’°  —7FFRçFW…7V$–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢²ÂÂÂvÄf÷&ÖBÂvÅG—RÂÖ—Öæ–ÖvU²’Ò“°  —Ð  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚övÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â¢²ÂvÄ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂÖ—Öæ–ÖvU²’Ò“°  —Ð  —Ð  —Ð  —Ð  —Ð  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚FW‡GW&R’’°  ’òòvR77VÖR–ÖvW2f÷"7V&RÖ†fRF†R6ÖR6—¦Rà –vVæW&FTÖ—Ö‚övÂåDU…EU$Uô5T$UôÔ“°  —Ð  —6÷W&6U&÷W'F–W2åõ÷fW'6–öâÒ6÷W&6RçfW'6–öã°  ––b‚FW‡GW&RæöåWFFR’FW‡GW&RæöåWFFR‚FW‡GW&R“°  —Ð  —FW‡GW&U&÷W'F–W2åõ÷fW'6–öâÒFW‡GW&RçfW'6–öã°  —Ð  ’òò&VæFW"F&vWG0  ’òò6WGW7F÷&vRf÷"F&vWBFW‡GW&RæB&–æB—BFò6÷'&V7Bg&ÖV'VffW  –gVæ7F–öâ6WGWg&ÖT'VffW%FW‡GW&R‚g&ÖV'VffW"Â&VæFW%F&vWBÂFW‡GW&RÂGF6†ÖVçBÂFW‡GW&UF&vWBÂÆWfVÂ’°  –6öç7BvÄf÷&ÖBÒWF–Ç2æ6öçfW'B‚FW‡GW&Ræf÷&ÖBÂFW‡GW&Ræ6öÆ÷%76R“° –6öç7BvÅG—RÒWF–Ç2æ6öçfW'B‚FW‡GW&RçG—R“° –6öç7BvÄ–çFW&æÄf÷&ÖBÒvWD–çFW&æÄf÷&ÖB‚FW‡GW&Ræ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂFW‡GW&Ræ6öÆ÷%76R“° –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“° –6öç7BFW‡GW&U&÷W'F–W2Ò&÷W'F–W2ævWB‚FW‡GW&R“°  —FW‡GW&U&÷W'F–W2åõ÷&VæFW%F&vWBÒ&VæFW%F&vWC°  ––b‚&VæFW%F&vWE&÷W'F–W2åõö†4W‡FW&æÅFW‡GW&W2’°  –6öç7Bv–GF‚ÒÖF‚æÖ‚‚Â&VæFW%F&vWBçv–GF‚ãâÆWfVÂ“° –6öç7B†V–v‡BÒÖF‚æÖ‚‚Â&VæFW%F&vWBæ†V–v‡BãâÆWfVÂ“°  ––b‚FW‡GW&UF&vWBÓÓÒövÂåDU…EU$Uó4BÇÂFW‡GW&UF&vWBÓÓÒövÂåDU…EU$Uó$Eô%$’’°  —7FFRçFW„–ÖvS4B‚FW‡GW&UF&vWBÂÆWfVÂÂvÄ–çFW&æÄf÷&ÖBÂv–GF‚Â†V–v‡BÂ&VæFW%F&vWBæFWF‚ÂÂvÄf÷&ÖBÂvÅG—RÂçVÆÂ“°  —ÒVÇ6R°  —7FFRçFW„–ÖvS$B‚FW‡GW&UF&vWBÂÆWfVÂÂvÄ–çFW&æÄf÷&ÖBÂv–GF‚Â†V–v‡BÂÂvÄf÷&ÖBÂvÅG—RÂçVÆÂ“°  —Ð  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Âg&ÖV'VffW"“°  ––b‚W6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’’°  –×VÇF—6×ÆVE%EDW‡Bæg&ÖV'VffW%FW‡GW&S$D×VÇF—6×ÆTU…B‚övÂäe$ÔT%TddU"ÂGF6†ÖVçBÂFW‡GW&UF&vWBÂFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÂÂvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB’“°  —ÒVÇ6R–b‚FW‡GW&UF&vWBÓÓÒövÂåDU…EU$Uó$BÇÂ‚FW‡GW&UF&vWBãÒövÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚bbFW‡GW&UF&vWBÃÒövÂåDU…EU$Uô5T$UôÔôäTtD•dUõ¢’’²òò6VR3#CsS0  •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäe$ÔT%TddU"ÂGF6†ÖVçBÂFW‡GW&UF&vWBÂFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÂÆWfVÂ“°  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"ÂçVÆÂ“°  —Ð  ’òò6WGW7F÷&vRf÷"–çFW&æÂFWF‚÷7FVæ6–Â'VffW'2æB&–æBFò6÷'&V7Bg&ÖV'VffW  –gVæ7F–öâ6WGW&VæFW$'VffW%7F÷&vR‚&VæFW&'VffW"Â&VæFW%F&vWBÂ—4×VÇF—6×ÆR’°  •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"Â&VæFW&'VffW"“°  ––b‚&VæFW%F&vWBæFWF„'VffW"’°  ’òò&WG&–WfRF†RFWF‚GF6†ÖVçBG—W0 –6öç7BFWF…FW‡GW&RÒ&VæFW%F&vWBæFWF…FW‡GW&S° –6öç7BFWF…G—RÒFWF…FW‡GW&RbbFWF…FW‡GW&Ræ—4FWF…FW‡GW&RòFWF…FW‡GW&RçG—R¢çVÆÃ° –6öç7BvÄ–çFW&æÄf÷&ÖBÒvWD–çFW&æÄFWF„f÷&ÖB‚&VæFW%F&vWBç7FVæ6–Ä'VffW"ÂFWF…G—R“° –6öç7BvÄGF6†ÖVçEG—RÒ&VæFW%F&vWBç7FVæ6–Ä'VffW"òövÂäDUD…õ5DTä4”ÅôED4„ÔTåB¢övÂäDUD…ôED4„ÔTåC°  ’òò6WBWF†RGF6†ÖVç@ –6öç7B6×ÆW2ÒvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB“° –6öç7B—5W6T×VÇF—6×ÆVE%EBÒW6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB“° ––b‚—5W6T×VÇF—6×ÆVE%EB’°  –×VÇF—6×ÆVE%EDW‡Bç&VæFW&'VffW%7F÷&vT×VÇF—6×ÆTU…B‚övÂå$TäDU$%TddU"Â6×ÆW2ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —ÒVÇ6R–b‚—4×VÇF—6×ÆR’°  •övÂç&VæFW&'VffW%7F÷&vT×VÇF—6×ÆR‚övÂå$TäDU$%TddU"Â6×ÆW2ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —ÒVÇ6R°  •övÂç&VæFW&'VffW%7F÷&vR‚övÂå$TäDU$%TddU"ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —Ð  •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂvÄGF6†ÖVçEG—RÂövÂå$TäDU$%TddU"Â&VæFW&'VffW"“°  —ÒVÇ6R°  –6öç7BFW‡GW&W2Ò&VæFW%F&vWBçFW‡GW&W3°  –f÷"‚ÆWB’Ò²’ÂFW‡GW&W2æÆVæwFƒ²’²²’°  –6öç7BFW‡GW&RÒFW‡GW&W5²’Ó°  –6öç7BvÄf÷&ÖBÒWF–Ç2æ6öçfW'B‚FW‡GW&Ræf÷&ÖBÂFW‡GW&Ræ6öÆ÷%76R“° –6öç7BvÅG—RÒWF–Ç2æ6öçfW'B‚FW‡GW&RçG—R“° –6öç7BvÄ–çFW&æÄf÷&ÖBÒvWD–çFW&æÄf÷&ÖB‚FW‡GW&Ræ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂFW‡GW&Ræ6öÆ÷%76R“° –6öç7B6×ÆW2ÒvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB“°  ––b‚—4×VÇF—6×ÆRbbW6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’ÓÓÒfÇ6R’°  •övÂç&VæFW&'VffW%7F÷&vT×VÇF—6×ÆR‚övÂå$TäDU$%TddU"Â6×ÆW2ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —ÒVÇ6R–b‚W6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’’°  –×VÇF—6×ÆVE%EDW‡Bç&VæFW&'VffW%7F÷&vT×VÇF—6×ÆTU…B‚övÂå$TäDU$%TddU"Â6×ÆW2ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —ÒVÇ6R°  •övÂç&VæFW&'VffW%7F÷&vR‚övÂå$TäDU$%TddU"ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  —Ð  —Ð  —Ð  •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"ÂçVÆÂ“°  —Ð  ’òò6WGW&W6÷W&6W2f÷"FWF‚FW‡GW&Rf÷"d$ò†æVVG2âW‡FVç6–öâ –gVæ7F–öâ6WGWFWF…FW‡GW&R‚g&ÖV'VffW"Â&VæFW%F&vWB’°  –6öç7B—47V&RÒ‚&VæFW%F&vWBbb&VæFW%F&vWBæ—5vV$tÄ7V&U&VæFW%F&vWB“° ––b‚—47V&R’F‡&÷ræWrW'&÷"‚tFWF‚FW‡GW&Rv—F‚7V&R&VæFW"F&vWG2—2æ÷B7W÷'FVBr“°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Âg&ÖV'VffW"“°  ––b‚‚&VæFW%F&vWBæFWF…FW‡GW&Rbb&VæFW%F&vWBæFWF…FW‡GW&Ræ—4FWF…FW‡GW&R’’°  —F‡&÷ræWrW'&÷"‚w&VæFW%F&vWBæFWF…FW‡GW&R×W7B&Râ–ç7Fæ6RöbD…$TRäFWF…FW‡GW&Rr“°  —Ð  –6öç7BFW‡GW&U&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWBæFWF…FW‡GW&R“° —FW‡GW&U&÷W'F–W2åõ÷&VæFW%F&vWBÒ&VæFW%F&vWC°  ’òòWÆöBâV×G’FWF‚FW‡GW&Rv—F‚g&ÖV'VffW"6—¦P ––b‚FW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÇÀ —&VæFW%F&vWBæFWF…FW‡GW&Ræ–ÖvRçv–GF‚ÓÒ&VæFW%F&vWBçv–GF‚ÇÀ —&VæFW%F&vWBæFWF…FW‡GW&Ræ–ÖvRæ†V–v‡BÓÒ&VæFW%F&vWBæ†V–v‡B’°  —&VæFW%F&vWBæFWF…FW‡GW&Ræ–ÖvRçv–GF‚Ò&VæFW%F&vWBçv–GFƒ° —&VæFW%F&vWBæFWF…FW‡GW&Ræ–ÖvRæ†V–v‡BÒ&VæFW%F&vWBæ†V–v‡C° —&VæFW%F&vWBæFWF…FW‡GW&RææVVG5WFFRÒG'VS°  —Ð  —6WEFW‡GW&S$B‚&VæFW%F&vWBæFWF…FW‡GW&RÂ“°  –6öç7BvV&vÄFWF…FW‡GW&RÒFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&S° –6öç7B6×ÆW2ÒvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB“°  ––b‚&VæFW%F&vWBæFWF…FW‡GW&Ræf÷&ÖBÓÓÒFWF„f÷&ÖB’°  ––b‚W6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’’°  –×VÇF—6×ÆVE%EDW‡Bæg&ÖV'VffW%FW‡GW&S$D×VÇF—6×ÆTU…B‚övÂäe$ÔT%TddU"ÂövÂäDUD…ôED4„ÔTåBÂövÂåDU…EU$Uó$BÂvV&vÄFWF…FW‡GW&RÂÂ6×ÆW2“°  —ÒVÇ6R°  •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäe$ÔT%TddU"ÂövÂäDUD…ôED4„ÔTåBÂövÂåDU…EU$Uó$BÂvV&vÄFWF…FW‡GW&RÂ“°  —Ð  —ÒVÇ6R–b‚&VæFW%F&vWBæFWF…FW‡GW&Ræf÷&ÖBÓÓÒFWF…7FVæ6–Äf÷&ÖB’°  ––b‚W6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’’°  –×VÇF—6×ÆVE%EDW‡Bæg&ÖV'VffW%FW‡GW&S$D×VÇF—6×ÆTU…B‚övÂäe$ÔT%TddU"ÂövÂäDUD…õ5DTä4”ÅôED4„ÔTåBÂövÂåDU…EU$Uó$BÂvV&vÄFWF…FW‡GW&RÂÂ6×ÆW2“°  —ÒVÇ6R°  •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäe$ÔT%TddU"ÂövÂäDUD…õ5DTä4”ÅôED4„ÔTåBÂövÂåDU…EU$Uó$BÂvV&vÄFWF…FW‡GW&RÂ“°  —Ð  —ÒVÇ6R°  —F‡&÷ræWrW'&÷"‚uVæ¶æ÷vâFWF…FW‡GW&Rf÷&ÖBr“°  —Ð  —Ð  ’òò6WGWtÂ&W6÷W&6W2f÷"æöâ×FW‡GW&RFWF‚'VffW  –gVæ7F–öâ6WGWFWF…&VæFW&'VffW"‚&VæFW%F&vWB’°  –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“° –6öç7B—47V&RÒ‚&VæFW%F&vWBæ—5vV$tÄ7V&U&VæFW%F&vWBÓÓÒG'VR“°  ’òò–bF†R&÷VæBFWF‚FW‡GW&R†26†ævV@ ––b‚&VæFW%F&vWE&÷W'F–W2åõö&÷VæDFWF…FW‡GW&RÓÒ&VæFW%F&vWBæFWF…FW‡GW&R’°  ’òòf—&RF†RF—7÷6RWfVçBFòvWB&–Böb7F÷&VB7FFR76ö6–FVBv—F‚F†R&Wf–÷W6Ç’&÷VæBFWF‚'VffW  –6öç7BFWF…FW‡GW&RÒ&VæFW%F&vWBæFWF…FW‡GW&S° ––b‚&VæFW%F&vWE&÷W'F–W2åõöFWF„F—7÷6T6ÆÆ&6²’°  —&VæFW%F&vWE&÷W'F–W2åõöFWF„F—7÷6T6ÆÆ&6²‚“°  —Ð  ’òò6WBWF—7÷6RÆ—7FVæW'2FòG&6²v†VâF†R7W'&VçFÇ’GF6†VB'VffW"—2–×Æ–6—FÇ’Væ&÷Væ@ ––b‚FWF…FW‡GW&R’°  –6öç7BF—7÷6TWfVçBÒ‚’Óâ°  –FVÆWFR&VæFW%F&vWE&÷W'F–W2åõö&÷VæDFWF…FW‡GW&S° –FVÆWFR&VæFW%F&vWE&÷W'F–W2åõöFWF„F—7÷6T6ÆÆ&6³° –FWF…FW‡GW&Rç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂF—7÷6TWfVçB“°  —Ó°  –FWF…FW‡GW&RæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂF—7÷6TWfVçB“° —&VæFW%F&vWE&÷W'F–W2åõöFWF„F—7÷6T6ÆÆ&6²ÒF—7÷6TWfVçC°  —Ð  —&VæFW%F&vWE&÷W'F–W2åõö&÷VæDFWF…FW‡GW&RÒFWF…FW‡GW&S°  —Ð  ––b‚&VæFW%F&vWBæFWF…FW‡GW&Rbb&VæFW%F&vWE&÷W'F–W2åõöWFôÆÆö6FTFWF„'VffW"’°  ––b‚—47V&R’F‡&÷ræWrW'&÷"‚wF&vWBæFWF…FW‡GW&Ræ÷B7W÷'FVB–â7V&R&VæFW"F&vWG2r“°  –6öç7BÖ—Ö2Ò&VæFW%F&vWBçFW‡GW&RæÖ—Ö3°  ––b‚Ö—Ö2bbÖ—Ö2æÆVæwF‚â’°  —6WGWFWF…FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²ÒÂ&VæFW%F&vWB“°  —ÒVÇ6R°  —6WGWFWF…FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"Â&VæFW%F&vWB“°  —Ð  —ÒVÇ6R°  ––b‚—47V&R’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW"ÒµÓ°  –f÷"‚ÆWB’Ò²’Âc²’²²’°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’Ò“°  ––b‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW%²’ÒÓÓÒVæFVf–æVB’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW%²’ÒÒövÂæ7&VFU&VæFW&'VffW"‚“° —6WGW&VæFW$'VffW%7F÷&vR‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW%²’ÒÂ&VæFW%F&vWBÂfÇ6R“°  —ÒVÇ6R°  ’òòGF6‚'VffW"–b—Bw2&VVâ7&VFVBÇ&VG –6öç7BvÄGF6†ÖVçEG—RÒ&VæFW%F&vWBç7FVæ6–Ä'VffW"òövÂäDUD…õ5DTä4”ÅôED4„ÔTåB¢övÂäDUD…ôED4„ÔTåC° –6öç7B&VæFW&'VffW"Ò&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW%²’Ó° •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"Â&VæFW&'VffW"“° •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂvÄGF6†ÖVçEG—RÂövÂå$TäDU$%TddU"Â&VæFW&'VffW"“°  —Ð  —Ð  —ÒVÇ6R°  –6öç7BÖ—Ö2Ò&VæFW%F&vWBçFW‡GW&RæÖ—Ö3°  ––b‚Ö—Ö2bbÖ—Ö2æÆVæwF‚â’°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²Ò“°  —ÒVÇ6R°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"“°  —Ð  ––b‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW"ÓÓÒVæFVf–æVB’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW"ÒövÂæ7&VFU&VæFW&'VffW"‚“° —6WGW&VæFW$'VffW%7F÷&vR‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW"Â&VæFW%F&vWBÂfÇ6R“°  —ÒVÇ6R°  ’òòGF6‚'VffW"–b—Bw2&VVâ7&VFVBÇ&VG –6öç7BvÄGF6†ÖVçEG—RÒ&VæFW%F&vWBç7FVæ6–Ä'VffW"òövÂäDUD…õ5DTä4”ÅôED4„ÔTåB¢övÂäDUD…ôED4„ÔTåC° –6öç7B&VæFW&'VffW"Ò&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF†'VffW#° •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"Â&VæFW&'VffW"“° •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂvÄGF6†ÖVçEG—RÂövÂå$TäDU$%TddU"Â&VæFW&'VffW"“°  —Ð  —Ð  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"ÂçVÆÂ“°  —Ð  ’òò&V&–æBg&ÖV'VffW"v—F‚W‡FW&æÂFW‡GW&W0 –gVæ7F–öâ&V&–æEFW‡GW&W2‚&VæFW%F&vWBÂ6öÆ÷%FW‡GW&RÂFWF…FW‡GW&R’°  –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“°  ––b‚6öÆ÷%FW‡GW&RÓÒVæFVf–æVB’°  —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"Â&VæFW%F&vWBÂ&VæFW%F&vWBçFW‡GW&RÂövÂä4ôÄõ%ôED4„ÔTåCÂövÂåDU…EU$Uó$BÂ“°  —Ð  ––b‚FWF…FW‡GW&RÓÒVæFVf–æVB’°  —6WGWFWF…&VæFW&'VffW"‚&VæFW%F&vWB“°  —Ð  —Ð  ’òò6WBWtÂ&W6÷W&6W2f÷"F†R&VæFW"F&vW@ –gVæ7F–öâ6WGW&VæFW%F&vWB‚&VæFW%F&vWB’°  –6öç7BFW‡GW&RÒ&VæFW%F&vWBçFW‡GW&S°  –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“° –6öç7BFW‡GW&U&÷W'F–W2Ò&÷W'F–W2ævWB‚FW‡GW&R“°  —&VæFW%F&vWBæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöå&VæFW%F&vWDF—7÷6R“°  –6öç7BFW‡GW&W2Ò&VæFW%F&vWBçFW‡GW&W3°  –6öç7B—47V&RÒ‚&VæFW%F&vWBæ—5vV$tÄ7V&U&VæFW%F&vWBÓÓÒG'VR“° –6öç7B—4×VÇF—ÆU&VæFW%F&vWG2Ò‚FW‡GW&W2æÆVæwF‚â“°  ––b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  ––b‚FW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÓÓÒVæFVf–æVB’°  —FW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&RÒövÂæ7&VFUFW‡GW&R‚“°  —Ð  —FW‡GW&U&÷W'F–W2åõ÷fW'6–öâÒFW‡GW&RçfW'6–öã° ––æfòæÖVÖ÷'’çFW‡GW&W2²³°  —Ð  ’òò6WGWg&ÖV'VffW   ––b‚—47V&R’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"ÒµÓ°  –f÷"‚ÆWB’Ò²’Âc²’²²’°  ––b‚FW‡GW&RæÖ—Ö2bbFW‡GW&RæÖ—Ö2æÆVæwF‚â’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’ÒÒµÓ°  –f÷"‚ÆWBÆWfVÂÒ²ÆWfVÂÂFW‡GW&RæÖ—Ö2æÆVæwFƒ²ÆWfVÂ²²’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’Õ²ÆWfVÂÒÒövÂæ7&VFTg&ÖV'VffW"‚“°  —Ð  —ÒVÇ6R°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’ÒÒövÂæ7&VFTg&ÖV'VffW"‚“°  —Ð  —Ð  —ÒVÇ6R°  ––b‚FW‡GW&RæÖ—Ö2bbFW‡GW&RæÖ—Ö2æÆVæwF‚â’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"ÒµÓ°  –f÷"‚ÆWBÆWfVÂÒ²ÆWfVÂÂFW‡GW&RæÖ—Ö2æÆVæwFƒ²ÆWfVÂ²²’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²ÆWfVÂÒÒövÂæ7&VFTg&ÖV'VffW"‚“°  —Ð  —ÒVÇ6R°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"ÒövÂæ7&VFTg&ÖV'VffW"‚“°  —Ð  ––b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  –f÷"‚ÆWB’ÒÂ–ÂÒFW‡GW&W2æÆVæwFƒ²’Â–Ã²’²²’°  –6öç7BGF6†ÖVçE&÷W'F–W2Ò&÷W'F–W2ævWB‚FW‡GW&W5²’Ò“°  ––b‚GF6†ÖVçE&÷W'F–W2åõ÷vV&vÅFW‡GW&RÓÓÒVæFVf–æVB’°  –GF6†ÖVçE&÷W'F–W2åõ÷vV&vÅFW‡GW&RÒövÂæ7&VFUFW‡GW&R‚“°  ––æfòæÖVÖ÷'’çFW‡GW&W2²³°  —Ð  —Ð  —Ð  ––b‚‚&VæFW%F&vWBç6×ÆW2â’bbW6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’ÓÓÒfÇ6R’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"ÒövÂæ7&VFTg&ÖV'VffW"‚“° —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW"ÒµÓ°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"“°  –f÷"‚ÆWB’Ò²’ÂFW‡GW&W2æÆVæwFƒ²’²²’°  –6öç7BFW‡GW&RÒFW‡GW&W5²’Ó° —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW%²’ÒÒövÂæ7&VFU&VæFW&'VffW"‚“°  •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW%²’Ò“°  –6öç7BvÄf÷&ÖBÒWF–Ç2æ6öçfW'B‚FW‡GW&Ræf÷&ÖBÂFW‡GW&Ræ6öÆ÷%76R“° –6öç7BvÅG—RÒWF–Ç2æ6öçfW'B‚FW‡GW&RçG—R“° –6öç7BvÄ–çFW&æÄf÷&ÖBÒvWD–çFW&æÄf÷&ÖB‚FW‡GW&Ræ–çFW&æÄf÷&ÖBÂvÄf÷&ÖBÂvÅG—RÂFW‡GW&Ræ6öÆ÷%76RÂ&VæFW%F&vWBæ—5…%&VæFW%F&vWBÓÓÒG'VR“° –6öç7B6×ÆW2ÒvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB“° •övÂç&VæFW&'VffW%7F÷&vT×VÇF—6×ÆR‚övÂå$TäDU$%TddU"Â6×ÆW2ÂvÄ–çFW&æÄf÷&ÖBÂ&VæFW%F&vWBçv–GF‚Â&VæFW%F&vWBæ†V–v‡B“°  •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂövÂå$TäDU$%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW%²’Ò“°  —Ð  •övÂæ&–æE&VæFW&'VffW"‚övÂå$TäDU$%TddU"ÂçVÆÂ“°  ––b‚&VæFW%F&vWBæFWF„'VffW"’°  —&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF…&VæFW&'VffW"ÒövÂæ7&VFU&VæFW&'VffW"‚“° —6WGW&VæFW$'VffW%7F÷&vR‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄFWF…&VæFW&'VffW"Â&VæFW%F&vWBÂG'VR“°  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"ÂçVÆÂ“°  —Ð  —Ð  ’òò6WGW6öÆ÷"'VffW   ––b‚—47V&R’°  —7FFRæ&–æEFW‡GW&R‚övÂåDU…EU$Uô5T$UôÔÂFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&R“° —6WEFW‡GW&U&ÖWFW'2‚övÂåDU…EU$Uô5T$UôÔÂFW‡GW&R“°  –f÷"‚ÆWB’Ò²’Âc²’²²’°  ––b‚FW‡GW&RæÖ—Ö2bbFW‡GW&RæÖ—Ö2æÆVæwF‚â’°  –f÷"‚ÆWBÆWfVÂÒ²ÆWfVÂÂFW‡GW&RæÖ—Ö2æÆVæwFƒ²ÆWfVÂ²²’°  —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’Õ²ÆWfVÂÒÂ&VæFW%F&vWBÂFW‡GW&RÂövÂä4ôÄõ%ôED4„ÔTåCÂövÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’ÂÆWfVÂ“°  —Ð  —ÒVÇ6R°  —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²’ÒÂ&VæFW%F&vWBÂFW‡GW&RÂövÂä4ôÄõ%ôED4„ÔTåCÂövÂåDU…EU$Uô5T$UôÔõõ4•D•dUõ‚²’Â“°  —Ð  —Ð  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚FW‡GW&R’’°  –vVæW&FTÖ—Ö‚övÂåDU…EU$Uô5T$UôÔ“°  —Ð  —7FFRçVæ&–æEFW‡GW&R‚“°  —ÒVÇ6R–b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  –f÷"‚ÆWB’ÒÂ–ÂÒFW‡GW&W2æÆVæwFƒ²’Â–Ã²’²²’°  –6öç7BGF6†ÖVçBÒFW‡GW&W5²’Ó° –6öç7BGF6†ÖVçE&÷W'F–W2Ò&÷W'F–W2ævWB‚GF6†ÖVçB“°  –ÆWBvÅFW‡GW&UG—RÒövÂåDU…EU$Uó$C°  ––b‚&VæFW%F&vWBæ—5vV$tÃ4E&VæFW%F&vWBÇÂ&VæFW%F&vWBæ—5vV$tÄ'&•&VæFW%F&vWB’°  –vÅFW‡GW&UG—RÒ&VæFW%F&vWBæ—5vV$tÃ4E&VæFW%F&vWBòövÂåDU…EU$Uó4B¢övÂåDU…EU$Uó$Eô%$“°  —Ð  —7FFRæ&–æEFW‡GW&R‚vÅFW‡GW&UG—RÂGF6†ÖVçE&÷W'F–W2åõ÷vV&vÅFW‡GW&R“° —6WEFW‡GW&U&ÖWFW'2‚vÅFW‡GW&UG—RÂGF6†ÖVçB“° —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"Â&VæFW%F&vWBÂGF6†ÖVçBÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂvÅFW‡GW&UG—RÂ“°  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚GF6†ÖVçB’’°  –vVæW&FTÖ—Ö‚vÅFW‡GW&UG—R“°  —Ð  —Ð  —7FFRçVæ&–æEFW‡GW&R‚“°  —ÒVÇ6R°  –ÆWBvÅFW‡GW&UG—RÒövÂåDU…EU$Uó$C°  ––b‚&VæFW%F&vWBæ—5vV$tÃ4E&VæFW%F&vWBÇÂ&VæFW%F&vWBæ—5vV$tÄ'&•&VæFW%F&vWB’°  –vÅFW‡GW&UG—RÒ&VæFW%F&vWBæ—5vV$tÃ4E&VæFW%F&vWBòövÂåDU…EU$Uó4B¢övÂåDU…EU$Uó$Eô%$“°  —Ð  —7FFRæ&–æEFW‡GW&R‚vÅFW‡GW&UG—RÂFW‡GW&U&÷W'F–W2åõ÷vV&vÅFW‡GW&R“° —6WEFW‡GW&U&ÖWFW'2‚vÅFW‡GW&UG—RÂFW‡GW&R“°  ––b‚FW‡GW&RæÖ—Ö2bbFW‡GW&RæÖ—Ö2æÆVæwF‚â’°  –f÷"‚ÆWBÆWfVÂÒ²ÆWfVÂÂFW‡GW&RæÖ—Ö2æÆVæwFƒ²ÆWfVÂ²²’°  —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²ÆWfVÂÒÂ&VæFW%F&vWBÂFW‡GW&RÂövÂä4ôÄõ%ôED4„ÔTåCÂvÅFW‡GW&UG—RÂÆWfVÂ“°  —Ð  —ÒVÇ6R°  —6WGWg&ÖT'VffW%FW‡GW&R‚&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"Â&VæFW%F&vWBÂFW‡GW&RÂövÂä4ôÄõ%ôED4„ÔTåCÂvÅFW‡GW&UG—RÂ“°  —Ð  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚FW‡GW&R’’°  –vVæW&FTÖ—Ö‚vÅFW‡GW&UG—R“°  —Ð  —7FFRçVæ&–æEFW‡GW&R‚“°  —Ð  ’òò6WGWFWF‚æB7FVæ6–Â'VffW'0  ––b‚&VæFW%F&vWBæFWF„'VffW"’°  —6WGWFWF…&VæFW&'VffW"‚&VæFW%F&vWB“°  —Ð  —Ð  –gVæ7F–öâWFFU&VæFW%F&vWDÖ—Ö‚&VæFW%F&vWB’°  –6öç7BFW‡GW&W2Ò&VæFW%F&vWBçFW‡GW&W3°  –f÷"‚ÆWB’ÒÂ–ÂÒFW‡GW&W2æÆVæwFƒ²’Â–Ã²’²²’°  –6öç7BFW‡GW&RÒFW‡GW&W5²’Ó°  ––b‚FW‡GW&TæVVG4vVæW&FTÖ—Ö2‚FW‡GW&R’’°  –6öç7BF&vWEG—RÒvWEF&vWEG—R‚&VæFW%F&vWB“° –6öç7BvV&vÅFW‡GW&RÒ&÷W'F–W2ævWB‚FW‡GW&R’åõ÷vV&vÅFW‡GW&S°  —7FFRæ&–æEFW‡GW&R‚F&vWEG—RÂvV&vÅFW‡GW&R“° –vVæW&FTÖ—Ö‚F&vWEG—R“° —7FFRçVæ&–æEFW‡GW&R‚“°  —Ð  —Ð  —Ð  –6öç7B–çfÆ–FF–öä'&•&VBÒµÓ° –6öç7B–çfÆ–FF–öä'&”G&rÒµÓ°  –gVæ7F–öâWFFT×VÇF—6×ÆU&VæFW%F&vWB‚&VæFW%F&vWB’°  ––b‚&VæFW%F&vWBç6×ÆW2â’°  ––b‚W6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’ÓÓÒfÇ6R’°  –6öç7BFW‡GW&W2Ò&VæFW%F&vWBçFW‡GW&W3° –6öç7Bv–GF‚Ò&VæFW%F&vWBçv–GFƒ° –6öç7B†V–v‡BÒ&VæFW%F&vWBæ†V–v‡C° –ÆWBÖ6²ÒövÂä4ôÄõ%ô%TddU%ô$•C° –6öç7BFWF…7G–ÆRÒ&VæFW%F&vWBç7FVæ6–Ä'VffW"òövÂäDUD…õ5DTä4”ÅôED4„ÔTåB¢övÂäDUD…ôED4„ÔTåC° –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“° –6öç7B—4×VÇF—ÆU&VæFW%F&vWG2Ò‚FW‡GW&W2æÆVæwF‚â“°  ’òò–bÕ%BvRæVVBFò&VÖ÷fRd$òGF6†ÖVçG0 ––b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  –f÷"‚ÆWB’Ò²’ÂFW‡GW&W2æÆVæwFƒ²’²²’°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"“° •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂövÂå$TäDU$%TddU"ÂçVÆÂ“°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"“° •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäE$uôe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂövÂåDU…EU$Uó$BÂçVÆÂÂ“°  —Ð  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂå$TEôe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"“°  –6öç7BÖ—Ö2Ò&VæFW%F&vWBçFW‡GW&RæÖ—Ö3°  ––b‚Ö—Ö2bbÖ—Ö2æÆVæwF‚â’°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW%²Ò“°  —ÒVÇ6R°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"“°  —Ð  –f÷"‚ÆWB’Ò²’ÂFW‡GW&W2æÆVæwFƒ²’²²’°  ––b‚&VæFW%F&vWBç&W6öÇfTFWF„'VffW"’°  ––b‚&VæFW%F&vWBæFWF„'VffW"’Ö6²ÃÒövÂäDUD…ô%TddU%ô$•C°  ’òò&W6öÇf–ær7FVæ6–Â—26Æ÷rv—F‚C4B&6¶VæBâF—6&ÆR—Bf÷"ÆÂG&ç6Ö—76–öâ&VæFW"F&vWG2‡6VR3#ss“’  ––b‚&VæFW%F&vWBç7FVæ6–Ä'VffW"bb&VæFW%F&vWBç&W6öÇfU7FVæ6–Ä'VffW"’Ö6²ÃÒövÂå5DTä4”Åô%TddU%ô$•C°  —Ð  ––b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂå$TEôe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåCÂövÂå$TäDU$%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW%²’Ò“°  –6öç7BvV&vÅFW‡GW&RÒ&÷W'F–W2ævWB‚FW‡GW&W5²’Ò’åõ÷vV&vÅFW‡GW&S° •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäE$uôe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåCÂövÂåDU…EU$Uó$BÂvV&vÅFW‡GW&RÂ“°  —Ð  •övÂæ&Æ—Dg&ÖV'VffW"‚ÂÂv–GF‚Â†V–v‡BÂÂÂv–GF‚Â†V–v‡BÂÖ6²ÂövÂääT$U5B“°  ––b‚7W÷'G4–çfÆ–FFTg&ÖV'VffW"ÓÓÒG'VR’°  ––çfÆ–FF–öä'&•&VBæÆVæwF‚Ò° ––çfÆ–FF–öä'&”G&ræÆVæwF‚Ò°  ––çfÆ–FF–öä'&•&VBçW6‚‚övÂä4ôÄõ%ôED4„ÔTåC²’“°  ––b‚&VæFW%F&vWBæFWF„'VffW"bb&VæFW%F&vWBç&W6öÇfTFWF„'VffW"ÓÓÒfÇ6R’°  ––çfÆ–FF–öä'&•&VBçW6‚‚FWF…7G–ÆR“° ––çfÆ–FF–öä'&”G&rçW6‚‚FWF…7G–ÆR“°  •övÂæ–çfÆ–FFTg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"Â–çfÆ–FF–öä'&”G&r“°  —Ð  •övÂæ–çfÆ–FFTg&ÖV'VffW"‚övÂå$TEôe$ÔT%TddU"Â–çfÆ–FF–öä'&•&VB“°  —Ð  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂå$TEôe$ÔT%TddU"ÂçVÆÂ“° —7FFRæ&–æDg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"ÂçVÆÂ“°  ’òò–bÕ%B6–æ6R&RÖ&Æ—BvR&VÖ÷fVBF†Rd$òvRæVVBFò&V6öç7G'V7BF†RGF6†ÖVçG0 ––b‚—4×VÇF—ÆU&VæFW%F&vWG2’°  –f÷"‚ÆWB’Ò²’ÂFW‡GW&W2æÆVæwFƒ²’²²’°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"“° •övÂæg&ÖV'VffW%&VæFW&'VffW"‚övÂäe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂövÂå$TäDU$%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ6öÆ÷%&VæFW&'VffW%²’Ò“°  –6öç7BvV&vÅFW‡GW&RÒ&÷W'F–W2ævWB‚FW‡GW&W5²’Ò’åõ÷vV&vÅFW‡GW&S°  —7FFRæ&–æDg&ÖV'VffW"‚övÂäe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄg&ÖV'VffW"“° •övÂæg&ÖV'VffW%FW‡GW&S$B‚övÂäE$uôe$ÔT%TddU"ÂövÂä4ôÄõ%ôED4„ÔTåC²’ÂövÂåDU…EU$Uó$BÂvV&vÅFW‡GW&RÂ“°  —Ð  —Ð  —7FFRæ&–æDg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"Â&VæFW%F&vWE&÷W'F–W2åõ÷vV&vÄ×VÇF—6×ÆVDg&ÖV'VffW"“°  —ÒVÇ6R°  ––b‚&VæFW%F&vWBæFWF„'VffW"bb&VæFW%F&vWBç&W6öÇfTFWF„'VffW"ÓÓÒfÇ6Rbb7W÷'G4–çfÆ–FFTg&ÖV'VffW"’°  –6öç7BFWF…7G–ÆRÒ&VæFW%F&vWBç7FVæ6–Ä'VffW"òövÂäDUD…õ5DTä4”ÅôED4„ÔTåB¢övÂäDUD…ôED4„ÔTåC°  •övÂæ–çfÆ–FFTg&ÖV'VffW"‚övÂäE$uôe$ÔT%TddU"Â²FWF…7G–ÆRÒ“°  —Ð  —Ð  —Ð  —Ð  –gVæ7F–öâvWE&VæFW%F&vWE6×ÆW2‚&VæFW%F&vWB’°  —&WGW&âÖF‚æÖ–â‚6&–Æ—F–W2æÖ…6×ÆW2Â&VæFW%F&vWBç6×ÆW2“°  —Ð  –gVæ7F–öâW6T×VÇF—6×ÆVE%EB‚&VæFW%F&vWB’°  –6öç7B&VæFW%F&vWE&÷W'F–W2Ò&÷W'F–W2ævWB‚&VæFW%F&vWB“°  —&WGW&â&VæFW%F&vWBç6×ÆW2âbbW‡FVç6–öç2æ†2‚utT$tÅö×VÇF—6×ÆVE÷&VæFW%÷Fõ÷FW‡GW&Rr’ÓÓÒG'VRbb&VæFW%F&vWE&÷W'F–W2åõ÷W6U&VæFW%FõFW‡GW&RÓÒfÇ6S°  —Ð  –gVæ7F–öâWFFUf–FVõFW‡GW&R‚FW‡GW&R’°  –6öç7Bg&ÖRÒ–æfòç&VæFW"æg&ÖS°  ’òò6†V6²F†RÆ7Bg&ÖRvRWFFVBF†Rf–FVõFW‡GW&P  ––b‚÷f–FVõFW‡GW&W2ævWB‚FW‡GW&R’ÓÒg&ÖR’°  •÷f–FVõFW‡GW&W2ç6WB‚FW‡GW&RÂg&ÖR“° —FW‡GW&RçWFFR‚“°  —Ð  —Ð  –gVæ7F–öâfW&–g”6öÆ÷%76R‚FW‡GW&RÂ–ÖvR’°  –6öç7B6öÆ÷%76RÒFW‡GW&Ræ6öÆ÷%76S° –6öç7Bf÷&ÖBÒFW‡GW&Ræf÷&ÖC° –6öç7BG—RÒFW‡GW&RçG—S°  ––b‚FW‡GW&Ræ—46ö×&W76VEFW‡GW&RÓÓÒG'VRÇÂFW‡GW&Ræ—5f–FVõFW‡GW&RÓÓÒG'VR’&WGW&â–ÖvS°  ––b‚6öÆ÷%76RÓÒÆ–æV%5$t$6öÆ÷%76Rbb6öÆ÷%76RÓÒæô6öÆ÷%76R’°  ’òò5$t   ––b‚6öÆ÷$ÖævVÖVçBævWEG&ç6fW"‚6öÆ÷%76R’ÓÓÒ5$t%G&ç6fW"’°  ’òò–âvV$tÂ"Væ6ö×&W76VBFW‡GW&W26âöæÇ’&R5$t"Væ6öFVB–bF†W’†fRF†R$t$‚f÷&Ö@  ––b‚f÷&ÖBÓÒ$t$f÷&ÖBÇÂG—RÓÒVç6–væVD'—FUG—R’°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅFW‡GW&W3¢5$t"Væ6öFVBFW‡GW&W2†fRFòW6R$t$f÷&ÖBæBVç6–væVD'—FUG—Râr“°  —Ð  —ÒVÇ6R°  –6öç6öÆRæW'&÷"‚uD…$TRåvV$tÅFW‡GW&W3¢Vç7W÷'FVBFW‡GW&R6öÆ÷"76S¢rÂ6öÆ÷%76R“°  —Ð  —Ð  —&WGW&â–ÖvS°  —Ð  –gVæ7F–öâvWDF–ÖVç6–öç2‚–ÖvR’°  ––b‚G—Vöb…DÔÄ–ÖvTVÆVÖVçBÓÒwVæFVf–æVBrbb–ÖvR–ç7Fæ6Vöb…DÔÄ–ÖvTVÆVÖVçB’°  ’òò–b–çG&–ç6–2FF&Ræ÷Bf–Æ&ÆRÂfÆÆ&6²Fòv–GF‚ö†V–v‡@  •ö–ÖvTF–ÖVç6–öç2çv–GF‚Ò–ÖvRææGW&Åv–GF‚ÇÂ–ÖvRçv–GFƒ° •ö–ÖvTF–ÖVç6–öç2æ†V–v‡BÒ–ÖvRææGW&Ä†V–v‡BÇÂ–ÖvRæ†V–v‡C°  —ÒVÇ6R–b‚G—Vöbf–FVôg&ÖRÓÒwVæFVf–æVBrbb–ÖvR–ç7Fæ6Vöbf–FVôg&ÖR’°  •ö–ÖvTF–ÖVç6–öç2çv–GF‚Ò–ÖvRæF—7Æ•v–GFƒ° •ö–ÖvTF–ÖVç6–öç2æ†V–v‡BÒ–ÖvRæF—7Æ”†V–v‡C°  —ÒVÇ6R°  •ö–ÖvTF–ÖVç6–öç2çv–GF‚Ò–ÖvRçv–GFƒ° •ö–ÖvTF–ÖVç6–öç2æ†V–v‡BÒ–ÖvRæ†V–v‡C°  —Ð  —&WGW&âö–ÖvTF–ÖVç6–öç3°  —Ð  ’òð  —F†—2æÆÆö6FUFW‡GW&UVæ—BÒÆÆö6FUFW‡GW&UVæ—C° —F†—2ç&W6WEFW‡GW&UVæ—G2Ò&W6WEFW‡GW&UVæ—G3°  —F†—2ç6WEFW‡GW&S$BÒ6WEFW‡GW&S$C° —F†—2ç6WEFW‡GW&S$D'&’Ò6WEFW‡GW&S$D'&“° —F†—2ç6WEFW‡GW&S4BÒ6WEFW‡GW&S4C° —F†—2ç6WEFW‡GW&T7V&RÒ6WEFW‡GW&T7V&S° —F†—2ç&V&–æEFW‡GW&W2Ò&V&–æEFW‡GW&W3° —F†—2ç6WGW&VæFW%F&vWBÒ6WGW&VæFW%F&vWC° —F†—2çWFFU&VæFW%F&vWDÖ—ÖÒWFFU&VæFW%F&vWDÖ—Ö° —F†—2çWFFT×VÇF—6×ÆU&VæFW%F&vWBÒWFFT×VÇF—6×ÆU&VæFW%F&vWC° —F†—2ç6WGWFWF…&VæFW&'VffW"Ò6WGWFWF…&VæFW&'VffW#° —F†—2ç6WGWg&ÖT'VffW%FW‡GW&RÒ6WGWg&ÖT'VffW%FW‡GW&S° —F†—2çW6T×VÇF—6×ÆVE%EBÒW6T×VÇF—6×ÆVE%EC° §Ð ¦gVæ7F–öâvV$tÅWF–Ç2‚vÂÂW‡FVç6–öç2’°  –gVæ7F–öâ6öçfW'B‚Â6öÆ÷%76RÒæô6öÆ÷%76R’°  –ÆWBW‡FVç6–öã°  –6öç7BG&ç6fW"Ò6öÆ÷$ÖævVÖVçBævWEG&ç6fW"‚6öÆ÷%76R“°  ––b‚ÓÓÒVç6–væVD'—FUG—R’&WGW&âvÂåTå4”täTEô%•DS° ––b‚ÓÓÒVç6–væVE6†÷'CCCCEG—R’&WGW&âvÂåTå4”täTEõ4„õ%EóEóEóEóC° ––b‚ÓÓÒVç6–væVE6†÷'CSSSG—R’&WGW&âvÂåTå4”täTEõ4„õ%EóUóUóUó° ––b‚ÓÓÒVç6–væVD–çCS““•G—R’&WGW&âvÂåTå4”täTEô”åEóUó•ó•ó•õ$Uc° ––b‚ÓÓÒVç6–væVD–çCG—R’&WGW&âvÂåTå4”täTEô”åEóeóeóeõ$Uc°  ––b‚ÓÓÒ'—FUG—R’&WGW&âvÂä%•DS° ––b‚ÓÓÒ6†÷'EG—R’&WGW&âvÂå4„õ%C° ––b‚ÓÓÒVç6–væVE6†÷'EG—R’&WGW&âvÂåTå4”täTEõ4„õ%C° ––b‚ÓÓÒ–çEG—R’&WGW&âvÂä”åC° ––b‚ÓÓÒVç6–væVD–çEG—R’&WGW&âvÂåTå4”täTEô”åC° ––b‚ÓÓÒfÆöEG—R’&WGW&âvÂädÄôC° ––b‚ÓÓÒ†ÆdfÆöEG—R’&WGW&âvÂä„ÄeôdÄôC°  ––b‚ÓÓÒÇ†f÷&ÖB’&WGW&âvÂäÅ„° ––b‚ÓÓÒ$t$f÷&ÖB’&WGW&âvÂå$t#° ––b‚ÓÓÒ$t$f÷&ÖB’&WGW&âvÂå$t$° ––b‚ÓÓÒFWF„f÷&ÖB’&WGW&âvÂäDUD…ô4ôÕôäTåC° ––b‚ÓÓÒFWF…7FVæ6–Äf÷&ÖB’&WGW&âvÂäDUD…õ5DTä4”Ã°  ’òòvV$tÃ"f÷&ÖG2à  ––b‚ÓÓÒ&VDf÷&ÖB’&WGW&âvÂå$TC° ––b‚ÓÓÒ&VD–çFVvW$f÷&ÖB’&WGW&âvÂå$TEô”åDTtU#° ––b‚ÓÓÒ$tf÷&ÖB’&WGW&âvÂå$s° ––b‚ÓÓÒ$t–çFVvW$f÷&ÖB’&WGW&âvÂå$uô”åDTtU#° ––b‚ÓÓÒ$t$–çFVvW$f÷&ÖB’&WGW&âvÂå$t$ô”åDTtU#°  ’òò35D0  ––b‚ÓÓÒ$t%õ35D5ôE…Côf÷&ÖBÇÂÓÓÒ$t$õ35D5ôE…Côf÷&ÖBÇÂÓÓÒ$t$õ35D5ôE…C5ôf÷&ÖBÇÂÓÓÒ$t$õ35D5ôE…CUôf÷&ÖB’°  ––b‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö6ö×&W76VE÷FW‡GW&U÷37F5÷7&v"r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t%õ35D5ôE…Côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ5$t%õ35D5ôE…CôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…Côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ5$t%ôÅ„õ35D5ôE…CôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…C5ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ5$t%ôÅ„õ35D5ôE…C5ôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…CUôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ5$t%ôÅ„õ35D5ôE…CUôU…C°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —ÒVÇ6R°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö6ö×&W76VE÷FW‡GW&U÷37F2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t%õ35D5ôE…Côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t%õ35D5ôE…CôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…Côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t$õ35D5ôE…CôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…C5ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t$õ35D5ôE…C5ôU…C° ––b‚ÓÓÒ$t$õ35D5ôE…CUôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t$õ35D5ôE…CUôU…C°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  —Ð  ’òòe%D0  ––b‚ÓÓÒ$t%õe%D5óD%côf÷&ÖBÇÂÓÓÒ$t%õe%D5ó$%côf÷&ÖBÇÂÓÓÒ$t$õe%D5óD%côf÷&ÖBÇÂÓÓÒ$t$õe%D5ó$%côf÷&ÖB’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö6ö×&W76VE÷FW‡GW&U÷g'F2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t%õe%D5óD%côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t%õe%D5óD%cô”Ôs° ––b‚ÓÓÒ$t%õe%D5ó$%côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t%õe%D5ó$%cô”Ôs° ––b‚ÓÓÒ$t$õe%D5óD%côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t$õe%D5óD%cô”Ôs° ––b‚ÓÓÒ$t$õe%D5ó$%côf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t$õe%D5ó$%cô”Ôs°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  ’òòUD0  ––b‚ÓÓÒ$t%ôUD3ôf÷&ÖBÇÂÓÓÒ$t%ôUD3%ôf÷&ÖBÇÂÓÓÒ$t$ôUD3%ôT5ôf÷&ÖB’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö6ö×&W76VE÷FW‡GW&UöWF2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t%ôUD3ôf÷&ÖBÇÂÓÓÒ$t%ôUD3%ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôUD3"¢W‡FVç6–öâä4ôÕ$U54TEõ$t#…ôUD3#° ––b‚ÓÓÒ$t$ôUD3%ôT5ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ôUD3%ôT2¢W‡FVç6–öâä4ôÕ$U54TEõ$t$…ôUD3%ôT3°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  ’òò5D0  ––b‚ÓÓÒ$t$ô5D5óGƒEôf÷&ÖBÇÂÓÓÒ$t$ô5D5óWƒEôf÷&ÖBÇÂÓÓÒ$t$ô5D5óWƒUôf÷&ÖBÇÀ —ÓÓÒ$t$ô5D5ógƒUôf÷&ÖBÇÂÓÓÒ$t$ô5D5ógƒeôf÷&ÖBÇÂÓÓÒ$t$ô5D5ó‡ƒUôf÷&ÖBÇÀ —ÓÓÒ$t$ô5D5ó‡ƒeôf÷&ÖBÇÂÓÓÒ$t$ô5D5ó‡ƒ…ôf÷&ÖBÇÂÓÓÒ$t$ô5D5óƒUôf÷&ÖBÇÀ —ÓÓÒ$t$ô5D5óƒeôf÷&ÖBÇÂÓÓÒ$t$ô5D5óƒ…ôf÷&ÖBÇÂÓÓÒ$t$ô5D5óƒôf÷&ÖBÇÀ —ÓÓÒ$t$ô5D5ó'ƒôf÷&ÖBÇÂÓÓÒ$t$ô5D5ó'ƒ%ôf÷&ÖB’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅö6ö×&W76VE÷FW‡GW&Uö7F2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t$ô5D5óGƒEôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óGƒEô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óGƒEô´…#° ––b‚ÓÓÒ$t$ô5D5óWƒEôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óWƒEô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óWƒEô´…#° ––b‚ÓÓÒ$t$ô5D5óWƒUôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óWƒUô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óWƒUô´…#° ––b‚ÓÓÒ$t$ô5D5ógƒUôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ógƒUô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ógƒUô´…#° ––b‚ÓÓÒ$t$ô5D5ógƒeôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ógƒeô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ógƒeô´…#° ––b‚ÓÓÒ$t$ô5D5ó‡ƒUôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ó‡ƒUô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ó‡ƒUô´…#° ––b‚ÓÓÒ$t$ô5D5ó‡ƒeôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ó‡ƒeô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ó‡ƒeô´…#° ––b‚ÓÓÒ$t$ô5D5ó‡ƒ…ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ó‡ƒ…ô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ó‡ƒ…ô´…#° ––b‚ÓÓÒ$t$ô5D5óƒUôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óƒUô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óƒUô´…#° ––b‚ÓÓÒ$t$ô5D5óƒeôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óƒeô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óƒeô´…#° ––b‚ÓÓÒ$t$ô5D5óƒ…ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óƒ…ô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óƒ…ô´…#° ––b‚ÓÓÒ$t$ô5D5óƒôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5óƒô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5óƒô´…#° ––b‚ÓÓÒ$t$ô5D5ó'ƒôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ó'ƒô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ó'ƒô´…#° ––b‚ÓÓÒ$t$ô5D5ó'ƒ%ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t#…ôÅ„…ô5D5ó'ƒ%ô´…"¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô5D5ó'ƒ%ô´…#°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  ’òò%D0  ––b‚ÓÓÒ$t$ô%D5ôf÷&ÖBÇÂÓÓÒ$t%ô%D5õ4”täTEôf÷&ÖBÇÂÓÓÒ$t%ô%D5õTå4”täTEôf÷&ÖB’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚tU…E÷FW‡GW&Uö6ö×&W76–öåö'F2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$t$ô%D5ôf÷&ÖB’&WGW&â‚G&ç6fW"ÓÓÒ5$t%G&ç6fW"’òW‡FVç6–öâä4ôÕ$U54TEõ5$t%ôÅ„ô%D5õTäõ$ÕôU…B¢W‡FVç6–öâä4ôÕ$U54TEõ$t$ô%D5õTäõ$ÕôU…C° ––b‚ÓÓÒ$t%ô%D5õ4”täTEôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t%ô%D5õ4”täTEôdÄôEôU…C° ––b‚ÓÓÒ$t%ô%D5õTå4”täTEôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$t%ô%D5õTå4”täTEôdÄôEôU…C°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  ’òò$uD0  ––b‚ÓÓÒ$TEõ$uD3ôf÷&ÖBÇÂÓÓÒ4”täTEõ$TEõ$uD3ôf÷&ÖBÇÂÓÓÒ$TEôu$TTåõ$uD3%ôf÷&ÖBÇÂÓÓÒ4”täTEõ$TEôu$TTåõ$uD3%ôf÷&ÖB’°  –W‡FVç6–öâÒW‡FVç6–öç2ævWB‚tU…E÷FW‡GW&Uö6ö×&W76–öå÷&wF2r“°  ––b‚W‡FVç6–öâÓÒçVÆÂ’°  ––b‚ÓÓÒ$TEõ$uD3ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$TEõ$uD3ôU…C° ––b‚ÓÓÒ4”täTEõ$TEõ$uD3ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ4”täTEõ$TEõ$uD3ôU…C° ––b‚ÓÓÒ$TEôu$TTåõ$uD3%ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ$TEôu$TTåõ$uD3%ôU…C° ––b‚ÓÓÒ4”täTEõ$TEôu$TTåõ$uD3%ôf÷&ÖB’&WGW&âW‡FVç6–öâä4ôÕ$U54TEõ4”täTEõ$TEôu$TTåõ$uD3%ôU…C°  —ÒVÇ6R°  —&WGW&âçVÆÃ°  —Ð  —Ð  ’òð  ––b‚ÓÓÒVç6–væVD–çC#C…G—R’&WGW&âvÂåTå4”täTEô”åEó#Eóƒ°  ’òò–b'"6âwB&R&W6öÇfVBÂ77VÖRF†RW6W"FVf–æW2vV$tÂ6öç7FçB27G&–ær†fÆÆ&6²÷v÷&¶&÷VæBf÷"6¶VB$t"f÷&ÖG2  —&WGW&â‚vÅ²ÒÓÒVæFVf–æVB’òvÅ²Ò¢çVÆÃ°  —Ð  —&WGW&â²6öçfW'C¢6öçfW'BÓ° §Ð ¦6öç7Böö66ÇW6–öå÷fW'FW‚Ò §fö–BÖ–â‚’°  –vÅõ÷6—F–öâÒfV3B‚÷6—F–öâÂã“° §Ö° ¦6öç7Böö66ÇW6–öåög&vÖVçBÒ §Væ–f÷&Ò6×ÆW#$D'&’FWF„6öÆ÷#°§Væ–f÷&ÒfÆöBFWF…v–GFƒ°§Væ–f÷&ÒfÆöBFWF„†V–v‡C° §fö–BÖ–â‚’°  —fV3"6ö÷&BÒfV3"‚vÅôg&t6ö÷&Bç‚òFWF…v–GF‚ÂvÅôg&t6ö÷&Bç’òFWF„†V–v‡B“°  ––b‚6ö÷&Bç‚ãÒã’°  –vÅôg&tFWF‚ÒFW‡GW&R‚FWF„6öÆ÷"ÂfV32‚6ö÷&Bç‚ÒãÂ6ö÷&Bç’Â’’ç#°  —ÒVÇ6R°  –vÅôg&tFWF‚ÒFW‡GW&R‚FWF„6öÆ÷"ÂfV32‚6ö÷&Bç‚Â6ö÷&Bç’Â’’ç#°  —Ð §Ö° ¢ò¢ ¢¢…"ÖöGVÆRF†BÖævW2F†R66W72FòF†RFWF‚6Vç6–ær’à¢¢ð¦6Æ72vV%…$FWF…6Vç6–ær°  ’ò¢  ’¢6öç7G'V7G2æWrFWF‚6Vç6–ærÖöGVÆRà ’¢ð –6öç7G'V7F÷"‚’°  ’ò¢  ’¢â÷VRFW‡GW&R&W&W6VçF–ærF†RFWF‚öbF†RW6W"w2Vçf—&öæÖVçBà ’  ’¢G—R³ôW‡FW&æÅFW‡GW&WÐ ’¢ð —F†—2çFW‡GW&RÒçVÆÃ°  ’ò¢  ’¢ÆæRÖW6‚f÷"f—7VÆ—¦–ærF†RFWF‚FW‡GW&Rà ’  ’¢G—R³ôÖW6‡Ð ’¢ð —F†—2æÖW6‚ÒçVÆÃ°  ’ò¢  ’¢F†RFWF‚æV"fÇVRà ’  ’¢G—R¶çVÖ&W'Ð ’¢ð —F†—2æFWF„æV"Ò°  ’ò¢  ’¢F†RFWF‚æV"f"à ’  ’¢G—R¶çVÖ&W'Ð ’¢ð —F†—2æFWF„f"Ò°  —Ð  ’ò¢  ’¢–æ—G2F†RFWF‚6Vç6–ærÖöGVÆP ’  ’¢&Òµ…%vV$tÄFWF„–æf÷&ÖF–öçÒFWF„FFÒF†R…"FWF‚FFà ’¢&Òµ…%&VæFW%7FFWÒ&VæFW%7FFRÒF†R…"&VæFW"7FFRà ’¢ð ––æ—B‚FWF„FFÂ&VæFW%7FFR’°  ––b‚F†—2çFW‡GW&RÓÓÒçVÆÂ’°  –6öç7BFW‡GW&RÒæWrW‡FW&æÅFW‡GW&R‚FWF„FFçFW‡GW&R“°  ––b‚‚FWF„FFæFWF„æV"ÓÒ&VæFW%7FFRæFWF„æV"’ÇÂ‚FWF„FFæFWF„f"ÓÒ&VæFW%7FFRæFWF„f"’’°  —F†—2æFWF„æV"ÒFWF„FFæFWF„æV#° —F†—2æFWF„f"ÒFWF„FFæFWF„f#°  —Ð  —F†—2çFW‡GW&RÒFW‡GW&S°  —Ð  —Ð  ’ò¢  ’¢&WGW&ç2ÆæRÖW6‚F†Bf—7VÆ—¦W2F†RFWF‚FW‡GW&Rà ’  ’¢&Ò´'&”6ÖW&Ò6ÖW&…"ÒF†R…"6ÖW&à ’¢&WGW&â³ôÖW6‡ÒF†RÆæRÖW6‚à ’¢ð –vWDÖW6‚‚6ÖW&…"’°  ––b‚F†—2çFW‡GW&RÓÒçVÆÂ’°  ––b‚F†—2æÖW6‚ÓÓÒçVÆÂ’°  –6öç7Bf–Ww÷'BÒ6ÖW&…"æ6ÖW&5²Òçf–Ww÷'C° –6öç7BÖFW&–ÂÒæWr6†FW$ÖFW&–Â‚° —fW'FW…6†FW#¢öö66ÇW6–öå÷fW'FW‚À –g&vÖVçE6†FW#¢öö66ÇW6–öåög&vÖVçBÀ —Væ–f÷&×3¢° –FWF„6öÆ÷#¢²fÇVS¢F†—2çFW‡GW&RÒÀ –FWF…v–GFƒ¢²fÇVS¢f–Ww÷'Bç¢ÒÀ –FWF„†V–v‡C¢²fÇVS¢f–Ww÷'BçrÐ —Ð —Ò“°  —F†—2æÖW6‚ÒæWrÖW6‚‚æWrÆæTvVöÖWG'’‚#Â#’ÂÖFW&–Â“°  —Ð  —Ð  —&WGW&âF†—2æÖW6ƒ°  —Ð  ’ò¢  ’¢&W6WG2F†RÖöGVÆP ’¢ð —&W6WB‚’°  —F†—2çFW‡GW&RÒçVÆÃ° —F†—2æÖW6‚ÒçVÆÃ°  —Ð  ’ò¢  ’¢&WGW&ç2FW‡GW&R&W&W6VçF–ærF†RFWF‚öbF†RW6W"w2Vçf—&öæÖVçBà ’  ’¢&WGW&â³ôW‡FW&æÅFW‡GW&WÒF†RFWF‚FW‡GW&Rà ’¢ð –vWDFWF…FW‡GW&R‚’°  —&WGW&âF†—2çFW‡GW&S°  —Ð §Ð ¢ò¢ ¢¢F†—26Æ72&W&W6VçG2â'7G&7F–öâöbF†RvV%…"FWf–6R’æB—0¢¢–çFW&æÆÇ’W6VB'’´Æ–æ²vV$tÅ&VæFW&W'ÒâvV%…$ÖævW&Ç6ò&÷f–FW2V&Æ–0¢¢–çFW&f6RF†BÆÆ÷w2W6W'2FòVæ&ÆRöF—6&ÆR…"æBW&f÷&Ò…"&VÆFV@¢¢F6·2Æ–¶Rf÷"–ç7Fæ6R&WG&–Wf–ær6öçG&öÆÆW'2à¢ ¢¢VvÖVçG2WfVçDF—7F6†W ¢¢†–FV6öç7G'V7F÷ ¢¢ð¦6Æ72vV%…$ÖævW"W‡FVæG2WfVçDF—7F6†W"°  ’ò¢  ’¢6öç7G'V7G2æWrvV$tÂ&VæFW&W"à ’  ’¢&ÒµvV$tÅ&VæFW&W'Ò&VæFW&W"ÒF†R&VæFW&W"à ’¢&ÒµvV$tÃ%&VæFW&–æt6öçFW‡GÒvÂÒF†R&VæFW&–ær6öçFW‡Bà ’¢ð –6öç7G'V7F÷"‚&VæFW&W"ÂvÂ’°  —7WW"‚“°  –6öç7B66÷RÒF†—3°  –ÆWB6W76–öâÒçVÆÃ°  –ÆWBg&ÖV'VffW%66ÆTf7F÷"Òã°  –ÆWB&VfW&Væ6U76RÒçVÆÃ° –ÆWB&VfW&Væ6U76UG—RÒvÆö6ÂÖfÆö÷"s° ’òò6WBFVfVÇBf÷fVF–öâFòÖ†–×VÒà –ÆWBf÷fVF–öâÒã° –ÆWB7W7FöÕ&VfW&Væ6U76RÒçVÆÃ°  –ÆWB÷6RÒçVÆÃ° –ÆWBvÄ&–æF–ærÒçVÆÃ° –ÆWBvÅ&ö¤Æ–W"ÒçVÆÃ° –ÆWBvÄ&6TÆ–W"ÒçVÆÃ° –ÆWB‡$g&ÖRÒçVÆÃ°  –6öç7B7W÷'G4vÄ&–æF–ærÒG—Vöb…%vV$tÄ&–æF–ærÓÒwVæFVf–æVBs°  –6öç7BFWF…6Vç6–ærÒæWrvV%…$FWF…6Vç6–ær‚“° –6öç7B6ÖW&66W75FW‡GW&W2Ò·Ó° –6öç7BGG&–'WFW2ÒvÂævWD6öçFW‡DGG&–'WFW2‚“°  –ÆWB–æ—F–Å&VæFW%F&vWBÒçVÆÃ° –ÆWBæWu&VæFW%F&vWBÒçVÆÃ°  –6öç7B6öçG&öÆÆW'2ÒµÓ° –6öç7B6öçG&öÆÆW$–çWE6÷W&6W2ÒµÓ°  –6öç7B7W'&VçE6—¦RÒæWrfV7F÷#"‚“° –ÆWB7W'&VçE—†VÅ&F–òÒçVÆÃ°  ’òð  –6öç7B6ÖW&ÂÒæWrW'7V7F—fT6ÖW&‚“° –6ÖW&Âçf–Ww÷'BÒæWrfV7F÷#B‚“°  –6öç7B6ÖW&"ÒæWrW'7V7F—fT6ÖW&‚“° –6ÖW&"çf–Ww÷'BÒæWrfV7F÷#B‚“°  –6öç7B6ÖW&2Ò²6ÖW&ÂÂ6ÖW&"Ó°  –6öç7B6ÖW&…"ÒæWr'&”6ÖW&‚“°  –ÆWBö7W'&VçDFWF„æV"ÒçVÆÃ° –ÆWBö7W'&VçDFWF„f"ÒçVÆÃ°  ’òð  ’ò¢  ’¢v†WF†W"F†RÖævW"w2…"6ÖW&6†÷VÆB&RWFöÖF–6ÆÇ’WFFVB÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2æ6ÖW&WFõWFFRÒG'VS°  ’ò¢  ’¢F†—2fÆræ÷F–f–W2F†R&VæFW&W"Fò&R&VG’f÷"…"&VæFW&–ærâ6WB—BFòG'VV  ’¢–b–÷R&Rvö–ærFòW6R…"–â–÷W"à ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBfÇ6P ’¢ð —F†—2æVæ&ÆVBÒfÇ6S°  ’ò¢  ’¢v†WF†W"…"&W6VçFF–öâ—27F—fR÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢&VFöæÇ ’¢FVfVÇBfÇ6P ’¢ð —F†—2æ—5&W6VçF–ærÒfÇ6S°  ’ò¢  ’¢&WGW&ç2w&÷W&W&W6VçF–ærF†RF&vWB&–76RöbF†R…"6öçG&öÆÆW"à ’¢W6RF†—276Rf÷"f—7VÆ—¦–ær4Bö&¦V7G2F†B7W÷'BF†RW6W"–âö–çF–æp ’¢F6·2Æ–¶RT’–çFW&7F–öâà ’  ’¢&Ò¶çVÖ&W'Ò–æFW‚ÒF†R–æFW‚öbF†R6öçG&öÆÆW"à ’¢&WGW&â´w&÷WÒw&÷W&W&W6VçF–ærF†RF&vWB&–76Rà ’¢ð —F†—2ævWD6öçG&öÆÆW"ÒgVæ7F–öâ‚–æFW‚’°  –ÆWB6öçG&öÆÆW"Ò6öçG&öÆÆW'5²–æFW‚Ó°  ––b‚6öçG&öÆÆW"ÓÓÒVæFVf–æVB’°  –6öçG&öÆÆW"ÒæWrvV%…$6öçG&öÆÆW"‚“° –6öçG&öÆÆW'5²–æFW‚ÒÒ6öçG&öÆÆW#°  —Ð  —&WGW&â6öçG&öÆÆW"ævWEF&vWE&•76R‚“°  —Ó°  ’ò¢  ’¢&WGW&ç2w&÷W&W&W6VçF–ærF†Rw&—76RöbF†R…"6öçG&öÆÆW"à ’¢W6RF†—276Rf÷"f—7VÆ—¦–ær4Bö&¦V7G2F†B7W÷'BF†RW6W"–âö–çF–æp ’¢F6·2Æ–¶RT’–çFW&7F–öâà ’  ’¢æ÷FS¢–b–÷RvçBFò6†÷r6öÖWF†–ær–âF†RW6W"w2†æBäBöffW" ’¢ö–çF–ær&’BF†R6ÖRF–ÖRÂ–÷RvÆÂvçBFòGF6†VBF†R†æF†VÆBö&¦V7@ ’¢FòF†Rw&÷W&WGW&æVB'’vWD6öçG&öÆÆW$w&—‚–æBF†R&’FòF†P ’¢w&÷W&WGW&æVB'’vWD6öçG&öÆÆW"‚–âF†R–FV—2Fò†fRGvð ’¢F–ffW&VçBw&÷W2–âGvòF–ffW&VçB6ö÷&F–æFR76W2f÷"F†R6ÖRvV%…  ’¢6öçG&öÆÆW"à ’  ’¢&Ò¶çVÖ&W'Ò–æFW‚ÒF†R–æFW‚öbF†R6öçG&öÆÆW"à ’¢&WGW&â´w&÷WÒw&÷W&W&W6VçF–ærF†Rw&—76Rà ’¢ð —F†—2ævWD6öçG&öÆÆW$w&—ÒgVæ7F–öâ‚–æFW‚’°  –ÆWB6öçG&öÆÆW"Ò6öçG&öÆÆW'5²–æFW‚Ó°  ––b‚6öçG&öÆÆW"ÓÓÒVæFVf–æVB’°  –6öçG&öÆÆW"ÒæWrvV%…$6öçG&öÆÆW"‚“° –6öçG&öÆÆW'5²–æFW‚ÒÒ6öçG&öÆÆW#°  —Ð  —&WGW&â6öçG&öÆÆW"ævWDw&—76R‚“°  —Ó°  ’ò¢  ’¢&WGW&ç2w&÷W&W&W6VçF–ærF†R†æF76RöbF†R…"6öçG&öÆÆW"à ’¢W6RF†—276Rf÷"f—7VÆ—¦–ær4Bö&¦V7G2F†B7W÷'BF†RW6W"–âö–çF–æp ’¢F6·2Æ–¶RT’–çFW&7F–öâà ’  ’¢&Ò¶çVÖ&W'Ò–æFW‚ÒF†R–æFW‚öbF†R6öçG&öÆÆW"à ’¢&WGW&â´w&÷WÒw&÷W&W&W6VçF–ærF†R†æF76Rà ’¢ð —F†—2ævWD†æBÒgVæ7F–öâ‚–æFW‚’°  –ÆWB6öçG&öÆÆW"Ò6öçG&öÆÆW'5²–æFW‚Ó°  ––b‚6öçG&öÆÆW"ÓÓÒVæFVf–æVB’°  –6öçG&öÆÆW"ÒæWrvV%…$6öçG&öÆÆW"‚“° –6öçG&öÆÆW'5²–æFW‚ÒÒ6öçG&öÆÆW#°  —Ð  —&WGW&â6öçG&öÆÆW"ævWD†æE76R‚“°  —Ó°  ’òð  –gVæ7F–öâöå6W76–öäWfVçB‚WfVçB’°  –6öç7B6öçG&öÆÆW$–æFW‚Ò6öçG&öÆÆW$–çWE6÷W&6W2æ–æFW„öb‚WfVçBæ–çWE6÷W&6R“°  ––b‚6öçG&öÆÆW$–æFW‚ÓÓÒÓ’°  —&WGW&ã°  —Ð  –6öç7B6öçG&öÆÆW"Ò6öçG&öÆÆW'5²6öçG&öÆÆW$–æFW‚Ó°  ––b‚6öçG&öÆÆW"ÓÒVæFVf–æVB’°  –6öçG&öÆÆW"çWFFR‚WfVçBæ–çWE6÷W&6RÂWfVçBæg&ÖRÂ7W7FöÕ&VfW&Væ6U76RÇÂ&VfW&Væ6U76R“° –6öçG&öÆÆW"æF—7F6„WfVçB‚²G—S¢WfVçBçG—RÂFF¢WfVçBæ–çWE6÷W&6RÒ“°  —Ð  —Ð  –gVæ7F–öâöå6W76–öäVæB‚’°  —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w6VÆV7BrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w6VÆV7G7F'BrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w6VÆV7FVæBrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w7VVW¦RrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w7VVW¦W7F'BrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚w7VVW¦VVæBrÂöå6W76–öäWfVçB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚vVæBrÂöå6W76–öäVæB“° —6W76–öâç&VÖ÷fTWfVçDÆ—7FVæW"‚v–çWG6÷W&6W66†ævRrÂöä–çWE6÷W&6W46†ævR“°  –f÷"‚ÆWB’Ò²’Â6öçG&öÆÆW'2æÆVæwFƒ²’²²’°  –6öç7B–çWE6÷W&6RÒ6öçG&öÆÆW$–çWE6÷W&6W5²’Ó°  ––b‚–çWE6÷W&6RÓÓÒçVÆÂ’6öçF–çVS°  –6öçG&öÆÆW$–çWE6÷W&6W5²’ÒÒçVÆÃ°  –6öçG&öÆÆW'5²’ÒæF—66öææV7B‚–çWE6÷W&6R“°  —Ð  •ö7W'&VçDFWF„æV"ÒçVÆÃ° •ö7W'&VçDFWF„f"ÒçVÆÃ°  –FWF…6Vç6–ærç&W6WB‚“° –f÷"‚6öç7B¶W’–â6ÖW&66W75FW‡GW&W2’°  –FVÆWFR6ÖW&66W75FW‡GW&W5²¶W’Ó°  —Ð  ’òò&W7F÷&Rg&ÖV'VffW"÷&VæFW&–ær7FFP  —&VæFW&W"ç6WE&VæFW%F&vWB‚–æ—F–Å&VæFW%F&vWB“°  –vÄ&6TÆ–W"ÒçVÆÃ° –vÅ&ö¤Æ–W"ÒçVÆÃ° –vÄ&–æF–ærÒçVÆÃ° —6W76–öâÒçVÆÃ° –æWu&VæFW%F&vWBÒçVÆÃ°  ’òð  –æ–ÖF–öâç7F÷‚“°  —66÷Ræ—5&W6VçF–ærÒfÇ6S°  —&VæFW&W"ç6WE—†VÅ&F–ò‚7W'&VçE—†VÅ&F–ò“° —&VæFW&W"ç6WE6—¦R‚7W'&VçE6—¦Rçv–GF‚Â7W'&VçE6—¦Ræ†V–v‡BÂfÇ6R“°  —66÷RæF—7F6„WfVçB‚²G—S¢w6W76–öæVæBrÒ“°  —Ð  ’ò¢  ’¢6WG2F†Rg&ÖV'VffW"66ÆRf7F÷"à ’  ’¢F†—2ÖWF†öB6âæ÷B&RW6VBGW&–ær…"6W76–öâà ’  ’¢&Ò¶çVÖ&W'ÒfÇVRÒF†Rg&ÖV'VffW"66ÆRf7F÷"à ’¢ð —F†—2ç6WDg&ÖV'VffW%66ÆTf7F÷"ÒgVæ7F–öâ‚fÇVR’°  –g&ÖV'VffW%66ÆTf7F÷"ÒfÇVS°  ––b‚66÷Ræ—5&W6VçF–ærÓÓÒG'VR’°  –6öç6öÆRçv&â‚uD…$TRåvV%…$ÖævW#¢6ææ÷B6†ævRg&ÖV'VffW"66ÆRv†–ÆR&W6VçF–ærâr“°  —Ð  —Ó°  ’ò¢  ’¢6WG2F†R&VfW&Væ6R76RG—Râ6â&RW6VBFò6öæf–wW&R7F–Â&VÆF–öç6†—v—F‚F†RW6W"w2‡—6–6À ’¢Vçf—&öæÖVçBâFWVæF–æröâ†÷rF†RW6W"Ö÷fW2–â4B76RÂ6WGF–ærâ&÷&–FR&VfW&Væ6R76R6à ’¢–×&÷fRG&6¶–ærâFVfVÇB—2Æö6ÂÖfÆö÷&âfÆ–BfÇVW26â&Rf÷VæB†W&P ’¢‡GG3¢òöFWfVÆ÷W"æÖ÷¦–ÆÆæ÷&röVâÕU2öFö72õvV"ô’õ…%&VfW&Væ6U76R7&VfW&Væ6U÷76U÷G—W2à ’  ’¢F†—2ÖWF†öB6âæ÷B&RW6VBGW&–ær…"6W76–öâà ’  ’¢&Ò·7G&–æwÒfÇVRÒF†R&VfW&Væ6R76RG—Rà ’¢ð —F†—2ç6WE&VfW&Væ6U76UG—RÒgVæ7F–öâ‚fÇVR’°  —&VfW&Væ6U76UG—RÒfÇVS°  ––b‚66÷Ræ—5&W6VçF–ærÓÓÒG'VR’°  –6öç6öÆRçv&â‚uD…$TRåvV%…$ÖævW#¢6ææ÷B6†ævR&VfW&Væ6R76RG—Rv†–ÆR&W6VçF–ærâr“°  —Ð  —Ó°  ’ò¢  ’¢&WGW&ç2F†R…"&VfW&Væ6R76Rà ’  ’¢&WGW&âµ…%&VfW&Væ6U76WÒF†R…"&VfW&Væ6R76Rà ’¢ð —F†—2ævWE&VfW&Væ6U76RÒgVæ7F–öâ‚’°  —&WGW&â7W7FöÕ&VfW&Væ6U76RÇÂ&VfW&Væ6U76S°  —Ó°  ’ò¢  ’¢6WG27W7FöÒ…"&VfW&Væ6R76Rà ’  ’¢&Òµ…%&VfW&Væ6U76WÒ76RÒF†R…"&VfW&Væ6R76Rà ’¢ð —F†—2ç6WE&VfW&Væ6U76RÒgVæ7F–öâ‚76R’°  –7W7FöÕ&VfW&Væ6U76RÒ76S°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçB&6RÆ–W"à ’  ’¢F†—2—2â…%&ö¦V7F–öäÆ–W&v†VâF†RF&vWFVB…"FWf–6R7W÷'G2F†P ’¢vV%…"Æ–W'2’Â÷"â…%vV$tÄÆ–W&÷F†W'v—6Rà ’  ’¢&WGW&â³ò……%vV$tÄÆ–W'Å…%&ö¦V7F–öäÆ–W"—ÒF†R…"&6RÆ–W"à ’¢ð —F†—2ævWD&6TÆ–W"ÒgVæ7F–öâ‚’°  —&WGW&âvÅ&ö¤Æ–W"ÓÒçVÆÂòvÅ&ö¤Æ–W"¢vÄ&6TÆ–W#°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçB…"&–æF–ærà ’  ’¢7&VFW2æWr&–æF–ær–bæVVFVBæBF†R'&÷w6W"—0 ’¢6&ÆRöbFö–ær6òà ’  ’¢&WGW&â³õ…%vV$tÄ&–æF–æwÒF†R…"&–æF–ærâ&WGW&ç2çVÆÆ–böæR6ææ÷B&R7&VFVBà ’¢ð —F†—2ævWD&–æF–ærÒgVæ7F–öâ‚’°  ––b‚vÄ&–æF–ærÓÓÒçVÆÂbb7W÷'G4vÄ&–æF–ær’°  –vÄ&–æF–ærÒæWr…%vV$tÄ&–æF–ær‚6W76–öâÂvÂ“°  —Ð  —&WGW&âvÄ&–æF–æs°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçB…"g&ÖRà ’  ’¢&WGW&â³õ…$g&ÖWÒF†R…"g&ÖRâ&WGW&ç2çVÆÆv†VâW6VB÷WG6–FR…"6W76–öâà ’¢ð —F†—2ævWDg&ÖRÒgVæ7F–öâ‚’°  —&WGW&â‡$g&ÖS°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçB…"6W76–öâà ’  ’¢&WGW&â³õ…%6W76–öçÒF†R…"6W76–öââ&WGW&ç2çVÆÆv†VâW6VB÷WG6–FR…"6W76–öâà ’¢ð —F†—2ævWE6W76–öâÒgVæ7F–öâ‚’°  —&WGW&â6W76–öã°  —Ó°  ’ò¢  ’¢gFW"…"6W76–öâ†2&VVâ&WVW7FVBW7VÆÇ’v—F‚öæRöbF†R¤'WGFöæÖöGVÆW2Â—@ ’¢—2–æ¦V7FVB–çFòF†R&VæFW&W"v—F‚F†—2ÖWF†öBâF†—2ÖWF†öBG&–vvW'2F†R7F'Bö` ’¢F†R7GVÂ…"&VæFW&–ærà ’  ’¢7–æ0 ’¢&Òµ…%6W76–öçÒfÇVRÒF†R…"6W76–öâFò6WBà ’¢&WGW&âµ&öÖ—6WÒ&öÖ—6RF†B&W6öÇfW2v†VâF†R6W76–öâ†2&VVâ6WBà ’¢ð —F†—2ç6WE6W76–öâÒ7–æ2gVæ7F–öâ‚fÇVR’°  —6W76–öâÒfÇVS°  ––b‚6W76–öâÓÒçVÆÂ’°  ––æ—F–Å&VæFW%F&vWBÒ&VæFW&W"ævWE&VæFW%F&vWB‚“°  —6W76–öâæFDWfVçDÆ—7FVæW"‚w6VÆV7BrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚w6VÆV7G7F'BrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚w6VÆV7FVæBrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚w7VVW¦RrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚w7VVW¦W7F'BrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚w7VVW¦VVæBrÂöå6W76–öäWfVçB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚vVæBrÂöå6W76–öäVæB“° —6W76–öâæFDWfVçDÆ—7FVæW"‚v–çWG6÷W&6W66†ævRrÂöä–çWE6÷W&6W46†ævR“°  ––b‚GG&–'WFW2ç‡$6ö×F–&ÆRÓÒG'VR’°  –v—BvÂæÖ¶U…$6ö×F–&ÆR‚“°  —Ð  –7W'&VçE—†VÅ&F–òÒ&VæFW&W"ævWE—†VÅ&F–ò‚“° —&VæFW&W"ævWE6—¦R‚7W'&VçE6—¦R“°   ’òò6†V6²F†BF†R'&÷w6W"–×ÆVÖVçG2F†RæV6W76'’—2FòW6Rà ’òò…%&ö¦V7F–öäÆ–W"&F†W"F†ââ…%vV$tÄÆ–W  –6öç7B7W÷'G4Æ–W'2Ò7W÷'G4vÄ&–æF–ærbbv7&VFU&ö¦V7F–öäÆ–W"r–â…%vV$tÄ&–æF–ærç&÷F÷G—S°  ––b‚7W÷'G4Æ–W'2’°  –6öç7BÆ–W$–æ—BÒ° –çF–Æ–3¢GG&–'WFW2æçF–Æ–2À –Ç†¢G'VRÀ –FWFƒ¢GG&–'WFW2æFWF‚À —7FVæ6–Ã¢GG&–'WFW2ç7FVæ6–ÂÀ –g&ÖV'VffW%66ÆTf7F÷#¢g&ÖV'VffW%66ÆTf7F÷  —Ó°  –vÄ&6TÆ–W"ÒæWr…%vV$tÄÆ–W"‚6W76–öâÂvÂÂÆ–W$–æ—B“°  —6W76–öâçWFFU&VæFW%7FFR‚²&6TÆ–W#¢vÄ&6TÆ–W"Ò“°  —&VæFW&W"ç6WE—†VÅ&F–ò‚“° —&VæFW&W"ç6WE6—¦R‚vÄ&6TÆ–W"æg&ÖV'VffW%v–GF‚ÂvÄ&6TÆ–W"æg&ÖV'VffW$†V–v‡BÂfÇ6R“°  –æWu&VæFW%F&vWBÒæWrvV$tÅ&VæFW%F&vWB€ –vÄ&6TÆ–W"æg&ÖV'VffW%v–GF‚À –vÄ&6TÆ–W"æg&ÖV'VffW$†V–v‡BÀ —° –f÷&ÖC¢$t$f÷&ÖBÀ —G—S¢Vç6–væVD'—FUG—RÀ –6öÆ÷%76S¢&VæFW&W"æ÷WGWD6öÆ÷%76RÀ —7FVæ6–Ä'VffW#¢GG&–'WFW2ç7FVæ6–ÂÀ —&W6öÇfTFWF„'VffW#¢‚vÄ&6TÆ–W"æ–væ÷&TFWF…fÇVW2ÓÓÒfÇ6R’À —&W6öÇfU7FVæ6–Ä'VffW#¢‚vÄ&6TÆ–W"æ–væ÷&TFWF…fÇVW2ÓÓÒfÇ6R  —Ð ’“°  —ÒVÇ6R°  –ÆWBFWF„f÷&ÖBÒçVÆÃ° –ÆWBFWF…G—RÒçVÆÃ° –ÆWBvÄFWF„f÷&ÖBÒçVÆÃ°  ––b‚GG&–'WFW2æFWF‚’°  –vÄFWF„f÷&ÖBÒGG&–'WFW2ç7FVæ6–ÂòvÂäDUDƒ#Eõ5DTä4”Ã‚¢vÂäDUD…ô4ôÕôäTåC#C° –FWF„f÷&ÖBÒGG&–'WFW2ç7FVæ6–ÂòFWF…7FVæ6–Äf÷&ÖB¢FWF„f÷&ÖC° –FWF…G—RÒGG&–'WFW2ç7FVæ6–ÂòVç6–væVD–çC#C…G—R¢Vç6–væVD–çEG—S°  —Ð  –6öç7B&ö¦V7F–öæÆ–W$–æ—BÒ° –6öÆ÷$f÷&ÖC¢vÂå$t$‚À –FWF„f÷&ÖC¢vÄFWF„f÷&ÖBÀ —66ÆTf7F÷#¢g&ÖV'VffW%66ÆTf7F÷  —Ó°  –vÄ&–æF–ærÒF†—2ævWD&–æF–ær‚“°  –vÅ&ö¤Æ–W"ÒvÄ&–æF–æræ7&VFU&ö¦V7F–öäÆ–W"‚&ö¦V7F–öæÆ–W$–æ—B“°  —6W76–öâçWFFU&VæFW%7FFR‚²Æ–W'3¢²vÅ&ö¤Æ–W"ÒÒ“°  —&VæFW&W"ç6WE—†VÅ&F–ò‚“° —&VæFW&W"ç6WE6—¦R‚vÅ&ö¤Æ–W"çFW‡GW&Uv–GF‚ÂvÅ&ö¤Æ–W"çFW‡GW&T†V–v‡BÂfÇ6R“°  –æWu&VæFW%F&vWBÒæWrvV$tÅ&VæFW%F&vWB€ –vÅ&ö¤Æ–W"çFW‡GW&Uv–GF‚À –vÅ&ö¤Æ–W"çFW‡GW&T†V–v‡BÀ —° –f÷&ÖC¢$t$f÷&ÖBÀ —G—S¢Vç6–væVD'—FUG—RÀ –FWF…FW‡GW&S¢æWrFWF…FW‡GW&R‚vÅ&ö¤Æ–W"çFW‡GW&Uv–GF‚ÂvÅ&ö¤Æ–W"çFW‡GW&T†V–v‡BÂFWF…G—RÂVæFVf–æVBÂVæFVf–æVBÂVæFVf–æVBÂVæFVf–æVBÂVæFVf–æVBÂVæFVf–æVBÂFWF„f÷&ÖB’À —7FVæ6–Ä'VffW#¢GG&–'WFW2ç7FVæ6–ÂÀ –6öÆ÷%76S¢&VæFW&W"æ÷WGWD6öÆ÷%76RÀ —6×ÆW3¢GG&–'WFW2æçF–Æ–2òB¢À —&W6öÇfTFWF„'VffW#¢‚vÅ&ö¤Æ–W"æ–væ÷&TFWF…fÇVW2ÓÓÒfÇ6R’À —&W6öÇfU7FVæ6–Ä'VffW#¢‚vÅ&ö¤Æ–W"æ–væ÷&TFWF…fÇVW2ÓÓÒfÇ6R —Ò“°  —Ð  –æWu&VæFW%F&vWBæ—5…%&VæFW%F&vWBÒG'VS²òòDôDò&VÖ÷fRF†—2v†Vâ÷76–&ÆRÂ6VR3#3#s€  —F†—2ç6WDf÷fVF–öâ‚f÷fVF–öâ“°  –7W7FöÕ&VfW&Væ6U76RÒçVÆÃ° —&VfW&Væ6U76RÒv—B6W76–öâç&WVW7E&VfW&Væ6U76R‚&VfW&Væ6U76UG—R“°  –æ–ÖF–öâç6WD6öçFW‡B‚6W76–öâ“° –æ–ÖF–öâç7F'B‚“°  —66÷Ræ—5&W6VçF–ærÒG'VS°  —66÷RæF—7F6„WfVçB‚²G—S¢w6W76–öç7F'BrÒ“°  —Ð  —Ó°  ’ò¢  ’¢&WGW&ç2F†RVçf—&öæÖVçB&ÆVæBÖöFRg&öÒF†R7W'&VçB…"6W76–öâà ’  ’¢&WGW&â²v÷VRwÂvFF—F—fRwÂvÇ†Ö&ÆVæBwÇVæFVf–æVGÒF†RVçf—&öæÖVçB&ÆVæBÖöFRâ&WGW&ç2VæFVf–æVFv†VâW6VB÷WG6–FRöb…"6W76–öâà ’¢ð —F†—2ævWDVçf—&öæÖVçD&ÆVæDÖöFRÒgVæ7F–öâ‚’°  ––b‚6W76–öâÓÒçVÆÂ’°  —&WGW&â6W76–öâæVçf—&öæÖVçD&ÆVæDÖöFS°  —Ð  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçBFWF‚FW‡GW&R6ö×WFVBf–FWF‚6Vç6–ærà ’  ’¢6VR´Æ–æ²vV%…$FWF…6Vç6–ær6vWDFWF…FW‡GW&WÒà ’  ’¢&WGW&â³õFW‡GW&WÒF†RFWF‚FW‡GW&Rà ’¢ð —F†—2ævWDFWF…FW‡GW&RÒgVæ7F–öâ‚’°  —&WGW&âFWF…6Vç6–ærævWDFWF…FW‡GW&R‚“°  —Ó°  –gVæ7F–öâöä–çWE6÷W&6W46†ævR‚WfVçB’°  ’òòæ÷F–g’F—66öææV7FV@  –f÷"‚ÆWB’Ò²’ÂWfVçBç&VÖ÷fVBæÆVæwFƒ²’²²’°  –6öç7B–çWE6÷W&6RÒWfVçBç&VÖ÷fVE²’Ó° –6öç7B–æFW‚Ò6öçG&öÆÆW$–çWE6÷W&6W2æ–æFW„öb‚–çWE6÷W&6R“°  ––b‚–æFW‚ãÒ’°  –6öçG&öÆÆW$–çWE6÷W&6W5²–æFW‚ÒÒçVÆÃ° –6öçG&öÆÆW'5²–æFW‚ÒæF—66öææV7B‚–çWE6÷W&6R“°  —Ð  —Ð  ’òòæ÷F–g’6öææV7FV@  –f÷"‚ÆWB’Ò²’ÂWfVçBæFFVBæÆVæwFƒ²’²²’°  –6öç7B–çWE6÷W&6RÒWfVçBæFFVE²’Ó°  –ÆWB6öçG&öÆÆW$–æFW‚Ò6öçG&öÆÆW$–çWE6÷W&6W2æ–æFW„öb‚–çWE6÷W&6R“°  ––b‚6öçG&öÆÆW$–æFW‚ÓÓÒÓ’°  ’òò76–vâ–çWB6÷W&6R6öçG&öÆÆW"F†B7W'&VçFÇ’†2æò–çWB6÷W&6P  –f÷"‚ÆWB’Ò²’Â6öçG&öÆÆW'2æÆVæwFƒ²’²²’°  ––b‚’ãÒ6öçG&öÆÆW$–çWE6÷W&6W2æÆVæwF‚’°  –6öçG&öÆÆW$–çWE6÷W&6W2çW6‚‚–çWE6÷W&6R“° –6öçG&öÆÆW$–æFW‚Ò“° –'&V³°  —ÒVÇ6R–b‚6öçG&öÆÆW$–çWE6÷W&6W5²’ÒÓÓÒçVÆÂ’°  –6öçG&öÆÆW$–çWE6÷W&6W5²’ÒÒ–çWE6÷W&6S° –6öçG&öÆÆW$–æFW‚Ò“° –'&V³°  —Ð  —Ð  ’òò–bÆÂ6öçG&öÆÆW'2Fò7W'&VçFÇ’&V6V—fR–çWBvR–væ÷&RæWröæW0  ––b‚6öçG&öÆÆW$–æFW‚ÓÓÒÓ’'&V³°  —Ð  –6öç7B6öçG&öÆÆW"Ò6öçG&öÆÆW'5²6öçG&öÆÆW$–æFW‚Ó°  ––b‚6öçG&öÆÆW"’°  –6öçG&öÆÆW"æ6öææV7B‚–çWE6÷W&6R“°  —Ð  —Ð  —Ð  ’òð  –6öç7B6ÖW&Å÷2ÒæWrfV7F÷#2‚“° –6öç7B6ÖW&%÷2ÒæWrfV7F÷#2‚“°  ’ò¢  ’¢77VÖW2"6ÖW&2F†B&R&ÆÆVÂæB6†&Râ‚Ö†—2ÂæBF†@ ’¢F†R6ÖW&2r&ö¦V7F–öâæBv÷&ÆBÖG&–6W2†fRÇ&VG’&VVâ6WBà ’¢æBF†BæV"æBf"ÆæW2&R–FVçF–6Âf÷"&÷F‚6ÖW&2à ’¢f—7VÆ—¦F–öâöbF†—2FV6†æ—VS¢‡GG3¢òö6ö×WFW&w&†–72ç7F6¶W†6†ævRæ6öÒöóCscP ’  ’¢&Ò´'&”6ÖW&Ò6ÖW&ÒF†R6ÖW&FòWFFRà ’¢&ÒµW'7V7F—fT6ÖW&Ò6ÖW&ÂÒF†RÆVgB6ÖW&à ’¢&ÒµW'7V7F—fT6ÖW&Ò6ÖW&"ÒF†R&–v‡B6ÖW&à ’¢ð –gVæ7F–öâ6WE&ö¦V7F–öäg&öÕVæ–öâ‚6ÖW&Â6ÖW&ÂÂ6ÖW&"’°  –6ÖW&Å÷2ç6WDg&öÔÖG&—…÷6—F–öâ‚6ÖW&ÂæÖG&—…v÷&ÆB“° –6ÖW&%÷2ç6WDg&öÔÖG&—…÷6—F–öâ‚6ÖW&"æÖG&—…v÷&ÆB“°  –6öç7B—BÒ6ÖW&Å÷2æF—7Fæ6UFò‚6ÖW&%÷2“°  –6öç7B&ö¤ÂÒ6ÖW&Âç&ö¦V7F–öäÖG&—‚æVÆVÖVçG3° –6öç7B&ö¥"Ò6ÖW&"ç&ö¦V7F–öäÖG&—‚æVÆVÖVçG3°  ’òòe"7—7FV×2v–ÆÂ†fR–FVçF–6Âf"æBæV"ÆæW2Âæ@ ’òòÖ÷7BÆ–¶VÇ’–FVçF–6ÂF÷æB&÷GFöÒg'W7GVÒW‡FVçG2à ’òòW6RF†RÆVgB6ÖW&f÷"F†W6RfÇVW2à –6öç7BæV"Ò&ö¤Å²BÒò‚&ö¤Å²ÒÒ“° –6öç7Bf"Ò&ö¤Å²BÒò‚&ö¤Å²Ò²“° –6öç7BF÷f÷bÒ‚&ö¤Å²’Ò²’ò&ö¤Å²RÓ° –6öç7B&÷GFöÔf÷bÒ‚&ö¤Å²’ÒÒ’ò&ö¤Å²RÓ°  –6öç7BÆVgDf÷bÒ‚&ö¤Å²‚ÒÒ’ò&ö¤Å²Ó° –6öç7B&–v‡Df÷bÒ‚&ö¥%²‚Ò²’ò&ö¥%²Ó° –6öç7BÆVgBÒæV"¢ÆVgDf÷c° –6öç7B&–v‡BÒæV"¢&–v‡Df÷c°  ’òò6Æ7VÆFRF†RæWr6ÖW&w2÷6—F–öâöfg6WBg&öÒF†P ’òòÆVgB6ÖW&â„öfg6WB6†÷VÆB&R&÷Vv†Ç’†Æb—Fà –6öç7B¤öfg6WBÒ—Bò‚ÒÆVgDf÷b²&–v‡Df÷b“° –6öç7B„öfg6WBÒ¤öfg6WB¢ÒÆVgDf÷c°  ’òòDôDó¢&WGFW"v’FòÇ’F†—2öfg6WCð –6ÖW&ÂæÖG&—…v÷&ÆBæFV6ö×÷6R‚6ÖW&ç÷6—F–öâÂ6ÖW&çVFW&æ–öâÂ6ÖW&ç66ÆR“° –6ÖW&çG&ç6ÆFU‚‚„öfg6WB“° –6ÖW&çG&ç6ÆFU¢‚¤öfg6WB“° –6ÖW&æÖG&—…v÷&ÆBæ6ö×÷6R‚6ÖW&ç÷6—F–öâÂ6ÖW&çVFW&æ–öâÂ6ÖW&ç66ÆR“° –6ÖW&æÖG&—…v÷&ÆD–çfW'6Ræ6÷’‚6ÖW&æÖG&—…v÷&ÆB’æ–çfW'B‚“°  ’òò6†V6²–bF†R&ö¦V7F–öâW6W2â–æf–æ—FRf"ÆæRà ––b‚&ö¤Å²ÒÓÓÒÓ’°  ’òòW6RF†R&ö¦V7F–öâÖG&—‚g&öÒF†RÆVgBW–Rà ’òòF†R6ÖW&öfg6WB—27Vff–6–VçBFò–æ6ÇVFRF†Rf–WrföÇVÖW0 ’òòöb&÷F‚W–W2†77VÖ–ær7–ÖÖWG&–2&ö¦V7F–öç2’à –6ÖW&ç&ö¦V7F–öäÖG&—‚æ6÷’‚6ÖW&Âç&ö¦V7F–öäÖG&—‚“° –6ÖW&ç&ö¦V7F–öäÖG&—„–çfW'6Ræ6÷’‚6ÖW&Âç&ö¦V7F–öäÖG&—„–çfW'6R“°  —ÒVÇ6R°  ’òòf–æBF†RVæ–öâöbF†Rg'W7GVÒfÇVW2öbF†R6ÖW&2æB66ÆP ’òòF†RfÇVW26òF†BF†RæV"ÆæRw2÷6—F–öâFöW2æ÷B6†ævR–âv÷&ÆB76RÀ ’òòÇF†÷Vv‚×W7Bæ÷r&R&VÆF—fRFòF†RæWrVæ–öâ6ÖW&à –6öç7BæV#"ÒæV"²¤öfg6WC° –6öç7Bf#"Òf"²¤öfg6WC° –6öç7BÆVgC"ÒÆVgBÒ„öfg6WC° –6öç7B&–v‡C"Ò&–v‡B²‚—BÒ„öfg6WB“° –6öç7BF÷"ÒF÷f÷b¢f"òf#"¢æV##° –6öç7B&÷GFöÓ"Ò&÷GFöÔf÷b¢f"òf#"¢æV##°  –6ÖW&ç&ö¦V7F–öäÖG&—‚æÖ¶UW'7V7F—fR‚ÆVgC"Â&–v‡C"ÂF÷"Â&÷GFöÓ"ÂæV#"Âf#"“° –6ÖW&ç&ö¦V7F–öäÖG&—„–çfW'6Ræ6÷’‚6ÖW&ç&ö¦V7F–öäÖG&—‚’æ–çfW'B‚“°  —Ð  —Ð  –gVæ7F–öâWFFT6ÖW&‚6ÖW&Â&VçB’°  ––b‚&VçBÓÓÒçVÆÂ’°  –6ÖW&æÖG&—…v÷&ÆBæ6÷’‚6ÖW&æÖG&—‚“°  —ÒVÇ6R°  –6ÖW&æÖG&—…v÷&ÆBæ×VÇF—Ç”ÖG&–6W2‚&VçBæÖG&—…v÷&ÆBÂ6ÖW&æÖG&—‚“°  —Ð  –6ÖW&æÖG&—…v÷&ÆD–çfW'6Ræ6÷’‚6ÖW&æÖG&—…v÷&ÆB’æ–çfW'B‚“°  —Ð  ’ò¢  ’¢WFFW2F†R7FFRöbF†R…"6ÖW&âW6RF†—2ÖWF†öBöâÆWfVÂ–b–÷P ’¢6WB6ÖW&WFõWFFVFòfÇ6VâF†RÖWF†öB&WV—&W2F†RæöâÕ…  ’¢6ÖW&öbF†R66VæR2&ÖWFW"âF†R76VB–â6ÖW&w2G&ç6f÷&ÖF–öà ’¢—2WFöÖF–6ÆÇ’F§W7FVBFòF†R÷6—F–öâöbF†R…"6ÖW&v†Vâ6ÆÆ–æp ’¢F†—2ÖWF†öBà ’  ’¢&Ò´6ÖW&Ò6ÖW&ÒF†R6ÖW&à ’¢ð —F†—2çWFFT6ÖW&ÒgVæ7F–öâ‚6ÖW&’°  ––b‚6W76–öâÓÓÒçVÆÂ’&WGW&ã°  –ÆWBFWF„æV"Ò6ÖW&ææV#° –ÆWBFWF„f"Ò6ÖW&æf#°  ––b‚FWF…6Vç6–ærçFW‡GW&RÓÒçVÆÂ’°  ––b‚FWF…6Vç6–æræFWF„æV"â’FWF„æV"ÒFWF…6Vç6–æræFWF„æV#° ––b‚FWF…6Vç6–æræFWF„f"â’FWF„f"ÒFWF…6Vç6–æræFWF„f#°  —Ð  –6ÖW&…"ææV"Ò6ÖW&"ææV"Ò6ÖW&ÂææV"ÒFWF„æV#° –6ÖW&…"æf"Ò6ÖW&"æf"Ò6ÖW&Âæf"ÒFWF„f#°  ––b‚ö7W'&VçDFWF„æV"ÓÒ6ÖW&…"ææV"ÇÂö7W'&VçDFWF„f"ÓÒ6ÖW&…"æf"’°  ’òòæ÷FRF†BF†RæWr&VæFW%7FFRvöâwBÇ’VçF–ÂF†RæW‡Bg&ÖRâ6VR3ƒ3#   —6W76–öâçWFFU&VæFW%7FFR‚° –FWF„æV#¢6ÖW&…"ææV"À –FWF„f#¢6ÖW&…"æf  —Ò“°  •ö7W'&VçDFWF„æV"Ò6ÖW&…"ææV#° •ö7W'&VçDFWF„f"Ò6ÖW&…"æf#°  —Ð  ’òò–æ†W&—B6ÖW&Æ–W'2æBVæ&ÆRW–RÆ–W'2ƒÒÆVgBÂ"Ò&–v‡B –6ÖW&…"æÆ–W'2æÖ6²Ò6ÖW&æÆ–W'2æÖ6²Â#° –6ÖW&ÂæÆ–W'2æÖ6²Ò6ÖW&…"æÆ–W'2æÖ6²b#° –6ÖW&"æÆ–W'2æÖ6²Ò6ÖW&…"æÆ–W'2æÖ6²b#°  –6öç7B&VçBÒ6ÖW&ç&VçC° –6öç7B6ÖW&2Ò6ÖW&…"æ6ÖW&3°  —WFFT6ÖW&‚6ÖW&…"Â&VçB“°  –f÷"‚ÆWB’Ò²’Â6ÖW&2æÆVæwFƒ²’²²’°  —WFFT6ÖW&‚6ÖW&5²’ÒÂ&VçB“°  —Ð  ’òòWFFR&ö¦V7F–öâÖG&—‚f÷"&÷W"f–Wrg'W7GVÒ7VÆÆ–æp  ––b‚6ÖW&2æÆVæwF‚ÓÓÒ"’°  —6WE&ö¦V7F–öäg&öÕVæ–öâ‚6ÖW&…"Â6ÖW&ÂÂ6ÖW&"“°  —ÒVÇ6R°  ’òò77VÖR6–ævÆR6ÖW&6WGW„"  –6ÖW&…"ç&ö¦V7F–öäÖG&—‚æ6÷’‚6ÖW&Âç&ö¦V7F–öäÖG&—‚“°  —Ð  ’òòWFFRW6W"6ÖW&æB—G26†–ÆG&Và  —WFFUW6W$6ÖW&‚6ÖW&Â6ÖW&…"Â&VçB“°  —Ó°  –gVæ7F–öâWFFUW6W$6ÖW&‚6ÖW&Â6ÖW&…"Â&VçB’°  ––b‚&VçBÓÓÒçVÆÂ’°  –6ÖW&æÖG&—‚æ6÷’‚6ÖW&…"æÖG&—…v÷&ÆB“°  —ÒVÇ6R°  –6ÖW&æÖG&—‚æ6÷’‚&VçBæÖG&—…v÷&ÆB“° –6ÖW&æÖG&—‚æ–çfW'B‚“° –6ÖW&æÖG&—‚æ×VÇF—Ç’‚6ÖW&…"æÖG&—…v÷&ÆB“°  —Ð  –6ÖW&æÖG&—‚æFV6ö×÷6R‚6ÖW&ç÷6—F–öâÂ6ÖW&çVFW&æ–öâÂ6ÖW&ç66ÆR“° –6ÖW&çWFFTÖG&—…v÷&ÆB‚G'VR“°  –6ÖW&ç&ö¦V7F–öäÖG&—‚æ6÷’‚6ÖW&…"ç&ö¦V7F–öäÖG&—‚“° –6ÖW&ç&ö¦V7F–öäÖG&—„–çfW'6Ræ6÷’‚6ÖW&…"ç&ö¦V7F–öäÖG&—„–çfW'6R“°  ––b‚6ÖW&æ—5W'7V7F—fT6ÖW&’°  –6ÖW&æf÷bÒ$C$DTr¢"¢ÖF‚æFâ‚ò6ÖW&ç&ö¦V7F–öäÖG&—‚æVÆVÖVçG5²RÒ“° –6ÖW&ç¦ööÒÒ°  —Ð  —Ð  ’ò¢  ’¢&WGW&ç2â–ç7Fæ6Röb´Æ–æ²'&”6ÖW&Òv†–6‚&W&W6VçG2F†R…"6ÖW& ’¢öbF†R7F—fR…"6W76–öââf÷"V6‚f–Wr—B†öÆG26W&FR6ÖW&ö&¦V7Bà ’  ’¢F†R6ÖW&w2f÷f—27W'&VçFÇ’æ÷BW6VBæBFöW2æ÷B&VfÆV7BF†Rf÷bö` ’¢F†R…"6ÖW&â–b–÷RæVVBF†Rf÷böâÆWfVÂÂ–÷R†fRFò6ö×WFR–à ’¢ÖçVÆÇ’g&öÒF†R…"6ÖW&w2&ö¦V7F–öâÖG&–6W2à ’  ’¢&WGW&â´'&”6ÖW&ÒF†R…"6ÖW&à ’¢ð —F†—2ævWD6ÖW&ÒgVæ7F–öâ‚’°  —&WGW&â6ÖW&…#°  —Ó°  ’ò¢  ’¢&WGW&ç2F†RÖ÷VçBöbf÷fVF–öâW6VB'’F†R…"6ö×÷6—F÷"f÷"F†R&ö¦V7F–öâÆ–W"à ’  ’¢&WGW&â¶çVÖ&W'ÇVæFVf–æVGÒF†RÖ÷VçBöbf÷fVF–öâà ’¢ð —F†—2ævWDf÷fVF–öâÒgVæ7F–öâ‚’°  ––b‚vÅ&ö¤Æ–W"ÓÓÒçVÆÂbbvÄ&6TÆ–W"ÓÓÒçVÆÂ’°  —&WGW&âVæFVf–æVC°  —Ð  —&WGW&âf÷fVF–öã°  —Ó°  ’ò¢  ’¢6WG2F†Rf÷fVF–öâfÇVRà ’  ’¢&Ò¶çVÖ&W'ÒfÇVRÒçVÖ&W"–âF†R&ævR³ÃÖv†W&RÖVç2æòf÷fVF–öâ†gVÆÂ&W6öÇWF–öâ ’¢æBÖVç2Ö†–×VÒf÷fVF–öâ‡F†RVFvW2&VæFW"BÆ÷vW"&W6öÇWF–öâ’à ’¢ð —F†—2ç6WDf÷fVF–öâÒgVæ7F–öâ‚fÇVR’°  ’òòÒæòf÷fVF–öâÒgVÆÂ&W6öÇWF–öà ’òòÒÖ†–×VÒf÷fVF–öâÒF†RVFvW2&VæFW"BÆ÷vW"&W6öÇWF–öà  –f÷fVF–öâÒfÇVS°  ––b‚vÅ&ö¤Æ–W"ÓÒçVÆÂ’°  –vÅ&ö¤Æ–W"æf—†VDf÷fVF–öâÒfÇVS°  —Ð  ––b‚vÄ&6TÆ–W"ÓÒçVÆÂbbvÄ&6TÆ–W"æf—†VDf÷fVF–öâÓÒVæFVf–æVB’°  –vÄ&6TÆ–W"æf—†VDf÷fVF–öâÒfÇVS°  —Ð  —Ó°  ’ò¢  ’¢&WGW&ç2G'VV–bFWF‚6Vç6–ær—27W÷'FVBà ’  ’¢&WGW&â¶&ööÆVçÒv†WF†W"FWF‚6Vç6–ær—27W÷'FVB÷"æ÷Bà ’¢ð —F†—2æ†4FWF…6Vç6–ærÒgVæ7F–öâ‚’°  —&WGW&âFWF…6Vç6–ærçFW‡GW&RÓÒçVÆÃ°  —Ó°  ’ò¢  ’¢&WGW&ç2F†RFWF‚6Vç6–ærÖW6‚à ’  ’¢6VR´Æ–æ²vV%…$FWF…6Vç6–ær6vWDÖW6‡Òà ’  ’¢&WGW&â´ÖW6‡ÒF†RFWF‚6Vç6–ærÖW6‚à ’¢ð —F†—2ævWDFWF…6Vç6–ætÖW6‚ÒgVæ7F–öâ‚’°  —&WGW&âFWF…6Vç6–ærævWDÖW6‚‚6ÖW&…"“°  —Ó°  ’ò¢  ’¢&WG&–WfW2â÷VRFW‡GW&Rg&öÒF†Rf–WrÖÆ–væVB´Æ–æ²…$6ÖW&Òà ’¢öæÇ’f–Æ&ÆRGW&–ærF†R7W'&VçBæ–ÖF–öâÆö÷à ’  ’¢&Òµ…$6ÖW&Ò‡$6ÖW&ÒF†R6ÖW&FòVW'’à ’¢&WGW&â³õFW‡GW&WÒâ÷VRFW‡GW&R&W&W6VçF–ærF†R7W'&VçB&r6ÖW&g&ÖRà ’¢ð —F†—2ævWD6ÖW&FW‡GW&RÒgVæ7F–öâ‚‡$6ÖW&’°  —&WGW&â6ÖW&66W75FW‡GW&W5²‡$6ÖW&Ó°  —Ó°  ’òòæ–ÖF–öâÆö÷   –ÆWBöäæ–ÖF–öäg&ÖT6ÆÆ&6²ÒçVÆÃ°  –gVæ7F–öâöäæ–ÖF–öäg&ÖR‚F–ÖRÂg&ÖR’°  —÷6RÒg&ÖRævWEf–WvW%÷6R‚7W7FöÕ&VfW&Væ6U76RÇÂ&VfW&Væ6U76R“° —‡$g&ÖRÒg&ÖS°  ––b‚÷6RÓÒçVÆÂ’°  –6öç7Bf–Ww2Ò÷6Rçf–Ww3°  ––b‚vÄ&6TÆ–W"ÓÒçVÆÂ’°  —&VæFW&W"ç6WE&VæFW%F&vWDg&ÖV'VffW"‚æWu&VæFW%F&vWBÂvÄ&6TÆ–W"æg&ÖV'VffW"“° —&VæFW&W"ç6WE&VæFW%F&vWB‚æWu&VæFW%F&vWB“°  —Ð  –ÆWB6ÖW&…$æVVG5WFFRÒfÇ6S°  ’òò6†V6²–b—Bw2æV6W76'’Fò&V'V–ÆB6ÖW&…"w26ÖW&Æ—7@  ––b‚f–Ww2æÆVæwF‚ÓÒ6ÖW&…"æ6ÖW&2æÆVæwF‚’°  –6ÖW&…"æ6ÖW&2æÆVæwF‚Ò° –6ÖW&…$æVVG5WFFRÒG'VS°  —Ð  –f÷"‚ÆWB’Ò²’Âf–Ww2æÆVæwFƒ²’²²’°  –6öç7Bf–WrÒf–Ww5²’Ó°  –ÆWBf–Ww÷'BÒçVÆÃ°  ––b‚vÄ&6TÆ–W"ÓÒçVÆÂ’°  —f–Ww÷'BÒvÄ&6TÆ–W"ævWEf–Ww÷'B‚f–Wr“°  —ÒVÇ6R°  –6öç7BvÅ7V$–ÖvRÒvÄ&–æF–ærævWEf–Wu7V$–ÖvR‚vÅ&ö¤Æ–W"Âf–Wr“° —f–Ww÷'BÒvÅ7V$–ÖvRçf–Ww÷'C°  ’òòf÷"6–FRÖ'’×6–FR&ö¦V7F–öâÂvRöæÇ’&öGV6R6–ævÆRFW‡GW&Rf÷"&÷F‚W–W2à ––b‚’ÓÓÒ’°  —&VæFW&W"ç6WE&VæFW%F&vWEFW‡GW&W2€ –æWu&VæFW%F&vWBÀ –vÅ7V$–ÖvRæ6öÆ÷%FW‡GW&RÀ –vÅ7V$–ÖvRæFWF…7FVæ6–ÅFW‡GW&R“°  —&VæFW&W"ç6WE&VæFW%F&vWB‚æWu&VæFW%F&vWB“°  —Ð  —Ð  –ÆWB6ÖW&Ò6ÖW&5²’Ó°  ––b‚6ÖW&ÓÓÒVæFVf–æVB’°  –6ÖW&ÒæWrW'7V7F—fT6ÖW&‚“° –6ÖW&æÆ–W'2æVæ&ÆR‚’“° –6ÖW&çf–Ww÷'BÒæWrfV7F÷#B‚“° –6ÖW&5²’ÒÒ6ÖW&°  —Ð  –6ÖW&æÖG&—‚æg&öÔ'&’‚f–WrçG&ç6f÷&ÒæÖG&—‚“° –6ÖW&æÖG&—‚æFV6ö×÷6R‚6ÖW&ç÷6—F–öâÂ6ÖW&çVFW&æ–öâÂ6ÖW&ç66ÆR“° –6ÖW&ç&ö¦V7F–öäÖG&—‚æg&öÔ'&’‚f–Wrç&ö¦V7F–öäÖG&—‚“° –6ÖW&ç&ö¦V7F–öäÖG&—„–çfW'6Ræ6÷’‚6ÖW&ç&ö¦V7F–öäÖG&—‚’æ–çfW'B‚“° –6ÖW&çf–Ww÷'Bç6WB‚f–Ww÷'Bç‚Âf–Ww÷'Bç’Âf–Ww÷'Bçv–GF‚Âf–Ww÷'Bæ†V–v‡B“°  ––b‚’ÓÓÒ’°  –6ÖW&…"æÖG&—‚æ6÷’‚6ÖW&æÖG&—‚“° –6ÖW&…"æÖG&—‚æFV6ö×÷6R‚6ÖW&…"ç÷6—F–öâÂ6ÖW&…"çVFW&æ–öâÂ6ÖW&…"ç66ÆR“°  —Ð  ––b‚6ÖW&…$æVVG5WFFRÓÓÒG'VR’°  –6ÖW&…"æ6ÖW&2çW6‚‚6ÖW&“°  —Ð  —Ð  ’òð  –6öç7BVæ&ÆVDfVGW&W2Ò6W76–öâæVæ&ÆVDfVGW&W3° –6öç7BwTFWF…6Vç6–ætVæ&ÆVBÒVæ&ÆVDfVGW&W2b` –Væ&ÆVDfVGW&W2æ–æ6ÇVFW2‚vFWF‚×6Vç6–ærr’b` —6W76–öâæFWF…W6vRÓÒvwRÖ÷F–Ö—¦VBs°  ––b‚wTFWF…6Vç6–ætVæ&ÆVBbb7W÷'G4vÄ&–æF–ær’°  –vÄ&–æF–ærÒ66÷RævWD&–æF–ær‚“°  –6öç7BFWF„FFÒvÄ&–æF–ærævWDFWF„–æf÷&ÖF–öâ‚f–Ww5²Ò“°  ––b‚FWF„FFbbFWF„FFæ—5fÆ–BbbFWF„FFçFW‡GW&R’°  –FWF…6Vç6–æræ–æ—B‚FWF„FFÂ6W76–öâç&VæFW%7FFR“°  —Ð  —Ð  –6öç7B6ÖW&66W74Væ&ÆVBÒVæ&ÆVDfVGW&W2b` ’Væ&ÆVDfVGW&W2æ–æ6ÇVFW2‚v6ÖW&Ö66W72r“°  ––b‚6ÖW&66W74Væ&ÆVBbb7W÷'G4vÄ&–æF–ær’°  —&VæFW&W"ç7FFRçVæ&–æEFW‡GW&R‚“°  –vÄ&–æF–ærÒ66÷RævWD&–æF–ær‚“°  –f÷"‚ÆWB’Ò²’Âf–Ww2æÆVæwFƒ²’²²’°  –6öç7B6ÖW&Òf–Ww5²’Òæ6ÖW&°  ––b‚6ÖW&’°  –ÆWB6ÖW&FW‚Ò6ÖW&66W75FW‡GW&W5²6ÖW&Ó°  ––b‚6ÖW&FW‚’°  –6ÖW&FW‚ÒæWrW‡FW&æÅFW‡GW&R‚“° –6ÖW&66W75FW‡GW&W5²6ÖW&ÒÒ6ÖW&FWƒ°  —Ð  –6öç7BvÅFW‡GW&RÒvÄ&–æF–ærævWD6ÖW&–ÖvR‚6ÖW&“° –6ÖW&FW‚ç6÷W&6UFW‡GW&RÒvÅFW‡GW&S°  —Ð  —Ð  —Ð  —Ð  ’òð  –f÷"‚ÆWB’Ò²’Â6öçG&öÆÆW'2æÆVæwFƒ²’²²’°  –6öç7B–çWE6÷W&6RÒ6öçG&öÆÆW$–çWE6÷W&6W5²’Ó° –6öç7B6öçG&öÆÆW"Ò6öçG&öÆÆW'5²’Ó°  ––b‚–çWE6÷W&6RÓÒçVÆÂbb6öçG&öÆÆW"ÓÒVæFVf–æVB’°  –6öçG&öÆÆW"çWFFR‚–çWE6÷W&6RÂg&ÖRÂ7W7FöÕ&VfW&Væ6U76RÇÂ&VfW&Væ6U76R“°  —Ð  —Ð  ––b‚öäæ–ÖF–öäg&ÖT6ÆÆ&6²’öäæ–ÖF–öäg&ÖT6ÆÆ&6²‚F–ÖRÂg&ÖR“°  ––b‚g&ÖRæFWFV7FVEÆæW2’°  —66÷RæF—7F6„WfVçB‚²G—S¢wÆæW6FWFV7FVBrÂFF¢g&ÖRÒ“°  —Ð  —‡$g&ÖRÒçVÆÃ°  —Ð  –6öç7Bæ–ÖF–öâÒæWrvV$tÄæ–ÖF–öâ‚“°  –æ–ÖF–öâç6WDæ–ÖF–öäÆö÷‚öäæ–ÖF–öäg&ÖR“°  —F†—2ç6WDæ–ÖF–öäÆö÷ÒgVæ7F–öâ‚6ÆÆ&6²’°  –öäæ–ÖF–öäg&ÖT6ÆÆ&6²Ò6ÆÆ&6³°  —Ó°  —F†—2æF—7÷6RÒgVæ7F–öâ‚’·Ó°  —Ð §Ð ¦6öç7BöSÒò¤õõU$Uõò¢òæWrWVÆW"‚“°¦6öç7BöÓÒò¤õõU$Uõò¢òæWrÖG&—ƒB‚“° ¦gVæ7F–öâvV$tÄÖFW&–Ç2‚&VæFW&W"Â&÷W'F–W2’°  –gVæ7F–öâ&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖÂVæ–f÷&Ò’°  ––b‚ÖæÖG&—„WFõWFFRÓÓÒG'VR’°  –ÖçWFFTÖG&—‚‚“°  —Ð  —Væ–f÷&ÒçfÇVRæ6÷’‚ÖæÖG&—‚“°  —Ð  –gVæ7F–öâ&Vg&W6„föuVæ–f÷&×2‚Væ–f÷&×2Âför’°  –föræ6öÆ÷"ævWE$t"‚Væ–f÷&×2æföt6öÆ÷"çfÇVRÂvWEVæÆ—EVæ–f÷&Ô6öÆ÷%76R‚&VæFW&W"’“°  ––b‚föræ—4för’°  —Væ–f÷&×2æfötæV"çfÇVRÒförææV#° —Væ–f÷&×2æfötf"çfÇVRÒföræf#°  —ÒVÇ6R–b‚föræ—4fötW‡"’°  —Væ–f÷&×2æfötFVç6—G’çfÇVRÒföræFVç6—G“°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6„ÖFW&–ÅVæ–f÷&×2‚Væ–f÷&×2ÂÖFW&–ÂÂ—†VÅ&F–òÂ†V–v‡BÂG&ç6Ö—76–öå&VæFW%F&vWB’°  ––b‚ÖFW&–Âæ—4ÖW6„&6–4ÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6„ÆÖ&W'DÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6…FööäÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“° —&Vg&W6…Væ–f÷&×5Fööâ‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6…†öætÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“° —&Vg&W6…Væ–f÷&×5†öær‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6…7FæF&DÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“° —&Vg&W6…Væ–f÷&×57FæF&B‚Væ–f÷&×2ÂÖFW&–Â“°  ––b‚ÖFW&–Âæ—4ÖW6…‡—6–6ÄÖFW&–Â’°  —&Vg&W6…Væ–f÷&×5‡—6–6Â‚Væ–f÷&×2ÂÖFW&–ÂÂG&ç6Ö—76–öå&VæFW%F&vWB“°  —Ð  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6„ÖF6ÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“° —&Vg&W6…Væ–f÷&×4ÖF6‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6„FWF„ÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6„F—7Fæ6TÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“° —&Vg&W6…Væ–f÷&×4F—7Fæ6R‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4ÖW6„æ÷&ÖÄÖFW&–Â’°  —&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—4Æ–æT&6–4ÖFW&–Â’°  —&Vg&W6…Væ–f÷&×4Æ–æR‚Væ–f÷&×2ÂÖFW&–Â“°  ––b‚ÖFW&–Âæ—4Æ–æTF6†VDÖFW&–Â’°  —&Vg&W6…Væ–f÷&×4F6‚‚Væ–f÷&×2ÂÖFW&–Â“°  —Ð  —ÒVÇ6R–b‚ÖFW&–Âæ—5ö–çG4ÖFW&–Â’°  —&Vg&W6…Væ–f÷&×5ö–çG2‚Væ–f÷&×2ÂÖFW&–ÂÂ—†VÅ&F–òÂ†V–v‡B“°  —ÒVÇ6R–b‚ÖFW&–Âæ—57&—FTÖFW&–Â’°  —&Vg&W6…Væ–f÷&×57&—FW2‚Væ–f÷&×2ÂÖFW&–Â“°  —ÒVÇ6R–b‚ÖFW&–Âæ—56†F÷tÖFW&–Â’°  —Væ–f÷&×2æ6öÆ÷"çfÇVRæ6÷’‚ÖFW&–Âæ6öÆ÷"“° —Væ–f÷&×2æ÷6—G’çfÇVRÒÖFW&–Âæ÷6—G“°  —ÒVÇ6R–b‚ÖFW&–Âæ—56†FW$ÖFW&–Â’°  –ÖFW&–ÂçVæ–f÷&×4æVVEWFFRÒfÇ6S²òò3SSƒ  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×46öÖÖöâ‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2æ÷6—G’çfÇVRÒÖFW&–Âæ÷6—G“°  ––b‚ÖFW&–Âæ6öÆ÷"’°  —Væ–f÷&×2æF–fgW6RçfÇVRæ6÷’‚ÖFW&–Âæ6öÆ÷"“°  —Ð  ––b‚ÖFW&–ÂæVÖ—76—fR’°  —Væ–f÷&×2æVÖ—76—fRçfÇVRæ6÷’‚ÖFW&–ÂæVÖ—76—fR’æ×VÇF—Ç•66Æ"‚ÖFW&–ÂæVÖ—76—fT–çFVç6—G’“°  —Ð  ––b‚ÖFW&–ÂæÖ’°  —Væ–f÷&×2æÖçfÇVRÒÖFW&–ÂæÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÖÂVæ–f÷&×2æÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†Ö’°  —Væ–f÷&×2æÇ†ÖçfÇVRÒÖFW&–ÂæÇ†Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÇ†ÖÂVæ–f÷&×2æÇ†ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âæ'V×Ö’°  —Væ–f÷&×2æ'V×ÖçfÇVRÒÖFW&–Âæ'V×Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ'V×ÖÂVæ–f÷&×2æ'V×ÖG&ç6f÷&Ò“°  —Væ–f÷&×2æ'V×66ÆRçfÇVRÒÖFW&–Âæ'V×66ÆS°  ––b‚ÖFW&–Âç6–FRÓÓÒ&6µ6–FR’°  —Væ–f÷&×2æ'V×66ÆRçfÇVR£ÒÓ°  —Ð  —Ð  ––b‚ÖFW&–Âææ÷&ÖÄÖ’°  —Væ–f÷&×2ææ÷&ÖÄÖçfÇVRÒÖFW&–Âææ÷&ÖÄÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âææ÷&ÖÄÖÂVæ–f÷&×2ææ÷&ÖÄÖG&ç6f÷&Ò“°  —Væ–f÷&×2ææ÷&ÖÅ66ÆRçfÇVRæ6÷’‚ÖFW&–Âææ÷&ÖÅ66ÆR“°  ––b‚ÖFW&–Âç6–FRÓÓÒ&6µ6–FR’°  —Væ–f÷&×2ææ÷&ÖÅ66ÆRçfÇVRææVvFR‚“°  —Ð  —Ð  ––b‚ÖFW&–ÂæF—7Æ6VÖVçDÖ’°  —Væ–f÷&×2æF—7Æ6VÖVçDÖçfÇVRÒÖFW&–ÂæF—7Æ6VÖVçDÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæF—7Æ6VÖVçDÖÂVæ–f÷&×2æF—7Æ6VÖVçDÖG&ç6f÷&Ò“°  —Væ–f÷&×2æF—7Æ6VÖVçE66ÆRçfÇVRÒÖFW&–ÂæF—7Æ6VÖVçE66ÆS° —Væ–f÷&×2æF—7Æ6VÖVçD&–2çfÇVRÒÖFW&–ÂæF—7Æ6VÖVçD&–3°  —Ð  ––b‚ÖFW&–ÂæVÖ—76—fTÖ’°  —Væ–f÷&×2æVÖ—76—fTÖçfÇVRÒÖFW&–ÂæVÖ—76—fTÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæVÖ—76—fTÖÂVæ–f÷&×2æVÖ—76—fTÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âç7V7VÆ$Ö’°  —Væ–f÷&×2ç7V7VÆ$ÖçfÇVRÒÖFW&–Âç7V7VÆ$Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç7V7VÆ$ÖÂVæ–f÷&×2ç7V7VÆ$ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†FW7Bâ’°  —Væ–f÷&×2æÇ†FW7BçfÇVRÒÖFW&–ÂæÇ†FW7C°  —Ð  –6öç7BÖFW&–Å&÷W'F–W2Ò&÷W'F–W2ævWB‚ÖFW&–Â“°  –6öç7BVçdÖÒÖFW&–Å&÷W'F–W2æVçdÖ° –6öç7BVçdÖ&÷FF–öâÒÖFW&–Å&÷W'F–W2æVçdÖ&÷FF–öã°  ––b‚VçdÖ’°  —Væ–f÷&×2æVçdÖçfÇVRÒVçdÖ°  •öSæ6÷’‚VçdÖ&÷FF–öâ“°  ’òò66öÖÖöFFRÆVgBÖ†æFVBg&ÖP •öSç‚£ÒÓ²öSç’£ÒÓ²öSç¢£ÒÓ°  ––b‚VçdÖæ—47V&UFW‡GW&RbbVçdÖæ—5&VæFW%F&vWEFW‡GW&RÓÓÒfÇ6R’°  ’òòVçf—&öæÖVçBÖ2v†–6‚&Ræ÷B7V&R&VæFW"F&vWG2÷"Õ$T×2föÆÆ÷rF–ffW&VçB6öçfVçF–öà •öSç’£ÒÓ° •öSç¢£ÒÓ°  —Ð  —Væ–f÷&×2æVçdÖ&÷FF–öâçfÇVRç6WDg&öÔÖG&—ƒB‚öÓæÖ¶U&÷FF–öäg&öÔWVÆW"‚öS’“°  —Væ–f÷&×2æfÆ—VçdÖçfÇVRÒ‚VçdÖæ—47V&UFW‡GW&RbbVçdÖæ—5&VæFW%F&vWEFW‡GW&RÓÓÒfÇ6R’òÓ¢°  —Væ–f÷&×2ç&VfÆV7F—f—G’çfÇVRÒÖFW&–Âç&VfÆV7F—f—G“° —Væ–f÷&×2æ–÷"çfÇVRÒÖFW&–Âæ–÷#° —Væ–f÷&×2ç&Vg&7F–öå&F–òçfÇVRÒÖFW&–Âç&Vg&7F–öå&F–ó°  —Ð  ––b‚ÖFW&–ÂæÆ–v‡DÖ’°  —Væ–f÷&×2æÆ–v‡DÖçfÇVRÒÖFW&–ÂæÆ–v‡DÖ° —Væ–f÷&×2æÆ–v‡DÖ–çFVç6—G’çfÇVRÒÖFW&–ÂæÆ–v‡DÖ–çFVç6—G“°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÆ–v‡DÖÂVæ–f÷&×2æÆ–v‡DÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæôÖ’°  —Væ–f÷&×2æôÖçfÇVRÒÖFW&–ÂæôÖ° —Væ–f÷&×2æôÖ–çFVç6—G’çfÇVRÒÖFW&–ÂæôÖ–çFVç6—G“°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæôÖÂVæ–f÷&×2æôÖG&ç6f÷&Ò“°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×4Æ–æR‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2æF–fgW6RçfÇVRæ6÷’‚ÖFW&–Âæ6öÆ÷"“° —Væ–f÷&×2æ÷6—G’çfÇVRÒÖFW&–Âæ÷6—G“°  ––b‚ÖFW&–ÂæÖ’°  —Væ–f÷&×2æÖçfÇVRÒÖFW&–ÂæÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÖÂVæ–f÷&×2æÖG&ç6f÷&Ò“°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×4F6‚‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2æF6…6—¦RçfÇVRÒÖFW&–ÂæF6…6—¦S° —Væ–f÷&×2çF÷FÅ6—¦RçfÇVRÒÖFW&–ÂæF6…6—¦R²ÖFW&–Âæv6—¦S° —Væ–f÷&×2ç66ÆRçfÇVRÒÖFW&–Âç66ÆS°  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×5ö–çG2‚Væ–f÷&×2ÂÖFW&–ÂÂ—†VÅ&F–òÂ†V–v‡B’°  —Væ–f÷&×2æF–fgW6RçfÇVRæ6÷’‚ÖFW&–Âæ6öÆ÷"“° —Væ–f÷&×2æ÷6—G’çfÇVRÒÖFW&–Âæ÷6—G“° —Væ–f÷&×2ç6—¦RçfÇVRÒÖFW&–Âç6—¦R¢—†VÅ&F–ó° —Væ–f÷&×2ç66ÆRçfÇVRÒ†V–v‡B¢ãS°  ––b‚ÖFW&–ÂæÖ’°  —Væ–f÷&×2æÖçfÇVRÒÖFW&–ÂæÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÖÂVæ–f÷&×2çWeG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†Ö’°  —Væ–f÷&×2æÇ†ÖçfÇVRÒÖFW&–ÂæÇ†Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÇ†ÖÂVæ–f÷&×2æÇ†ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†FW7Bâ’°  —Væ–f÷&×2æÇ†FW7BçfÇVRÒÖFW&–ÂæÇ†FW7C°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×57&—FW2‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2æF–fgW6RçfÇVRæ6÷’‚ÖFW&–Âæ6öÆ÷"“° —Væ–f÷&×2æ÷6—G’çfÇVRÒÖFW&–Âæ÷6—G“° —Væ–f÷&×2ç&÷FF–öâçfÇVRÒÖFW&–Âç&÷FF–öã°  ––b‚ÖFW&–ÂæÖ’°  —Væ–f÷&×2æÖçfÇVRÒÖFW&–ÂæÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÖÂVæ–f÷&×2æÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†Ö’°  —Væ–f÷&×2æÇ†ÖçfÇVRÒÖFW&–ÂæÇ†Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÇ†ÖÂVæ–f÷&×2æÇ†ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæÇ†FW7Bâ’°  —Væ–f÷&×2æÇ†FW7BçfÇVRÒÖFW&–ÂæÇ†FW7C°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×5†öær‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2ç7V7VÆ"çfÇVRæ6÷’‚ÖFW&–Âç7V7VÆ"“° —Væ–f÷&×2ç6†–æ–æW72çfÇVRÒÖF‚æÖ‚‚ÖFW&–Âç6†–æ–æW72ÂRÓB“²òòFò&WfVçB÷r‚ãÂã  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×5Fööâ‚Væ–f÷&×2ÂÖFW&–Â’°  ––b‚ÖFW&–Âæw&F–VçDÖ’°  —Væ–f÷&×2æw&F–VçDÖçfÇVRÒÖFW&–Âæw&F–VçDÖ°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×57FæF&B‚Væ–f÷&×2ÂÖFW&–Â’°  —Væ–f÷&×2æÖWFÆæW72çfÇVRÒÖFW&–ÂæÖWFÆæW73°  ––b‚ÖFW&–ÂæÖWFÆæW74Ö’°  —Væ–f÷&×2æÖWFÆæW74ÖçfÇVRÒÖFW&–ÂæÖWFÆæW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂæÖWFÆæW74ÖÂVæ–f÷&×2æÖWFÆæW74ÖG&ç6f÷&Ò“°  —Ð  —Væ–f÷&×2ç&÷Vv†æW72çfÇVRÒÖFW&–Âç&÷Vv†æW73°  ––b‚ÖFW&–Âç&÷Vv†æW74Ö’°  —Væ–f÷&×2ç&÷Vv†æW74ÖçfÇVRÒÖFW&–Âç&÷Vv†æW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç&÷Vv†æW74ÖÂVæ–f÷&×2ç&÷Vv†æW74ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–ÂæVçdÖ’°  ’ò÷Væ–f÷&×2æVçdÖçfÇVRÒÖFW&–ÂæVçdÖ²òò'BöbVæ–f÷&×26öÖÖöà  —Væ–f÷&×2æVçdÖ–çFVç6—G’çfÇVRÒÖFW&–ÂæVçdÖ–çFVç6—G“°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×5‡—6–6Â‚Væ–f÷&×2ÂÖFW&–ÂÂG&ç6Ö—76–öå&VæFW%F&vWB’°  —Væ–f÷&×2æ–÷"çfÇVRÒÖFW&–Âæ–÷#²òòÇ6ò'BöbVæ–f÷&×26öÖÖöà  ––b‚ÖFW&–Âç6†VVââ’°  —Væ–f÷&×2ç6†VVä6öÆ÷"çfÇVRæ6÷’‚ÖFW&–Âç6†VVä6öÆ÷"’æ×VÇF—Ç•66Æ"‚ÖFW&–Âç6†VVâ“°  —Væ–f÷&×2ç6†VVå&÷Vv†æW72çfÇVRÒÖFW&–Âç6†VVå&÷Vv†æW73°  ––b‚ÖFW&–Âç6†VVä6öÆ÷$Ö’°  —Væ–f÷&×2ç6†VVä6öÆ÷$ÖçfÇVRÒÖFW&–Âç6†VVä6öÆ÷$Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç6†VVä6öÆ÷$ÖÂVæ–f÷&×2ç6†VVä6öÆ÷$ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âç6†VVå&÷Vv†æW74Ö’°  —Væ–f÷&×2ç6†VVå&÷Vv†æW74ÖçfÇVRÒÖFW&–Âç6†VVå&÷Vv†æW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç6†VVå&÷Vv†æW74ÖÂVæ–f÷&×2ç6†VVå&÷Vv†æW74ÖG&ç6f÷&Ò“°  —Ð  —Ð  ––b‚ÖFW&–Âæ6ÆV&6öBâ’°  —Væ–f÷&×2æ6ÆV&6öBçfÇVRÒÖFW&–Âæ6ÆV&6öC° —Væ–f÷&×2æ6ÆV&6öE&÷Vv†æW72çfÇVRÒÖFW&–Âæ6ÆV&6öE&÷Vv†æW73°  ––b‚ÖFW&–Âæ6ÆV&6öDÖ’°  —Væ–f÷&×2æ6ÆV&6öDÖçfÇVRÒÖFW&–Âæ6ÆV&6öDÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ6ÆV&6öDÖÂVæ–f÷&×2æ6ÆV&6öDÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âæ6ÆV&6öE&÷Vv†æW74Ö’°  —Væ–f÷&×2æ6ÆV&6öE&÷Vv†æW74ÖçfÇVRÒÖFW&–Âæ6ÆV&6öE&÷Vv†æW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ6ÆV&6öE&÷Vv†æW74ÖÂVæ–f÷&×2æ6ÆV&6öE&÷Vv†æW74ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âæ6ÆV&6öDæ÷&ÖÄÖ’°  —Væ–f÷&×2æ6ÆV&6öDæ÷&ÖÄÖçfÇVRÒÖFW&–Âæ6ÆV&6öDæ÷&ÖÄÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ6ÆV&6öDæ÷&ÖÄÖÂVæ–f÷&×2æ6ÆV&6öDæ÷&ÖÄÖG&ç6f÷&Ò“°  —Væ–f÷&×2æ6ÆV&6öDæ÷&ÖÅ66ÆRçfÇVRæ6÷’‚ÖFW&–Âæ6ÆV&6öDæ÷&ÖÅ66ÆR“°  ––b‚ÖFW&–Âç6–FRÓÓÒ&6µ6–FR’°  —Væ–f÷&×2æ6ÆV&6öDæ÷&ÖÅ66ÆRçfÇVRææVvFR‚“°  —Ð  —Ð  —Ð  ––b‚ÖFW&–ÂæF—7W'6–öââ’°  —Væ–f÷&×2æF—7W'6–öâçfÇVRÒÖFW&–ÂæF—7W'6–öã°  —Ð  ––b‚ÖFW&–Âæ—&–FW66Væ6Râ’°  —Væ–f÷&×2æ—&–FW66Væ6RçfÇVRÒÖFW&–Âæ—&–FW66Væ6S° —Væ–f÷&×2æ—&–FW66Væ6T”õ"çfÇVRÒÖFW&–Âæ—&–FW66Væ6T”õ#° —Væ–f÷&×2æ—&–FW66Væ6UF†–6¶æW74Ö–æ–×VÒçfÇVRÒÖFW&–Âæ—&–FW66Væ6UF†–6¶æW75&ævU²Ó° —Væ–f÷&×2æ—&–FW66Væ6UF†–6¶æW74Ö†–×VÒçfÇVRÒÖFW&–Âæ—&–FW66Væ6UF†–6¶æW75&ævU²Ó°  ––b‚ÖFW&–Âæ—&–FW66Væ6TÖ’°  —Væ–f÷&×2æ—&–FW66Væ6TÖçfÇVRÒÖFW&–Âæ—&–FW66Væ6TÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ—&–FW66Væ6TÖÂVæ–f÷&×2æ—&–FW66Væ6TÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âæ—&–FW66Væ6UF†–6¶æW74Ö’°  —Væ–f÷&×2æ—&–FW66Væ6UF†–6¶æW74ÖçfÇVRÒÖFW&–Âæ—&–FW66Væ6UF†–6¶æW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âæ—&–FW66Væ6UF†–6¶æW74ÖÂVæ–f÷&×2æ—&–FW66Væ6UF†–6¶æW74ÖG&ç6f÷&Ò“°  —Ð  —Ð  ––b‚ÖFW&–ÂçG&ç6Ö—76–öââ’°  —Væ–f÷&×2çG&ç6Ö—76–öâçfÇVRÒÖFW&–ÂçG&ç6Ö—76–öã° —Væ–f÷&×2çG&ç6Ö—76–öå6×ÆW$ÖçfÇVRÒG&ç6Ö—76–öå&VæFW%F&vWBçFW‡GW&S° —Væ–f÷&×2çG&ç6Ö—76–öå6×ÆW%6—¦RçfÇVRç6WB‚G&ç6Ö—76–öå&VæFW%F&vWBçv–GF‚ÂG&ç6Ö—76–öå&VæFW%F&vWBæ†V–v‡B“°  ––b‚ÖFW&–ÂçG&ç6Ö—76–öäÖ’°  —Væ–f÷&×2çG&ç6Ö—76–öäÖçfÇVRÒÖFW&–ÂçG&ç6Ö—76–öäÖ°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂçG&ç6Ö—76–öäÖÂVæ–f÷&×2çG&ç6Ö—76–öäÖG&ç6f÷&Ò“°  —Ð  —Væ–f÷&×2çF†–6¶æW72çfÇVRÒÖFW&–ÂçF†–6¶æW73°  ––b‚ÖFW&–ÂçF†–6¶æW74Ö’°  —Væ–f÷&×2çF†–6¶æW74ÖçfÇVRÒÖFW&–ÂçF†–6¶æW74Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–ÂçF†–6¶æW74ÖÂVæ–f÷&×2çF†–6¶æW74ÖG&ç6f÷&Ò“°  —Ð  —Væ–f÷&×2æGFVçVF–öäF—7Fæ6RçfÇVRÒÖFW&–ÂæGFVçVF–öäF—7Fæ6S° —Væ–f÷&×2æGFVçVF–öä6öÆ÷"çfÇVRæ6÷’‚ÖFW&–ÂæGFVçVF–öä6öÆ÷"“°  —Ð  ––b‚ÖFW&–Âææ—6÷G&÷’â’°  —Væ–f÷&×2ææ—6÷G&÷•fV7F÷"çfÇVRç6WB‚ÖFW&–Âææ—6÷G&÷’¢ÖF‚æ6÷2‚ÖFW&–Âææ—6÷G&÷•&÷FF–öâ’ÂÖFW&–Âææ—6÷G&÷’¢ÖF‚ç6–â‚ÖFW&–Âææ—6÷G&÷•&÷FF–öâ’“°  ––b‚ÖFW&–Âææ—6÷G&÷”Ö’°  —Væ–f÷&×2ææ—6÷G&÷”ÖçfÇVRÒÖFW&–Âææ—6÷G&÷”Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âææ—6÷G&÷”ÖÂVæ–f÷&×2ææ—6÷G&÷”ÖG&ç6f÷&Ò“°  —Ð  —Ð  —Væ–f÷&×2ç7V7VÆ$–çFVç6—G’çfÇVRÒÖFW&–Âç7V7VÆ$–çFVç6—G“° —Væ–f÷&×2ç7V7VÆ$6öÆ÷"çfÇVRæ6÷’‚ÖFW&–Âç7V7VÆ$6öÆ÷"“°  ––b‚ÖFW&–Âç7V7VÆ$6öÆ÷$Ö’°  —Væ–f÷&×2ç7V7VÆ$6öÆ÷$ÖçfÇVRÒÖFW&–Âç7V7VÆ$6öÆ÷$Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç7V7VÆ$6öÆ÷$ÖÂVæ–f÷&×2ç7V7VÆ$6öÆ÷$ÖG&ç6f÷&Ò“°  —Ð  ––b‚ÖFW&–Âç7V7VÆ$–çFVç6—G”Ö’°  —Væ–f÷&×2ç7V7VÆ$–çFVç6—G”ÖçfÇVRÒÖFW&–Âç7V7VÆ$–çFVç6—G”Ö°  —&Vg&W6…G&ç6f÷&ÕVæ–f÷&Ò‚ÖFW&–Âç7V7VÆ$–çFVç6—G”ÖÂVæ–f÷&×2ç7V7VÆ$–çFVç6—G”ÖG&ç6f÷&Ò“°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×4ÖF6‚Væ–f÷&×2ÂÖFW&–Â’°  ––b‚ÖFW&–ÂæÖF6’°  —Væ–f÷&×2æÖF6çfÇVRÒÖFW&–ÂæÖF6°  —Ð  —Ð  –gVæ7F–öâ&Vg&W6…Væ–f÷&×4F—7Fæ6R‚Væ–f÷&×2ÂÖFW&–Â’°  –6öç7BÆ–v‡BÒ&÷W'F–W2ævWB‚ÖFW&–Â’æÆ–v‡C°  —Væ–f÷&×2ç&VfW&Væ6U÷6—F–öâçfÇVRç6WDg&öÔÖG&—…÷6—F–öâ‚Æ–v‡BæÖG&—…v÷&ÆB“° —Væ–f÷&×2ææV$F—7Fæ6RçfÇVRÒÆ–v‡Bç6†F÷ræ6ÖW&ææV#° —Væ–f÷&×2æf$F—7Fæ6RçfÇVRÒÆ–v‡Bç6†F÷ræ6ÖW&æf#°  —Ð  —&WGW&â° —&Vg&W6„föuVæ–f÷&×3¢&Vg&W6„föuVæ–f÷&×2À —&Vg&W6„ÖFW&–ÅVæ–f÷&×3¢&Vg&W6„ÖFW&–ÅVæ–f÷&×0 —Ó° §Ð ¦gVæ7F–öâvV$tÅVæ–f÷&×4w&÷W2‚vÂÂ–æfòÂ6&–Æ—F–W2Â7FFR’°  –ÆWB'VffW'2Ò·Ó° –ÆWBWFFTÆ—7BÒ·Ó° –ÆWBÆÆö6FVD&–æF–æuö–çG2ÒµÓ°  –6öç7BÖ„&–æF–æuö–çG2ÒvÂævWE&ÖWFW"‚vÂäÔ…õTä”dõ$Õô%TddU%ô$”äD”äu2“²òò&–æF–ærö–çG2&RvÆö&Âv†W&V2&Æö6²–æF–6W2&RW"6†FW"&öw&Ð  –gVæ7F–öâ&–æB‚Væ–f÷&×4w&÷WÂ&öw&Ò’°  –6öç7BvV&vÅ&öw&ÒÒ&öw&Òç&öw&Ó° —7FFRçVæ–f÷&Ô&Æö6´&–æF–ær‚Væ–f÷&×4w&÷WÂvV&vÅ&öw&Ò“°  —Ð  –gVæ7F–öâWFFR‚Væ–f÷&×4w&÷WÂ&öw&Ò’°  –ÆWB'VffW"Ò'VffW'5²Væ–f÷&×4w&÷Wæ–BÓ°  ––b‚'VffW"ÓÓÒVæFVf–æVB’°  —&W&UVæ–f÷&×4w&÷W‚Væ–f÷&×4w&÷W“°  –'VffW"Ò7&VFT'VffW"‚Væ–f÷&×4w&÷W“° –'VffW'5²Væ–f÷&×4w&÷Wæ–BÒÒ'VffW#°  —Væ–f÷&×4w&÷WæFDWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåVæ–f÷&×4w&÷W4F—7÷6R“°  —Ð  ’òòVç7W&RFòWFFRF†R&–æF–ærö–çG2ö&Æö6²–æF–6W2Ö–ærf÷"F†—2&öw&Ð  –6öç7BvV&vÅ&öw&ÒÒ&öw&Òç&öw&Ó° —7FFRçWFFUT$ôÖ–ær‚Væ–f÷&×4w&÷WÂvV&vÅ&öw&Ò“°  ’òòWFFRT$òöæ6RW"g&ÖP  –6öç7Bg&ÖRÒ–æfòç&VæFW"æg&ÖS°  ––b‚WFFTÆ—7E²Væ–f÷&×4w&÷Wæ–BÒÓÒg&ÖR’°  —WFFT'VffW$FF‚Væ–f÷&×4w&÷W“°  —WFFTÆ—7E²Væ–f÷&×4w&÷Wæ–BÒÒg&ÖS°  —Ð  —Ð  –gVæ7F–öâ7&VFT'VffW"‚Væ–f÷&×4w&÷W’°  ’òòF†R6WGWöbâT$ò—2–æFWVæFVçBöb'F–7VÆ"6†FW"&öw&Ò'WBvÆö&À  –6öç7B&–æF–æuö–çD–æFW‚ÒÆÆö6FT&–æF–æuö–çD–æFW‚‚“° —Væ–f÷&×4w&÷Wåõö&–æF–æuö–çD–æFW‚Ò&–æF–æuö–çD–æFWƒ°  –6öç7B'VffW"ÒvÂæ7&VFT'VffW"‚“° –6öç7B6—¦RÒVæ–f÷&×4w&÷Wåõ÷6—¦S° –6öç7BW6vRÒVæ–f÷&×4w&÷WçW6vS°  –vÂæ&–æD'VffW"‚vÂåTä”dõ$Õô%TddU"Â'VffW"“° –vÂæ'VffW$FF‚vÂåTä”dõ$Õô%TddU"Â6—¦RÂW6vR“° –vÂæ&–æD'VffW"‚vÂåTä”dõ$Õô%TddU"ÂçVÆÂ“° –vÂæ&–æD'VffW$&6R‚vÂåTä”dõ$Õô%TddU"Â&–æF–æuö–çD–æFW‚Â'VffW"“°  —&WGW&â'VffW#°  —Ð  –gVæ7F–öâÆÆö6FT&–æF–æuö–çD–æFW‚‚’°  –f÷"‚ÆWB’Ò²’ÂÖ„&–æF–æuö–çG3²’²²’°  ––b‚ÆÆö6FVD&–æF–æuö–çG2æ–æFW„öb‚’’ÓÓÒÓ’°  –ÆÆö6FVD&–æF–æuö–çG2çW6‚‚’“° —&WGW&â“°  —Ð  —Ð  –6öç6öÆRæW'&÷"‚uD…$TRåvV$tÅ&VæFW&W#¢Ö†–×VÒçVÖ&W"öb6–×VÇFæV÷W6Ç’W6&ÆRVæ–f÷&×2w&÷W2&V6†VBâr“°  —&WGW&â°  —Ð  –gVæ7F–öâWFFT'VffW$FF‚Væ–f÷&×4w&÷W’°  –6öç7B'VffW"Ò'VffW'5²Væ–f÷&×4w&÷Wæ–BÓ° –6öç7BVæ–f÷&×2ÒVæ–f÷&×4w&÷WçVæ–f÷&×3° –6öç7B66†RÒVæ–f÷&×4w&÷Wåõö66†S°  –vÂæ&–æD'VffW"‚vÂåTä”dõ$Õô%TddU"Â'VffW"“°  –f÷"‚ÆWB’ÒÂ–ÂÒVæ–f÷&×2æÆVæwFƒ²’Â–Ã²’²²’°  –6öç7BVæ–f÷&Ô'&’Ò'&’æ—4'&’‚Væ–f÷&×5²’Ò’òVæ–f÷&×5²’Ò¢²Væ–f÷&×5²’ÒÓ°  –f÷"‚ÆWB¢ÒÂ¦ÂÒVæ–f÷&Ô'&’æÆVæwFƒ²¢Â¦Ã²¢²²’°  –6öç7BVæ–f÷&ÒÒVæ–f÷&Ô'&•²¢Ó°  ––b‚†5Væ–f÷&Ô6†ævVB‚Væ–f÷&ÒÂ’Â¢Â66†R’ÓÓÒG'VR’°  –6öç7Böfg6WBÒVæ–f÷&Òåõööfg6WC°  –6öç7BfÇVW2Ò'&’æ—4'&’‚Væ–f÷&ÒçfÇVR’òVæ–f÷&ÒçfÇVR¢²Væ–f÷&ÒçfÇVRÓ°  –ÆWB'&”öfg6WBÒ°  –f÷"‚ÆWB²Ò²²ÂfÇVW2æÆVæwFƒ²²²²’°  –6öç7BfÇVRÒfÇVW5²²Ó°  –6öç7B–æfòÒvWEVæ–f÷&Õ6—¦R‚fÇVR“°  ’òòDôDòFB–çFVvW"æB7G'V7B7W÷'@ ––b‚G—VöbfÇVRÓÓÒvçVÖ&W"rÇÂG—VöbfÇVRÓÓÒv&ööÆVâr’°  —Væ–f÷&ÒåõöFF²ÒÒfÇVS° –vÂæ'VffW%7V$FF‚vÂåTä”dõ$Õô%TddU"Âöfg6WB²'&”öfg6WBÂVæ–f÷&ÒåõöFF“°  —ÒVÇ6R–b‚fÇVRæ—4ÖG&—ƒ2’°  ’òòÖçVÆÇ’6öçfW'F–ær7ƒ2Fò7ƒ@  —Væ–f÷&ÒåõöFF²ÒÒfÇVRæVÆVÖVçG5²Ó° —Væ–f÷&ÒåõöFF²ÒÒfÇVRæVÆVÖVçG5²Ó° —Væ–f÷&ÒåõöFF²"ÒÒfÇVRæVÆVÖVçG5²"Ó° —Væ–f÷&ÒåõöFF²2ÒÒ° —Væ–f÷&ÒåõöFF²BÒÒfÇVRæVÆVÖVçG5²2Ó° —Væ–f÷&ÒåõöFF²RÒÒfÇVRæVÆVÖVçG5²BÓ° —Væ–f÷&ÒåõöFF²bÒÒfÇVRæVÆVÖVçG5²RÓ° —Væ–f÷&ÒåõöFF²rÒÒ° —Væ–f÷&ÒåõöFF²‚ÒÒfÇVRæVÆVÖVçG5²bÓ° —Væ–f÷&ÒåõöFF²’ÒÒfÇVRæVÆVÖVçG5²rÓ° —Væ–f÷&ÒåõöFF²ÒÒfÇVRæVÆVÖVçG5²‚Ó° —Væ–f÷&ÒåõöFF²ÒÒ°  —ÒVÇ6R°  —fÇVRçFô'&’‚Væ–f÷&ÒåõöFFÂ'&”öfg6WB“°  –'&”öfg6WB³Ò–æfòç7F÷&vRòfÆöC3$'&’ä%•DU5õU%ôTÄTÔTåC°  —Ð  —Ð  –vÂæ'VffW%7V$FF‚vÂåTä”dõ$Õô%TddU"Âöfg6WBÂVæ–f÷&ÒåõöFF“°  —Ð  —Ð  —Ð  –vÂæ&–æD'VffW"‚vÂåTä”dõ$Õô%TddU"ÂçVÆÂ“°  —Ð  –gVæ7F–öâ†5Væ–f÷&Ô6†ævVB‚Væ–f÷&ÒÂ–æFW‚Â–æFW„'&’Â66†R’°  –6öç7BfÇVRÒVæ–f÷&ÒçfÇVS° –6öç7B–æFW…7G&–ærÒ–æFW‚²uòr²–æFW„'&“°  ––b‚66†U²–æFW…7G&–ærÒÓÓÒVæFVf–æVB’°  ’òò66†RVçG'’FöW2æ÷BW†—7B6òf   ––b‚G—VöbfÇVRÓÓÒvçVÖ&W"rÇÂG—VöbfÇVRÓÓÒv&ööÆVâr’°  –66†U²–æFW…7G&–ærÒÒfÇVS°  —ÒVÇ6R°  –66†U²–æFW…7G&–ærÒÒfÇVRæ6ÆöæR‚“°  —Ð  —&WGW&âG'VS°  —ÒVÇ6R°  –6öç7B66†VDö&¦V7BÒ66†U²–æFW…7G&–ærÓ°  ’òò6ö×&R7W'&VçBfÇVRv—F‚66†VBVçG'  ––b‚G—VöbfÇVRÓÓÒvçVÖ&W"rÇÂG—VöbfÇVRÓÓÒv&ööÆVâr’°  ––b‚66†VDö&¦V7BÓÒfÇVR’°  –66†U²–æFW…7G&–ærÒÒfÇVS° —&WGW&âG'VS°  —Ð  —ÒVÇ6R°  ––b‚66†VDö&¦V7BæWVÇ2‚fÇVR’ÓÓÒfÇ6R’°  –66†VDö&¦V7Bæ6÷’‚fÇVR“° —&WGW&âG'VS°  —Ð  —Ð  —Ð  —&WGW&âfÇ6S°  —Ð  –gVæ7F–öâ&W&UVæ–f÷&×4w&÷W‚Væ–f÷&×4w&÷W’°  ’òòFWFW&Ö–æRF÷FÂ'VffW"6—¦R66÷&F–ærFòF†R5DCCÆ–÷W@ ’òò†–çC¢5DCC—2F†RöæÇ’7W÷'FVBÆ–÷WB–âvV$tÂ   –6öç7BVæ–f÷&×2ÒVæ–f÷&×4w&÷WçVæ–f÷&×3°  –ÆWBöfg6WBÒ²òòvÆö&Â'VffW"öfg6WB–â'—FW0 –6öç7B6‡Væµ6—¦RÒc²òò6—¦Röb6‡Væ²–â'—FW0  –f÷"‚ÆWB’ÒÂÂÒVæ–f÷&×2æÆVæwFƒ²’ÂÃ²’²²’°  –6öç7BVæ–f÷&Ô'&’Ò'&’æ—4'&’‚Væ–f÷&×5²’Ò’òVæ–f÷&×5²’Ò¢²Væ–f÷&×5²’ÒÓ°  –f÷"‚ÆWB¢ÒÂ¦ÂÒVæ–f÷&Ô'&’æÆVæwFƒ²¢Â¦Ã²¢²²’°  –6öç7BVæ–f÷&ÒÒVæ–f÷&Ô'&•²¢Ó°  –6öç7BfÇVW2Ò'&’æ—4'&’‚Væ–f÷&ÒçfÇVR’òVæ–f÷&ÒçfÇVR¢²Væ–f÷&ÒçfÇVRÓ°  –f÷"‚ÆWB²ÒÂ¶ÂÒfÇVW2æÆVæwFƒ²²Â¶Ã²²²²’°  –6öç7BfÇVRÒfÇVW5²²Ó°  –6öç7B–æfòÒvWEVæ–f÷&Õ6—¦R‚fÇVR“°  –6öç7B6‡Væ´öfg6WBÒöfg6WBR6‡Væµ6—¦S²òòöfg6WB–âF†R7W'&VçB6‡Væ° –6öç7B6‡VæµFF–ærÒ6‡Væ´öfg6WBR–æfòæ&÷VæF'“²òò&WV—&VBFF–ærFòÖF6‚&÷VæF' –6öç7B6‡Væµ7F'BÒ6‡Væ´öfg6WB²6‡VæµFF–æs²òòF†R7F'B÷6—F–öâ–âF†R7W'&VçB6‡Væ²f÷"F†RFF  –öfg6WB³Ò6‡VæµFF–æs°  ’òò6†V6²f÷"6‡Væ²÷fW&fÆ÷p ––b‚6‡Væµ7F'BÓÒbb‚6‡Væµ6—¦RÒ6‡Væµ7F'B’Â–æfòç7F÷&vR’°  ’òòFBFF–æræBF§W7Böfg6W@ –öfg6WB³Ò‚6‡Væµ6—¦RÒ6‡Væµ7F'B“°  —Ð  ’òòF†RföÆÆ÷v–ærGvò&÷W'F–W2v–ÆÂ&RW6VBf÷"'F–Â'VffW"WFFW0 —Væ–f÷&ÒåõöFFÒæWrfÆöC3$'&’‚–æfòç7F÷&vRòfÆöC3$'&’ä%•DU5õU%ôTÄTÔTåB“° —Væ–f÷&Òåõööfg6WBÒöfg6WC°  ’òòWFFRF†RvÆö&Âöfg6W@ –öfg6WB³Ò–æfòç7F÷&vS°  —Ð  —Ð  —Ð  ’òòVç7W&R6÷'&V7Bf–æÂFF–æp  –6öç7B6‡Væ´öfg6WBÒöfg6WBR6‡Væµ6—¦S°  ––b‚6‡Væ´öfg6WBâ’öfg6WB³Ò‚6‡Væµ6—¦RÒ6‡Væ´öfg6WB“°  ’òð  —Væ–f÷&×4w&÷Wåõ÷6—¦RÒöfg6WC° —Væ–f÷&×4w&÷Wåõö66†RÒ·Ó°  —&WGW&âF†—3°  —Ð  –gVæ7F–öâvWEVæ–f÷&Õ6—¦R‚fÇVR’°  –6öç7B–æfòÒ° –&÷VæF'“¢Âòò'—FW0 —7F÷&vS¢òò'—FW0 —Ó°  ’òòFWFW&Ö–æR6—¦W266÷&F–ærFò5DCC   ––b‚G—VöbfÇVRÓÓÒvçVÖ&W"rÇÂG—VöbfÇVRÓÓÒv&ööÆVâr’°  ’òòfÆöBö–çBö&ööÀ  ––æfòæ&÷VæF'’ÒC° ––æfòç7F÷&vRÒC°  —ÒVÇ6R–b‚fÇVRæ—5fV7F÷#"’°  ’òòfV3   ––æfòæ&÷VæF'’Òƒ° ––æfòç7F÷&vRÒƒ°  —ÒVÇ6R–b‚fÇVRæ—5fV7F÷#2ÇÂfÇVRæ—46öÆ÷"’°  ’òòfV30  ––æfòæ&÷VæF'’Òc° ––æfòç7F÷&vRÒ#²òòWf–Ã¢fV32×W7B7F'BöâbÖ'—FR&÷VæF'’'WB—BöæÇ’6öç7VÖW2"'—FW0  —ÒVÇ6R–b‚fÇVRæ—5fV7F÷#B’°  ’òòfV3@  ––æfòæ&÷VæF'’Òc° ––æfòç7F÷&vRÒc°  —ÒVÇ6R–b‚fÇVRæ—4ÖG&—ƒ2’°  ’òòÖC2†–â5DCC7ƒ2ÖG&—‚—2&W&W6VçFVB27ƒB  ––æfòæ&÷VæF'’ÒCƒ° ––æfòç7F÷&vRÒCƒ°  —ÒVÇ6R–b‚fÇVRæ—4ÖG&—ƒB’°  ’òòÖC@  ––æfòæ&÷VæF'’ÒcC° ––æfòç7F÷&vRÒcC°  —ÒVÇ6R–b‚fÇVRæ—5FW‡GW&R’°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢FW‡GW&R6×ÆW'26âæ÷B&R'BöbâVæ–f÷&×2w&÷Wâr“°  —ÒVÇ6R°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢Vç7W÷'FVBVæ–f÷&ÒfÇVRG—RârÂfÇVR“°  —Ð  —&WGW&â–æfó°  —Ð  –gVæ7F–öâöåVæ–f÷&×4w&÷W4F—7÷6R‚WfVçB’°  –6öç7BVæ–f÷&×4w&÷WÒWfVçBçF&vWC°  —Væ–f÷&×4w&÷Wç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöåVæ–f÷&×4w&÷W4F—7÷6R“°  –6öç7B–æFW‚ÒÆÆö6FVD&–æF–æuö–çG2æ–æFW„öb‚Væ–f÷&×4w&÷Wåõö&–æF–æuö–çD–æFW‚“° –ÆÆö6FVD&–æF–æuö–çG2ç7Æ–6R‚–æFW‚Â“°  –vÂæFVÆWFT'VffW"‚'VffW'5²Væ–f÷&×4w&÷Wæ–BÒ“°  –FVÆWFR'VffW'5²Væ–f÷&×4w&÷Wæ–BÓ° –FVÆWFRWFFTÆ—7E²Væ–f÷&×4w&÷Wæ–BÓ°  —Ð  –gVæ7F–öâF—7÷6R‚’°  –f÷"‚6öç7B–B–â'VffW'2’°  –vÂæFVÆWFT'VffW"‚'VffW'5²–BÒ“°  —Ð  –ÆÆö6FVD&–æF–æuö–çG2ÒµÓ° –'VffW'2Ò·Ó° —WFFTÆ—7BÒ·Ó°  —Ð  —&WGW&â°  –&–æC¢&–æBÀ —WFFS¢WFFRÀ  –F—7÷6S¢F—7÷6P  —Ó° §Ð ¢ò¢ ¢¢F†—2&VæFW&W"W6W2vV$tÂ"FòF—7Æ’66VæW2à¢ ¢¢vV$tÂ—2æ÷B7W÷'FVB6–æ6R#c6à¢¢ð¦6Æ72vV$tÅ&VæFW&W"°  ’ò¢  ’¢6öç7G'V7G2æWrvV$tÂ&VæFW&W"à ’  ’¢&ÒµvV$tÅ&VæFW&W'ä÷F–öç7Ò·&ÖWFW'5ÒÒF†R6öæf–wW&F–öâ&ÖWFW"à ’¢ð –6öç7G'V7F÷"‚&ÖWFW'2Ò·Ò’°  –6öç7B° –6çf2Ò7&VFT6çf4VÆVÖVçB‚’À –6öçFW‡BÒçVÆÂÀ –FWF‚ÒG'VRÀ —7FVæ6–ÂÒfÇ6RÀ –Ç†ÒfÇ6RÀ –çF–Æ–2ÒfÇ6RÀ —&V×VÇF—Æ–VDÇ†ÒG'VRÀ —&W6W'fTG&v–æt'VffW"ÒfÇ6RÀ —÷vW%&VfW&Væ6RÒvFVfVÇBrÀ –f–Ä–dÖ¦÷%W&f÷&Öæ6T6fVBÒfÇ6RÀ —&WfW'6VDFWF„'VffW"ÒfÇ6RÀ —ÒÒ&ÖWFW'3°  ’ò¢  ’¢F†—2fÆr6â&RW6VBf÷"G—RFW7F–ærà ’  ’¢G—R¶&ööÆVçÐ ’¢&VFöæÇ ’¢FVfVÇBG'VP ’¢ð —F†—2æ—5vV$tÅ&VæFW&W"ÒG'VS°  –ÆWBöÇ†°  ––b‚6öçFW‡BÓÒçVÆÂ’°  ––b‚G—VöbvV$tÅ&VæFW&–æt6öçFW‡BÓÒwVæFVf–æVBrbb6öçFW‡B–ç7Fæ6VöbvV$tÅ&VæFW&–æt6öçFW‡B’°  —F‡&÷ræWrW'&÷"‚uD…$TRåvV$tÅ&VæFW&W#¢vV$tÂ—2æ÷B7W÷'FVB6–æ6R#c2âr“°  —Ð  •öÇ†Ò6öçFW‡BævWD6öçFW‡DGG&–'WFW2‚’æÇ†°  —ÒVÇ6R°  •öÇ†ÒÇ†°  —Ð  –6öç7BV–çD6ÆV$6öÆ÷"ÒæWrV–çC3$'&’‚B“° –6öç7B–çD6ÆV$6öÆ÷"ÒæWr–çC3$'&’‚B“°  –ÆWB7W'&VçE&VæFW$Æ—7BÒçVÆÃ° –ÆWB7W'&VçE&VæFW%7FFRÒçVÆÃ°  ’òò&VæFW"‚’6â&R6ÆÆVBg&öÒv—F†–â6ÆÆ&6²G&–vvW&VB'’æ÷F†W"&VæFW"à ’òòvRG&6²F†—26òF†BF†RæW7FVB&VæFW"6ÆÂvWG2—G2Æ—7BæB7FFR—6öÆFVBg&öÒF†R&VçB&VæFW"6ÆÂà  –6öç7B&VæFW$Æ—7E7F6²ÒµÓ° –6öç7B&VæFW%7FFU7F6²ÒµÓ°  ’òòV&Æ–2&÷W'F–W0  ’ò¢  ’¢6çf2v†W&RF†R&VæFW&W"G&w2—G2÷WGWBåF†—2—2WFöÖF–6ÆÇ’7&VFVB'’F†R&VæFW&W  ’¢–âF†R6öç7G'V7F÷"†–bæ÷B&÷f–FVBÇ&VG’“²–÷R§W7BæVVBFòFB—BFò–÷W"vRÆ–¶R6ó  ’¢§0 ’¢Fö7VÖVçBæ&öG’æVæD6†–ÆB‚&VæFW&W"æFöÔVÆVÖVçB“° ’¢  ’  ’¢G—R´DôÔVÆVÖVçGÐ ’¢ð —F†—2æFöÔVÆVÖVçBÒ6çf3°  ’ò¢  ’¢ö&¦V7Bv—F‚FV'Vr6öæf–wW&F–öâ6WGF–æw2à ’  ’¢Ò6†V6µ6†FW$W'&÷'6¢–b—B—2G'VVÂFVf–æW2v†WF†W"ÖFW&–Â6†FW"&öw&×2&P ’¢6†V6¶VBf÷"W'&÷'2GW&–ær6ö×–ÆF–öâæBÆ–æ¶vR&ö6W72â—BÖ’&RW6VgVÂFòF—6&ÆP ’¢F†—26†V6²–â&öGV7F–öâf÷"W&f÷&Öæ6Rv–ââ—B—27G&öævÇ’&V6öÖÖVæFVBFò¶VWF†W6P ’¢6†V6·2Væ&ÆVBGW&–ærFWfVÆ÷ÖVçBâ–bF†R6†FW"FöW2æ÷B6ö×–ÆRæBÆ–æ²Ò—Bv–ÆÂæ÷@ ’¢v÷&²æB76ö6–FVBÖFW&–Âv–ÆÂæ÷B&VæFW"à ’¢Òöå6†FW$W'&÷"†vÂÂ&öw&ÒÂvÅfW'FW…6†FW"ÆvÄg&vÖVçE6†FW"–¢6ÆÆ&6²gVæ7F–öâF†@ ’¢6â&RW6VBf÷"7W7FöÒW'&÷"&W÷'F–ærâF†R6ÆÆ&6²&V6V—fW2F†RvV$tÂ6öçFW‡BÂâ–ç7Fæ6P ’¢öbvV$tÅ&öw&Ò2vVÆÂGvò–ç7Fæ6W2öbvV$tÅ6†FW"&W&W6VçF–ærF†RfW'FW‚æBg&vÖVçB6†FW"à ’¢76–væ–ær7W7FöÒgVæ7F–öâF—6&ÆW2F†RFVfVÇBW'&÷"&W÷'F–ærà ’  ’¢G—R´ö&¦V7GÐ ’¢ð —F†—2æFV'VrÒ°  ’ò¢  ’¢Væ&ÆW2W'&÷"6†V6¶–æræB&W÷'F–ærv†Vâ6†FW"&öw&×2&R&V–ær6ö×–ÆVBà ’¢G—R¶&ööÆVçÐ ’¢ð –6†V6µ6†FW$W'&÷'3¢G'VRÀ ’ò¢  ’¢6ÆÆ&6²f÷"7W7FöÒW'&÷"&W÷'F–ærà ’¢G—R³ôgVæ7F–öçÐ ’¢ð –öå6†FW$W'&÷#¢çVÆÀ —Ó°  ’òò6ÆV&–æp  ’ò¢  ’¢v†WF†W"F†R&VæFW&W"6†÷VÆBWFöÖF–6ÆÇ’6ÆV"—G2÷WGWB&Vf÷&R&VæFW&–ærg&ÖR÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2æWFô6ÆV"ÒG'VS°  ’ò¢  ’¢–b´Æ–æ²vV$tÅ&VæFW&W"6WFô6ÆV'Ò6WBFòG'VVÂv†WF†W"F†R&VæFW&W"6†÷VÆB6ÆV  ’¢F†R6öÆ÷"'VffW"÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2æWFô6ÆV$6öÆ÷"ÒG'VS°  ’ò¢  ’¢–b´Æ–æ²vV$tÅ&VæFW&W"6WFô6ÆV'Ò6WBFòG'VVÂv†WF†W"F†R&VæFW&W"6†÷VÆB6ÆV  ’¢F†RFWF‚'VffW"÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2æWFô6ÆV$FWF‚ÒG'VS°  ’ò¢  ’¢–b´Æ–æ²vV$tÅ&VæFW&W"6WFô6ÆV'Ò6WBFòG'VVÂv†WF†W"F†R&VæFW&W"6†÷VÆB6ÆV  ’¢F†R7FVæ6–Â'VffW"÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2æWFô6ÆV%7FVæ6–ÂÒG'VS°  ’òò66VæRw&€  ’ò¢  ’¢v†WF†W"F†R&VæFW&W"6†÷VÆB6÷'Bö&¦V7G2÷"æ÷Bà ’  ’¢æ÷FS¢6÷'F–ær—2W6VBFòGFV×BFò&÷W&Ç’&VæFW"ö&¦V7G2F†B†fR6öÖP ’¢FVw&VRöbG&ç7&Væ7’â'’FVf–æ—F–öâÂ6÷'F–ærö&¦V7G2Ö’æ÷Bv÷&²–âÆÀ ’¢66W2âFWVæF–æröâF†RæVVG2öbÆ–6F–öâÂ—BÖ’&RæV6W76'’FòGW&à ’¢öfb6÷'F–æræBW6R÷F†W"ÖWF†öG2FòFVÂv—F‚G&ç7&Væ7’&VæFW&–ærRærà ’¢ÖçVÆÇ’FWFW&Ö–æ–ærV6‚ö&¦V7Bw2&VæFW&–ær÷&FW"à ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBG'VP ’¢ð —F†—2ç6÷'Dö&¦V7G2ÒG'VS°  ’òòW6W"ÖFVf–æVB6Æ—–æp  ’ò¢  ’¢W6W"ÖFVf–æVB6Æ—–ærÆæW27V6–f–VB–âv÷&ÆB76RâF†W6RÆæW2Ç’vÆö&ÆÇ’à ’¢ö–çG2–â76Rv†÷6RF÷B&öGV7Bv—F‚F†RÆæR—2æVvF—fR&R7WBv’à ’  ’¢G—R´'&“ÅÆæSçÐ ’¢ð —F†—2æ6Æ—–æuÆæW2ÒµÓ°  ’ò¢  ’¢v†WF†W"F†R&VæFW&W"&W7V7G2ö&¦V7BÖÆWfVÂ6Æ—–ærÆæW2÷"æ÷Bà ’  ’¢G—R¶&ööÆVçÐ ’¢FVfVÇBfÇ6P ’¢ð —F†—2æÆö6Ä6Æ—–ætVæ&ÆVBÒfÇ6S°  ’òòFöæRÖ–æp  ’ò¢  ’¢F†RFöæRÖ–ærFV6†æ—VRöbF†R&VæFW&W"à ’  ’¢G—R²„æõFöæTÖ–æwÄÆ–æV%FöæTÖ–æwÅ&V–æ†&EFöæTÖ–æwÄ6–æVöåFöæTÖ–æwÄ4U4f–ÆÖ–5FöæTÖ–æwÄ7W7FöÕFöæTÖ–æwÄu…FöæTÖ–æwÄæWWG&ÅFöæTÖ–ær—Ð ’¢FVfVÇBæõFöæTÖ–æp ’¢ð —F†—2çFöæTÖ–ærÒæõFöæTÖ–æs°  ’ò¢  ’¢W‡÷7W&RÆWfVÂöbFöæRÖ–ærà ’  ’¢G—R¶çVÖ&W'Ð ’¢FVfVÇB ’¢ð —F†—2çFöæTÖ–ætW‡÷7W&RÒã°  ’òòG&ç6Ö—76–öà  ’ò¢  ’¢F†Ræ÷&ÖÆ—¦VB&W6öÇWF–öâ66ÆRf÷"F†RG&ç6Ö—76–öâ&VæFW"F&vWBÂÖV7W&VB–âW&6VçFvP ’¢öbf–Ww÷'BF–ÖVç6–öç2âÆ÷vW&–ærF†—2fÇVR6â&W7VÇB–â6–væ–f–6çBW&f÷&Öæ6R–×&÷fVÖVçG0 ’¢v†VâW6–ær´Æ–æ²ÖW6…‡—6–6ÄÖFW&–Â7G&ç6Ö—76–öçÒà ’  ’¢G—R¶çVÖ&W'Ð ’¢FVfVÇB ’¢ð —F†—2çG&ç6Ö—76–öå&W6öÇWF–öå66ÆRÒã°  ’òò–çFW&æÂ&÷W'F–W0  –6öç7B÷F†—2ÒF†—3°  –ÆWBö—46öçFW‡DÆ÷7BÒfÇ6S°  ’òò–çFW&æÂ7FFR66†P  —F†—2åö÷WGWD6öÆ÷%76RÒ5$t$6öÆ÷%76S°  –ÆWBö7W'&VçD7F—fT7V&Tf6RÒ° –ÆWBö7W'&VçD7F—fTÖ—ÖÆWfVÂÒ° –ÆWBö7W'&VçE&VæFW%F&vWBÒçVÆÃ° –ÆWBö7W'&VçDÖFW&–Ä–BÒÓ°  –ÆWBö7W'&VçD6ÖW&ÒçVÆÃ°  –6öç7Bö7W'&VçEf–Ww÷'BÒæWrfV7F÷#B‚“° –6öç7Bö7W'&VçE66—76÷"ÒæWrfV7F÷#B‚“° –ÆWBö7W'&VçE66—76÷%FW7BÒçVÆÃ°  –6öç7Bö7W'&VçD6ÆV$6öÆ÷"ÒæWr6öÆ÷"‚ƒ“° –ÆWBö7W'&VçD6ÆV$Ç†Ò°  ’òð  –ÆWB÷v–GF‚Ò6çf2çv–GFƒ° –ÆWBö†V–v‡BÒ6çf2æ†V–v‡C°  –ÆWB÷—†VÅ&F–òÒ° –ÆWBö÷VU6÷'BÒçVÆÃ° –ÆWB÷G&ç7&VçE6÷'BÒçVÆÃ°  –6öç7B÷f–Ww÷'BÒæWrfV7F÷#B‚ÂÂ÷v–GF‚Âö†V–v‡B“° –6öç7B÷66—76÷"ÒæWrfV7F÷#B‚ÂÂ÷v–GF‚Âö†V–v‡B“° –ÆWB÷66—76÷%FW7BÒfÇ6S°  ’òòg'W7GVÐ  –6öç7Bög'W7GVÒÒæWrg'W7GVÒ‚“°  ’òò6Æ—–æp  –ÆWBö6Æ—–ætVæ&ÆVBÒfÇ6S° –ÆWBöÆö6Ä6Æ—–ætVæ&ÆVBÒfÇ6S°  ’òò6ÖW&ÖG&–6W266†P  –6öç7B÷&ö¥67&VVäÖG&—‚ÒæWrÖG&—ƒB‚“°  –6öç7B÷fV7F÷#2ÒæWrfV7F÷#2‚“°  –6öç7B÷fV7F÷#BÒæWrfV7F÷#B‚“°  –6öç7BöV×G•66VæRÒ²&6¶w&÷VæC¢çVÆÂÂfös¢çVÆÂÂVçf—&öæÖVçC¢çVÆÂÂ÷fW'&–FTÖFW&–Ã¢çVÆÂÂ—566VæS¢G'VRÓ°  –ÆWB÷&VæFW$&6¶w&÷VæBÒfÇ6S°  –gVæ7F–öâvWEF&vWE—†VÅ&F–ò‚’°  —&WGW&âö7W'&VçE&VæFW%F&vWBÓÓÒçVÆÂò÷—†VÅ&F–ò¢°  —Ð  ’òò–æ—F–Æ—¦P  –ÆWBövÂÒ6öçFW‡C°  –gVæ7F–öâvWD6öçFW‡B‚6öçFW‡DæÖRÂ6öçFW‡DGG&–'WFW2’°  —&WGW&â6çf2ævWD6öçFW‡B‚6öçFW‡DæÖRÂ6öçFW‡DGG&–'WFW2“°  —Ð  —G'’°  –6öç7B6öçFW‡DGG&–'WFW2Ò° –Ç†¢G'VRÀ –FWF‚À —7FVæ6–ÂÀ –çF–Æ–2À —&V×VÇF—Æ–VDÇ†À —&W6W'fTG&v–æt'VffW"À —÷vW%&VfW&Væ6RÀ –f–Ä–dÖ¦÷%W&f÷&Öæ6T6fVBÀ —Ó°  ’òòöfg67&VVä6çf2FöW2æ÷B†fR6WDGG&–'WFRÂ6VR3##ƒ ––b‚w6WDGG&–'WFRr–â6çf2’6çf2ç6WDGG&–'WFR‚vFFÖVæv–æRrÂF‡&VRæ§2"Gµ$Ud•4”ôçÖ“°  ’òòWfVçBÆ—7FVæW'2×W7B&R&Vv—7FW&VB&Vf÷&RvV$tÂ6öçFW‡B—27&VFVBÂ6VR3#sS0 –6çf2æFDWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡FÆ÷7BrÂöä6öçFW‡DÆ÷7BÂfÇ6R“° –6çf2æFDWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡G&W7F÷&VBrÂöä6öçFW‡E&W7F÷&RÂfÇ6R“° –6çf2æFDWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡F7&VF–öæW'&÷"rÂöä6öçFW‡D7&VF–öäW'&÷"ÂfÇ6R“°  ––b‚övÂÓÓÒçVÆÂ’°  –6öç7B6öçFW‡DæÖRÒwvV&vÃ"s°  •övÂÒvWD6öçFW‡B‚6öçFW‡DæÖRÂ6öçFW‡DGG&–'WFW2“°  ––b‚övÂÓÓÒçVÆÂ’°  ––b‚vWD6öçFW‡B‚6öçFW‡DæÖR’’°  —F‡&÷ræWrW'&÷"‚tW'&÷"7&VF–ærvV$tÂ6öçFW‡Bv—F‚–÷W"6VÆV7FVBGG&–'WFW2âr“°  —ÒVÇ6R°  —F‡&÷ræWrW'&÷"‚tW'&÷"7&VF–ærvV$tÂ6öçFW‡Bâr“°  —Ð  —Ð  —Ð  —Ò6F6‚‚W'&÷"’°  –6öç6öÆRæW'&÷"‚uD…$TRåvV$tÅ&VæFW&W#¢r²W'&÷"æÖW76vR“° —F‡&÷rW'&÷#°  —Ð  –ÆWBW‡FVç6–öç2Â6&–Æ—F–W2Â7FFRÂ–æfó° –ÆWB&÷W'F–W2ÂFW‡GW&W2Â7V&VÖ2Â7V&WWfÖ2ÂGG&–'WFW2ÂvVöÖWG&–W2Âö&¦V7G3° –ÆWB&öw&Ô66†RÂÖFW&–Ç2Â&VæFW$Æ—7G2Â&VæFW%7FFW2Â6Æ—–ærÂ6†F÷tÖ°  –ÆWB&6¶w&÷VæBÂÖ÷'‡F&vWG2Â'VffW%&VæFW&W"Â–æFW†VD'VffW%&VæFW&W#°  –ÆWBWF–Ç2Â&–æF–æu7FFW2ÂVæ–f÷&×4w&÷W3°  –gVæ7F–öâ–æ—DtÄ6öçFW‡B‚’°  –W‡FVç6–öç2ÒæWrvV$tÄW‡FVç6–öç2‚övÂ“° –W‡FVç6–öç2æ–æ—B‚“°  —WF–Ç2ÒæWrvV$tÅWF–Ç2‚övÂÂW‡FVç6–öç2“°  –6&–Æ—F–W2ÒæWrvV$tÄ6&–Æ—F–W2‚övÂÂW‡FVç6–öç2Â&ÖWFW'2ÂWF–Ç2“°  —7FFRÒæWrvV$tÅ7FFR‚övÂÂW‡FVç6–öç2“°  ––b‚6&–Æ—F–W2ç&WfW'6VDFWF„'VffW"bb&WfW'6VDFWF„'VffW"’°  —7FFRæ'VffW'2æFWF‚ç6WE&WfW'6VB‚G'VR“°  —Ð  ––æfòÒæWrvV$tÄ–æfò‚övÂ“° —&÷W'F–W2ÒæWrvV$tÅ&÷W'F–W2‚“° —FW‡GW&W2ÒæWrvV$tÅFW‡GW&W2‚övÂÂW‡FVç6–öç2Â7FFRÂ&÷W'F–W2Â6&–Æ—F–W2ÂWF–Ç2Â–æfò“° –7V&VÖ2ÒæWrvV$tÄ7V&TÖ2‚÷F†—2“° –7V&WWfÖ2ÒæWrvV$tÄ7V&UUdÖ2‚÷F†—2“° –GG&–'WFW2ÒæWrvV$tÄGG&–'WFW2‚övÂ“° –&–æF–æu7FFW2ÒæWrvV$tÄ&–æF–æu7FFW2‚övÂÂGG&–'WFW2“° –vVöÖWG&–W2ÒæWrvV$tÄvVöÖWG&–W2‚övÂÂGG&–'WFW2Â–æfòÂ&–æF–æu7FFW2“° –ö&¦V7G2ÒæWrvV$tÄö&¦V7G2‚övÂÂvVöÖWG&–W2ÂGG&–'WFW2Â–æfò“° –Ö÷'‡F&vWG2ÒæWrvV$tÄÖ÷'‡F&vWG2‚övÂÂ6&–Æ—F–W2ÂFW‡GW&W2“° –6Æ—–ærÒæWrvV$tÄ6Æ—–ær‚&÷W'F–W2“° —&öw&Ô66†RÒæWrvV$tÅ&öw&×2‚÷F†—2Â7V&VÖ2Â7V&WWfÖ2ÂW‡FVç6–öç2Â6&–Æ—F–W2Â&–æF–æu7FFW2Â6Æ—–ær“° –ÖFW&–Ç2ÒæWrvV$tÄÖFW&–Ç2‚÷F†—2Â&÷W'F–W2“° —&VæFW$Æ—7G2ÒæWrvV$tÅ&VæFW$Æ—7G2‚“° —&VæFW%7FFW2ÒæWrvV$tÅ&VæFW%7FFW2‚W‡FVç6–öç2“° –&6¶w&÷VæBÒæWrvV$tÄ&6¶w&÷VæB‚÷F†—2Â7V&VÖ2Â7V&WWfÖ2Â7FFRÂö&¦V7G2ÂöÇ†Â&V×VÇF—Æ–VDÇ†“° —6†F÷tÖÒæWrvV$tÅ6†F÷tÖ‚÷F†—2Âö&¦V7G2Â6&–Æ—F–W2“° —Væ–f÷&×4w&÷W2ÒæWrvV$tÅVæ–f÷&×4w&÷W2‚övÂÂ–æfòÂ6&–Æ—F–W2Â7FFR“°  –'VffW%&VæFW&W"ÒæWrvV$tÄ'VffW%&VæFW&W"‚övÂÂW‡FVç6–öç2Â–æfò“° ––æFW†VD'VffW%&VæFW&W"ÒæWrvV$tÄ–æFW†VD'VffW%&VæFW&W"‚övÂÂW‡FVç6–öç2Â–æfò“°  ––æfòç&öw&×2Ò&öw&Ô66†Rç&öw&×3°  ’ò¢  ’¢†öÆG2FWF–Ç2&÷WBF†R6&–Æ—F–W2öbF†R7W'&VçB&VæFW&–ær6öçFW‡Bà ’  ’¢æÖRvV$tÅ&VæFW&W"66&–Æ—F–W0 ’¢G—RµvV$tÅ&VæFW&W'ä6&–Æ—F–W7Ð ’¢ð •÷F†—2æ6&–Æ—F–W2Ò6&–Æ—F–W3°  ’ò¢  ’¢&÷f–FW2ÖWF†öG2f÷"&WG&–Wf–æræBFW7F–ærvV$tÂW‡FVç6–öç2à ’  ’¢ÒvWB†W‡FVç6–öäæÖS§7G&–ær–¢W6VBFò6†V6²v†WF†W"vV$tÂW‡FVç6–öâ—27W÷'FV@ ’¢æB&WGW&âF†RW‡FVç6–öâö&¦V7B–bf–Æ&ÆRà ’¢Ò†2†W‡FVç6–öäæÖS§7G&–ær–¢&WGW&ç2G'VV–bF†RW‡FVç6–öâ—27W÷'FVBà ’  ’¢æÖRvV$tÅ&VæFW&W"6W‡FVç6–öç0 ’¢G—R´ö&¦V7GÐ ’¢ð •÷F†—2æW‡FVç6–öç2ÒW‡FVç6–öç3°  ’ò¢  ’¢W6VBFòG&6²&÷W'F–W2öb÷F†W"ö&¦V7G2Æ–¶RæF—fRvV$tÂö&¦V7G2à ’  ’¢æÖRvV$tÅ&VæFW&W"7&÷W'F–W0 ’¢G—R´ö&¦V7GÐ ’¢ð •÷F†—2ç&÷W'F–W2Ò&÷W'F–W3°  ’ò¢  ’¢ÖævW2F†R&VæFW"Æ—7G2öbF†R&VæFW&W"à ’  ’¢æÖRvV$tÅ&VæFW&W"7&VæFW$Æ—7G0 ’¢G—R´ö&¦V7GÐ ’¢ð •÷F†—2ç&VæFW$Æ—7G2Ò&VæFW$Æ—7G3°    ’ò¢  ’¢–çFW&f6Rf÷"Öæv–ær6†F÷w2à ’  ’¢æÖRvV$tÅ&VæFW&W"76†F÷tÖ  ’¢G—RµvV$tÅ&VæFW&W'å6†F÷tÖÐ ’¢ð •÷F†—2ç6†F÷tÖÒ6†F÷tÖ°  ’ò¢  ’¢–çFW&f6Rf÷"Öæv–ærF†RvV$tÂ7FFRà ’  ’¢æÖRvV$tÅ&VæFW&W"77FFP ’¢G—R´ö&¦V7GÐ ’¢ð •÷F†—2ç7FFRÒ7FFS°  ’ò¢  ’¢†öÆG26W&–W2öb7FF—7F–6Â–æf÷&ÖF–öâ&÷WBF†RuRÖVÖ÷' ’¢æBF†R&VæFW&–ær&ö6W72âW6VgVÂf÷"FV'Vvv–æræBÖöæ—F÷&–ærà ’  ’¢'’FVfVÇBF†W6RFF&R&W6WBBV6‚&VæFW"6ÆÂ'WBv†Vâ†f–æp ’¢×VÇF—ÆR&VæFW"76W2W"g&ÖR†Rærâv†VâW6–ær÷7B&ö6W76–ær’—B6à ’¢&R&VfW'&VBFò&W6WBv—F‚7W7FöÒGFW&ââf—'7BÂ6WBWFõ&W6WFFð ’¢fÇ6Và ’¢§0 ’¢&VæFW&W"æ–æfòæWFõ&W6WBÒfÇ6S° ’¢  ’¢6ÆÂ&W6WB‚–v†VæWfW"–÷R†fRf–æ—6†VBFò&VæFW"6–ævÆRg&ÖRà ’¢§0 ’¢&VæFW&W"æ–æfòç&W6WB‚“° ’¢  ’  ’¢æÖRvV$tÅ&VæFW&W"6–æfð ’¢G—RµvV$tÅ&VæFW&W'ä–æf÷Ð ’¢ð •÷F†—2æ–æfòÒ–æfó°  —Ð  ––æ—DtÄ6öçFW‡B‚“°  ’òò‡   –6öç7B‡"ÒæWrvV%…$ÖævW"‚÷F†—2ÂövÂ“°  ’ò¢  ’¢&VfW&Væ6RFòF†R…"ÖævW"à ’  ’¢G—RµvV%…$ÖævW'Ð ’¢ð —F†—2ç‡"Ò‡#°  ’ò¢  ’¢&WGW&ç2F†R&VæFW&–ær6öçFW‡Bà ’  ’¢&WGW&âµvV$tÃ%&VæFW&–æt6öçFW‡GÒF†R&VæFW&–ær6öçFW‡Bà ’¢ð —F†—2ævWD6öçFW‡BÒgVæ7F–öâ‚’°  —&WGW&âövÃ°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R&VæFW&–ær6öçFW‡BGG&–'WFW2à ’  ’¢&WGW&âµvV$tÄ6öçFW‡DGG&–'WFW7ÒF†R&VæFW&–ær6öçFW‡BGG&–'WFW2à ’¢ð —F†—2ævWD6öçFW‡DGG&–'WFW2ÒgVæ7F–öâ‚’°  —&WGW&âövÂævWD6öçFW‡DGG&–'WFW2‚“°  —Ó°  ’ò¢  ’¢6–×VÆFW2Æ÷72öbF†RvV$tÂ6öçFW‡BâF†—2&WV—&W27W÷'Bf÷"F†RtT$tÅöÆ÷6Uö6öçFW‡FW‡FVç6–öâà ’¢ð —F†—2æf÷&6T6öçFW‡DÆ÷72ÒgVæ7F–öâ‚’°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅöÆ÷6Uö6öçFW‡Br“° ––b‚W‡FVç6–öâ’W‡FVç6–öâæÆ÷6T6öçFW‡B‚“°  —Ó°  ’ò¢  ’¢6–×VÆFW2&W7F÷&RöbF†RvV$tÂ6öçFW‡BâF†—2&WV—&W27W÷'Bf÷"F†RtT$tÅöÆ÷6Uö6öçFW‡FW‡FVç6–öâà ’¢ð —F†—2æf÷&6T6öçFW‡E&W7F÷&RÒgVæ7F–öâ‚’°  –6öç7BW‡FVç6–öâÒW‡FVç6–öç2ævWB‚utT$tÅöÆ÷6Uö6öçFW‡Br“° ––b‚W‡FVç6–öâ’W‡FVç6–öâç&W7F÷&T6öçFW‡B‚“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R—†VÂ&F–òà ’  ’¢&WGW&â¶çVÖ&W'ÒF†R—†VÂ&F–òà ’¢ð —F†—2ævWE—†VÅ&F–òÒgVæ7F–öâ‚’°  —&WGW&â÷—†VÅ&F–ó°  —Ó°  ’ò¢  ’¢6WG2F†Rv—fVâ—†VÂ&F–òæB&W6—¦W2F†R6çf2–bæV6W76'’à ’  ’¢&Ò¶çVÖ&W'ÒfÇVRÒF†R—†VÂ&F–òà ’¢ð —F†—2ç6WE—†VÅ&F–òÒgVæ7F–öâ‚fÇVR’°  ––b‚fÇVRÓÓÒVæFVf–æVB’&WGW&ã°  •÷—†VÅ&F–òÒfÇVS°  —F†—2ç6WE6—¦R‚÷v–GF‚Âö†V–v‡BÂfÇ6R“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R&VæFW&W"w26—¦R–âÆöv–6Â—†VÇ2âF†—2ÖWF†öBFöW2æ÷B†öæ÷"F†R—†VÂ&F–òà ’  ’¢&ÒµfV7F÷#'ÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&âµfV7F÷#'ÒF†R&VæFW&W"w26—¦R–âÆöv–6Â—†VÇ2à ’¢ð —F†—2ævWE6—¦RÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBç6WB‚÷v–GF‚Âö†V–v‡B“°  —Ó°  ’ò¢  ’¢&W6—¦W2F†R÷WGWB6çf2Fò‡v–GF‚Â†V–v‡B’v—F‚FWf–6R—†VÂ&F–òF¶Và ’¢–çFò66÷VçBÂæBÇ6ò6WG2F†Rf–Ww÷'BFòf—BF†B6—¦RÂ7F'F–ær–âƒÀ ’¢’â6WGF–ærWFFU7G–ÆVFòfÇ6R&WfVçG2ç’7G–ÆR6†ævW2FòF†R÷WGWB6çf2à ’  ’¢&Ò¶çVÖ&W'Òv–GF‚ÒF†Rv–GF‚–âÆöv–6Â—†VÇ2à ’¢&Ò¶çVÖ&W'Ò†V–v‡BÒF†R†V–v‡B–âÆöv–6Â—†VÇ2à ’¢&Ò¶&ööÆVçÒ·WFFU7G–ÆS×G'VUÒÒv†WF†W"FòWFFRF†R7G–ÆVGG&–'WFRöbF†R6çf2÷"æ÷Bà ’¢ð —F†—2ç6WE6—¦RÒgVæ7F–öâ‚v–GF‚Â†V–v‡BÂWFFU7G–ÆRÒG'VR’°  ––b‚‡"æ—5&W6VçF–ær’°  –6öç6öÆRçv&â‚uD…$TRåvV$tÅ&VæFW&W#¢6åÂwB6†ævR6—¦Rv†–ÆRe"FWf–6R—2&W6VçF–ærâr“° —&WGW&ã°  —Ð  •÷v–GF‚Òv–GFƒ° •ö†V–v‡BÒ†V–v‡C°  –6çf2çv–GF‚ÒÖF‚æfÆö÷"‚v–GF‚¢÷—†VÅ&F–ò“° –6çf2æ†V–v‡BÒÖF‚æfÆö÷"‚†V–v‡B¢÷—†VÅ&F–ò“°  ––b‚WFFU7G–ÆRÓÓÒG'VR’°  –6çf2ç7G–ÆRçv–GF‚Òv–GF‚²w‚s° –6çf2ç7G–ÆRæ†V–v‡BÒ†V–v‡B²w‚s°  —Ð  —F†—2ç6WEf–Ww÷'B‚ÂÂv–GF‚Â†V–v‡B“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†RG&v–ær'VffW"6—¦R–â‡—6–6Â—†VÇ2âF†—2ÖWF†öB†öæ÷'2F†R—†VÂ&F–òà ’  ’¢&ÒµfV7F÷#'ÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&âµfV7F÷#'ÒF†RG&v–ær'VffW"6—¦Rà ’¢ð —F†—2ævWDG&v–æt'VffW%6—¦RÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBç6WB‚÷v–GF‚¢÷—†VÅ&F–òÂö†V–v‡B¢÷—†VÅ&F–ò’æfÆö÷"‚“°  —Ó°  ’ò¢  ’¢F†—2ÖWF†öBÆÆ÷w2FòFVf–æRF†RG&v–ær'VffW"6—¦R'’7V6–g––æp ’¢v–GF‚Â†V–v‡BæB—†VÂ&F–òÆÂBöæ6RâF†R6—¦RöbF†RG&v–æp ’¢'VffW"—26ö×WFVBv—F‚F†—2f÷&×VÆ  ’¢§0 ’¢6—¦Rç‚Òv–GF‚¢—†VÅ&F–ó° ’¢6—¦Rç’Ò†V–v‡B¢—†VÅ&F–ó° ’¢  ’  ’¢&Ò¶çVÖ&W'Òv–GF‚ÒF†Rv–GF‚–âÆöv–6Â—†VÇ2à ’¢&Ò¶çVÖ&W'Ò†V–v‡BÒF†R†V–v‡B–âÆöv–6Â—†VÇ2à ’¢&Ò¶çVÖ&W'Ò—†VÅ&F–òÒF†R—†VÂ&F–òà ’¢ð —F†—2ç6WDG&v–æt'VffW%6—¦RÒgVæ7F–öâ‚v–GF‚Â†V–v‡BÂ—†VÅ&F–ò’°  •÷v–GF‚Òv–GFƒ° •ö†V–v‡BÒ†V–v‡C°  •÷—†VÅ&F–òÒ—†VÅ&F–ó°  –6çf2çv–GF‚ÒÖF‚æfÆö÷"‚v–GF‚¢—†VÅ&F–ò“° –6çf2æ†V–v‡BÒÖF‚æfÆö÷"‚†V–v‡B¢—†VÅ&F–ò“°  —F†—2ç6WEf–Ww÷'B‚ÂÂv–GF‚Â†V–v‡B“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R7W'&VçBf–Ww÷'BFVf–æ—F–öâà ’  ’¢&ÒµfV7F÷#'ÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&âµfV7F÷#'ÒF†R7W'&VçBf–Ww÷'BFVf–æ—F–öâà ’¢ð —F†—2ævWD7W'&VçEf–Ww÷'BÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBæ6÷’‚ö7W'&VçEf–Ww÷'B“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†Rf–Ww÷'BFVf–æ—F–öâà ’  ’¢&ÒµfV7F÷#GÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&âµfV7F÷#GÒF†Rf–Ww÷'BFVf–æ—F–öâà ’¢ð —F†—2ævWEf–Ww÷'BÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBæ6÷’‚÷f–Ww÷'B“°  —Ó°  ’ò¢  ’¢6WG2F†Rf–Ww÷'BFò&VæFW"g&öÒ‡‚Â’–Fò‡‚²v–GF‚Â’²†V–v‡B–à ’  ’¢&Ò¶çVÖ&W"ÂfV7F÷#GÒ‚ÒF†R†÷&—¦öçFÂ6ö÷&F–æFRf÷"F†RÆ÷vW"ÆVgB6÷&æW"öbF†Rf–Ww÷'B÷&–v–â–âÆöv–6Â—†VÂVæ—Bà ’¢÷"ÇFW&æF—fVÇ’f÷W"Ö6ö×öæVçBfV7F÷"7V6–g––ærÆÂF†R&ÖWFW'2öbF†Rf–Ww÷'Bà ’¢&Ò¶çVÖ&W'Ò’ÒF†RfW'F–6Â6ö÷&F–æFRf÷"F†RÆ÷vW"ÆVgB6÷&æW"öbF†Rf–Ww÷'B÷&–v–â–âÆöv–6Â—†VÂVæ—Bà ’¢&Ò¶çVÖ&W'Òv–GF‚ÒF†Rv–GF‚öbF†Rf–Ww÷'B–âÆöv–6Â—†VÂVæ—Bà ’¢&Ò¶çVÖ&W'Ò†V–v‡BÒF†R†V–v‡BöbF†Rf–Ww÷'B–âÆöv–6Â—†VÂVæ—Bà ’¢ð —F†—2ç6WEf–Ww÷'BÒgVæ7F–öâ‚‚Â’Âv–GF‚Â†V–v‡B’°  ––b‚‚æ—5fV7F÷#B’°  •÷f–Ww÷'Bç6WB‚‚ç‚Â‚ç’Â‚ç¢Â‚çr“°  —ÒVÇ6R°  •÷f–Ww÷'Bç6WB‚‚Â’Âv–GF‚Â†V–v‡B“°  —Ð  —7FFRçf–Ww÷'B‚ö7W'&VçEf–Ww÷'Bæ6÷’‚÷f–Ww÷'B’æ×VÇF—Ç•66Æ"‚÷—†VÅ&F–ò’ç&÷VæB‚’“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R66—76÷"&Vv–öâà ’  ’¢&ÒµfV7F÷#GÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&âµfV7F÷#GÒF†R66—76÷"&Vv–öâà ’¢ð —F†—2ævWE66—76÷"ÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBæ6÷’‚÷66—76÷"“°  —Ó°  ’ò¢  ’¢6WG2F†R66—76÷"&Vv–öâFò&VæFW"g&öÒ‡‚Â’–Fò‡‚²v–GF‚Â’²†V–v‡B–à ’  ’¢&Ò¶çVÖ&W"ÂfV7F÷#GÒ‚ÒF†R†÷&—¦öçFÂ6ö÷&F–æFRf÷"F†RÆ÷vW"ÆVgB6÷&æW"öbF†R66—76÷"&Vv–öâ÷&–v–â–âÆöv–6Â—†VÂVæ—Bà ’¢÷"ÇFW&æF—fVÇ’f÷W"Ö6ö×öæVçBfV7F÷"7V6–g––ærÆÂF†R&ÖWFW'2öbF†R66—76÷"&Vv–öâà ’¢&Ò¶çVÖ&W'Ò’ÒF†RfW'F–6Â6ö÷&F–æFRf÷"F†RÆ÷vW"ÆVgB6÷&æW"öbF†R66—76÷"&Vv–öâ÷&–v–â–âÆöv–6Â—†VÂVæ—Bà ’¢&Ò¶çVÖ&W'Òv–GF‚ÒF†Rv–GF‚öbF†R66—76÷"&Vv–öâ–âÆöv–6Â—†VÂVæ—Bà ’¢&Ò¶çVÖ&W'Ò†V–v‡BÒF†R†V–v‡BöbF†R66—76÷"&Vv–öâ–âÆöv–6Â—†VÂVæ—Bà ’¢ð —F†—2ç6WE66—76÷"ÒgVæ7F–öâ‚‚Â’Âv–GF‚Â†V–v‡B’°  ––b‚‚æ—5fV7F÷#B’°  •÷66—76÷"ç6WB‚‚ç‚Â‚ç’Â‚ç¢Â‚çr“°  —ÒVÇ6R°  •÷66—76÷"ç6WB‚‚Â’Âv–GF‚Â†V–v‡B“°  —Ð  —7FFRç66—76÷"‚ö7W'&VçE66—76÷"æ6÷’‚÷66—76÷"’æ×VÇF—Ç•66Æ"‚÷—†VÅ&F–ò’ç&÷VæB‚’“°  —Ó°  ’ò¢  ’¢&WGW&ç2G'VV–bF†R66—76÷"FW7B—2Væ&ÆVBà ’  ’¢&WGW&â¶&ööÆVçÒv†WF†W"F†R66—76÷"FW7B—2Væ&ÆVB÷"æ÷Bà ’¢ð —F†—2ævWE66—76÷%FW7BÒgVæ7F–öâ‚’°  —&WGW&â÷66—76÷%FW7C°  —Ó°  ’ò¢  ’¢Væ&ÆR÷"F—6&ÆRF†R66—76÷"FW7Bâv†VâF†—2—2Væ&ÆVBÂöæÇ’F†R—†VÇ0 ’¢v—F†–âF†RFVf–æVB66—76÷"&Vv–ÆÂ&RffV7FVB'’gW'F†W"&VæFW&W  ’¢7F–öç2à ’  ’¢&Ò¶&ööÆVçÒ&ööÆVâÒv†WF†W"F†R66—76÷"FW7B—2Væ&ÆVB÷"æ÷Bà ’¢ð —F†—2ç6WE66—76÷%FW7BÒgVæ7F–öâ‚&ööÆVâ’°  —7FFRç6WE66—76÷%FW7B‚÷66—76÷%FW7BÒ&ööÆVâ“°  —Ó°  ’ò¢  ’¢6WG27W7FöÒ÷VR6÷'BgVæ7F–öâf÷"F†R&VæFW"Æ—7G2â72çVÆÆ  ’¢FòW6RF†RFVfVÇB–çFW%6÷'E7F&ÆVgVæ7F–öâà ’  ’¢&Ò³ôgVæ7F–öçÒÖWF†öBÒF†R÷VR6÷'BgVæ7F–öâà ’¢ð —F†—2ç6WD÷VU6÷'BÒgVæ7F–öâ‚ÖWF†öB’°  •ö÷VU6÷'BÒÖWF†öC°  —Ó°  ’ò¢  ’¢6WG27W7FöÒG&ç7&VçB6÷'BgVæ7F–öâf÷"F†R&VæFW"Æ—7G2â72çVÆÆ  ’¢FòW6RF†RFVfVÇB&WfW'6U–çFW%6÷'E7F&ÆVgVæ7F–öâà ’  ’¢&Ò³ôgVæ7F–öçÒÖWF†öBÒF†R÷VR6÷'BgVæ7F–öâà ’¢ð —F†—2ç6WEG&ç7&VçE6÷'BÒgVæ7F–öâ‚ÖWF†öB’°  •÷G&ç7&VçE6÷'BÒÖWF†öC°  —Ó°  ’òò6ÆV&–æp  ’ò¢  ’¢&WGW&ç2F†R6ÆV"6öÆ÷"à ’  ’¢&Ò´6öÆ÷'ÒF&vWBÒF†RÖWF†öBw&—FW2F†R&W7VÇB–âF†—2F&vWBö&¦V7Bà ’¢&WGW&â´6öÆ÷'ÒF†R6ÆV"6öÆ÷"à ’¢ð —F†—2ævWD6ÆV$6öÆ÷"ÒgVæ7F–öâ‚F&vWB’°  —&WGW&âF&vWBæ6÷’‚&6¶w&÷VæBævWD6ÆV$6öÆ÷"‚’“°  —Ó°  ’ò¢  ’¢6WG2F†R6ÆV"6öÆ÷"æBÇ†à ’  ’¢&Ò´6öÆ÷'Ò6öÆ÷"ÒF†R6ÆV"6öÆ÷"à ’¢&Ò¶çVÖ&W'Ò¶Ç†ÓÒÒF†R6ÆV"Ç†à ’¢ð —F†—2ç6WD6ÆV$6öÆ÷"ÒgVæ7F–öâ‚’°  –&6¶w&÷VæBç6WD6ÆV$6öÆ÷"‚ââæ&wVÖVçG2“°  —Ó°  ’ò¢  ’¢&WGW&ç2F†R6ÆV"Ç†â&ævW2v—F†–â³ÃÖà ’  ’¢&WGW&â¶çVÖ&W'ÒF†R6ÆV"Ç†à ’¢ð —F†—2ævWD6ÆV$Ç†ÒgVæ7F–öâ‚’°  —&WGW&â&6¶w&÷VæBævWD6ÆV$Ç†‚“°  —Ó°  ’ò¢  ’¢6WG2F†R6ÆV"Ç†à ’  ’¢&Ò¶çVÖ&W'ÒÇ†ÒF†R6ÆV"Ç†à ’¢ð —F†—2ç6WD6ÆV$Ç†ÒgVæ7F–öâ‚’°  –&6¶w&÷VæBç6WD6ÆV$Ç†‚ââæ&wVÖVçG2“°  —Ó°  ’ò¢  ’¢FVÆÇ2F†R&VæFW&W"Fò6ÆV"—G26öÆ÷"ÂFWF‚÷"7FVæ6–ÂG&v–ær'VffW"‡2’à ’¢F†—2ÖWF†öB–æ—F–Æ—¦W2F†R'VffW'2FòF†R7W'&VçB6ÆV"6öÆ÷"fÇVW2à ’  ’¢&Ò¶&ööÆVçÒ¶6öÆ÷#×G'VUÒÒv†WF†W"F†R6öÆ÷"'VffW"6†÷VÆB&R6ÆV&VB÷"æ÷Bà ’¢&Ò¶&ööÆVçÒ¶FWFƒ×G'VUÒÒv†WF†W"F†RFWF‚'VffW"6†÷VÆB&R6ÆV&VB÷"æ÷Bà ’¢&Ò¶&ööÆVçÒ·7FVæ6–Ã×G'VUÒÒv†WF†W"F†R7FVæ6–Â'VffW"6†÷VÆB&R6ÆV&VB÷"æ÷Bà ’¢ð —F†—2æ6ÆV"ÒgVæ7F–öâ‚6öÆ÷"ÒG'VRÂFWF‚ÒG'VRÂ7FVæ6–ÂÒG'VR’°  –ÆWB&—G2Ò°  ––b‚6öÆ÷"’°  ’òò6†V6²–bvRw&RG'––ærFò6ÆV"â–çFVvW"F&vW@ –ÆWB—4–çFVvW$f÷&ÖBÒfÇ6S° ––b‚ö7W'&VçE&VæFW%F&vWBÓÒçVÆÂ’°  –6öç7BF&vWDf÷&ÖBÒö7W'&VçE&VæFW%F&vWBçFW‡GW&Ræf÷&ÖC° –—4–çFVvW$f÷&ÖBÒF&vWDf÷&ÖBÓÓÒ$t$–çFVvW$f÷&ÖBÇÀ —F&vWDf÷&ÖBÓÓÒ$t–çFVvW$f÷&ÖBÇÀ —F&vWDf÷&ÖBÓÓÒ&VD–çFVvW$f÷&ÖC°  —Ð  ’òòW6RF†R&÷&–FR6ÆV"gVæ7F–öç2Fò6ÆV"F†RF&vWB–b—Bw26–væV@ ’òò÷"Vç6–væVB–çFVvW"F&vW@ ––b‚—4–çFVvW$f÷&ÖB’°  –6öç7BF&vWEG—RÒö7W'&VçE&VæFW%F&vWBçFW‡GW&RçG—S° –6öç7B—5Vç6–væVEG—RÒF&vWEG—RÓÓÒVç6–væVD'—FUG—RÇÀ —F&vWEG—RÓÓÒVç6–væVD–çEG—RÇÀ —F&vWEG—RÓÓÒVç6–væVE6†÷'EG—RÇÀ —F&vWEG—RÓÓÒVç6–væVD–çC#C…G—RÇÀ —F&vWEG—RÓÓÒVç6–væVE6†÷'CCCCEG—RÇÀ —F&vWEG—RÓÓÒVç6–væVE6†÷'CSSSG—S°  –6öç7B6ÆV$6öÆ÷"Ò&6¶w&÷VæBævWD6ÆV$6öÆ÷"‚“° –6öç7BÒ&6¶w&÷VæBævWD6ÆV$Ç†‚“° –6öç7B"Ò6ÆV$6öÆ÷"ç#° –6öç7BrÒ6ÆV$6öÆ÷"æs° –6öç7B"Ò6ÆV$6öÆ÷"æ#°  ––b‚—5Vç6–væVEG—R’°  —V–çD6ÆV$6öÆ÷%²ÒÒ#° —V–çD6ÆV$6öÆ÷%²ÒÒs° —V–çD6ÆV$6öÆ÷%²"ÒÒ#° —V–çD6ÆV$6öÆ÷%²2ÒÒ° •övÂæ6ÆV$'VffW'V—b‚övÂä4ôÄõ"ÂÂV–çD6ÆV$6öÆ÷"“°  —ÒVÇ6R°  ––çD6ÆV$6öÆ÷%²ÒÒ#° ––çD6ÆV$6öÆ÷%²ÒÒs° ––çD6ÆV$6öÆ÷%²"ÒÒ#° ––çD6ÆV$6öÆ÷%²2ÒÒ° •övÂæ6ÆV$'VffW&—b‚övÂä4ôÄõ"ÂÂ–çD6ÆV$6öÆ÷"“°  —Ð  —ÒVÇ6R°  –&—G2ÃÒövÂä4ôÄõ%ô%TddU%ô$•C°  —Ð  —Ð  ––b‚FWF‚’°  –&—G2ÃÒövÂäDUD…ô%TddU%ô$•C°  —Ð  ––b‚7FVæ6–Â’°  –&—G2ÃÒövÂå5DTä4”Åô%TddU%ô$•C° —F†—2ç7FFRæ'VffW'2ç7FVæ6–Âç6WDÖ6²‚†fffffffb“°  —Ð  •övÂæ6ÆV"‚&—G2“°  —Ó°  ’ò¢  ’¢6ÆV'2F†R6öÆ÷"'VffW"âWV—fÆVçBFò6ÆÆ–ær&VæFW&W"æ6ÆV"‚G'VRÂfÇ6RÂfÇ6R–à ’¢ð —F†—2æ6ÆV$6öÆ÷"ÒgVæ7F–öâ‚’°  —F†—2æ6ÆV"‚G'VRÂfÇ6RÂfÇ6R“°  —Ó°  ’ò¢  ’¢6ÆV'2F†RFWF‚'VffW"âWV—fÆVçBFò6ÆÆ–ær&VæFW&W"æ6ÆV"‚fÇ6RÂG'VRÂfÇ6R–à ’¢ð —F†—2æ6ÆV$FWF‚ÒgVæ7F–öâ‚’°  —F†—2æ6ÆV"‚fÇ6RÂG'VRÂfÇ6R“°  —Ó°  ’ò¢  ’¢6ÆV'2F†R7FVæ6–Â'VffW"âWV—fÆVçBFò6ÆÆ–ær&VæFW&W"æ6ÆV"‚fÇ6RÂfÇ6RÂG'VR–à ’¢ð —F†—2æ6ÆV%7FVæ6–ÂÒgVæ7F–öâ‚’°  —F†—2æ6ÆV"‚fÇ6RÂfÇ6RÂG'VR“°  —Ó°  ’ò¢  ’¢g&VW2F†RuR×&VÆFVB&W6÷W&6W2ÆÆö6FVB'’F†—2–ç7Fæ6Râ6ÆÂF†—0 ’¢ÖWF†öBv†VæWfW"F†—2–ç7Fæ6R—2æòÆöævW"W6VB–â–÷W"à ’¢ð —F†—2æF—7÷6RÒgVæ7F–öâ‚’°  –6çf2ç&VÖ÷fTWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡FÆ÷7BrÂöä6öçFW‡DÆ÷7BÂfÇ6R“° –6çf2ç&VÖ÷fTWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡G&W7F÷&VBrÂöä6öçFW‡E&W7F÷&RÂfÇ6R“° –6çf2ç&VÖ÷fTWfVçDÆ—7FVæW"‚wvV&vÆ6öçFW‡F7&VF–öæW'&÷"rÂöä6öçFW‡D7&VF–öäW'&÷"ÂfÇ6R“°  –&6¶w&÷VæBæF—7÷6R‚“° —&VæFW$Æ—7G2æF—7÷6R‚“° —&VæFW%7FFW2æF—7÷6R‚“° —&÷W'F–W2æF—7÷6R‚“° –7V&VÖ2æF—7÷6R‚“° –7V&WWfÖ2æF—7÷6R‚“° –ö&¦V7G2æF—7÷6R‚“° –&–æF–æu7FFW2æF—7÷6R‚“° —Væ–f÷&×4w&÷W2æF—7÷6R‚“° —&öw&Ô66†RæF—7÷6R‚“°  —‡"æF—7÷6R‚“°  —‡"ç&VÖ÷fTWfVçDÆ—7FVæW"‚w6W76–öç7F'BrÂöå…%6W76–öå7F'B“° —‡"ç&VÖ÷fTWfVçDÆ—7FVæW"‚w6W76–öæVæBrÂöå…%6W76–öäVæB“°  –æ–ÖF–öâç7F÷‚“°  —Ó°  ’òòWfVçG0  –gVæ7F–öâöä6öçFW‡DÆ÷7B‚WfVçB’°  –WfVçBç&WfVçDFVfVÇB‚“°  –6öç6öÆRæÆör‚uD…$TRåvV$tÅ&VæFW&W#¢6öçFW‡BÆ÷7Bâr“°  •ö—46öçFW‡DÆ÷7BÒG'VS°  —Ð  –gVæ7F–öâöä6öçFW‡E&W7F÷&R‚ò¢WfVçB¢ò’°  –6öç6öÆRæÆör‚uD…$TRåvV$tÅ&VæFW&W#¢6öçFW‡B&W7F÷&VBâr“°  •ö—46öçFW‡DÆ÷7BÒfÇ6S°  –6öç7B–æfôWFõ&W6WBÒ–æfòæWFõ&W6WC° –6öç7B6†F÷tÖVæ&ÆVBÒ6†F÷tÖæVæ&ÆVC° –6öç7B6†F÷tÖWFõWFFRÒ6†F÷tÖæWFõWFFS° –6öç7B6†F÷tÖæVVG5WFFRÒ6†F÷tÖææVVG5WFFS° –6öç7B6†F÷tÖG—RÒ6†F÷tÖçG—S°  ––æ—DtÄ6öçFW‡B‚“°  ––æfòæWFõ&W6WBÒ–æfôWFõ&W6WC° —6†F÷tÖæVæ&ÆVBÒ6†F÷tÖVæ&ÆVC° —6†F÷tÖæWFõWFFRÒ6†F÷tÖWFõWFFS° —6†F÷tÖææVVG5WFFRÒ6†F÷tÖæVVG5WFFS° —6†F÷tÖçG—RÒ6†F÷tÖG—S°  —Ð  –gVæ7F–öâöä6öçFW‡D7&VF–öäW'&÷"‚WfVçB’°  –6öç6öÆRæW'&÷"‚uD…$TRåvV$tÅ&VæFW&W#¢vV$tÂ6öçFW‡B6÷VÆBæ÷B&R7&VFVBâ&V6öã¢rÂWfVçBç7FGW4ÖW76vR“°  —Ð  –gVæ7F–öâöäÖFW&–ÄF—7÷6R‚WfVçB’°  –6öç7BÖFW&–ÂÒWfVçBçF&vWC°  –ÖFW&–Âç&VÖ÷fTWfVçDÆ—7FVæW"‚vF—7÷6RrÂöäÖFW&–ÄF—7÷6R“°  –FVÆÆö6FTÖFW&–Â‚ÖFW&–Â“°  —Ð  ’òò'VffW"FVÆÆö6F–öà  –gVæ7F–öâFVÆÆö6FTÖFW&–Â‚ÖFW&–Â’°  —&VÆV6TÖFW&–Å&öw&Õ&VfW&Væ6W2‚ÖFW&–Â“°  —&÷W'F–W2ç&VÖ÷fR‚ÖFW&–Â“°  —Ð   –gVæ7F–öâ&VÆV6TÖFW&–Å&öw&Õ&VfW&Væ6W2‚ÖFW&–Â’°  –6öç7B&öw&×2Ò&÷W'F–W2ævWB‚ÖFW&–Â’ç&öw&×3°  ––b‚&öw&×2ÓÒVæFVf–æVB’°  —&öw&×2æf÷$V6‚‚gVæ7F–öâ‚&öw&Ò’°  —&öw&Ô66†Rç&VÆV6U&öw&Ò‚&öw&Ò“°  —Ò“°  ––b‚ÖFW&–Âæ—56†FW$ÖFW&–Â’°  —&öw&Ô66†Rç&VÆV6U6†FW$66†R‚ÖFW&–Â“°  —Ð  —Ð  —Ð  ’òò'VffW"&VæFW&–æp  —F†—2ç&VæFW$'VffW$F—&V7BÒgVæ7F–öâ‚6ÖW&Â66VæRÂvVöÖWG'’ÂÖFW&–ÂÂö&¦V7BÂw&÷W’°  ––b‚66VæRÓÓÒçVÆÂ’66VæRÒöV×G•66VæS²òò&VæFW$'VffW$F—&V7B6V6öæB&ÖWFW"W6VBFò&Rför†6÷VÆB&RçVÆÂ  –6öç7Bg&öçDf6T5rÒ‚ö&¦V7Bæ—4ÖW6‚bbö&¦V7BæÖG&—…v÷&ÆBæFWFW&Ö–æçB‚’Â“°  –6öç7B&öw&ÒÒ6WE&öw&Ò‚6ÖW&Â66VæRÂvVöÖWG'’ÂÖFW&–ÂÂö&¦V7B“°  —7FFRç6WDÖFW&–Â‚ÖFW&–ÂÂg&öçDf6T5r“°  ’òð  –ÆWB–æFW‚ÒvVöÖWG'’æ–æFWƒ° –ÆWB&ævTf7F÷"Ò°  ––b‚ÖFW&–Âçv—&Vg&ÖRÓÓÒG'VR’°  ––æFW‚ÒvVöÖWG&–W2ævWEv—&Vg&ÖTGG&–'WFR‚vVöÖWG'’“°  ––b‚–æFW‚ÓÓÒVæFVf–æVB’&WGW&ã°  —&ævTf7F÷"Ò#°  —Ð  ’òð  –6öç7BG&u&ævRÒvVöÖWG'’æG&u&ævS° –6öç7B÷6—F–öâÒvVöÖWG'’æGG&–'WFW2ç÷6—F–öã°  –ÆWBG&u7F'BÒG&u&ævRç7F'B¢&ævTf7F÷#° –ÆWBG&tVæBÒ‚G&u&ævRç7F'B²G&u&ævRæ6÷VçB’¢&ævTf7F÷#°  ––b‚w&÷WÓÒçVÆÂ’°  –G&u7F'BÒÖF‚æÖ‚‚G&u7F'BÂw&÷Wç7F'B¢&ævTf7F÷"“° –G&tVæBÒÖF‚æÖ–â‚G&tVæBÂ‚w&÷Wç7F'B²w&÷Wæ6÷VçB’¢&ævTf7F÷"“°  —Ð  ––b‚–æFW‚ÓÒçVÆÂ’°  –G&u7F'BÒÖF‚æÖ‚‚G&u7F'BÂ“° –G&tVæBÒÖF‚æÖ–â‚G&tVæBÂ–æFW‚æ6÷VçB“°  —ÒVÇ6R–b‚÷6—F–öâÓÒVæFVf–æVBbb÷6—F–öâÓÒçVÆÂ’°  –G&u7F'BÒÖF‚æÖ‚‚G&u7F'BÂ“° –G&tVæBÒÖF‚æÖ–â‚G&tVæBÂ÷6—F–öâæ6÷VçB“°  —Ð  –6öç7BG&t6÷VçBÒG&tVæBÒG&u7F'C°  ––b‚G&t6÷VçBÂÇÂG&t6÷VçBÓÓÒ–æf–æ—G’’&WGW&ã°  ’òð  –&–æF–æu7FFW2ç6WGW‚ö&¦V7BÂÖFW&–ÂÂ&öw&ÒÂvVöÖWG'’Â–æFW‚“°  –ÆWBGG&–'WFS° –ÆWB&VæFW&W"Ò'VffW%&VæFW&W#°  ––b‚–æFW‚ÓÒçVÆÂ’°  –GG&–'WFRÒGG&–'WFW2ævWB‚–æFW‚“°  —&VæFW&W"Ò–æFW†VD'VffW%&VæFW&W#° —&VæFW&W"ç6WD–æFW‚‚GG&–'WFR“°  —Ð  ’òð  ––b‚ö&¦V7Bæ—4ÖW6‚’°  ––b‚ÖFW&–Âçv—&Vg&ÖRÓÓÒG'VR’°  —7FFRç6WDÆ–æUv–GF‚‚ÖFW&–Âçv—&Vg&ÖTÆ–æWv–GF‚¢vWEF&vWE—†VÅ&F–ò‚’“° —&VæFW&W"ç6WDÖöFR‚övÂäÄ”äU2“°  —ÒVÇ6R°  —&VæFW&W"ç6WDÖöFR‚övÂåE$”ätÄU2“°  —Ð  —ÒVÇ6R–b‚ö&¦V7Bæ—4Æ–æR’°  –ÆWBÆ–æUv–GF‚ÒÖFW&–ÂæÆ–æWv–GFƒ°  ––b‚Æ–æUv–GF‚ÓÓÒVæFVf–æVB’Æ–æUv–GF‚Ò²òòæ÷BW6–ærÆ–æR¤ÖFW&–À  —7FFRç6WDÆ–æUv–GF‚‚Æ–æUv–GF‚¢vWEF&vWE—†VÅ&F–ò‚’“°  ––b‚ö&¦V7Bæ—4Æ–æU6VvÖVçG2’°  —&VæFW&W"ç6WDÖöFR‚övÂäÄ”äU2“°  —ÒVÇ6R–b‚ö&¦V7Bæ—4Æ–æTÆö÷’°  —&VæFW&W"ç6WDÖöFR‚övÂäÄ”äUôÄôõ“°  —ÒVÇ6R°  —&VæFW&W"ç6WDÖöFR‚övÂäÄ”äUõ5E$•“°  —Ð  —ÒVÇ6R–b‚ö&¦V7Bæ—5ö–çG2’°  —&VæFW&W"ç6WDÖöFR‚övÂåô”åE2“°  —ÒVÇ6R–b‚ö&¦V7Bæ—57&—FR’°  —&VæFW&W"ç6WDÖöFR‚övÂåE$”ätÄU2“°  —Ð  ––b‚ö&¦V7Bæ—4&F6†VDÖW6‚’°  ––b‚ö&¦V7Båö×VÇF”G&t–ç7Fæ6W2ÓÒçVÆÂ’°  ’òòFW&V6FVBÂ#s@ —v&äöæ6R‚uD…$TRåvV$tÅ&VæFW&W#¢&VæFW$×VÇF”G&t–ç7Fæ6W2†2&VVâFW&V6FVBæBv–ÆÂ&R&VÖ÷fVB–â#ƒBâVæBFò&VæFW$×VÇF”G&r&wVÖVçG2æBW6R–æF—&V7F–öââr“° —&VæFW&W"ç&VæFW$×VÇF”G&t–ç7Fæ6W2‚ö&¦V7Båö×VÇF”G&u7F'G2Âö&¦V7Båö×VÇF”G&t6÷VçG2Âö&¦V7Båö×VÇF”G&t6÷VçBÂö&¦V7Båö×VÇF”G&t–ç7Fæ6W2“°  —ÒVÇ6R°  ––b‚W‡FVç6–öç2ævWB‚utT$tÅö×VÇF•öG&rr’’°  –6öç7B7F'G2Òö&¦V7Båö×VÇF”G&u7F'G3° –6öç7B6÷VçG2Òö&¦V7Båö×VÇF”G&t6÷VçG3° –6öç7BG&t6÷VçBÒö&¦V7Båö×VÇF”G&t6÷VçC° –6öç7B'—FW5W$VÆVÖVçBÒ–æFW‚òGG&–'WFW2ævWB‚–æFW‚’æ'—FW5W$VÆVÖVçB¢° –6öç7BVæ–f÷&×2Ò&÷W'F–W2ævWB‚ÖFW&–Â’æ7W'&VçE&öw&ÒævWEVæ–f÷&×2‚“° –f÷"‚ÆWB’Ò²’ÂG&t6÷VçC²’²²’°  —Væ–f÷&×2ç6WEfÇVR‚övÂÂuövÅôG&t”BrÂ’“° —&VæFW&W"ç&VæFW"‚7F'G5²’Òò'—FW5W$VÆVÖVçBÂ6÷VçG5²’Ò“°  —Ð  —ÒVÇ6R°  —&VæFW&W"ç&VæFW$×VÇF”G&r‚ö&¦V7Båö×VÇF”G&u7F'G2Âö&¦V7Båö×VÇF”G&t6÷VçG2Âö&¦V7Båö×VÇF”G&t6÷VçB“°  —Ð  —Ð  —ÒVÇ6R–b‚ö&¦V7Bæ—4–ç7Fæ6VDÖW6‚’°  —&VæFW&W"ç&VæFW$–ç7Fæ6W2‚G&u7F'BÂG&t6÷VçBÂö&¦V7Bæ6÷VçB“°  —ÒVÇ6R–b‚vVöÖWG'’æ—4–ç7Fæ6VD'VffW$vVöÖWG'’’°  –6öç7BÖ„–ç7Fæ6T6÷VçBÒvVöÖWG'’åöÖ„–ç7Fæ6T6÷VçBÓÒVæFVf–æVBòvVöÖWG'’åöÖ„–ç7Fæ6T6÷VçB¢–æf–æ—G“° –6öç7B–ç7Fæ6T6÷VçBÒÖF‚æÖ–â‚vVöÖWG'’æ–ç7Fæ6T6÷VçBÂÖ„–ç7Fæ6T6÷VçB“°  —&VæFW&W"ç&VæFW$–ç7Fæ6W2‚G&u7F'BÂG&t6÷VçBÂ–ç7Fæ6T6÷VçB“°  —ÒVÇ6R°  —&VæFW&W"ç&VæFW"‚G&u7F'BÂG&t6÷VçB“°  —Ð  —Ó°  ’òò6ö×–ÆP  –gVæ7F–öâ&W&TÖFW&–Â‚ÖFW&–ÂÂ66VæRÂö&¦V7B’°  ––b‚ÖFW&–ÂçG&ç7&VçBÓÓÒG'VRbbÖFW&–Âç6–FRÓÓÒF÷V&ÆU6–FRbbÖFW&–Âæf÷&6U6–ævÆU72ÓÓÒfÇ6R’°  –ÖFW&–Âç6–FRÒ&6µ6–FS° –ÖFW&–ÂææVVG5WFFRÒG'VS° –vWE&öw&Ò‚ÖFW&–ÂÂ66VæRÂö&¦V7B“°  –ÖFW&–Âç6–FRÒg&öçE6–FS° –ÖFW&–ÂææVVG5WFFRÒG'VS° –vWE&öw&Ò‚ÖFW&–ÂÂ66VæRÂö&¦V7B“°  –ÖFW&–Âç6–FRÒF÷V&ÆU6–FS°  —ÒVÇ6R°  –vWE&öw&Ò‚ÖFW&–ÂÂ66VæRÂö&¦V7B“°  —Ð  —Ð  ’ò¢  ’¢6ö×–ÆW2ÆÂÖFW&–Ç2–âF†R66VæRv—F‚F†R6ÖW&âF†—2—2W6VgVÂFò&V6ö×–ÆR6†FW'0 ’¢&Vf÷&RF†Rf—'7B&VæFW&–ærâ–b–÷RvçBFòFB4Bö&¦V7BFòâW†—7F–ær66VæRÂW6RF†RF†—&@ ’¢÷F–öæÂ&ÖWFW"f÷"Ç––ærF†RF&vWB66VæRà ’  ’¢æ÷FRF†BF†R‡F&vWB’66VæRw2Æ–v‡F–æræBVçf—&öæÖVçB×W7B&R6öæf–wW&VB&Vf÷&R6ÆÆ–ærF†—2ÖWF†öBà ’  ’¢&Ò´ö&¦V7C4GÒ66VæRÒF†R66VæR÷"æ÷F†W"G—Röb4Bö&¦V7BFò&V6ö×–ÆRà ’¢&Ò´6ÖW&Ò6ÖW&ÒF†R6ÖW&à ’¢&Ò³õ66VæWÒ·F&vWE66VæSÖçVÆÅÒÒF†RF&vWB66VæRà ’¢&WGW&âµ6WCÄÖFW&–ÃçÒF†R&V6ö×–ÆVBÖFW&–Ç2à ’¢ð —F†—2æ6ö×–ÆRÒgVæ7F–öâ‚66VæRÂ6ÖW&ÂF&vWE66VæRÒçVÆÂ’°  ––b‚F&vWE66VæRÓÓÒçVÆÂ’F&vWE66VæRÒ66VæS°  –7W'&VçE&VæFW%7FFRÒ&VæFW%7FFW2ævWB‚F&vWE66VæR“° –7W'&VçE&VæFW%7FFRæ–æ—B‚6ÖW&“°  —&VæFW%7FFU7F6²çW6‚‚7W'&VçE&VæFW%7FFR“°  ’òòvF†W"Æ–v‡G2g&öÒ&÷F‚F†RF&vWB66VæRæBF†RæWrö&¦V7BF†Bv–ÆÂ&RFFVBFòF†R66VæRà  —F&vWE66VæRçG&fW'6Uf—6–&ÆR‚gVæ7F–öâ‚ö&¦V7B’°  ––b‚ö&¦V7Bæ—4Æ–v‡Bbbö&¦V7BæÆ–W'2çFW7B‚6ÖW&æÆ–W'2’’°  –7W'&VçE&VæFW%7FFRçW6„Æ–v‡B‚ö&¦V7B“°  ––b‚ö&¦V7Bæ67E6†F÷r’°  –7W'&VçE&VæFW%7FFRçW6…6†F÷r‚ö&¦V7B“°  —Ð  —Ð  —Ò“°  ––b‚66VæRÓÒF&vWE66VæR’°  —66VæRçG&fW'6Uf—6–&ÆR‚gVæ7F–öâ‚ö&¦V7B’°  ––b‚ö&¦V7Bæ—4Æ–v‡Bbbö&¦V7BæÆ–W'2çFW7B‚6ÖW&æÆ–W'2’’°  –7W'&VçE&VæFW%7FFRçW6„Æ–v‡B‚ö&¦V7B“°  ––b‚ö&¦V7Bæ67E6†F÷r’°  –7W'&VçE&VæFW%7FFRçW6…6†F÷r‚ö&¦V7B“°  —Ð  —Ð  —Ò“°  —Ð  –7W'&VçE&VæFW%7FFRç6WGWÆ–v‡G2‚“°  ’òòöæÇ’–æ—F–Æ—¦RÖFW&–Ç2–âF†RæWr66VæRÂæ÷BF†RF&vWE66VæRà  –6öç7BÖFW&–Ç2ÒæWr6WB‚“°  —66VæRçG&fW'6R‚gVæ7F–öâ‚ö&¦V7B’°  ––b‚‚ö&¦V7Bæ—4ÖW6‚ÇÂö&¦V7Bæ—5ö–çG2ÇÂö&¦V7Bæ—4Æ–æRÇÂö&¦V7Bæ—57&—FR’’°  —&WGW&ã°  —Ð  –6öç7BÖFW&–ÂÒö&¦V7BæÖFW&–Ã°  ––b‚ÖFW&–Â’°  ––b‚'&’æ—4'&’‚ÖFW&–Â’’°  –f÷"‚ÆWB’Ò²’ÂÖFW&–ÂæÆVæwFƒ²’²²’°  –6öç7BÖFW&–Ã"ÒÖFW&–Å²’Ó°  —&W&TÖFW&–Â‚ÖFW&–Ã"ÂF&vWE66VæRÂö&¦V7B“° –ÖFW&–Ç2æFB‚ÖFW&–Ã"“°  —Ð  —ÒVÇ6R°  —&W&TÖFW&–Â‚ÖFW&–ÂÂF&vWE66VæRÂö&¦V7B“° –ÖFW&–Ç2æFB‚ÖFW&–Â“°  —Ð  —Ð  —Ò“°  –7W'&VçE&VæFW%7FFRÒ&VæFW%7FFU7F6²ç÷‚“°  —&WGW&âÖFW&–Ç3°  —Ó°  ’òò6ö×–ÆT7–æ0  ’ò¢  ’¢7–æ6‡&öæ÷W2fW'6–öâöb´Æ–æ²vV$tÅ&VæFW&W"66ö×–ÆWÒà ’  ’¢F†—2ÖWF†öBÖ¶W2W6RöbF†R´…%÷&ÆÆVÅ÷6†FW%ö6ö×–ÆVvV$tÂW‡FVç6–öââ†Væ6RÀ ’¢—B—2&V6öÖÖVæFVBFòW6RF†—2fW'6–öâöb6ö×–ÆR‚–v†VæWfW"÷76–&ÆRà ’  ’¢7–æ0 ’¢&Ò´ö&¦V7C4GÒ66VæRÒF†R66VæR÷"æ÷F†W"G—Röb4Bö&¦V7BFò&V6ö×–ÆRà ’¢&Ò´6ÖW&Ò6ÖW&ÒF†R6ÖW&à ’¢&Ò³õ66VæWÒ·F&vWE66VæSÖçVÆÅÒÒF†RF&vWB66VæRà ’¢&WGW&âµ&öÖ—6WÒ&öÖ—6RF†B&W6öÇfW2v†VâF†Rv—fVâ66VæR6â&R&VæFW&VBv—F†÷WBVææV6W76'’7FÆÆ–ærGVRFò6†FW"6ö×–ÆF–öâà ’¢ð —F†—2æ6ö×–ÆT7–æ2ÒgVæ7F–öâ‚66VæRÂ6ÖW&ÂF&vWE66VæRÒçVÆÂ’°  –6öç7BÖFW&–Ç2ÒF†—2æ6ö×–ÆR‚66VæRÂ6ÖW&ÂF&vWE66VæR“°  ’òòv—Bf÷"ÆÂF†RÖFW&–Ç2–âF†RæWrö&¦V7BFò–æF–6FRF†BF†W’w&P ’òò&VG’Fò&RW6VB&Vf÷&R&W6öÇf–ærF†R&öÖ—6Rà  —&WGW&âæWr&öÖ—6R‚‚&W6öÇfR’Óâ°  –gVæ7F–öâ6†V6´ÖFW&–Ç5&VG’‚’°  –ÖFW&–Ç2æf÷$V6‚‚gVæ7F–öâ‚ÖFW&–Â’°  –6öç7BÖFW&–Å&÷W'F–W2Ò&÷W'F–W2ævWB‚ÖFW&–Â“° –6öç7B&öw&ÒÒÖFW&–Å&÷W'F–W2æ7W'&VçE&öw&Ó°  ––b‚&öw&Òæ—5&VG’‚’’°  ’òò&VÖ÷fRç’&öw&×2F†B&W÷'BF†W’w&R&VG’FòW6Rg&öÒF†RÆ—7@ –ÖFW&–Ç2æFVÆWFR‚ÖFW&–Â“°  —Ð  —Ò“°  ’òòöæ6RF†RÆ—7Böb6ö×–Æ–ærÖFW&–Ç2—2V×G’Â6ÆÂF†R6ÆÆ&6°  ––b‚ÖFW&–Ç2ç6—¦RÓÓÒ’°  —&W6öÇfR‚66VæR“° —&WGW&ã°  —Ð  ’òò–b6öÖRÖÚ±î¸Â¸­yêë¢°k¢G§¦*^aterials are still not ready, wait a bit and check again

					setTimeout( checkMaterialsReady, 10 );

				}

				if ( extensions.get( 'KHR_parallel_shader_compile' ) !== null ) {

					// If we can check the compilation status of the materials without
					// blocking then do so right away.

					checkMaterialsReady();

				} else {

					// Otherwise start by waiting a bit to give the materials we just
					// initialized a chance to finish.

					setTimeout( checkMaterialsReady, 10 );

				}

			} );

		};

		// Animation Loop

		let onAnimationFrameCallback = null;

		function onAnimationFrame( time ) {

			if ( onAnimationFrameCallback ) onAnimationFrameCallback( time );

		}

		function onXRSessionStart() {

			animation.stop();

		}

		function onXRSessionEnd() {

			animation.start();

		}

		const animation = new WebGLAnimation();
		animation.setAnimationLoop( onAnimationFrame );

		if ( typeof self !== 'undefined' ) animation.setContext( self );

		this.setAnimationLoop = function ( callback ) {

			onAnimationFrameCallback = callback;
			xr.setAnimationLoop( callback );

			( callback === null ) ? animation.stop() : animation.start();

		};

		xr.addEventListener( 'sessionstart', onXRSessionStart );
		xr.addEventListener( 'sessionend', onXRSessionEnd );

		// Rendering

		/**
		 * Renders the given scene (or other type of 3D object) using the given camera.
		 *
		 * The render is done to a previously specified render target set by calling {@link WebGLRenderer#setRenderTarget}
		 * or to the canvas as usual.
		 *
		 * By default render buffers are cleared before rendering but you can prevent
		 * this by setting the property `autoClear` to `false`. If you want to prevent
		 * only certain buffers being cleared you can `autoClearColor`, `autoClearDepth`
		 * or `autoClearStencil` to `false`. To force a clear, use {@link WebGLRenderer#clear}.
		 *
		 * @param {Object3D} scene - The scene to render.
		 * @param {Camera} camera - The camera.
		 */
		this.render = function ( scene, camera ) {

			if ( camera !== undefined && camera.isCamera !== true ) {

				console.error( 'THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.' );
				return;

			}

			if ( _isContextLost === true ) return;

			// update scene graph

			if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();

			// update camera matrices and frustum

			if ( camera.parent === null && camera.matrixWorldAutoUpdate === true ) camera.updateMatrixWorld();

			if ( xr.enabled === true && xr.isPresenting === true ) {

				if ( xr.cameraAutoUpdate === true ) xr.updateCamera( camera );

				camera = xr.getCamera(); // use XR camera for rendering

			}

			//
			if ( scene.isScene === true ) scene.onBeforeRender( _this, scene, camera, _currentRenderTarget );

			currentRenderState = renderStates.get( scene, renderStateStack.length );
			currentRenderState.init( camera );

			renderStateStack.push( currentRenderState );

			_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
			_frustum.setFromProjectionMatrix( _projScreenMatrix, WebGLCoordinateSystem, camera.reversedDepth );

			_localClippingEnabled = this.localClippingEnabled;
			_clippingEnabled = clipping.init( this.clippingPlanes, _localClippingEnabled );

			currentRenderList = renderLists.get( scene, renderListStack.length );
			currentRenderList.init();

			renderListStack.push( currentRenderList );

			if ( xr.enabled === true && xr.isPresenting === true ) {

				const depthSensingMesh = _this.xr.getDepthSensingMesh();

				if ( depthSensingMesh !== null ) {

					projectObject( depthSensingMesh, camera, - Infinity, _this.sortObjects );

				}

			}

			projectObject( scene, camera, 0, _this.sortObjects );

			currentRenderList.finish();

			if ( _this.sortObjects === true ) {

				currentRenderList.sort( _opaqueSort, _transparentSort );

			}

			_renderBackground = xr.enabled === false || xr.isPresenting === false || xr.hasDepthSensing() === false;
			if ( _renderBackground ) {

				background.addToRenderList( currentRenderList, scene );

			}

			//

			this.info.render.frame ++;

			if ( _clippingEnabled === true ) clipping.beginShadows();

			const shadowsArray = currentRenderState.state.shadowsArray;

			shadowMap.render( shadowsArray, scene, camera );

			if ( _clippingEnabled === true ) clipping.endShadows();

			//

			if ( this.info.autoReset === true ) this.info.reset();

			// render scene

			const opaqueObjects = currentRenderList.opaque;
			const transmissiveObjects = currentRenderList.transmissive;

			currentRenderState.setupLights();

			if ( camera.isArrayCamera ) {

				const cameras = camera.cameras;

				if ( transmissiveObjects.length > 0 ) {

					for ( let i = 0, l = cameras.length; i < l; i ++ ) {

						const camera2 = cameras[ i ];

						renderTransmissionPass( opaqueObjects, transmissiveObjects, scene, camera2 );

					}

				}

				if ( _renderBackground ) background.render( scene );

				for ( let i = 0, l = cameras.length; i < l; i ++ ) {

					const camera2 = cameras[ i ];

					renderScene( currentRenderList, scene, camera2, camera2.viewport );

				}

			} else {

				if ( transmissiveObjects.length > 0 ) renderTransmissionPass( opaqueObjects, transmissiveObjects, scene, camera );

				if ( _renderBackground ) background.render( scene );

				renderScene( currentRenderList, scene, camera );

			}

			//

			if ( _currentRenderTarget !== null && _currentActiveMipmapLevel === 0 ) {

				// resolve multisample renderbuffers to a single-sample texture if necessary

				textures.updateMultisampleRenderTarget( _currentRenderTarget );

				// Generate mipmap if we're using any kind of mipmap filtering

				textures.updateRenderTargetMipmap( _currentRenderTarget );

			}

			//

			if ( scene.isScene === true ) scene.onAfterRender( _this, scene, camera );

			// _gl.finish();

			bindingStates.resetDefaultState();
			_currentMaterialId = -1;
			_currentCamera = null;

			renderStateStack.pop();

			if ( renderStateStack.length > 0 ) {

				currentRenderState = renderStateStack[ renderStateStack.length - 1 ];

				if ( _clippingEnabled === true ) clipping.setGlobalState( _this.clippingPlanes, currentRenderState.state.camera );

			} else {

				currentRenderState = null;

			}

			renderListStack.pop();

			if ( renderListStack.length > 0 ) {

				currentRenderList = renderListStack[ renderListStack.length - 1 ];

			} else {

				currentRenderList = null;

			}

		};

		function projectObject( object, camera, groupOrder, sortObjects ) {

			if ( object.visible === false ) return;

			const visible = object.layers.test( camera.layers );

			if ( visible ) {

				if ( object.isGroup ) {

					groupOrder = object.renderOrder;

				} else if ( object.isLOD ) {

					if ( object.autoUpdate === true ) object.update( camera );

				} else if ( object.isLight ) {

					currentRenderState.pushLight( object );

					if ( object.castShadow ) {

						currentRenderState.pushShadow( object );

					}

				} else if ( object.isSprite ) {

					if ( ! object.frustumCulled || _frustum.intersectsSprite( object ) ) {

						if ( sortObjects ) {

							_vector4.setFromMatrixPosition( object.matrixWorld )
								.applyMatrix4( _projScreenMatrix );

						}

						const geometry = objects.update( object );
						const material = object.material;

						if ( material.visible ) {

							currentRenderList.push( object, geometry, material, groupOrder, _vector4.z, null );

						}

					}

				} else if ( object.isMesh || object.isLine || object.isPoints ) {

					if ( ! object.frustumCulled || _frustum.intersectsObject( object ) ) {

						const geometry = objects.update( object );
						const material = object.material;

						if ( sortObjects ) {

							if ( object.boundingSphere !== undefined ) {

								if ( object.boundingSphere === null ) object.computeBoundingSphere();
								_vector4.copy( object.boundingSphere.center );

							} else {

								if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();
								_vector4.copy( geometry.boundingSphere.center );

							}

							_vector4
								.applyMatrix4( object.matrixWorld )
								.applyMatrix4( _projScreenMatrix );

						}

						if ( Array.isArray( material ) ) {

							const groups = geometry.groups;

							for ( let i = 0, l = groups.length; i < l; i ++ ) {

								const group = groups[ i ];
								const groupMaterial = material[ group.materialIndex ];

								if ( groupMaterial && groupMaterial.visible ) {

									currentRenderList.push( object, geometry, groupMaterial, groupOrder, _vector4.z, group );

								}

							}

						} else if ( material.visible ) {

							currentRenderList.push( object, geometry, material, groupOrder, _vector4.z, null );

						}

					}

				}

			}

			const children = object.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				projectObject( children[ i ], camera, groupOrder, sortObjects );

			}

		}

		function renderScene( currentRenderList, scene, camera, viewport ) {

			const opaqueObjects = currentRenderList.opaque;
			const transmissiveObjects = currentRenderList.transmissive;
			const transparentObjects = currentRenderList.transparent;

			currentRenderState.setupLightsView( camera );

			if ( _clippingEnabled === true ) clipping.setGlobalState( _this.clippingPlanes, camera );

			if ( viewport ) state.viewport( _currentViewport.copy( viewport ) );

			if ( opaqueObjects.length > 0 ) renderObjects( opaqueObjects, scene, camera );
			if ( transmissiveObjects.length > 0 ) renderObjects( transmissiveObjects, scene, camera );
			if ( transparentObjects.length > 0 ) renderObjects( transparentObjects, scene, camera );

			// Ensure depth buffer writing is enabled so it can be cleared on next render

			state.buffers.depth.setTest( true );
			state.buffers.depth.setMask( true );
			state.buffers.color.setMask( true );

			state.setPolygonOffset( false );

		}

		function renderTransmissionPass( opaqueObjects, transmissiveObjects, scene, camera ) {

			const overrideMaterial = scene.isScene === true ? scene.overrideMaterial : null;

			if ( overrideMaterial !== null ) {

				return;

			}

			if ( currentRenderState.state.transmissionRenderTarget[ camera.id ] === undefined ) {

				currentRenderState.state.transmissionRenderTarget[ camera.id ] = new WebGLRenderTarget( 1, 1, {
					generateMipmaps: true,
					type: ( extensions.has( 'EXT_color_buffer_half_float' ) || extensions.has( 'EXT_color_buffer_float' ) ) ? HalfFloatType : UnsignedByteType,
					minFilter: LinearMipmapLinearFilter,
					samples: 4,
					stencilBuffer: stencil,
					resolveDepthBuffer: false,
					resolveStencilBuffer: false,
					colorSpace: ColorManagement.workingColorSpace,
				} );

				// debug

				/*
				const geometry = new PlaneGeometry();
				const material = new MeshBasicMaterial( { map: _transmissionRenderTarget.texture } );

				const mesh = new Mesh( geometry, material );
				scene.add( mesh );
				*/

			}

			const transmissionRenderTarget = currentRenderState.state.transmissionRenderTarget[ camera.id ];

			const activeViewport = camera.viewport || _currentViewport;
			transmissionRenderTarget.setSize( activeViewport.z * _this.transmissionResolutionScale, activeViewport.w * _this.transmissionResolutionScale );

			//

			const currentRenderTarget = _this.getRenderTarget();
			const currentActiveCubeFace = _this.getActiveCubeFace();
			const currentActiveMipmapLevel = _this.getActiveMipmapLevel();

			_this.setRenderTarget( transmissionRenderTarget );

			_this.getClearColor( _currentClearColor );
			_currentClearAlpha = _this.getClearAlpha();
			if ( _currentClearAlpha < 1 ) _this.setClearColor( 0xffffff, 0.5 );

			_this.clear();

			if ( _renderBackground ) background.render( scene );

			// Turn off the features which can affect the frag color for opaque objects pass.
			// Otherwise they are applied twice in opaque objects pass and transmission objects pass.
			const currentToneMapping = _this.toneMapping;
			_this.toneMapping = NoToneMapping;

			// Remove viewport from camera to avoid nested render calls resetting viewport to it (e.g Reflector).
			// Transmission render pass requires viewport to match the transmissionRenderTarget.
			const currentCameraViewport = camera.viewport;
			if ( camera.viewport !== undefined ) camera.viewport = undefined;

			currentRenderState.setupLightsView( camera );

			if ( _clippingEnabled === true ) clipping.setGlobalState( _this.clippingPlanes, camera );

			renderObjects( opaqueObjects, scene, camera );

			textures.updateMultisampleRenderTarget( transmissionRenderTarget );
			textures.updateRenderTargetMipmap( transmissionRenderTarget );

			if ( extensions.has( 'WEBGL_multisampled_render_to_texture' ) === false ) { // see #28131

				let renderTargetNeedsUpdate = false;

				for ( let i = 0, l = transmissiveObjects.length; i < l; i ++ ) {

					const renderItem = transmissiveObjects[ i ];

					const object = renderItem.object;
					const geometry = renderItem.geometry;
					const material = renderItem.material;
					const group = renderItem.group;

					if ( material.side === DoubleSide && object.layers.test( camera.layers ) ) {

						const currentSide = material.side;

						material.side = BackSide;
						material.needsUpdate = true;

						renderObject( object, scene, camera, geometry, material, group );

						material.side = currentSide;
						material.needsUpdate = true;

						renderTargetNeedsUpdate = true;

					}

				}

				if ( renderTargetNeedsUpdate === true ) {

					textures.updateMultisampleRenderTarget( transmissionRenderTarget );
					textures.updateRenderTargetMipmap( transmissionRenderTarget );

				}

			}

			_this.setRenderTarget( currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel );

			_this.setClearColor( _currentClearColor, _currentClearAlpha );

			if ( currentCameraViewport !== undefined ) camera.viewport = currentCameraViewport;

			_this.toneMapping = currentToneMapping;

		}

		function renderObjects( renderList, scene, camera ) {

			const overrideMaterial = scene.isScene === true ? scene.overrideMaterial : null;

			for ( let i = 0, l = renderList.length; i < l; i ++ ) {

				const renderItem = renderList[ i ];

				const object = renderItem.object;
				const geometry = renderItem.geometry;
				const group = renderItem.group;
				let material = renderItem.material;

				if ( material.allowOverride === true && overrideMaterial !== null ) {

					material = overrideMaterial;

				}

				if ( object.layers.test( camera.layers ) ) {

					renderObject( object, scene, camera, geometry, material, group );

				}

			}

		}

		function renderObject( object, scene, camera, geometry, material, group ) {

			object.onBeforeRender( _this, scene, camera, geometry, material, group );

			object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );
			object.normalMatrix.getNormalMatrix( object.modelViewMatrix );

			material.onBeforeRender( _this, scene, camera, geometry, object, group );

			if ( material.transparent === true && material.side === DoubleSide && material.forceSinglePass === false ) {

				material.side = BackSide;
				material.needsUpdate = true;
				_this.renderBufferDirect( camera, scene, geometry, material, object, group );

				material.side = FrontSide;
				material.needsUpdate = true;
				_this.renderBufferDirect( camera, scene, geometry, material, object, group );

				material.side = DoubleSide;

			} else {

				_this.renderBufferDirect( camera, scene, geometry, material, object, group );

			}

			object.onAfterRender( _this, scene, camera, geometry, material, group );

		}

		function getProgram( material, scene, object ) {

			if ( scene.isScene !== true ) scene = _emptyScene; // scene could be a Mesh, Line, Points, ...

			const materialProperties = properties.get( material );

			const lights = currentRenderState.state.lights;
			const shadowsArray = currentRenderState.state.shadowsArray;

			const lightsStateVersion = lights.state.version;

			const parameters = programCache.getParameters( material, lights.state, shadowsArray, scene, object );
			const programCacheKey = programCache.getProgramCacheKey( parameters );

			let programs = materialProperties.programs;

			// always update environment and fog - changing these trigger an getProgram call, but it's possible that the program doesn't change

			materialProperties.environment = material.isMeshStandardMaterial ? scene.environment : null;
			materialProperties.fog = scene.fog;
			materialProperties.envMap = ( material.isMeshStandardMaterial ? cubeuvmaps : cubemaps ).get( material.envMap || materialProperties.environment );
			materialProperties.envMapRotation = ( materialProperties.environment !== null && material.envMap === null ) ? scene.environmentRotation : material.envMapRotation;

			if ( programs === undefined ) {

				// new material

				material.addEventListener( 'dispose', onMaterialDispose );

				programs = new Map();
				materialProperties.programs = programs;

			}

			let program = programs.get( programCacheKey );

			if ( program !== undefined ) {

				// early out if program and light state is identical

				if ( materialProperties.currentProgram === program && materialProperties.lightsStateVersion === lightsStateVersion ) {

					updateCommonMaterialProperties( material, parameters );

					return program;

				}

			} else {

				parameters.uniforms = programCache.getUniforms( material );

				material.onBeforeCompile( parameters, _this );

				program = programCache.acquireProgram( parameters, programCacheKey );
				programs.set( programCacheKey, program );

				materialProperties.uniforms = parameters.uniforms;

			}

			const uniforms = materialProperties.uniforms;

			if ( ( ! material.isShaderMaterial && ! material.isRawShaderMaterial ) || material.clipping === true ) {

				uniforms.clippingPlanes = clipping.uniform;

			}

			updateCommonMaterialProperties( material, parameters );

			// store the light setup it was created for

			materialProperties.needsLights = materialNeedsLights( material );
			materialProperties.lightsStateVersion = lightsStateVersion;

			if ( materialProperties.needsLights ) {

				// wire up the material to this renderer's lighting state

				uniforms.ambientLightColor.value = lights.state.ambient;
				uniforms.lightProbe.value = lights.state.probe;
				uniforms.directionalLights.value = lights.state.directional;
				uniforms.directionalLightShadows.value = lights.state.directionalShadow;
				uniforms.spotLights.value = lights.state.spot;
				uniforms.spotLightShadows.value = lights.state.spotShadow;
				uniforms.rectAreaLights.value = lights.state.rectArea;
				uniforms.ltc_1.value = lights.state.rectAreaLTC1;
				uniforms.ltc_2.value = lights.state.rectAreaLTC2;
				uniforms.pointLights.value = lights.state.point;
				uniforms.pointLightShadows.value = lights.state.pointShadow;
				uniforms.hemisphereLights.value = lights.state.hemi;

				uniforms.directionalShadowMap.value = lights.state.directionalShadowMap;
				uniforms.directionalShadowMatrix.value = lights.state.directionalShadowMatrix;
				uniforms.spotShadowMap.value = lights.state.spotShadowMap;
				uniforms.spotLightMatrix.value = lights.state.spotLightMatrix;
				uniforms.spotLightMap.value = lights.state.spotLightMap;
				uniforms.pointShadowMap.value = lights.state.pointShadowMap;
				uniforms.pointShadowMatrix.value = lights.state.pointShadowMatrix;
				// TODO (abelnation): add area lights shadow info to uniforms

			}

			materialProperties.currentProgram = program;
			materialProperties.uniformsList = null;

			return program;

		}

		function getUniformList( materialProperties ) {

			if ( materialProperties.uniformsList === null ) {

				const progUniforms = materialProperties.currentProgram.getUniforms();
				materialProperties.uniformsList = WebGLUniforms.seqWithValue( progUniforms.seq, materialProperties.uniforms );

			}

			return materialProperties.uniformsList;

		}

		function updateCommonMaterialProperties( material, parameters ) {

			const materialProperties = properties.get( material );

			materialProperties.outputColorSpace = parameters.outputColorSpace;
			materialProperties.batching = parameters.batching;
			materialProperties.batchingColor = parameters.batchingColor;
			materialProperties.instancing = parameters.instancing;
			materialProperties.instancingColor = parameters.instancingColor;
			materialProperties.instancingMorph = parameters.instancingMorph;
			materialProperties.skinning = parameters.skinning;
			materialProperties.morphTargets = parameters.morphTargets;
			materialProperties.morphNormals = parameters.morphNormals;
			materialProperties.morphColors = parameters.morphColors;
			materialProperties.morphTargetsCount = parameters.morphTargetsCount;
			materialProperties.numClippingPlanes = parameters.numClippingPlanes;
			materialProperties.numIntersection = parameters.numClipIntersection;
			materialProperties.vertexAlphas = parameters.vertexAlphas;
			materialProperties.vertexTangents = parameters.vertexTangents;
			materialProperties.toneMapping = parameters.toneMapping;

		}

		function setProgram( camera, scene, geometry, material, object ) {

			if ( scene.isScene !== true ) scene = _emptyScene; // scene could be a Mesh, Line, Points, ...

			textures.resetTextureUnits();

			const fog = scene.fog;
			const environment = material.isMeshStandardMaterial ? scene.environment : null;
			const colorSpace = ( _currentRenderTarget === null ) ? _this.outputColorSpace : ( _currentRenderTarget.isXRRenderTarget === true ? _currentRenderTarget.texture.colorSpace : LinearSRGBColorSpace );
			const envMap = ( material.isMeshStandardMaterial ? cubeuvmaps : cubemaps ).get( material.envMap || environment );
			const vertexAlphas = material.vertexColors === true && !! geometry.attributes.color && geometry.attributes.color.itemSize === 4;
			const vertexTangents = !! geometry.attributes.tangent && ( !! material.normalMap || material.anisotropy > 0 );
			const morphTargets = !! geometry.morphAttributes.position;
			const morphNormals = !! geometry.morphAttributes.normal;
			const morphColors = !! geometry.morphAttributes.color;

			let toneMapping = NoToneMapping;

			if ( material.toneMapped ) {

				if ( _currentRenderTarget === null || _currentRenderTarget.isXRRenderTarget === true ) {

					toneMapping = _this.toneMapping;

				}

			}

			const morphAttribute = geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color;
			const morphTargetsCount = ( morphAttribute !== undefined ) ? morphAttribute.length : 0;

			const materialProperties = properties.get( material );
			const lights = currentRenderState.state.lights;

			if ( _clippingEnabled === true ) {

				if ( _localClippingEnabled === true || camera !== _currentCamera ) {

					const useCache =
						camera === _currentCamera &&
						material.id === _currentMaterialId;

					// we might want to call this function with some ClippingGroup
					// object instead of the material, once it becomes feasible
					// (#8465, #8379)
					clipping.setState( material, camera, useCache );

				}

			}

			//

			let needsProgramChange = false;

			if ( material.version === materialProperties.__version ) {

				if ( materialProperties.needsLights && ( materialProperties.lightsStateVersion !== lights.state.version ) ) {

					needsProgramChange = true;

				} else if ( materialProperties.outputColorSpace !== colorSpace ) {

					needsProgramChange = true;

				} else if ( object.isBatchedMesh && materialProperties.batching === false ) {

					needsProgramChange = true;

				} else if ( ! object.isBatchedMesh && materialProperties.batching === true ) {

					needsProgramChange = true;

				} else if ( object.isBatchedMesh && materialProperties.batchingColor === true && object.colorTexture === null ) {

					needsProgramChange = true;

				} else if ( object.isBatchedMesh && materialProperties.batchingColor === false && object.colorTexture !== null ) {

					needsProgramChange = true;

				} else if ( object.isInstancedMesh && materialProperties.instancing === false ) {

					needsProgramChange = true;

				} else if ( ! object.isInstancedMesh && materialProperties.instancing === true ) {

					needsProgramChange = true;

				} else if ( object.isSkinnedMesh && materialProperties.skinning === false ) {

					needsProgramChange = true;

				} else if ( ! object.isSkinnedMesh && materialProperties.skinning === true ) {

					needsProgramChange = true;

				} else if ( object.isInstancedMesh && materialProperties.instancingColor === true && object.instanceColor === null ) {

					needsProgramChange = true;

				} else if ( object.isInstancedMesh && materialProperties.instancingColor === false && object.instanceColor !== null ) {

					needsProgramChange = true;

				} else if ( object.isInstancedMesh && materialProperties.instancingMorph === true && object.morphTexture === null ) {

					needsProgramChange = true;

				} else if ( object.isInstancedMesh && materialProperties.instancingMorph === false && object.morphTexture !== null ) {

					needsProgramChange = true;

				} else if ( materialProperties.envMap !== envMap ) {

					needsProgramChange = true;

				} else if ( material.fog === true && materialProperties.fog !== fog ) {

					needsProgramChange = true;

				} else if ( materialProperties.numClippingPlanes !== undefined &&
					( materialProperties.numClippingPlanes !== clipping.numPlanes ||
					materialProperties.numIntersection !== clipping.numIntersection ) ) {

					needsProgramChange = true;

				} else if ( materialProperties.vertexAlphas !== vertexAlphas ) {

					needsProgramChange = true;

				} else if ( materialProperties.vertexTangents !== vertexTangents ) {

					needsProgramChange = true;

				} else if ( materialProperties.morphTargets !== morphTargets ) {

					needsProgramChange = true;

				} else if ( materialProperties.morphNormals !== morphNormals ) {

					needsProgramChange = true;

				} else if ( materialProperties.morphColors !== morphColors ) {

					needsProgramChange = true;

				} else if ( materialProperties.toneMapping !== toneMapping ) {

					needsProgramChange = true;

				} else if ( materialProperties.morphTargetsCount !== morphTargetsCount ) {

					needsProgramChange = true;

				}

			} else {

				needsProgramChange = true;
				materialProperties.__version = material.version;

			}

			//

			let program = materialProperties.currentProgram;

			if ( needsProgramChange === true ) {

				program = getProgram( material, scene, object );

			}

			let refreshProgram = false;
			let refreshMaterial = false;
			let refreshLights = false;

			const p_uniforms = program.getUniforms(),
				m_uniforms = materialProperties.uniforms;

			if ( state.useProgram( program.program ) ) {

				refreshProgram = true;
				refreshMaterial = true;
				refreshLights = true;

			}

			if ( material.id !== _currentMaterialId ) {

				_currentMaterialId = material.id;

				refreshMaterial = true;

			}

			if ( refreshProgram || _currentCamera !== camera ) {

				// common camera uniforms

				const reversedDepthBuffer = state.buffers.depth.getReversed();

				if ( reversedDepthBuffer && camera.reversedDepth !== true ) {

					camera._reversedDepth = true;
					camera.updateProjectionMatrix();

				}

				p_uniforms.setValue( _gl, 'projectionMatrix', camera.projectionMatrix );

				p_uniforms.setValue( _gl, 'viewMatrix', camera.matrixWorldInverse );

				const uCamPos = p_uniforms.map.cameraPosition;

				if ( uCamPos !== undefined ) {

					uCamPos.setValue( _gl, _vector3.setFromMatrixPosition( camera.matrixWorld ) );

				}

				if ( capabilities.logarithmicDepthBuffer ) {

					p_uniforms.setValue( _gl, 'logDepthBufFC',
						2.0 / ( Math.log( camera.far + 1.0 ) / Math.LN2 ) );

				}

				// consider moving isOrthographic to UniformLib and WebGLMaterials, see https://github.com/mrdoob/three.js/pull/26467#issuecomment-1645185067

				if ( material.isMeshPhongMaterial ||
					material.isMeshToonMaterial ||
					material.isMeshLambertMaterial ||
					material.isMeshBasicMaterial ||
					material.isMeshStandardMaterial ||
					material.isShaderMaterial ) {

					p_uniforms.setValue( _gl, 'isOrthographic', camera.isOrthographicCamera === true );

				}

				if ( _currentCamera !== camera ) {

					_currentCamera = camera;

					// lighting uniforms depend on the camera so enforce an update
					// now, in case this material supports lights - or later, when
					// the next material that does gets activated:

					refreshMaterial = true;		// set to true on material change
					refreshLights = true;		// remains set until update done

				}

			}

			// skinning and morph target uniforms must be set even if material didn't change
			// auto-setting of texture unit for bone and morph texture must go before other textures
			// otherwise textures used for skinning and morphing can take over texture units reserved for other material textures

			if ( object.isSkinnedMesh ) {

				p_uniforms.setOptional( _gl, object, 'bindMatrix' );
				p_uniforms.setOptional( _gl, object, 'bindMatrixInverse' );

				const skeleton = object.skeleton;

				if ( skeleton ) {

					if ( skeleton.boneTexture === null ) skeleton.computeBoneTexture();

					p_uniforms.setValue( _gl, 'boneTexture', skeleton.boneTexture, textures );

				}

			}

			if ( object.isBatchedMesh ) {

				p_uniforms.setOptional( _gl, object, 'batchingTexture' );
				p_uniforms.setValue( _gl, 'batchingTexture', object._matricesTexture, textures );

				p_uniforms.setOptional( _gl, object, 'batchingIdTexture' );
				p_uniforms.setValue( _gl, 'batchingIdTexture', object._indirectTexture, textures );

				p_uniforms.setOptional( _gl, object, 'batchingColorTexture' );
				if ( object._colorsTexture !== null ) {

					p_uniforms.setValue( _gl, 'batchingColorTexture', object._colorsTexture, textures );

				}

			}

			const morphAttributes = geometry.morphAttributes;

			if ( morphAttributes.position !== undefined || morphAttributes.normal !== undefined || ( morphAttributes.color !== undefined ) ) {

				morphtargets.update( object, geometry, program );

			}

			if ( refreshMaterial || materialProperties.receiveShadow !== object.receiveShadow ) {

				materialProperties.receiveShadow = object.receiveShadow;
				p_uniforms.setValue( _gl, 'receiveShadow', object.receiveShadow );

			}

			// https://github.com/mrdoob/three.js/pull/24467#issuecomment-1209031512

			if ( material.isMeshGouraudMaterial && material.envMap !== null ) {

				m_uniforms.envMap.value = envMap;

				m_uniforms.flipEnvMap.value = ( envMap.isCubeTexture && envMap.isRenderTargetTexture === false ) ? -1 : 1;

			}

			if ( material.isMeshStandardMaterial && material.envMap === null && scene.environment !== null ) {

				m_uniforms.envMapIntensity.value = scene.environmentIntensity;

			}

			if ( refreshMaterial ) {

				p_uniforms.setValue( _gl, 'toneMappingExposure', _this.toneMappingExposure );

				if ( materialProperties.needsLights ) {

					// the current material requires lighting info

					// note: all lighting uniforms are always set correctly
					// they simply reference the renderer's state for their
					// values
					//
					// use the current material's .needsUpdate flags to set
					// the GL state when required

					markUniformsLightsNeedsUpdate( m_uniforms, refreshLights );

				}

				// refresh uniforms common to several materials

				if ( fog && material.fog === true ) {

					materials.refreshFogUniforms( m_uniforms, fog );

				}

				materials.refreshMaterialUniforms( m_uniforms, material, _pixelRatio, _height, currentRenderState.state.transmissionRenderTarget[ camera.id ] );

				WebGLUniforms.upload( _gl, getUniformList( materialProperties ), m_uniforms, textures );

			}

			if ( material.isShaderMaterial && material.uniformsNeedUpdate === true ) {

				WebGLUniforms.upload( _gl, getUniformList( materialProperties ), m_uniforms, textures );
				material.uniformsNeedUpdate = false;

			}

			if ( material.isSpriteMaterial ) {

				p_uniforms.setValue( _gl, 'center', object.center );

			}

			// common matrices

			p_uniforms.setValue( _gl, 'modelViewMatrix', object.modelViewMatrix );
			p_uniforms.setValue( _gl, 'normalMatrix', object.normalMatrix );
			p_uniforms.setValue( _gl, 'modelMatrix', object.matrixWorld );

			// UBOs

			if ( material.isShaderMaterial || material.isRawShaderMaterial ) {

				const groups = material.uniformsGroups;

				for ( let i = 0, l = groups.length; i < l; i ++ ) {

					const group = groups[ i ];

					uniformsGroups.update( group, program );
					uniformsGroups.bind( group, program );

				}

			}

			return program;

		}

		// If uniforms are marked as clean, they don't need to be loaded to the GPU.

		function markUniformsLightsNeedsUpdate( uniforms, value ) {

			uniforms.ambientLightColor.needsUpdate = value;
			uniforms.lightProbe.needsUpdate = value;

			uniforms.directionalLights.needsUpdate = value;
			uniforms.directionalLightShadows.needsUpdate = value;
			uniforms.pointLights.needsUpdate = value;
			uniforms.pointLightShadows.needsUpdate = value;
			uniforms.spotLights.needsUpdate = value;
			uniforms.spotLightShadows.needsUpdate = value;
			uniforms.rectAreaLights.needsUpdate = value;
			uniforms.hemisphereLights.needsUpdate = value;

		}

		function materialNeedsLights( material ) {

			return material.isMeshLambertMaterial || material.isMeshToonMaterial || material.isMeshPhongMaterial ||
				material.isMeshStandardMaterial || material.isShadowMaterial ||
				( material.isShaderMaterial && material.lights === true );

		}

		/**
		 * Returns the active cube face.
		 *
		 * @return {number} The active cube face.
		 */
		this.getActiveCubeFace = function () {

			return _currentActiveCubeFace;

		};

		/**
		 * Returns the active mipmap level.
		 *
		 * @return {number} The active mipmap level.
		 */
		this.getActiveMipmapLevel = function () {

			return _currentActiveMipmapLevel;

		};

		/**
		 * Returns the active render target.
		 *
		 * @return {?WebGLRenderTarget} The active render target. Returns `null` if no render target
		 * is currently set.
		 */
		this.getRenderTarget = function () {

			return _currentRenderTarget;

		};

		this.setRenderTargetTextures = function ( renderTarget, colorTexture, depthTexture ) {

			const renderTargetProperties = properties.get( renderTarget );

			renderTargetProperties.__autoAllocateDepthBuffer = renderTarget.resolveDepthBuffer === false;
			if ( renderTargetProperties.__autoAllocateDepthBuffer === false ) {

				// The multisample_render_to_texture extension doesn't work properly if there
				// are midframe flushes and an external depth buffer. Disable use of the extension.
				renderTargetProperties.__useRenderToTexture = false;

			}

			properties.get( renderTarget.texture ).__webglTexture = colorTexture;
			properties.get( renderTarget.depthTexture ).__webglTexture = renderTargetProperties.__autoAllocateDepthBuffer ? undefined : depthTexture;

			renderTargetProperties.__hasExternalTextures = true;

		};

		this.setRenderTargetFramebuffer = function ( renderTarget, defaultFramebuffer ) {

			const renderTargetProperties = properties.get( renderTarget );
			renderTargetProperties.__webglFramebuffer = defaultFramebuffer;
			renderTargetProperties.__useDefaultFramebuffer = defaultFramebuffer === undefined;

		};

		const _scratchFrameBuffer = _gl.createFramebuffer();

		/**
		 * Sets the active rendertarget.
		 *
		 * @param {?WebGLRenderTarget} renderTarget - The render target to set. When `null` is given,
		 * the canvas is set as the active render target instead.
		 * @param {number} [activeCubeFace=0] - The active cube face when using a cube render target.
		 * Indicates the z layer to render in to when using 3D or array render targets.
		 * @param {number} [activeMipmapLevel=0] - The active mipmap level.
		 */
		this.setRenderTarget = function ( renderTarget, activeCubeFace = 0, activeMipmapLevel = 0 ) {

			_currentRenderTarget = renderTarget;
			_currentActiveCubeFace = activeCubeFace;
			_currentActiveMipmapLevel = activeMipmapLevel;

			let useDefaultFramebuffer = true;
			let framebuffer = null;
			let isCube = false;
			let isRenderTarget3D = false;

			if ( renderTarget ) {

				const renderTargetProperties = properties.get( renderTarget );

				if ( renderTargetProperties.__useDefaultFramebuffer !== undefined ) {

					// We need to make sure to rebind the framebuffer.
					state.bindFramebuffer( _gl.FRAMEBUFFER, null );
					useDefaultFramebuffer = false;

				} else if ( renderTargetProperties.__webglFramebuffer === undefined ) {

					textures.setupRenderTarget( renderTarget );

				} else if ( renderTargetProperties.__hasExternalTextures ) {

					// Color and depth texture must be rebound in order for the swapchain to update.
					textures.rebindTextures( renderTarget, properties.get( renderTarget.texture ).__webglTexture, properties.get( renderTarget.depthTexture ).__webglTexture );

				} else if ( renderTarget.depthBuffer ) {

					// check if the depth texture is already bound to the frame buffer and that it's been initialized
					const depthTexture = renderTarget.depthTexture;
					if ( renderTargetProperties.__boundDepthTexture !== depthTexture ) {

						// check if the depth texture is compatible
						if (
							depthTexture !== null &&
							properties.has( depthTexture ) &&
							( renderTarget.width !== depthTexture.image.width || renderTarget.height !== depthTexture.image.height )
						) {

							throw new Error( 'WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.' );

						}

						// Swap the depth buffer to the currently attached one
						textures.setupDepthRenderbuffer( renderTarget );

					}

				}

				const texture = renderTarget.texture;

				if ( texture.isData3DTexture || texture.isDataArrayTexture || texture.isCompressedArrayTexture ) {

					isRenderTarget3D = true;

				}

				const __webglFramebuffer = properties.get( renderTarget ).__webglFramebuffer;

				if ( renderTarget.isWebGLCubeRenderTarget ) {

					if ( Array.isArray( __webglFramebuffer[ activeCubeFace ] ) ) {

						framebuffer = __webglFramebuffer[ activeCubeFace ][ activeMipmapLevel ];

					} else {

						framebuffer = __webglFramebuffer[ activeCubeFace ];

					}

					isCube = true;

				} else if ( ( renderTarget.samples > 0 ) && textures.useMultisampledRTT( renderTarget ) === false ) {

					framebuffer = properties.get( renderTarget ).__webglMultisampledFramebuffer;

				} else {

					if ( Array.isArray( __webglFramebuffer ) ) {

						framebuffer = __webglFramebuffer[ activeMipmapLevel ];

					} else {

						framebuffer = __webglFramebuffer;

					}

				}

				_currentViewport.copy( renderTarget.viewport );
				_currentScissor.copy( renderTarget.scissor );
				_currentScissorTest = renderTarget.scissorTest;

			} else {

				_currentViewport.copy( _viewport ).multiplyScalar( _pixelRatio ).floor();
				_currentScissor.copy( _scissor ).multiplyScalar( _pixelRatio ).floor();
				_currentScissorTest = _scissorTest;

			}

			// Use a scratch frame buffer if rendering to a mip level to avoid depth buffers
			// being bound that are different sizes.
			if ( activeMipmapLevel !== 0 ) {

				framebuffer = _scratchFrameBuffer;

			}

			const framebufferBound = state.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );

			if ( framebufferBound && useDefaultFramebuffer ) {

				state.drawBuffers( renderTarget, framebuffer );

			}

			state.viewport( _currentViewport );
			state.scissor( _currentScissor );
			state.setScissorTest( _currentScissorTest );

			if ( isCube ) {

				const textureProperties = properties.get( renderTarget.texture );
				_gl.framebufferTexture2D( _gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_CUBE_MAP_POSITIVE_X + activeCubeFace, textureProperties.__webglTexture, activeMipmapLevel );

			} else if ( isRenderTarget3D ) {

				const layer = activeCubeFace;

				for ( let i = 0; i < renderTarget.textures.length; i ++ ) {

					const textureProperties = properties.get( renderTarget.textures[ i ] );

					_gl.framebufferTextureLayer( _gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0 + i, textureProperties.__webglTexture, activeMipmapLevel, layer );

				}

			} else if ( renderTarget !== null && activeMipmapLevel !== 0 ) {

				// Only bind the frame buffer if we are using a scratch frame buffer to render to a mipmap.
				// If we rebind the texture when using a multi sample buffer then an error about inconsistent samples will be thrown.
				const textureProperties = properties.get( renderTarget.texture );
				_gl.framebufferTexture2D( _gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, textureProperties.__webglTexture, activeMipmapLevel );

			}

			_currentMaterialId = -1; // reset current material to ensure correct uniform bindings

		};

		/**
		 * Reads the pixel data from the given render target into the given buffer.
		 *
		 * @param {WebGLRenderTarget} renderTarget - The render target to read from.
		 * @param {number} x - The `x` coordinate of the copy region's origin.
		 * @param {number} y - The `y` coordinate of the copy region's origin.
		 * @param {number} width - The width of the copy region.
		 * @param {number} height - The height of the copy region.
		 * @param {TypedArray} buffer - The result buffer.
		 * @param {number} [activeCubeFaceIndex] - The active cube face index.
		 * @param {number} [textureIndex=0] - The texture index of an MRT render target.
		 */
		this.readRenderTargetPixels = function ( renderTarget, x, y, width, height, buffer, activeCubeFaceIndex, textureIndex = 0 ) {

			if ( ! ( renderTarget && renderTarget.isWebGLRenderTarget ) ) {

				console.error( 'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.' );
				return;

			}

			let framebuffer = properties.get( renderTarget ).__webglFramebuffer;

			if ( renderTarget.isWebGLCubeRenderTarget && activeCubeFaceIndex !== undefined ) {

				framebuffer = framebuffer[ activeCubeFaceIndex ];

			}

			if ( framebuffer ) {

				state.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );

				try {

					const texture = renderTarget.textures[ textureIndex ];
					const textureFormat = texture.format;
					const textureType = texture.type;

					if ( ! capabilities.textureFormatReadable( textureFormat ) ) {

						console.error( 'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.' );
						return;

					}

					if ( ! capabilities.textureTypeReadable( textureType ) ) {

						console.error( 'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.' );
						return;

					}

					// the following if statement ensures valid read requests (no out-of-bounds pixels, see #8604)

					if ( ( x >= 0 && x <= ( renderTarget.width - width ) ) && ( y >= 0 && y <= ( renderTarget.height - height ) ) ) {

						// when using MRT, select the correct color buffer for the subsequent read command

						if ( renderTarget.textures.length > 1 ) _gl.readBuffer( _gl.COLOR_ATTACHMENT0 + textureIndex );

						_gl.readPixels( x, y, width, height, utils.convert( textureFormat ), utils.convert( textureType ), buffer );

					}

				} finally {

					// restore framebuffer of current render target if necessary

					const framebuffer = ( _currentRenderTarget !== null ) ? properties.get( _currentRenderTarget ).__webglFramebuffer : null;
					state.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );

				}

			}

		};

		/**
		 * Asynchronous, non-blocking version of {@link WebGLRenderer#readRenderTargetPixels}.
		 *
		 * It is recommended to use this version of `readRenderTargetPixels()` whenever possible.
		 *
		 * @async
		 * @param {WebGLRenderTarget} renderTarget - The render target to read from.
		 * @param {number} x - The `x` coordinate of the copy region's origin.
		 * @param {number} y - The `y` coordinate of the copy region's origin.
		 * @param {number} width - The width of the copy region.
		 * @param {number} height - The height of the copy region.
		 * @param {TypedArray} buffer - The result buffer.
		 * @param {number} [activeCubeFaceIndex] - The active cube face index.
		 * @param {number} [textureIndex=0] - The texture index of an MRT render target.
		 * @return {Promise<TypedArray>} A Promise that resolves when the read has been finished. The resolve provides the read data as a typed array.
		 */
		this.readRenderTargetPixelsAsync = async function ( renderTarget, x, y, width, height, buffer, activeCubeFaceIndex, textureIndex = 0 ) {

			if ( ! ( renderTarget && renderTarget.isWebGLRenderTarget ) ) {

				throw new Error( 'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.' );

			}

			let framebuffer = properties.get( renderTarget ).__webglFramebuffer;
			if ( renderTarget.isWebGLCubeRenderTarget && activeCubeFaceIndex !== undefined ) {

				framebuffer = framebuffer[ activeCubeFaceIndex ];

			}

			if ( framebuffer ) {

				// the following if statement ensures valid read requests (no out-of-bounds pixels, see #8604)
				if ( ( x >= 0 && x <= ( renderTarget.width - width ) ) && ( y >= 0 && y <= ( renderTarget.height - height ) ) ) {

					// set the active frame buffer to the one we want to read
					state.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );

					const texture = renderTarget.textures[ textureIndex ];
					const textureFormat = texture.format;
					const textureType = texture.type;

					if ( ! capabilities.textureFormatReadable( textureFormat ) ) {

						throw new Error( 'THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.' );

					}

					if ( ! capabilities.textureTypeReadable( textureType ) ) {

						throw new Error( 'THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.' );

					}

					const glBuffer = _gl.createBuffer();
					_gl.bindBuffer( _gl.PIXEL_PACK_BUFFER, glBuffer );
					_gl.bufferData( _gl.PIXEL_PACK_BUFFER, buffer.byteLength, _gl.STREAM_READ );

					// when using MRT, select the correct color buffer for the subsequent read command

					if ( renderTarget.textures.length > 1 ) _gl.readBuffer( _gl.COLOR_ATTACHMENT0 + textureIndex );

					_gl.readPixels( x, y, width, height, utils.convert( textureFormat ), utils.convert( textureType ), 0 );

					// reset the frame buffer to the currently set buffer before waiting
					const currFramebuffer = _currentRenderTarget !== null ? properties.get( _currentRenderTarget ).__webglFramebuffer : null;
					state.bindFramebuffer( _gl.FRAMEBUFFER, currFramebuffer );

					// check if the commands have finished every 8 ms
					const sync = _gl.fenceSync( _gl.SYNC_GPU_COMMANDS_COMPLETE, 0 );

					_gl.flush();

					await probeAsync( _gl, sync, 4 );

					// read the data and delete the buffer
					_gl.bindBuffer( _gl.PIXEL_PACK_BUFFER, glBuffer );
					_gl.getBufferSubData( _gl.PIXEL_PACK_BUFFER, 0, buffer );
					_gl.deleteBuffer( glBuffer );
					_gl.deleteSync( sync );

					return buffer;

				} else {

					throw new Error( 'THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.' );

				}

			}

		};

		/**
		 * Copies pixels from the current bound framebuffer into the given texture.
		 *
		 * @param {FramebufferTexture} texture - The texture.
		 * @param {?Vector2} [position=null] - The start position of the copy operation.
		 * @param {number} [level=0] - The mip level. The default represents the base mip.
		 */
		this.copyFramebufferToTexture = function ( texture, position = null, level = 0 ) {

			const levelScale = Math.pow( 2, - level );
			const width = Math.floor( texture.image.width * levelScale );
			const height = Math.floor( texture.image.height * levelScale );

			const x = position !== null ? position.x : 0;
			const y = position !== null ? position.y : 0;

			textures.setTexture2D( texture, 0 );

			_gl.copyTexSubImage2D( _gl.TEXTURE_2D, level, 0, 0, x, y, width, height );

			state.unbindTexture();

		};

		const _srcFramebuffer = _gl.createFramebuffer();
		const _dstFramebuffer = _gl.createFramebuffer();

		/**
		 * Copies data of the given source texture into a destination texture.
		 *
		 * When using render target textures as `srcTexture` and `dstTexture`, you must make sure both render targets are initialized
		 * {@link WebGLRenderer#initRenderTarget}.
		 *
		 * @param {Texture} srcTexture - The source texture.
		 * @param {Texture} dstTexture - The destination texture.
		 * @param {?(Box2|Box3)} [srcRegion=null] - A bounding box which describes the source region. Can be two or three-dimensional.
		 * @param {?(Vector2|Vector3)} [dstPosition=null] - A vector that represents the origin of the destination region. Can be two or three-dimensional.
		 * @param {number} [srcLevel=0] - The source mipmap level to copy.
		 * @param {?number} [dstLevel=null] - The destination mipmap level.
		 */
		this.copyTextureToTexture = function ( srcTexture, dstTexture, srcRegion = null, dstPosition = null, srcLevel = 0, dstLevel = null ) {

			// support the previous signature with just a single dst mipmap level
			if ( dstLevel === null ) {

				if ( srcLevel !== 0 ) {

					// @deprecated, r171
					warnOnce( 'WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels.' );
					dstLevel = srcLevel;
					srcLevel = 0;

				} else {

					dstLevel = 0;

				}

			}

			// gather the necessary dimensions to copy
			let width, height, depth, minX, minY, minZ;
			let dstX, dstY, dstZ;
			const image = srcTexture.isCompressedTexture ? srcTexture.mipmaps[ dstLevel ] : srcTexture.image;
			if ( srcRegion !== null ) {

				width = srcRegion.max.x - srcRegion.min.x;
				height = srcRegion.max.y - srcRegion.min.y;
				depth = srcRegion.isBox3 ? srcRegion.max.z - srcRegion.min.z : 1;
				minX = srcRegion.min.x;
				minY = srcRegion.min.y;
				minZ = srcRegion.isBox3 ? srcRegion.min.z : 0;

			} else {

				const levelScale = Math.pow( 2, - srcLevel );
				width = Math.floor( image.width * levelScale );
				height = Math.floor( image.height * levelScale );
				if ( srcTexture.isDataArrayTexture ) {

					depth = image.depth;

				} else if ( srcTexture.isData3DTexture ) {

					depth = Math.floor( image.depth * levelScale );

				} else {

					depth = 1;

				}

				minX = 0;
				minY = 0;
				minZ = 0;

			}

			if ( dstPosition !== null ) {

				dstX = dstPosition.x;
				dstY = dstPosition.y;
				dstZ = dstPosition.z;

			} else {

				dstX = 0;
				dstY = 0;
				dstZ = 0;

			}

			// Set up the destination target
			const glFormat = utils.convert( dstTexture.format );
			const glType = utils.convert( dstTexture.type );
			let glTarget;

			if ( dstTexture.isData3DTexture ) {

				textures.setTexture3D( dstTexture, 0 );
				glTarget = _gl.TEXTURE_3D;

			} else if ( dstTexture.isDataArrayTexture || dstTexture.isCompressedArrayTexture ) {

				textures.setTexture2DArray( dstTexture, 0 );
				glTarget = _gl.TEXTURE_2D_ARRAY;

			} else {

				textures.setTexture2D( dstTexture, 0 );
				glTarget = _gl.TEXTURE_2D;

			}

			_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, dstTexture.flipY );
			_gl.pixelStorei( _gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, dstTexture.premultiplyAlpha );
			_gl.pixelStorei( _gl.UNPACK_ALIGNMENT, dstTexture.unpackAlignment );

			// used for copying data from cpu
			const currentUnpackRowLen = _gl.getParameter( _gl.UNPACK_ROW_LENGTH );
			const currentUnpackImageHeight = _gl.getParameter( _gl.UNPACK_IMAGE_HEIGHT );
			const currentUnpackSkipPixels = _gl.getParameter( _gl.UNPACK_SKIP_PIXELS );
			const currentUnpackSkipRows = _gl.getParameter( _gl.UNPACK_SKIP_ROWS );
			const currentUnpackSkipImages = _gl.getParameter( _gl.UNPACK_SKIP_IMAGES );

			_gl.pixelStorei( _gl.UNPACK_ROW_LENGTH, image.width );
			_gl.pixelStorei( _gl.UNPACK_IMAGE_HEIGHT, image.height );
			_gl.pixelStorei( _gl.UNPACK_SKIP_PIXELS, minX );
			_gl.pixelStorei( _gl.UNPACK_SKIP_ROWS, minY );
			_gl.pixelStorei( _gl.UNPACK_SKIP_IMAGES, minZ );

			// set up the src texture
			const isSrc3D = srcTexture.isDataArrayTexture || srcTexture.isData3DTexture;
			const isDst3D = dstTexture.isDataArrayTexture || dstTexture.isData3DTexture;
			if ( srcTexture.isDepthTexture ) {

				const srcTextureProperties = properties.get( srcTexture );
				const dstTextureProperties = properties.get( dstTexture );
				const srcRenderTargetProperties = properties.get( srcTextureProperties.__renderTarget );
				const dstRenderTargetProperties = properties.get( dstTextureProperties.__renderTarget );
				state.bindFramebuffer( _gl.READ_FRAMEBUFFER, srcRenderTargetProperties.__webglFramebuffer );
				state.bindFramebuffer( _gl.DRAW_FRAMEBUFFER, dstRenderTargetProperties.__webglFramebuffer );

				for ( let i = 0; i < depth; i ++ ) {

					// if the source or destination are a 3d target then a layer needs to be bound
					if ( isSrc3D ) {

						_gl.framebufferTextureLayer( _gl.READ_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, properties.get( srcTexture ).__webglTexture, srcLevel, minZ + i );
						_gl.framebufferTextureLayer( _gl.DRAW_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, properties.get( dstTexture ).__webglTexture, dstLevel, dstZ + i );

					}

					_gl.blitFramebuffer( minX, minY, width, height, dstX, dstY, width, height, _gl.DEPTH_BUFFER_BIT, _gl.NEAREST );

				}

				state.bindFramebuffer( _gl.READ_FRAMEBUFFER, null );
				state.bindFramebuffer( _gl.DRAW_FRAMEBUFFER, null );

			} else if ( srcLevel !== 0 || srcTexture.isRenderTargetTexture || properties.has( srcTexture ) ) {

				// get the appropriate frame buffers
				const srcTextureProperties = properties.get( srcTexture );
				const dstTextureProperties = properties.get( dstTexture );

				// bind the frame buffer targets
				state.bindFramebuffer( _gl.READ_FRAMEBUFFER, _srcFramebuffer );
				state.bindFramebuffer( _gl.DRAW_FRAMEBUFFER, _dstFramebuffer );

				for ( let i = 0; i < depth; i ++ ) {

					// assign the correct layers and mip maps to the frame buffers
					if ( isSrc3D ) {

						_gl.framebufferTextureLayer( _gl.READ_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, srcTextureProperties.__webglTexture, srcLevel, minZ + i );

					} else {

						_gl.framebufferTexture2D( _gl.READ_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, srcTextureProperties.__webglTexture, srcLevel );

					}

					if ( isDst3D ) {

						_gl.framebufferTextureLayer( _gl.DRAW_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, dstTextureProperties.__webglTexture, dstLevel, dstZ + i );

					} else {

						_gl.framebufferTexture2D( _gl.DRAW_FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, dstTextureProperties.__webglTexture, dstLevel );

					}

					// copy the data using the fastest function that can achieve the copy
					if ( srcLevel !== 0 ) {

						_gl.blitFramebuffer( minX, minY, width, height, dstX, dstY, width, height, _gl.COLOR_BUFFER_BIT, _gl.NEAREST );

					} else if ( isDst3D ) {

						_gl.copyTexSubImage3D( glTarget, dstLevel, dstX, dstY, dstZ + i, minX, minY, width, height );

					} else {

						_gl.copyTexSubImage2D( glTarget, dstLevel, dstX, dstY, minX, minY, width, height );

					}

				}

				// unbind read, draw buffers
				state.bindFramebuffer( _gl.READ_FRAMEBUFFER, null );
				state.bindFramebuffer( _gl.DRAW_FRAMEBUFFER, null );

			} else {

				if ( isDst3D ) {

					// copy data into the 3d texture
					if ( srcTexture.isDataTexture || srcTexture.isData3DTexture ) {

						_gl.texSubImage3D( glTarget, dstLevel, dstX, dstY, dstZ, width, height, depth, glFormat, glType, image.data );

					} else if ( dstTexture.isCompressedArrayTexture ) {

						_gl.compressedTexSubImage3D( glTarget, dstLevel, dstX, dstY, dstZ, width, height, depth, glFormat, image.data );

					} else {

						_gl.texSubImage3D( glTarget, dstLevel, dstX, dstY, dstZ, width, height, depth, glFormat, glType, image );

					}

				} else {

					// copy data into the 2d texture
					if ( srcTexture.isDataTexture ) {

						_gl.texSubImage2D( _gl.TEXTURE_2D, dstLevel, dstX, dstY, width, height, glFormat, glType, image.data );

					} else if ( srcTexture.isCompressedTexture ) {

						_gl.compressedTexSubImage2D( _gl.TEXTURE_2D, dstLevel, dstX, dstY, image.width, image.height, glFormat, image.data );

					} else {

						_gl.texSubImage2D( _gl.TEXTURE_2D, dstLevel, dstX, dstY, width, height, glFormat, glType, image );

					}

				}

			}

			// reset values
			_gl.pixelStorei( _gl.UNPACK_ROW_LENGTH, currentUnpackRowLen );
			_gl.pixelStorei( _gl.UNPACK_IMAGE_HEIGHT, currentUnpackImageHeight );
			_gl.pixelStorei( _gl.UNPACK_SKIP_PIXELS, currentUnpackSkipPixels );
			_gl.pixelStorei( _gl.UNPACK_SKIP_ROWS, currentUnpackSkipRows );
			_gl.pixelStorei( _gl.UNPACK_SKIP_IMAGES, currentUnpackSkipImages );

			// Generate mipmaps only when copying level 0
			if ( dstLevel === 0 && dstTexture.generateMipmaps ) {

				_gl.generateMipmap( glTarget );

			}

			state.unbindTexture();

		};

		/**
		 * Initializes the given WebGLRenderTarget memory. Useful for initializing a render target so data
		 * can be copied into it using {@link WebGLRenderer#copyTextureToTexture} before it has been
		 * rendered to.
		 *
		 * @param {WebGLRenderTarget} target - The render target.
		 */
		this.initRenderTarget = function ( target ) {

			if ( properties.get( target ).__webglFramebuffer === undefined ) {

				textures.setupRenderTarget( target );

			}

		};

		/**
		 * Initializes the given texture. Useful for preloading a texture rather than waiting until first
		 * render (which can cause noticeable lags due to decode and GPU upload overhead).
		 *
		 * @param {Texture} texture - The texture.
		 */
		this.initTexture = function ( texture ) {

			if ( texture.isCubeTexture ) {

				textures.setTextureCube( texture, 0 );

			} else if ( texture.isData3DTexture ) {

				textures.setTexture3D( texture, 0 );

			} else if ( texture.isDataArrayTexture || texture.isCompressedArrayTexture ) {

				textures.setTexture2DArray( texture, 0 );

			} else {

				textures.setTexture2D( texture, 0 );

			}

			state.unbindTexture();

		};

		/**
		 * Can be used to reset the internal WebGL state. This method is mostly
		 * relevant for applications which share a single WebGL context across
		 * multiple WebGL libraries.
		 */
		this.resetState = function () {

			_currentActiveCubeFace = 0;
			_currentActiveMipmapLevel = 0;
			_currentRenderTarget = null;

			state.reset();
			bindingStates.reset();

		};

		if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

			__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'observe', { detail: this } ) );

		}

	}

	/**
	 * Defines the coordinate system of the renderer.
	 *
	 * In `WebGLRenderer`, the value is always `WebGLCoordinateSystem`.
	 *
	 * @type {WebGLCoordinateSystem|WebGPUCoordinateSystem}
	 * @default WebGLCoordinateSystem
	 * @readonly
	 */
	get coordinateSystem() {

		return WebGLCoordinateSystem;

	}

	/**
	 * Defines the output color space of the renderer.
	 *
	 * @type {SRGBColorSpace|LinearSRGBColorSpace}
	 * @default SRGBColorSpace
	 */
	get outputColorSpace() {

		return this._outputColorSpace;

	}

	set outputColorSpace( colorSpace ) {

		this._outputColorSpace = colorSpace;

		const gl = this.getContext();
		gl.drawingBufferColorSpace = ColorManagement._getDrawingBufferColorSpace( colorSpace );
		gl.unpackColorSpace = ColorManagement._getUnpackColorSpace();

	}

}

export { ACESFilmicToneMapping, AddEquation, AddOperation, AdditiveBlending, AgXToneMapping, AlphaFormat, AlwaysCompare, AlwaysDepth, ArrayCamera, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, ByteType, CineonToneMapping, ClampToEdgeWrapping, Color, ColorManagement, ConstantAlphaFactor, ConstantColorFactor, CubeReflectionMapping, CubeRefractionMapping, CubeTexture, CubeUVReflectionMapping, CullFaceBack, CullFaceFront, CullFaceNone, CustomBlending, CustomToneMapping, Data3DTexture, DataArrayTexture, DepthFormat, DepthStencilFormat, DepthTexture, DoubleSide, DstAlphaFactor, DstColorFactor, EqualCompare, EqualDepth, EquirectangularReflectionMapping, EquirectangularRefractionMapping, Euler, EventDispatcher, ExternalTexture, FloatType, FrontSide, Frustum, GLSL3, GreaterCompare, GreaterDepth, GreaterEqualCompare, GreaterEqualDepth, HalfFloatType, IntType, Layers, LessCompare, LessDepth, LessEqualCompare, LessEqualDepth, LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, LinearSRGBColorSpace, LinearToneMapping, LinearTransfer, Matrix3, Matrix4, MaxEquation, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial, MinEquation, MirroredRepeatWrapping, MixOperation, MultiplyBlending, MultiplyOperation, NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, NeutralToneMapping, NeverCompare, NeverDepth, NoBlending, NoColorSpace, NoToneMapping, NormalBlending, NotEqualCompare, NotEqualDepth, ObjectSpaceNormalMap, OneFactor, OneMinusConstantAlphaFactor, OneMinusConstantColorFactor, OneMinusDstAlphaFactor, OneMinusDstColorFactor, OneMinusSrcAlphaFactor, OneMinusSrcColorFactor, OrthographicCamera, PCFShadowMap, PCFSoftShadowMap, PMREMGenerator, PerspectiveCamera, Plane, PlaneGeometry, RED_GREEN_RGTC2_Format, RED_RGTC1_Format, REVISION, RGBADepthPacking, RGBAFormat, RGBAIntegerFormat, RGBA_ASTC_10x10_Format, RGBA_ASTC_10x5_Format, RGBA_ASTC_10x6_Format, RGBA_ASTC_10x8_Format, RGBA_ASTC_12x10_Format, RGBA_ASTC_12x12_Format, RGBA_ASTC_4x4_Format, RGBA_ASTC_5x4_Format, RGBA_ASTC_5x5_Format, RGBA_ASTC_6x5_Format, RGBA_ASTC_6x6_Format, RGBA_ASTC_8x5_Format, RGBA_ASTC_8x6_Format, RGBA_ASTC_8x8_Format, RGBA_BPTC_Format, RGBA_ETC2_EAC_Format, RGBA_PVRTC_2BPPV1_Format, RGBA_PVRTC_4BPPV1_Format, RGBA_S3TC_DXT1_Format, RGBA_S3TC_DXT3_Format, RGBA_S3TC_DXT5_Format, RGBFormat, RGB_BPTC_SIGNED_Format, RGB_BPTC_UNSIGNED_Format, RGB_ETC1_Format, RGB_ETC2_Format, RGB_PVRTC_2BPPV1_Format, RGB_PVRTC_4BPPV1_Format, RGB_S3TC_DXT1_Format, RGFormat, RGIntegerFormat, RedFormat, RedIntegerFormat, ReinhardToneMapping, RepeatWrapping, ReverseSubtractEquation, SIGNED_RED_GREEN_RGTC2_Format, SIGNED_RED_RGTC1_Format, SRGBColorSpace, SRGBTransfer, ShaderChunk, ShaderLib, ShaderMaterial, ShortType, SrcAlphaFactor, SrcAlphaSaturateFactor, SrcColorFactor, SubtractEquation, SubtractiveBlending, TangentSpaceNormalMap, Texture, Uint16BufferAttribute, Uint32BufferAttribute, UniformsLib, UniformsUtils, UnsignedByteType, UnsignedInt101111Type, UnsignedInt248Type, UnsignedInt5999Type, UnsignedIntType, UnsignedShort4444Type, UnsignedShort5551Type, UnsignedShortType, VSMShadowMap, Vector2, Vector3, Vector4, WebGLCoordinateSystem, WebGLCubeRenderTarget, WebGLRenderTarget, WebGLRenderer, WebGLUtils, WebXRController, ZeroFactor, createCanvasElement };
