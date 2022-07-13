/**
 * Container for process-level data, that is used across or outside of individual plugins.
 */
export type ModuleData = {
  imports?: Import[]

  // The exported view name
  viewName?: string

  // The name of the Meta$ parameter
  metaName?: string

  // The type of the Meta$ parameter
  metaType?: string
}

/**
 * Details of an import in the generated module.
 */
export type Import = {
  id: string
  from: string
}
