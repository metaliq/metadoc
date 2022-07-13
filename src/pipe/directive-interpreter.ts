import { Plugin, Processor } from "unified"
import { visit } from "unist-util-visit"
import { Directive } from "mdast-util-directive"
import { h } from "hastscript"
import { Import, ModuleData } from "./types"
import { Parent } from "mdast"

export const directiveInterpreter: Plugin = function (this: Processor) {
  return (root, file) => {
    console.log(`Processing directives in file: ${file.basename}`)
    const processData = this.data()
    const moduleData: ModuleData = processData.moduleData = (processData.moduleData || {})

    visit(root, (node, index, parent: Parent) => {
      if (["textDirective", "leafDirective", "containerDirective"].includes(node.type)) {
        const directive = node as Directive

        let isHtmlTag = false

        if (directive.name === "import") {
          moduleData.imports = moduleData.imports || []
          moduleData.imports.push(directive.attributes as Import)
        } else if (directive.name === "meta") {
          moduleData.metaName = directive.attributes.id
          moduleData.metaType = directive.attributes.type
        } else {
          isHtmlTag = true
          const data = directive.data || (directive.data = {})
          const hast = h(directive.name, directive.attributes)

          data.hName = hast.tagName
          data.hProperties = hast.properties
        }

        // if (!isHtmlTag) {
        //   parent.children.splice(parent.children.indexOf(directive), 1)
        //   console.log(parent.children)
        // }
      }
    })
  }
}
