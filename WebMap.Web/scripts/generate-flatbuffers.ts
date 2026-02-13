import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMAS_DIR = '../WebMap.Schema'
const TEMP_OUTPUT = 'src/_generated'
const FINAL_OUTPUT = 'src/net/models'

const schemaFiles = readdirSync(SCHEMAS_DIR).filter((file) =>
    file.endsWith('.fbs')
);

if (schemaFiles.length === 0) {
    console.log('No .fbs schema files found in', SCHEMAS_DIR)
    process.exit(0)
}

/* Clean up previous output */
rmSync(TEMP_OUTPUT, { recursive: true, force: true })
rmSync(FINAL_OUTPUT, { recursive: true, force: true })

/* compile all schemas to TypeScript */
for (const file of schemaFiles) {
    const schemaPath = join(SCHEMAS_DIR, file);
    console.log(`Compiling ${schemaPath}`)

    execSync(`flatc --ts -o ${TEMP_OUTPUT} ${schemaPath}`, {
        stdio: 'inherit',
    })
}

console.log(`✓ Generated TypeScript for ${schemaFiles.length} schema(s)`)

/* Move files from the nested namespace folder to the final destination */
const generatedModelsDir = join(TEMP_OUTPUT, 'web-map/networking/models')
mkdirSync(FINAL_OUTPUT, { recursive: true })
cpSync(generatedModelsDir, FINAL_OUTPUT, { recursive: true })

/* Fix import paths in all generated files (they reference the old nested paths) */
const files = readdirSync(FINAL_OUTPUT).filter(f => f.endsWith('.ts'))
for (const file of files) {
    const filePath = join(FINAL_OUTPUT, file)
    let content = readFileSync(filePath, 'utf-8')
    content = content.replace(/from '\.\.\/.*?\/models\//g, 'from \'./')
    content = '// @ts-nocheck\n' + content
    writeFileSync(filePath, content)
}

console.log(`✓ Moved files to ${FINAL_OUTPUT}`)

/* Clean up temp directory */
rmSync(TEMP_OUTPUT, { recursive: true, force: true })

/* Always generate our own barrel export with all types */
const modelFiles = readdirSync(FINAL_OUTPUT).filter(f => f.endsWith('.ts'))
const exports = modelFiles.map(f => `export * from './${f}'`).join('\n')
writeFileSync(join(FINAL_OUTPUT, 'index.ts'), `${exports}\n`)

console.log(`✓ Fixed all import paths`)
