import { readFile, mkdir } from "fs/promises"
import { join } from "path"
import { generatePages } from "../pipe/generate-pages"

async function main () {
  const dir = process.argv.pop()
  await mkdir(join(dir, "src", "gen"))
  const json = await readFile(join(dir, "content", "index.json"), "utf8")
  const index = JSON.parse(json)
  const { nav } = index as { nav: string[] }
  await generatePages(dir, nav)
}

main().catch(console.error)
