import { formatPackageFile } from './formatPackageJson.js'

await formatPackageFile().then(() => console.log('Created package.json'))
