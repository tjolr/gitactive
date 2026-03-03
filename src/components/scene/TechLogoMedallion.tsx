import { useRef, useEffect } from "react";
import * as THREE from "three";
import { scene, white } from "../../lib/palette";
import type { TechLanguage } from "../../types";

const RADIUS = 0.45;
const THICKNESS = 0.18;
const OUTER_RADIUS = RADIUS + 0.03;
const RIM_COLOR = scene.rimHex;

const LOGO_URLS: Record<TechLanguage, string> = {
  vue: "/logos/vue.svg",
  react: "/logos/react.svg",
  typescript: "/logos/typescript.svg",
  kotlin: "/logos/kotlin.svg",
  java: "/logos/java.svg",
  sql: "/logos/sql.svg",
  prisma: "/logos/prisma.svg",
  json: "/logos/json.svg",
  markdown: "/logos/markdown.svg",
  html: "/logos/html.svg",
  png: "/logos/png.svg",
};

// Map file extensions to available logos
export const EXT_TO_LOGO: Record<string, TechLanguage> = {
  vue: "vue",
  tsx: "react",
  jsx: "react",
  ts: "typescript",
  kt: "kotlin",
  java: "java",
  sql: "sql",
  prisma: "prisma",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  html: "html",
  htm: "html",
  png: "png",
};

// Module-level texture cache — each logo loaded only once
const textureCache = new Map<TechLanguage, THREE.Texture>();

function loadLogoTexture(language: TechLanguage): Promise<THREE.Texture> {
  const cached = textureCache.get(language);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      textureCache.set(language, tex);
      resolve(tex);
    };
    img.onerror = reject;
    img.src = LOGO_URLS[language];
  });
}

export function TechLogoMedallion({ language }: { language: TechLanguage }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const protrude = THICKNESS * 0.6;

  useEffect(() => {
    let cancelled = false;
    loadLogoTexture(language).then((tex) => {
      if (cancelled || !matRef.current) return;
      matRef.current.map = tex;
      matRef.current.color.set(white.hex);
      matRef.current.needsUpdate = true;
    }).catch(() => { /* silently fail — keeps fallback color */ });

    return () => { cancelled = true; };
  }, [language]);

  return (
    <group position={[0, 0, protrude]}>
      {/* Front face with logo */}
      <mesh position={[0, 0, THICKNESS / 2]}>
        <circleGeometry args={[RADIUS, 32]} />
        <meshBasicMaterial ref={matRef} color={RIM_COLOR} toneMapped={false} side={THREE.FrontSide} />
      </mesh>
      {/* Back cap */}
      <mesh position={[0, 0, -THICKNESS / 2]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[OUTER_RADIUS, 32]} />
        <meshStandardMaterial color={RIM_COLOR} side={THREE.FrontSide} />
      </mesh>
      {/* Cylinder rim for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, THICKNESS, 32, 1, true]} />
        <meshStandardMaterial color={RIM_COLOR} metalness={0.4} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const SMALL_RADIUS = 0.12;
const SMALL_THICKNESS = 0.1;

export function SmallLogoIcon({ language, position, scale = 1 }: { language: TechLanguage; position: [number, number, number]; scale?: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    let cancelled = false;
    loadLogoTexture(language).then((tex) => {
      if (cancelled || !matRef.current) return;
      matRef.current.map = tex;
      matRef.current.color.set(white.hex);
      matRef.current.needsUpdate = true;
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [language]);

  const r = SMALL_RADIUS * scale;
  const outer = r + 0.02;
  const thick = SMALL_THICKNESS * scale;
  const prot = thick * 0.6;

  return (
    <group position={[position[0], position[1], position[2] + prot]}>
      {/* Front face with logo */}
      <mesh position={[0, 0, thick / 2]}>
        <circleGeometry args={[r, 24]} />
        <meshBasicMaterial ref={matRef} color={RIM_COLOR} toneMapped={false} side={THREE.FrontSide} />
      </mesh>
      {/* Back cap */}
      <mesh position={[0, 0, -thick / 2]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[outer, 24]} />
        <meshStandardMaterial color={RIM_COLOR} side={THREE.FrontSide} />
      </mesh>
      {/* Cylinder rim for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[outer, outer, thick, 24, 1, true]} />
        <meshStandardMaterial color={RIM_COLOR} metalness={0.4} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
