import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { shaderDiscovery } from '../../scripts/shaders/bun-discovery'

const shaders = process.argv.includes('--shaders')
const installedShaders = process.argv.includes('--installed-shaders')
const projectArtwork = process.argv.includes('--project-artwork')
const graphics = shaders || installedShaders || projectArtwork
const nativeGpu = process.argv.includes('--native-gpu')

const browser = process.env.CHROME_BIN ?? (process.platform === 'win32'
  ? [join(process.env.PROGRAMFILES ?? 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  : ['google-chrome', 'chromium', 'chromium-browser'].map(name => Bun.which(name)).find(Boolean))
if (!browser) throw new Error('Set CHROME_BIN to an existing Chrome/Chromium/Edge executable; this check installs nothing')
const temporaryRoot = realpathSync(tmpdir())
const profile = mkdtempSync(join(temporaryRoot, 'portfolio-image-browser-'))
if (!resolve(profile).startsWith(`${resolve(temporaryRoot)}${sep}portfolio-image-browser-`)) throw new Error('Unsafe temporary browser profile path')
const bundle = await Bun.build({ entrypoints: [installedShaders ? './tests/browser/shader-library.tsx' : shaders ? './tests/browser/shader-runtime.tsx' : projectArtwork ? './tests/browser/project-artwork.ts' : './src/lib/media/convert-to-webp.ts'], target: 'browser', write: false, plugins: shaders || installedShaders ? [shaderDiscovery()] : [] })
if (!bundle.success) throw new Error('Image conversion browser bundle failed')
const server = Bun.serve({
  hostname: '127.0.0.1', port: 0,
  fetch(request) {
    if (projectArtwork && new URL(request.url).pathname === '/project-artwork-mask.webp') return new Response(Bun.file('./public/terrain/assets/fbm-mask.webp'))
    return new URL(request.url).pathname === '/media.js'
      ? new Response(bundle.outputs[0], { headers: { 'content-type': 'text/javascript' } })
      : new Response(Bun.file(shaders || installedShaders ? './tests/browser/shader-runtime.html' : projectArtwork ? './tests/browser/project-artwork.html' : './tests/browser/image-conversion.html'))
  },
})
try {
  const child = spawn(browser, ['--headless=new', ...(graphics ? ['--window-size=1280,900', ...(nativeGpu ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])] : ['--disable-gpu']), '--disable-background-networking', '--disable-extensions', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', String(server.url)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.resume()
  child.stderr.resume()
  let closed = false
  let launchError
  const exited = new Promise(resolveExit => child.once('close', () => { closed = true; resolveExit() }))
  child.once('error', error => { launchError = error })
  const timer = setTimeout(() => child.kill(), installedShaders ? 180_000 : 45_000)
  let socket
  try {
    const wait = milliseconds => new Promise(resolveWait => setTimeout(resolveWait, milliseconds))
    const activePort = join(profile, 'DevToolsActivePort')
    while (!existsSync(activePort)) {
      if (closed || launchError) throw launchError ?? new Error('Browser exited before debugging became available')
      await wait(100)
    }
    const port = Number(readFileSync(activePort, 'utf8').split('\n')[0])
    let page
    while (!page) {
      if (closed) throw new Error('Browser exited before opening the fixture')
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json())
      page = targets.find(target => target.type === 'page' && target.url.startsWith(String(server.url)))
      if (!page) await wait(100)
    }
    socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolveOpen, reject) => { socket.onopen = resolveOpen; socket.onerror = reject })
    let result
    let commandId = 0
    const deadline = Date.now() + (installedShaders ? 165_000 : 35_000)
    while (Date.now() < deadline) {
      const id = ++commandId
      result = await new Promise((resolveResult, reject) => {
        socket.onclose = () => reject(new Error('Browser closed before conversion completed'))
        socket.onmessage = event => {
          const message = JSON.parse(String(event.data))
          if (message.id === id) resolveResult(message.result?.result?.value)
        }
        socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
          expression: `({ status: document.readyState === 'complete' ? document.body?.dataset.status : undefined, text: document.getElementById('result')?.textContent, fixtures: window.mediaFixtures, renderer: document.body?.dataset.renderer })`,
          returnByValue: true,
        } }))
      })
      if (result?.status === 'passed' || result?.status === 'failed') break
      await wait(100)
    }
    if (result?.status !== 'passed') throw new Error(`Browser ${installedShaders ? 'installed shaders' : shaders ? 'shader runtime' : projectArtwork ? 'project artwork' : 'image conversion'} checks failed: ${result?.text ?? 'No completed browser result'}`)
    console.log(result.text)
    if (graphics) console.log(`WebGL renderer: ${result.renderer ?? 'unavailable'}`)
    if (process.env.MEDIA_PRINT_FIXTURES === 'true') console.log(JSON.stringify(result.fixtures))
    socket.send(JSON.stringify({ id: ++commandId, method: 'Browser.close' }))
    await Promise.race([exited, wait(2000)])
  } finally {
    clearTimeout(timer)
    socket?.close()
    if (!closed) { child.kill(); await exited }
  }
} finally {
  server.stop(true)
  try { rmSync(profile, { recursive: true, force: true }) } catch { console.warn('Temporary browser profile could not be fully removed') }
}
