import { MeshPhysicalMaterial, type Texture } from "three";
import {
  logoSurfaceMap,
  logoSurfaceUniforms,
  logoSurfaceVaryings,
  logoSurfaceVertex,
} from "./shaders";

export const logoSurfaceSettings = {
  metalness: 0.96,
  roughness: 0.18,
  clearcoat: 0.12,
  clearcoatRoughness: 0.14,
  ior: 1.5,
  reflectivity: 0.4,
  specularIntensity: 0.35,
  envMapIntensity: 1.05,
} as const;

export function createLogoSurface(texture: Texture, phase: number) {
  const uniforms = {
    uLogoTime: { value: 0 },
    uLogoPhase: { value: phase },
  };
  const material = new MeshPhysicalMaterial({
    ...logoSurfaceSettings,
    color: 0xffffff,
    map: texture,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      logoSurfaceVaryings +
      shader.vertexShader.replace("#include <begin_vertex>", logoSurfaceVertex);
    shader.fragmentShader =
      logoSurfaceVaryings +
      logoSurfaceUniforms +
      shader.fragmentShader.replace("#include <map_fragment>", logoSurfaceMap);
  };
  material.customProgramCacheKey = () => "exploration-chromatic-metal-v1";
  return { material, uniforms };
}
