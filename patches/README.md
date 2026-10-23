# React Three Fiber Timer compatibility

Install dependencies with `bun install` so `package.json`'s `patchedDependencies` is applied. The patch is pinned to Fiber 9.8.1 and covers its ESM, development CommonJS and production CommonJS builds.

Fiber creates a deprecated Three.js Clock internally. The patch replaces that allocation with a Timer-backed clock adapter, retaining Fiber's elapsed-time, automatic start, stop/start, and manual/demand render-loop contract. It does not suppress logging or change the Three.js version. Remove the patch when a compatible Fiber release provides this migration itself.

`tests/home-startup.test.tsx` checks actual Fiber store creation, absence of Clock warnings and pause/resume/frame-loop timing. `bun install --frozen-lockfile` verifies the saved dependency state.
