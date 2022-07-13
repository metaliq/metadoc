/**
 * Shorthand for type casting. Instead of:
 * ```ts
 * <unknown>value as <Type>
 * ```
 * use:
 * ```ts
 * as<Type>(value)
 * ```
 */
export const as = <To> (x: any) => x as To
