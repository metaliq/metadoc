import { mkdir } from "fs/promises"
import { generatePages } from "../pipe/generate-pages"

async function main () {
  const outDir = process.argv.pop()
  const inDir = process.argv.pop()
  await mkdir(outDir)
  await generatePages(inDir, outDir)
}

main().catch(console.error)
