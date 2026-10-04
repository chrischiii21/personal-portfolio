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

function Terrain({ materialRef }: { materialRef: RefObject<THREE.PointsMaterial | null> }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      // Keep a flat "valley" down the middle so the camera path stays clear.
      const valley = Math.min(1, Math.abs(x) / 18);
      const h =
        Math.sin(x * 0.12 + t) * Math.cos(z * 0.1 + t * 0.6) * 2.4 +
        Math.sin(x * 0.31 - t * 0.8) * Math.sin(z * 0.27 + t) * 0.9;
      pos.setY(i, h * valley * valley + valley * valley * 7);
    }
    pos.needsUpdate = true;
  });

  return (
    // Rendered as a dot matrix rather than a wireframe: quieter, and reads as "data landscape".
    <points geometry={geometry} position={[0, -5, -40]}>
      <pointsMaterial ref={materialRef} map={DOT} alphaTest={0.05} size={0.1} sizeAttenuation transparent depthWrite={false} />
    </points>
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
  const gridMat = useRef<THREE.PointsMaterial>(null);
  const pointsMat = useRef<THREE.PointsMaterial>(null);
  const tmp = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), []);
  const fog = useMemo(() => new THREE.Fog(THEME.dark.bg, 8, 55), []);

  useEffect(() => {
    scene.fog = fog;
    const theme = isDark.current ? THEME.dark : THEME.light;
    fog.color.set(theme.bg);
    gridMat.current?.color.set(theme.primary);
    pointsMat.current?.color.set(theme.primary);
  }, [scene, fog, isDark]);

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
    if (gridMat.current) {
      tmp.a.set(theme.primary).lerp(tmp.b.set(theme.secondary), mix);
      gridMat.current.color.lerp(tmp.a, k);
      gridMat.current.opacity = theme.gridOpacity;
    }
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
      <Terrain materialRef={gridMat} />
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
