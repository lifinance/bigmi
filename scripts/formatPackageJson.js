import fsExtra from 'fs-extra'
import { resolve } from 'node:path'
const { readFile, writeFile, copy, remove } = fsExtra

export async function formatPackageFile() {
  const originalPackageJsonPath = resolve(process.cwd(), './package.json')
  const packageTmpPath = resolve(process.cwd(), './package.json.tmp')

  const packageData = await readFile(originalPackageJsonPath, 'utf8')

  await copy(originalPackageJsonPath, packageTmpPath)

  const {
    nyc,
    scripts,
    devDependencies,
    workspaces,
    files,
    ...packageDataOther
  } = JSON.parse(packageData)

  const newPackageData = {
    ...packageDataOther,
    main: './dist/esm/index.js',
    types: './dist/esm/index.d.ts',
    exports: {
      '.': {
        types: './dist/esm/index.d.ts',
        default: './dist/esm/index.js',
      },
      ...(packageDataOther.name === '@bigmi/core'
        ? {
            '.': {
              types: './dist/esm/index.d.ts',
              import: './dist/esm/index.js',
              default: './dist/cjs/index.js',
            },
          }
        : {
            '.': {
              types: './dist/esm/index.d.ts',
              default: './dist/esm/index.js',
            },
          }),
      './package.json': './package.json',
    },
  }

  if (newPackageData.name === '@bigmi/core') {
    // biome-ignore lint/performance/noDelete:
    delete newPackageData.module
  }

  await writeFile(
    originalPackageJsonPath,
    JSON.stringify(newPackageData, null, 2),
    'utf8'
  )

  return newPackageData
}

export async function restorePackageFile() {
  try {
    const originalPackageJsonPath = resolve(process.cwd(), './package.json')
    const packageTmpPath = resolve(process.cwd(), './package.json.tmp')

    await copy(packageTmpPath, originalPackageJsonPath)
    await remove(packageTmpPath)
  } catch (_error) {
    console.warn('Post release failed.')
  }
}
