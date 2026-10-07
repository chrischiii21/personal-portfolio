import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Brand palette, kept in sync with the Tailwind classes used across the site.
const THEME = {
  dark: {
    bg: "#08090b", // ink
    primary: "#34d399", // emerald-400
    secondary: "#a7f3d0", // emerald-200 — a quiet drift, not a hue change
    gridOpacity: 0.55,
    pointOpacity: 0.35,
  },
  light: {
    bg: "#f4f4f2", // paper
    primary: "#059669", // emerald-600
    secondary: "#0f766e", // teal-700
    gridOpacity: 0.5,
    pointOpacity: 0.3,
  },
};

const TERRAIN_SIZE = 140;
const TERRAIN_SEGMENTS = 110;
const PARTICLE_COUNT = 500;
const FLIGHT_DISTANCE = 70; // how far the camera travels from top to bottom of the page

/** Soft round sprite so points render as dots, not squares, when they get close to the camera. */
function makeDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
const DOT = typeof document !== "undefined" ? makeDotTexture() : null;

function useIsDark() {
  const ref = useRef(document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      ref.current = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return ref;
}

function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current = max > 0 ? window.scrollY / max : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return ref;
}

function usePointer() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return ref;
}

type TerrainUniforms = {
  uTime: { value: number };
  uScale: { value: number };
  uOpacity: { value: number };
  uLow: { value: THREE.Color };
  uPeak: { value: THREE.Color };
};

// Height is computed on the GPU (was a per-frame CPU loop over every vertex).
const TERRAIN_VERT = /* glsl */ `
  uniform float uTime, uScale, uOpacity;
  uniform vec3 uLow, uPeak;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.35;
    // Keep a flat "valley" down the middle so the camera path stays clear.
    float valley = min(1.0, abs(p.x) / 18.0);
    float h = sin(p.x * 0.12 + t) * cos(p.z * 0.1 + t * 0.6) * 2.4
            + sin(p.x * 0.31 - t * 0.8) * sin(p.z * 0.27 + t) * 0.9;
    p.y = (h + 7.0) * valley * valley;

    float peak = smoothstep(3.0, 9.5, p.y);
    // A thin scanline sweeps toward the viewer, like a radar pass over the landscape.
    float scan = pow(1.0 - abs(fract((p.z + uTime * 5.0) / 45.0) * 2.0 - 1.0), 18.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    vColor = mix(uLow, uPeak, peak + scan * 0.6);
    // Fade with distance instead of fog, so the dots melt into whatever the page background is.
    vAlpha = uOpacity * (0.7 + 0.6 * peak + scan * 1.5) * (1.0 - smoothstep(10.0, 58.0, depth)) * smoothstep(0.5, 3.0, depth);
    gl_PointSize = (0.12 + peak * 0.05 + scan * 0.07) * uScale / depth;
    gl_Position = projectionMatrix * mv;
  }
`;

const TERRAIN_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, vAlpha * (1.0 - smoothstep(0.15, 0.5, d)));
    #include <colorspace_fragment>
  }
`;

function Terrain({ uniforms }: { uniforms: TerrainUniforms }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  // Built by hand: R3F's <shaderMaterial uniforms> copies each uniform, so the Rig's
  // per-frame writes to `uniforms` would never reach the GPU.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        transparent: true,
        depthWrite: false,
      }),
    [uniforms]
  );

  useFrame(({ clock, size, viewport }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScale.value = size.height * viewport.dpr * 0.5; // matches three's sizeAttenuation
  });

  return (
    // Rendered as a dot matrix rather than a wireframe: quieter, and reads as "data landscape".
    // Shader displaces vertices, so the CPU-side bounding sphere is wrong — skip culling.
    <points geometry={geometry} material={material} position={[0, -5, -40]} frustumCulled={false} />
  );
}

// Wireframe solids along the flight path give the scroll a sense of travel.
const LANDMARKS: { geometry: THREE.BufferGeometry; position: [number, number, number]; spin: number }[] =
  typeof document === "undefined"
    ? []
    : [
        { geometry: new THREE.IcosahedronGeometry(2.4, 1), position: [9, 2.5, -12], spin: 0.12 },
        { geometry: new THREE.OctahedronGeometry(2), position: [-9, 1.5, -28], spin: -0.16 },
        { geometry: new THREE.DodecahedronGeometry(2.2), position: [8.5, 0.5, -44], spin: 0.1 },
        { geometry: new THREE.IcosahedronGeometry(3, 0), position: [-7.5, 0, -60], spin: -0.12 },
      ].map((l) => ({ ...l, geometry: new THREE.EdgesGeometry(l.geometry) }));

function Landmarks({ material }: { material: THREE.LineBasicMaterial }) {
  const refs = useRef<(THREE.LineSegments | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const l = LANDMARKS[i];
      m.rotation.set(t * l.spin * 0.6, t * l.spin, 0);
      m.position.y = l.position[1] + Math.sin(t * 0.6 + i * 1.7) * 0.4;
    });
  });
  return (
    <>
      {LANDMARKS.map((l, i) => (
        <lineSegments
          key={i}
          ref={(el) => void (refs.current[i] = el)}
          geometry={l.geometry}
          position={l.position}
          material={material}
        />
      ))}
    </>
  );
}

function Particles({ materialRef }: { materialRef: RefObject<THREE.PointsMaterial | null> }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = (Math.random() - 0.3) * 30;
      arr[i * 3 + 2] = 10 - Math.random() * (FLIGHT_DISTANCE + 50);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={materialRef} map={DOT} alphaTest={0.05} size={0.08} sizeAttenuation transparent depthWrite={false} />
    </points>
  );
}

function Rig() {
  const { camera, scene } = useThree();
  const isDark = useIsDark();
  const scroll = useScrollProgress();
  const pointer = usePointer();
  const smooth = useRef({ scroll: 0, x: 0, y: 0 });
  const pointsMat = useRef<THREE.PointsMaterial>(null);
  const tmp = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), []);
  const fog = useMemo(() => new THREE.Fog(THEME.dark.bg, 8, 55), []);
  const terrain = useMemo<TerrainUniforms>(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 450 },
      uOpacity: { value: 0 },
      uLow: { value: new THREE.Color() },
      uPeak: { value: new THREE.Color() },
    }),
    []
  );
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }), []);

  useEffect(() => {
    scene.fog = fog;
    const theme = isDark.current ? THEME.dark : THEME.light;
    fog.color.set(theme.bg);
    terrain.uLow.value.set(theme.primary);
    terrain.uPeak.value.set(theme.secondary);
    lineMat.color.set(theme.primary);
    pointsMat.current?.color.set(theme.primary);
  }, [scene, fog, isDark, terrain, lineMat]);

  useFrame((_, delta) => {
    const s = smooth.current;
    const k = 1 - Math.exp(-delta * 4); // frame-rate independent easing
    s.scroll += (scroll.current - s.scroll) * k;
    s.x += (pointer.current.x - s.x) * k;
    s.y += (pointer.current.y - s.y) * k;

    camera.position.set(s.x * 1.6, 1.5 - s.y * 0.8 - s.scroll * 2, 8 - s.scroll * FLIGHT_DISTANCE);
    camera.rotation.set(-0.08 + s.y * 0.04 + s.scroll * 0.06, -s.x * 0.06, s.scroll * 0.25 - 0.05);

    const theme = isDark.current ? THEME.dark : THEME.light;
    // Hue journey: emerald at the top, drifting to blue by the projects section.
    const mix = THREE.MathUtils.smoothstep(s.scroll, 0.25, 0.85);
    tmp.a.set(theme.primary).lerp(tmp.b.set(theme.secondary), mix);
    terrain.uLow.value.lerp(tmp.a, k);
    lineMat.color.lerp(tmp.a, k);
    terrain.uPeak.value.lerp(tmp.b.set(theme.secondary), k);
    terrain.uOpacity.value += (theme.gridOpacity - terrain.uOpacity.value) * k;
    lineMat.opacity = theme.gridOpacity * 0.6;
    if (pointsMat.current) {
      // Particles run slightly ahead of the grid on the color journey.
      tmp.a.set(theme.primary).lerp(tmp.b.set(theme.secondary), Math.min(1, mix + 0.35));
      pointsMat.current.color.lerp(tmp.a, k);
      pointsMat.current.opacity = theme.pointOpacity;
    }
    fog.color.lerp(tmp.a.set(theme.bg), Math.min(1, k * 2));
  });

  return (
    <>
      <Terrain uniforms={terrain} />
      <Landmarks material={lineMat} />
      <Particles materialRef={pointsMat} />
    </>
  );
}

export default function Scene3D() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none scene-fade-in">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 60, near: 0.1, far: 120, position: [0, 1.5, 8] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Rig />
      </Canvas>
    </div>
  );
}
