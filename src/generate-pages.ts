import { read, write } from "to-vfile"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import rehypeSlug from "rehype-slug"
import Path from "path"
import { dedent } from "ts-dedent"
import { readFile } from "fs/promises"
import rehypeRaw from "rehype-raw"

export async function generatePages (pages: string[]) {
  const processor = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .use(rehypeSlug)

  for (const page of pages) {
    const path = Path.join(process.cwd(), "content", `${page}.md`)

    // TODO: Revert to using v-file read
    const content = await readFile(path, "utf8")

    // TODO: Implement as unified plugin
    const lines = content.split("\n")
    const newLines = lines.map(line => {
      if (line.match(/^\w*@/)) {
        const tag = line.trim().substr(1) // Content of tag after @
        const name = tag.split(" ")[0].split(/[^\w-]/)[0] || "div"
        const classes = tag.match(/\.(\S*)/g).map(c => c.substr(1))
        const html = `<${name} class="${classes}">`
        return new Array(line.search("@")).fill(" ").join() + html
      } else if (line.match(/^\S*}$/)) { // TODO: Proper handling of nesting / inner content
        return "</div>"
      } else {
        return line
      }
    })

    const newContent = newLines.join("\n")

    const file = await processor
      .process(newContent)
      // TODO: Reinstate v-file as process source
      // .process(await read(path))

    const html = file.value.toString()

    const output = dedent`
      import { html } from "lit"

      export const ${page} = () => html\`
        ${html.trim()}
      \`
      
    `

    await write({
      path: Path.join(process.cwd(), "src", "gen", `${page}.ts`),
      value: output
    })
  }
}
