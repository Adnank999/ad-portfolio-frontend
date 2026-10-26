import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { BunPlugin } from 'bun'

export function shaderDiscovery(): BunPlugin {
  return {
    name: 'shader-definition-discovery',
    setup(builder) {
      builder.onLoad({ filter: /[\\/]shaders[\\/]registry\.ts$/ }, async ({ path }) => {
        const files = (await readdir(join(dirname(path), 'definitions'))).filter(file => file.endsWith('.ts')).sort()
        const imports = files.map((file, index) => `import { definition as shader${index} } from './definitions/${file}'`).join('\n')
        const entries = files.map((file, index) => `${JSON.stringify(file)}: { definition: shader${index} }`).join(',')
        const contents = (await readFile(path, 'utf8')).replace(/^const modules = import\.meta\.glob.*$/m, `const modules = {${entries}}`)
        return { contents: `${imports}\n${contents}`, loader: 'ts' }
      })
    },
  }
}
