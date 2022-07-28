import { Plugin } from "unified"
import { visit } from "unist-util-visit"
import { is } from "unist-util-is"
import { paragraph, text } from "mdast-builder"
import { Parent } from "unist"
import { as } from "../util/util"

// Check for expression-within-literal syntax
const codeExprEx = /^\$\{/
// Check for directive syntax
const directiveEx = /^:/

export const remarkMetaCode: Plugin = function () {
  return (tree, file) => {
    visit(tree, (node, index, parent: Parent) => {
      if (is(node, ["code", "inlineCode"])) {
        const code = as<{ value: string }>(node)
        // Add default `div` name to directives`
        code.value = code.value.replace(/^(:{1,3})\{/g, "$1div{")
        // code.lang is the selected language
        if (code.value.match(codeExprEx) || code.value.match(directiveEx)) {
          const textNode = text(code.value)
          const newNode = is(node, "code") ? paragraph(textNode) : textNode
          parent.children.splice(parent.children.indexOf(node), 1, newNode)
        }
      }
    })
  }
}
