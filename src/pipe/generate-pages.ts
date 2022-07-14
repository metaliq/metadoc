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
import { capitalize } from "metaliq/lib/util/util"

const processor = unified()
  .use(remarkParse)
  .use(remarkMetaCode)
  .use(remarkDirective)
  .use(directiveInterpreter)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .use(rehypeSlug)

export async function generatePages (dir: string, pages: string[]) {
  const processorData = processor.data()
  for (const page of pages) {
    const inPath = Path.join(dir, "content", `${page}.md`)
    const outPath = Path.join(dir, "src", "gen", `${page}.ts`)

    processorData.moduleData = {}
    const file = await processor.process(await read(inPath))
    const moduleData: ModuleData = processorData.moduleData
    moduleData.imports = moduleData.imports || []
    moduleData.viewName = page.split("-").map((w, i) => i > 0 ? capitalize(w) : w).join("")
    const html = file.value.toString()
    // TODO: Proper fix to prevent munging embedded tags in code expressions
    const fixTags = html.replace(/&#x3C;/g, "<")
    const value = htmlTs(fixTags, moduleData)

    await write({ path: outPath, value })
  }
}

const htmlTs = (html: string, moduleData: ModuleData) => {
  const imports: Import[] = [
    { id: "html", from: "lit" },
    { id: "MetaView", from: "metaliq/lib/policies/presentation/presentation" },
    ...moduleData.imports
  ]

  const importsTs = imports.map(i => `import { ${i.id} } from "${i.from}"`).join("\n")

  const ts = dedent`
    ${importsTs}

    export const ${moduleData.viewName}: MetaView<${moduleData.metaType || "any"}> = (${moduleData.metaName ?? ""}) => html\`
      ${html.trim()}
    \`
  `
  return ts
}
