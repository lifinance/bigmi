import { join } from 'node:path'
import fsExtra from 'fs-extra'

const { readFile, writeFile } = fsExtra

async function run() {
  const packagePath = join(process.cwd(), './package.json')

  const packageData = await readFile(packagePath, 'utf8')

  const { version, name } = JSON.parse(packageData)

  const src = `export const name = '${name}'\nexport const version = '${version}'\n`

  writeFile(`${process.cwd()}/src/version.ts`, src, {
    flat: 'w',
  })
}

await run()
