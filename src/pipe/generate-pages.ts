import { read, write } from "to-vfile"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkDirective from "remark-directive"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import rehypeSlug from "rehype-slug"
import Path from "path"
import { dedent } from "ts-dedent"
import rehypeRaw from "rehype-raw"
import { directiveInterpreter } from "./directive-interpreter"
import { Import, ModuleData } from "./types"
import { remarkMetaCode } from "./remark-meta-code"
import { capitalize } from "@metaliq/util"
import { mkdir, readdir } from "fs/promises"
import Watcher from "chokidar"

const processor = unified()
  .use(remarkParse)
  .use(remarkMetaCode)
  .use(remarkDirective)
  .use(directiveInterpreter)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .use(rehypeSlug)

export async function generatePages (inDir: string, outDir: string) {
  const filePaths = await readDirPaths(inDir)

  for (const inPath of filePaths) {
    await generatePage(inDir, outDir, inPath)
  }
}

export async function watchAndGenerate (inDir: string, outDir: string) {
  const onChange = (path: string) => {
    if (path.match(/\.md$/)) {
      generatePage(inDir, outDir, path).catch(console.error)
    }
  }

  await generatePages(inDir, outDir)
  Watcher.watch(inDir, { ignoreInitial: true })
    .on("change", onChange)
    .on("add", onChange)
}

export async function generatePage (inDir: string, outDir: string, inPath: string) {
  const subPath = Path.relative(inDir, inPath)
  const outPath = Path.join(outDir, subPath).split(".").slice(0, -1).concat("ts").join(".")
  await mkdir(Path.dirname(outPath), { recursive: true })

  const processorData = processor.data()
  processorData.moduleData = {}
  const file = await processor.process(await read(inPath))
  const moduleData: ModuleData = processorData.moduleData
  moduleData.imports = moduleData.imports || []
  moduleData.viewName = Path.basename(inPath)
    // Remove extension
    .replace(/\.[^/.]+$/, "")
    // Change from kebab to camel case
    .split("-")
    .map((w, i) => i > 0 ? capitalize(w) : w)
    .join("")
  const html = file.value.toString()
  // TODO: Proper fix to prevent munging embedded tags in code expressions
  const fixTags = html.replace(/&#x3C;/g, "<")
  const value = htmlTs(fixTags, moduleData)

  await write({ path: outPath, value })
}

const htmlTs = (html: string, moduleData: ModuleData) => {
  const imports: Import[] = [
    { id: "html", from: "lit" },
    { id: "Meta", from: "metaliq" },
    { id: "MetaView", from: "metaliq/lib/policies/presentation/presentation" },
    ...moduleData.imports
  ]

  const importsTs = imports.map(i => `import { ${i.id} } from "${i.from}"`).join("\n")

  const ts = dedent`
    ${importsTs}

    export const ${moduleData.viewName}: MetaView<${moduleData.metaType || "any"}> = (${valueMetaParams(moduleData.metaName)}) => html\`
      ${html.trim()}
    \`
  `
  return ts
}

const valueMetaParams = (name: string) => name
  ? `${name}, ${name}$`
  : ""

const readDirPaths = async (dir: string) => {
  let paths: string[] = []
  const files = await readdir(dir, { withFileTypes: true })

  for (const file of files) {
    const path = Path.join(dir, file.name)
    if (file.isDirectory()) {
      const childFileNames = await readDirPaths(path)
      paths = [...paths, ...childFileNames]
    } else {
      paths.push(path)
    }
  }

  return paths
}
