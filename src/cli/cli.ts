import { mkdir } from "fs/promises"
import { generatePages, watchAndGenerate } from "../pipe/generate-pages"
import { Command } from "commander"

const program = new Command()
program
  .name("metadoc")
  .version("0.4.0")
  .argument("<inDir>", "input directory")
  .argument("<outDir>", "output directory")
  .option("-w, --watch", "watch for changes")

program.parse()

const options: { watch: boolean } = program.opts()
const [inDir, outDir] = program.args

console.log(`Running metadoc on ${inDir} to ${outDir} ${options.watch ? "and watching for changes" : ""}`)

async function main () {
  await mkdir(outDir, { recursive: true })
  if (options.watch) {
    watchAndGenerate(inDir, outDir)
  } else {
    await generatePages(inDir, outDir)
  }
}

main().catch(console.error)
