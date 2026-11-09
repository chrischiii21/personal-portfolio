import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Project } from "../types";
import { prefersReducedMotion } from "./effects";

// World units. The folder is W×H; the glass pocket covers its lower part.
const W = 3.4;
const H = 2.2;
const POCKET = 1.4;
const CW = 1.1;
const CH = 1.5;
const { damp } = THREE.MathUtils;
const FRAME_Y = 0.4; // camera height: the middle of the folder-plus-raised-cards range

// Square corners throughout, to match the site's sharp-edged surfaces.
function rect(w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.closePath();
  return s;
}

/** Folder back panel, with the tab rising on the top-left. */
function folderShape() {
  const tab = 0.24;
  const x0 = -W / 2, x1 = W / 2, y0 = -H / 2, y1 = H / 2;
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, y1);
  s.lineTo(x0 + 1.55, y1);
  s.lineTo(x0 + 1.25, y1 + tab);
  s.lineTo(x0, y1 + tab);
  s.closePath();
  return s;
}

// A hairline chamfer, not a rounded bevel: edges stay crisp but still catch the light.
const BEVEL = { bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 };
const BACK_GEO = new THREE.ExtrudeGeometry(folderShape(), { depth: 0.05, ...BEVEL });
const FRONT_GEO = new THREE.ExtrudeGeometry(rect(W, POCKET), { depth: 0.06, ...BEVEL });
const FRAME_GEO = new THREE.ExtrudeGeometry(rect(CW, CH), { depth: 0.02, bevelEnabled: false });
const FACE_W = CW - 0.06;
const FACE_H = CH - 0.06;
const IMG_GEO = (() => {
  const w = FACE_W, h = FACE_H;
  const g = new THREE.ShapeGeometry(rect(w, h));
  // ShapeGeometry's UVs are raw shape coordinates; map them to 0–1 so the card face fits.
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / w + 0.5;
    uv[i * 2 + 1] = p.getY(i) / h + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
})();

/** "Projects" printed on the pocket, in the site's serif. */
function makeLabel(count: number) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-serif") || "Georgia, serif";
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `italic 150px ${serif}`;
    ctx.fillText("Projects", 0, 145);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 46px ui-monospace, Menlo, monospace";
    ctx.fillText(`${String(count).padStart(2, "0")} — SELECTED WORK`, 8, 225);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}

/** Relative luminance of a #rrggbb colour (0 = black, 1 = white). */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/**
 * A card face drawn on a canvas: the project's logo on its brand colour, with its number,
 * status, name and stack. Redrawn once the logo and the site fonts have loaded.
 */
function makeFace(project: Project, index: number, total: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = Math.round((512 * FACE_H) / FACE_W);
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const css = getComputedStyle(document.documentElement);
  const sans = css.getPropertyValue("--font-sans") || "system-ui, sans-serif";
  const mono = css.getPropertyValue("--font-mono") || "ui-monospace, monospace";
  const bg = project.color ?? "#0f1626";
  const dark = luminance(bg) < 0.55;
  const fg = dark ? "255,255,255" : "12,12,14";
  const pad = 36;
  const logo = new Image();

  const draw = () => {
    const { width: w, height: h } = c;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = `rgba(${fg},0.14)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    ctx.textBaseline = "alphabetic";
    ctx.font = `500 20px ${mono}`;
    ctx.fillStyle = `rgba(${fg},0.6)`;
    ctx.fillText(`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, pad, pad + 20);
    const status = (project.status ?? "live").toUpperCase();
    const sw = ctx.measureText(status).width;
    ctx.fillText(status, w - pad - sw, pad + 20);
    ctx.fillStyle = project.status ? "#f59e0b" : "#5b9bff";
    ctx.fillRect(w - pad - sw - 18, pad + 7, 9, 9);

    // Logos are square; draw them in a square box in the upper middle.
    const size = 230;
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, (w - size) / 2, h * 0.4 - size / 2, size, size);

    ctx.fillStyle = `rgba(${fg},0.14)`;
    ctx.fillRect(pad, h - 196, w - pad * 2, 2);
    ctx.fillStyle = `rgb(${fg})`;
    ctx.font = `600 46px ${sans}`;
    const words = project.name.split(" ");
    const lines: string[] = [];
    for (const word of words) {
      const last = lines[lines.length - 1];
      if (last && ctx.measureText(`${last} ${word}`).width <= w - pad * 2) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
    }
    lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, pad, h - 140 + i * 50));
    ctx.font = `500 18px ${mono}`;
    ctx.fillStyle = `rgba(${fg},0.55)`;
    ctx.fillText(project.tech.join(" · ").toUpperCase(), pad, h - pad);
    tex.needsUpdate = true;
  };

  logo.onload = draw;
  if (project.logo) logo.src = project.logo;
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}

type CardProps = {
  project: Project;
  index: number;
  total: number;
  hovered: number | null;
  featured: number;
  exit: { current: number };
  setHovered: (i: number | null) => void;
  onOpen: (p: Project) => void;
  started: { current: number | null };
};

function Card({ project, index, total, hovered, featured, exit, setHovered, onOpen, started }: CardProps) {
  const ref = useRef<THREE.Group>(null);
  const spread = index - (total - 1) / 2;
  // Right-hand cards sit a touch further back so mirrored pairs never share a depth (z-fighting with an even count).
  const base = { x: spread * 0.55, y: 0.72 - Math.abs(spread) * 0.08, z: 0.25 - Math.abs(spread) * 0.05 - (spread > 0 ? 0.03 : 0), rz: -spread * 0.12 };
  const face = useMemo(() => makeFace(project, index, total), [project, index, total]);
  const image = useMemo(() => new THREE.MeshBasicMaterial({ map: face, toneMapped: false }), [face]);
  const frame = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#0a0a0a", roughness: 0.35, clearcoat: 1 }), []);
  useEffect(() => () => face.dispose(), [face]);

  useFrame(({ clock }, dt) => {
    const g = ref.current!;
    const out = started.current !== null && clock.elapsedTime - started.current > 0.2 + index * 0.09;
    const feat = featured === index;
    const lift = !feat && hovered === index;
    const { y, z } = g.position;
    let ty = base.y + (out ? (lift ? 0.5 : 0) : -0.9);
    let tz = base.z + (lift ? 0.12 : 0);
    // Cards travel up, over the pocket's lip, and only then forward (or back), so they never pass through the glass.
    if (feat) {
      ty = z > 0.8 ? 0.55 : 1.3;
      tz = y > 1.05 || z > 0.6 ? 1.0 : z;
    } else if (z > base.z + 0.2) {
      ty = 1.3;
      tz = y > 1.05 ? base.z : z;
    }
    let tx = feat ? 0 : base.x;
    // Exit: every card fans out and flies toward the viewer as the page moves on.
    const e = exit.current;
    if (e > 0) {
      tx = tx * (1 + e * 3) + spread * e * 1.2;
      ty += e * 0.8;
      tz += e * 3;
    }
    g.position.x = damp(g.position.x, tx, 7, dt);
    g.position.y = damp(y, ty, 7, dt);
    g.position.z = damp(z, tz, 7, dt);
    g.rotation.z = damp(g.rotation.z, feat || lift ? 0 : base.rz, 7, dt);
    g.scale.setScalar(damp(g.scale.x, feat && z > 0.6 ? 1.2 : lift ? 1.06 : 1, 7, dt));
  });

  return (
    <group
      ref={ref}
      position={[base.x, base.y - 0.9, base.z]}
      rotation={[0, 0, base.rz]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(index);
      }}
      onPointerOut={() => setHovered(null)}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(project);
      }}
    >
      <mesh geometry={FRAME_GEO} material={frame} />
      <mesh geometry={IMG_GEO} material={image} position={[0, 0, 0.021]} />
    </group>
  );
}

function Folder({ projects, hovered, featured, exit, setHovered, onOpen }: Omit<CardProps, "project" | "index" | "total" | "started"> & { projects: Project[] }) {
  const { gl, scene } = useThree();
  const rig = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduce = useMemo(prefersReducedMotion, []);
  // When the cards start rising out of the pocket (set on the first frame).
  const started = useRef<number | null>(null);
  const label = useMemo(() => makeLabel(projects.length), [projects.length]);
  const back = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#5b9bff", roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }), []);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#a0c8ff",
        transmission: 1,
        roughness: 0.38, // frosts whatever sits behind it
        thickness: 0.6,
        ior: 1.4,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        attenuationColor: new THREE.Color("#5b9bff"),
        attenuationDistance: 2.5,
      }),
    []
  );

  // Studio reflections for the glass and clearcoat, built locally (no HDR download).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    pmrem.dispose();
    return () => env.dispose();
  }, [gl, scene]);

  // The folder turns toward the cursor anywhere on the page, not only over the canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      pointer.current.x = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      pointer.current.y = THREE.MathUtils.clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl]);

  useFrame(({ camera, clock, size }, dt) => {
    started.current ??= reduce ? -Infinity : clock.elapsedTime;
    // Frame everything the cards can reach: a featured card comes forward (z ≈ 1) and its top
    // sits near y ≈ 2, so keep that plane in view vertically, and the fan's width horizontally.
    const tan = Math.tan(THREE.MathUtils.degToRad(35 / 2));
    camera.position.z = Math.max(1 + (2.1 - FRAME_Y) / tan, 2 / (tan * (size.width / size.height)) + 0.5);
    if (reduce) return;
    const g = rig.current!;
    g.rotation.y = damp(g.rotation.y, pointer.current.x * 0.3, 4, dt);
    g.rotation.x = damp(g.rotation.x, pointer.current.y * 0.15, 4, dt);
    g.position.y = Math.sin(clock.elapsedTime * 1.1) * 0.05 - exit.current * 1.4; // folder drops away as the cards leave
  });

  return (
    <group ref={rig}>
      <mesh geometry={BACK_GEO} material={back} position={[0, 0, -0.05]} />
      {projects.map((p, i) => (
        <Card
          key={p.url}
          project={p}
          index={i}
          total={projects.length}
          hovered={hovered}
          featured={featured}
          exit={exit}
          setHovered={setHovered}
          onOpen={onOpen}
          started={started}
        />
      ))}
      {/* Pocket hinges at the bottom edge and leans toward the viewer. */}
      <group position={[0, -H / 2, 0.42]} rotation={[0.12, 0, 0]}>
        <mesh geometry={FRONT_GEO} material={glass} position={[0, POCKET / 2, 0]} />
        <mesh position={[-W / 2 + 1.25, 0.45, 0.09]}>
          <planeGeometry args={[2.1, 0.525]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      </group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <pointLight position={[0, 1.2, -1.5]} intensity={6} color="#7fb0ff" />
    </group>
  );
}

export default function ProjectFolder({
  projects,
  active,
  featured,
  exit,
  hovered,
  setHovered,
  onOpen,
}: {
  projects: Project[];
  active: boolean;
  /** Card pulled out in front of the folder by scrolling; -1 = all tucked in. */
  featured: number;
  exit: { current: number };
  /** Lifted card, shared with the project index buttons under the folder. */
  hovered: number | null;
  setHovered: (i: number | null) => void;
  onOpen: (p: Project) => void;
}) {
  useEffect(() => {
    document.body.style.cursor = hovered === null ? "" : "pointer";
    return () => void (document.body.style.cursor = "");
  }, [hovered]);

  // Mouse/touch only; keyboard and screen-reader users use the project index buttons under it.
  return (
    <div aria-hidden className="relative h-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [0, FRAME_Y, 6.4] }}
        gl={{ antialias: true, alpha: true }}
      >
        <Folder projects={projects} hovered={hovered} featured={featured} exit={exit} setHovered={setHovered} onOpen={onOpen} />
      </Canvas>
    </div>
  );
}
