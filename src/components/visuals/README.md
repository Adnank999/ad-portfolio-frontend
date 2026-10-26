# Visual renderer

`VisualRenderer` selects exactly one image or shader from the tagged visual contract. Place shader-capable instances inside one `ActiveShaderProvider` per page/editor. IDs use React `useId` so SSR/hydration and simultaneous slots remain stable. The aspect-ratio container reserves layout space; pass `eager` for hero posters/images. Shader code is never imported during SSR.
