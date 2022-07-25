import { Plugin, Processor } from "unified"
import { visit } from "unist-util-visit"
import { Directive } from "mdast-util-directive"
import { h } from "hastscript"
import { Import, ModuleData } from "./types"
import { Parent } from "@types/unist"

export const directiveInterpreter: Plugin = function (this: Processor) {
  return (root, file) => {
    const processData = this.data()
    const moduleData: ModuleData = processData.moduleData = (processData.moduleData || {})

    const removeNodes: Array<[Directive, Parent]> = []

    visit(root, (node, index, parent: Parent) => {
      if (["textDirective", "leafDirective", "containerDirective"].includes(node.type)) {
        const directive = node as Directive

        let isHtmlTag = false

        // TODO: Shift this to frontmatter
        if (directive.name === "import") {
          moduleData.imports = moduleData.imports || []
          moduleData.imports.push(directive.attributes as Import)
        } else if (directive.name === "meta") {
          moduleData.metaName = directive.attributes.id
          moduleData.metaType = directive.attributes.type
        } else {
          isHtmlTag = true
          const data = directive.data || (directive.data = {})
          const hast = h(directive.name || "div", directive.attributes)

          data.hName = hast.tagName
          data.hProperties = hast.properties
        }

        if (!isHtmlTag) {
          removeNodes.push([directive, parent])
        }
      }
    })

    for (const [node, parent] of removeNodes) {
      parent.children.splice(parent.children.indexOf(node), 1)
    }
  }
}
