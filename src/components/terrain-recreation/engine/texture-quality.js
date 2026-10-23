import { LinearFilter, LinearMipmapLinearFilter } from 'three';

export function configureSurfaceTexture(texture, anisotropy = 8) {
  if (!texture?.isTexture || texture.isRenderTargetTexture) return texture;
  const hasMipmaps = texture.generateMipmaps || texture.mipmaps.length > 1;
  const minFilter = hasMipmaps ? LinearMipmapLinearFilter : LinearFilter;
  const samples = hasMipmaps ? Math.max(1, Number(anisotropy) || 1) : 1;
  if (texture.minFilter !== minFilter || texture.magFilter !== LinearFilter || texture.anisotropy !== samples) {
    texture.minFilter = minFilter; texture.magFilter = LinearFilter; texture.anisotropy = samples;
    texture.needsUpdate = true;
  }
  return texture;
}

