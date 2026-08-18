import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vDepth = worldPosition.z;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D uMapA;
  uniform sampler2D uMapB;
  uniform float uMix;
  uniform float uAlpha;
  uniform float uLens;
  uniform float uZoom;
  uniform float uPlaneAspect;
  uniform float uAspectA;
  uniform float uAspectB;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec3 uAccent;

  varying vec2 vUv;

  float glitchHash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec2 containRatio(float imageAspect, float planeAspect) {
    return vec2(
      min(imageAspect / planeAspect, 1.0),
      min(planeAspect / imageAspect, 1.0)
    );
  }

  vec4 sampleLens(sampler2D image, vec2 uv, float imageAspect) {
    vec2 delta = uv - uPointer;

    vec2 aspectDelta = delta * vec2(uPlaneAspect, 1.0);
    float distanceToPointer = length(aspectDelta);

    float lensMask =
      smoothstep(0.26, 0.075, distanceToPointer) *
      uLens;

    /*
     * Directional zoom vector.
     *
     * Instead of a purely radial magnification, introduce a subtle
     * directional push based on the pointer position relative to center.
     */
    vec2 pointerVector = (uPointer - 0.5);
    pointerVector.x *= uPlaneAspect;

    float pointerStrength = clamp(length(pointerVector) * 1.35, 0.0, 1.0);

    vec2 zoomDirection = normalize(pointerVector + vec2(0.00001));

    /*
     * Main radial zoom.
     */
    float zoomAmount = mix(1.5, uZoom, lensMask);

    vec2 zoomedUv =
      uPointer +
      delta / zoomAmount;

    /*
     * Game-like directional lens pull.
     * Stronger near the pointer and while the lens is active.
     */
    vec2 directionalOffset =
      zoomDirection *
      lensMask *
      pointerStrength *
      0.012;

    vec2 magnifiedUv =
      zoomedUv -
      directionalOffset;

    vec2 finalUv =
      mix(uv, magnifiedUv, lensMask);

    vec2 ratio =
      containRatio(imageAspect, uPlaneAspect);

    vec2 imageUv =
      (finalUv - 0.5) / ratio + 0.5;

    float inside =
      step(0.0, imageUv.x) *
      step(imageUv.x, 1.0) *
      step(0.0, imageUv.y) *
      step(imageUv.y, 1.0);

    vec2 sampledUv =
      clamp(imageUv, 0.0, 1.0);

    /*
     * Digital horizontal glitch bands.
     */
    float band =
      floor(vUv.y * 36.0);

    float glitchGate =
      step(
        0.88,
        glitchHash(
          vec2(
            band,
            floor(uTime * 8.0)
          )
        )
      );

    float glitchShift =
      (
        glitchHash(
          vec2(
            band + 4.0,
            floor(uTime * 11.0)
          )
        ) - 0.5
      ) *
      0.012 *
      lensMask *
      glitchGate;

    vec2 glitchUv =
      clamp(
        sampledUv + vec2(glitchShift, 0.0),
        0.0,
        1.0
      );

    /*
     * Chromatic aberration vector.
     *
     * Direction follows both radial lens distortion and the zoom vector.
     */
    vec2 chromaVector =
      normalize(
        aspectDelta +
        zoomDirection * 0.45 +
        vec2(0.00001)
      );

    chromaVector.x /= uPlaneAspect;

    float chromaStrength =
      lensMask *
      (
        0.0028 +
        pointerStrength * 0.0025 +
        glitchGate * 0.0035
      );

    vec2 chromaOffset =
      chromaVector *
      chromaStrength;

    /*
     * Primary RGB split.
     */
    float red =
      texture2D(
        image,
        clamp(
          glitchUv + chromaOffset,
          0.0,
          1.0
        )
      ).r;

    float green =
      texture2D(
        image,
        glitchUv
      ).g;

    float blue =
      texture2D(
        image,
        clamp(
          glitchUv - chromaOffset,
          0.0,
          1.0
        )
      ).b;

    vec3 baseColor =
      vec3(red, green, blue);

    /*
     * ~10% game-like trails.
     *
     * Multiple samples spread backwards along the chromatic/zoom vector.
     * Trail contribution is deliberately subtle.
     */
    vec2 trailVector =
      (
        chromaVector * 0.010 +
        zoomDirection / vec2(uPlaneAspect, 1.0) * 0.005
      ) *
      lensMask;

    vec3 trail1 =
      texture2D(
        image,
        clamp(
          glitchUv - trailVector,
          0.0,
          1.0
        )
      ).rgb;

    vec3 trail2 =
      texture2D(
        image,
        clamp(
          glitchUv - trailVector * 2.0,
          0.0,
          1.0
        )
      ).rgb;

    vec3 trail3 =
      texture2D(
        image,
        clamp(
          glitchUv - trailVector * 3.2,
          0.0,
          1.0
        )
      ).rgb;

    /*
     * Colored trail separation.
     *
     * Creates the blue/red "game speed" edge rather than ordinary blur.
     */
    trail1 *= vec3(1.10, 0.96, 0.90);
    trail2 *= vec3(0.90, 0.98, 1.12);
    trail3 *= vec3(0.82, 0.94, 1.18);

    vec3 trailColor =
      trail1 * 0.050 +
      trail2 * 0.032 +
      trail3 * 0.018;

    /*
     * Total trail contribution = ~10%.
     */
    vec3 finalColor =
      baseColor * 0.90 +
      trailColor;

    float alpha =
      texture2D(
        image,
        sampledUv
      ).a *
      inside;

    return vec4(
      finalColor,
      alpha
    );
  }

  void main() {
    vec4 colorA =
      sampleLens(
        uMapA,
        vUv,
        uAspectA
      );

    vec4 colorB =
      sampleLens(
        uMapB,
        vUv,
        uAspectB
      );

    vec4 color =
      mix(
        colorA,
        colorB,
        smoothstep(
          0.05,
          0.95,
          uMix
        )
      );

    float edge =
      smoothstep(
        0.0,
        0.07,
        vUv.x
      ) *
      smoothstep(
        0.0,
        0.07,
        1.0 - vUv.x
      ) *
      smoothstep(
        0.0,
        0.08,
        vUv.y
      ) *
      smoothstep(
        0.0,
        0.08,
        1.0 - vUv.y
      );

    vec2 circleDelta =
      (vUv - uPointer) *
      vec2(
        uPlaneAspect,
        1.0
      );

    float circleDistance =
      length(circleDelta);

    float circleProgress =
      smoothstep(
        0.0,
        1.0,
        uLens
      );

    float circleRadius =
      0.19 *
      circleProgress;

    float circleAngle =
      atan(
        circleDelta.y,
        circleDelta.x
      ) /
      6.2831853 +
      0.5;

    float dash =
      step(
        0.28,
        fract(
          (
            circleAngle +
            uTime * 0.055
          ) *
          18.0
        )
      );

    float outerRing =
      1.0 -
      smoothstep(
        0.0015,
        0.005,
        abs(
          circleDistance -
          circleRadius
        )
      );

    float innerRing =
      1.0 -
      smoothstep(
        0.001,
        0.0035,
        abs(
          circleDistance -
          circleRadius * 0.72
        )
      );

    float digitalCircle =
      (
        outerRing *
        mix(
          0.22,
          0.8,
          dash
        ) +
        innerRing * 0.16
      ) *
      smoothstep(
        0.04,
        0.32,
        uLens
      );

    float scanline =
      0.975 +
      0.025 *
      sin(
        (
          vUv.y +
          uTime * 0.012
        ) *
        900.0
      );

    float accentGlow =
      pow(
        1.0 - edge,
        2.0
      ) *
      0.16;

    color.rgb =
      color.rgb *
      scanline +
      uAccent *
      accentGlow;

    vec3 circleColor =
      mix(
        vec3(
          0.18,
          0.96,
          0.78
        ),
        uAccent,
        0.45
      );

    color.rgb +=
      circleColor *
      digitalCircle *
      (
        0.34 +
        0.08 *
        sin(
          uTime * 7.0
        )
      );

    color.rgb *=
      0.92 +
      edge * 0.08;

    color.a *=
      edge *
      uAlpha;

    gl_FragColor =
      color;
  }
`;

const makePlaceholder = () => {
  const data = new Uint8Array([9, 14, 18, 255]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const clamp = THREE.MathUtils.clamp;

export function createProjectScene({
  canvas,
  projects,
  stops,
  onFailure,
  onPerformance,
}) {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
  } catch (error) {
    onFailure?.(error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const projectGroup = new THREE.Group();
  const placeholder = makePlaceholder();
  const geometry = new THREE.PlaneGeometry(2.55, 1.52, 1, 1);
  const textureCache = new Map();
  const meshes = [];
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2(8, 8);
  const pointerUv = new THREE.Vector2(0.5, 0.5);
  const pointerUvTarget = new THREE.Vector2(0.5, 0.5);
  const frameSamples = [];
  const clock = new THREE.Clock();
  const baseDpr = Math.min(
    window.devicePixelRatio || 1,
    matchMedia("(pointer: coarse)").matches ? 1 : 1.5,
  );
  let currentDpr = baseDpr;
  let desiredStep = 0;
  let displayedStep = 0;
  let lensTarget = 0;
  let lensStrength = 0;
  let zoomTarget = 1.16;
  let zoomStrength = 1.16;
  let zoomed = false;
  let activeProjectIndex = 0;
  let visible = false;
  let destroyed = false;
  let rafId = 0;
  let lastPerfReport = 0;
  let lastQualityChange = 0;
  let activeVideoKeys = new Set();
  let width = 1;
  let height = 1;

  camera.position.set(0, 0.05, 5.25);
  scene.add(projectGroup);

  const grid = new THREE.GridHelper(18, 24, 0x2d765f, 0x13231f);
  grid.position.set(0, -1.35, -1.9);
  grid.rotation.x = Math.PI * 0.08;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  grid.material.depthWrite = false;
  scene.add(grid);

  projects.forEach((project, index) => {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMapA: { value: placeholder },
        uMapB: { value: placeholder },
        uMix: { value: 0 },
        uAlpha: { value: index === 0 ? 1 : 0 },
        uLens: { value: 1 },
        uZoom: { value: 1.16 },
        uPlaneAspect: { value: 2.55 / 1.52 },
        uAspectA: { value: 1 },
        uAspectB: { value: 1 },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uAccent: { value: new THREE.Color(project.accent) },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = index * 3.25;
    mesh.userData.projectIndex = index;
    meshes.push(mesh);
    projectGroup.add(mesh);
  });

  const markTexture = (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  };

  const loadTexture = (slide) => {
    const key = `${slide.type}:${slide.src}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const record = {
      key,
      texture: placeholder,
      aspect: 1,
      video: null,
      active: false,
      ready: false,
    };
    textureCache.set(key, record);

    if (slide.type === "video") {
      const video = document.createElement("video");
      video.src = slide.src;
      video.poster = slide.poster || "";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-hidden", "true");
      record.video = video;
      video.addEventListener(
        "loadedmetadata",
        () => {
          record.aspect = video.videoWidth / Math.max(video.videoHeight, 1);
          record.texture = markTexture(new THREE.VideoTexture(video));
          record.ready = true;
        },
        { once: true },
      );
      video.addEventListener(
        "error",
        () => {
          if (!slide.poster) return;
          new THREE.TextureLoader().load(slide.poster, (texture) => {
            record.aspect =
              texture.image.width / Math.max(texture.image.height, 1);
            record.texture = markTexture(texture);
            record.ready = true;
          });
        },
        { once: true },
      );
      video.load();
    } else {
      new THREE.TextureLoader().load(
        slide.src,
        (texture) => {
          record.aspect =
            texture.image.width / Math.max(texture.image.height, 1);
          record.texture = markTexture(texture);
          record.ready = true;
        },
        undefined,
        () =>
          onFailure?.(
            new Error(`Unable to load project texture: ${slide.src}`),
          ),
      );
    }

    return record;
  };

  const primeProject = (projectIndex, slideIndex = 0) => {
    const project = projects[projectIndex];
    if (!project) return;
    loadTexture(
      project.slides[clamp(slideIndex, 0, project.slides.length - 1)],
    );
  };

  const updateVideos = (records) => {
    const nextActiveKeys = new Set(
      records.filter(Boolean).map((record) => record.key),
    );
    if (
      [...nextActiveKeys].every((key) => activeVideoKeys.has(key)) &&
      nextActiveKeys.size === activeVideoKeys.size
    )
      return;

    activeVideoKeys = nextActiveKeys;
    textureCache.forEach((record) => {
      if (!record.video) return;
      const shouldPlay = visible && activeVideoKeys.has(record.key);
      if (shouldPlay && !record.active) {
        record.video.play().catch(() => {});
      } else if (!shouldPlay && record.active) {
        record.video.pause();
      }
      record.active = shouldPlay;
    });
  };

  const resize = (nextWidth, nextHeight) => {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(width, height, false);

    const compact = width < 800;
    const scale = compact
      ? Math.min(0.9, width / 430)
      : Math.min(1.12, width / 1440 + 0.2);
    projectGroup.scale.setScalar(Math.max(0.72, scale));
    projectGroup.position.y = compact ? 0.18 : 0.02;
  };

  const setMaterialMedia = (material, recordA, recordB, mix) => {
    material.uniforms.uMapA.value = recordA?.texture || placeholder;
    material.uniforms.uMapB.value =
      recordB?.texture || recordA?.texture || placeholder;
    material.uniforms.uAspectA.value = recordA?.aspect || 1;
    material.uniforms.uAspectB.value = recordB?.aspect || recordA?.aspect || 1;
    material.uniforms.uMix.value = mix;
  };

  const reportPerformance = (now) => {
    if (now - lastPerfReport < 500) return;
    lastPerfReport = now;
    const sorted = [...frameSamples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const fps = median ? Math.min(999, 1000 / median) : 0;
    onPerformance?.({
      fps,
      frameTime: median,
      dpr: currentDpr,
      drawCalls: renderer.info.render.calls,
      textures: renderer.info.memory.textures,
      webgl2: renderer.capabilities.isWebGL2,
    });

    if (
      frameSamples.length >= 90 &&
      median > 18.5 &&
      currentDpr > 0.75 &&
      now - lastQualityChange > 3000
    ) {
      currentDpr = Math.max(0.75, currentDpr - 0.25);
      lastQualityChange = now;
      resize(width, height);
    }
  };

  const draw = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    const now = performance.now();
    frameSamples.push(delta * 1000);
    if (frameSamples.length > 120) frameSamples.shift();

    displayedStep = THREE.MathUtils.damp(displayedStep, desiredStep, 9, delta);
    pointerUv.lerp(pointerUvTarget, 1 - Math.exp(-14 * delta));
    lensStrength = THREE.MathUtils.damp(lensStrength, lensTarget, 12, delta);
    // zoomStrength = THREE.MathUtils.damp(zoomStrength, zoomTarget, 8, delta);
    zoomStrength = THREE.MathUtils.damp(
      zoomStrength,
      zoomTarget,
      8,
      delta,
    )
    const lowIndex = Math.floor(displayedStep);
    const highIndex = Math.min(stops.length - 1, lowIndex + 1);
    const localProgress = clamp(displayedStep - lowIndex, 0, 1);
    const fromStop = stops[lowIndex] || stops[0];
    const toStop = stops[highIndex] || fromStop;
    const projectTransition =
      fromStop.projectIndex === toStop.projectIndex ? 0 : localProgress;
    const projectCursor = THREE.MathUtils.lerp(
      fromStop.projectIndex,
      toStop.projectIndex,
      projectTransition,
    );
    activeProjectIndex =
      localProgress > 0.5 ? toStop.projectIndex : fromStop.projectIndex;

    primeProject(fromStop.projectIndex, fromStop.slideIndex);
    primeProject(toStop.projectIndex, toStop.slideIndex);
    primeProject(activeProjectIndex - 1);
    primeProject(activeProjectIndex + 1);

    const fromRecord = loadTexture(fromStop.slide);
    const toRecord = loadTexture(toStop.slide);
    updateVideos([fromRecord, toRecord]);

    meshes.forEach((mesh, index) => {
      const distance = index - projectCursor;
      const targetX = distance * 3.25;
      mesh.position.x = THREE.MathUtils.damp(
        mesh.position.x,
        targetX,
        10,
        delta,
      );
      // Keep the presentation plane locked to one vertical baseline while
      // frames crossfade. A per-frame lift makes the viewport appear to jump
      // when the scroll position crosses a frame boundary.
      mesh.position.y = 0;
      mesh.position.z = -Math.min(Math.abs(distance), 2) * 0.42;
      mesh.rotation.y = clamp(-distance * 0.16, -0.38, 0.38);
      mesh.rotation.x =
        index === activeProjectIndex ? (pointerUv.y - 0.5) * -0.035 : 0;

      const material = mesh.material;
      const alphaTarget = clamp(1 - Math.abs(distance) * 0.46, 0.08, 1);
      material.uniforms.uAlpha.value = THREE.MathUtils.damp(
        material.uniforms.uAlpha.value,
        alphaTarget,
        10,
        delta,
      );
      material.uniforms.uTime.value = now * 0.001;
      material.uniforms.uPointer.value.copy(pointerUv);
      material.uniforms.uLens.value =
        index === activeProjectIndex ? lensStrength : 0;
      material.uniforms.uZoom.value =
        index === activeProjectIndex
          ? zoomStrength
          : 1.16

      if (
        index === fromStop.projectIndex &&
        fromStop.projectIndex === toStop.projectIndex
      ) {
        setMaterialMedia(material, fromRecord, toRecord, localProgress);
      } else if (
        index === toStop.projectIndex &&
        fromStop.projectIndex !== toStop.projectIndex
      ) {
        const first = loadTexture(projects[index].slides[0]);
        setMaterialMedia(material, first, first, 0);
      } else if (index === fromStop.projectIndex) {
        setMaterialMedia(material, fromRecord, fromRecord, 0);
      } else if (Math.abs(index - activeProjectIndex) <= 1) {
        const first = loadTexture(projects[index].slides[0]);
        setMaterialMedia(material, first, first, 0);
      }
    });

    grid.position.x = -projectCursor * 0.28;
    grid.material.opacity = 0.2 + lensStrength * 0.08;
    renderer.render(scene, camera);
    reportPerformance(now);
  };

  const loop = () => {
    if (!visible || destroyed || document.hidden) {
      rafId = 0;
      return;
    }
    draw();
    rafId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (!rafId && visible && !destroyed && !document.hidden) {
      clock.getDelta();
      rafId = requestAnimationFrame(loop);
    }
  };

  const setVisible = (nextVisible) => {
    visible = nextVisible;
    if (visible) start();
    else {
      cancelAnimationFrame(rafId);
      rafId = 0;
      updateVideos([]);
    }
  };

  const setProgress = (progress) => {
    desiredStep = clamp(progress, 0, 1) * Math.max(stops.length - 1, 0);
    start();
  };

  const pointerMove = (clientX, clientY, enableLens = true) => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointerNdc, camera);
    const intersection = raycaster.intersectObject(
      meshes[activeProjectIndex],
      false,
    )[0];
    if (intersection?.uv) {
      pointerUvTarget.copy(intersection.uv);
      lensTarget = enableLens ? 1 : lensTarget;
      canvas.classList.add("is-inspecting");
      return true;
    }
    if (enableLens) lensTarget = 0;
    canvas.classList.remove("is-inspecting");
    return false;
  };

  const setLensActive = (active) => {
    lensTarget = active ? 1 : 0;
    if (!active) canvas.classList.remove("is-inspecting");
    start();
  };

  const handleVisibility = () => {
    if (!document.hidden) start();
    else updateVideos([]);
  };

  const handleContextLost = (event) => {
    event.preventDefault();
    onFailure?.(new Error("WebGL context lost"));
    setVisible(false);
  };

  const handlePointerDown = (event) => {
    const hit = pointerMove(
      event.clientX,
      event.clientY,
      false,
    )

    if (!hit) return
    zoomTarget = 1.5
    canvas.setPointerCapture?.(event.pointerId)
    start()
  }

  const handlePointerUp = (event) => {
    zoomTarget = 1.16
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    start()
  }

  document.addEventListener("visibilitychange", handleVisibility);
  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointerup', handlePointerUp)
  canvas.addEventListener('pointercancel', handlePointerUp)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x050708, 0);
  resize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
  primeProject(0, 0);
  primeProject(0, 1);
  draw();

  return {
    resize,
    setProgress,
    setVisible,
    pointerMove,
    setLensActive,
    getActiveProjectIndex: () => activeProjectIndex,
    destroy() {
      destroyed = true;
      setVisible(false);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      textureCache.forEach((record) => {
        record.video?.pause();
        if (record.video) {
          record.video.removeAttribute("src");
          record.video.load();
        }
        if (record.texture !== placeholder) record.texture.dispose();
      });
      meshes.forEach((mesh) => mesh.material.dispose());
      geometry.dispose();
      placeholder.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
    },
  };
}
