# Service visual field

Controlled, accessible picker used by `ServiceFields` for all six service slots. It owns upload progress, retry/cancel and the selector, but not persistence. It reuses `useImageUpload('service_image', { requireVerified: true })` and the existing form-level asset reference/pending context. It does not implement another authentication or storage client.

Shader controls come from reviewed definitions and are gated by the deployed backend catalog. Shader selection needs only the effect, props and description; there is no required poster upload. Legacy poster metadata is retained without being shown. Image selection keeps its existing upload/preview/description UI. Changes submit with the service's normal Save operation. Preview uses the same background-only fallback and fade-aware single-active renderer as the public service page. See `components/shaders/README.md` for the contract and release workflow.
