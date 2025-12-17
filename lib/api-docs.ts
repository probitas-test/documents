/**
 * API documentation types and utilities
 *
 * These types represent the structure of deno doc --json output
 * and provide utilities for working with API documentation.
 */

// ============================================================================
// Built-in Type Links
// ============================================================================

const MDN_BASE = "https://developer.mozilla.org/en-US/docs/Web/JavaScript";
const TS_BASE = "https://www.typescriptlang.org/docs/handbook";

/**
 * Map of built-in type names to their documentation URLs
 */
export const BUILTIN_TYPE_LINKS: Record<string, string> = {
  // JavaScript primitives (MDN)
  string: `${MDN_BASE}/Reference/Global_Objects/String`,
  number: `${MDN_BASE}/Reference/Global_Objects/Number`,
  boolean: `${MDN_BASE}/Reference/Global_Objects/Boolean`,
  symbol: `${MDN_BASE}/Reference/Global_Objects/Symbol`,
  bigint: `${MDN_BASE}/Reference/Global_Objects/BigInt`,
  null: `${MDN_BASE}/Reference/Operators/null`,
  undefined: `${MDN_BASE}/Reference/Global_Objects/undefined`,
  object: `${MDN_BASE}/Reference/Global_Objects/Object`,

  // JavaScript built-in objects (MDN)
  Array: `${MDN_BASE}/Reference/Global_Objects/Array`,
  Promise: `${MDN_BASE}/Reference/Global_Objects/Promise`,
  Map: `${MDN_BASE}/Reference/Global_Objects/Map`,
  Set: `${MDN_BASE}/Reference/Global_Objects/Set`,
  WeakMap: `${MDN_BASE}/Reference/Global_Objects/WeakMap`,
  WeakSet: `${MDN_BASE}/Reference/Global_Objects/WeakSet`,
  Date: `${MDN_BASE}/Reference/Global_Objects/Date`,
  RegExp: `${MDN_BASE}/Reference/Global_Objects/RegExp`,
  Error: `${MDN_BASE}/Reference/Global_Objects/Error`,
  Function: `${MDN_BASE}/Reference/Global_Objects/Function`,
  ArrayBuffer: `${MDN_BASE}/Reference/Global_Objects/ArrayBuffer`,
  Uint8Array: `${MDN_BASE}/Reference/Global_Objects/Uint8Array`,
  Int8Array: `${MDN_BASE}/Reference/Global_Objects/Int8Array`,
  Uint16Array: `${MDN_BASE}/Reference/Global_Objects/Uint16Array`,
  Int16Array: `${MDN_BASE}/Reference/Global_Objects/Int16Array`,
  Uint32Array: `${MDN_BASE}/Reference/Global_Objects/Uint32Array`,
  Int32Array: `${MDN_BASE}/Reference/Global_Objects/Int32Array`,
  Float32Array: `${MDN_BASE}/Reference/Global_Objects/Float32Array`,
  Float64Array: `${MDN_BASE}/Reference/Global_Objects/Float64Array`,
  DataView: `${MDN_BASE}/Reference/Global_Objects/DataView`,
  JSON: `${MDN_BASE}/Reference/Global_Objects/JSON`,
  Iterator: `${MDN_BASE}/Reference/Global_Objects/Iterator`,
  AsyncIterator: `${MDN_BASE}/Reference/Global_Objects/AsyncIterator`,
  Generator: `${MDN_BASE}/Reference/Global_Objects/Generator`,
  AsyncGenerator: `${MDN_BASE}/Reference/Global_Objects/AsyncGenerator`,
  Iterable: `${MDN_BASE}/Reference/Iteration_protocols#the_iterable_protocol`,
  AsyncIterable:
    `${MDN_BASE}/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols`,

  // TypeScript utility types
  Partial: `${TS_BASE}/utility-types.html#partialtype`,
  Required: `${TS_BASE}/utility-types.html#requiredtype`,
  Readonly: `${TS_BASE}/utility-types.html#readonlytype`,
  Record: `${TS_BASE}/utility-types.html#recordkeys-type`,
  Pick: `${TS_BASE}/utility-types.html#picktype-keys`,
  Omit: `${TS_BASE}/utility-types.html#omittype-keys`,
  Exclude: `${TS_BASE}/utility-types.html#excludeuniontype-excludedmembers`,
  Extract: `${TS_BASE}/utility-types.html#extracttype-union`,
  NonNullable: `${TS_BASE}/utility-types.html#nonnullabletype`,
  ReturnType: `${TS_BASE}/utility-types.html#returntypetype`,
  Parameters: `${TS_BASE}/utility-types.html#parameterstype`,
  InstanceType: `${TS_BASE}/utility-types.html#instancetypetype`,
  Awaited: `${TS_BASE}/utility-types.html#awaitedtype`,

  // TypeScript special types
  void: `${TS_BASE}/2/basic-types.html#void`,
  never: `${TS_BASE}/2/basic-types.html#never`,
  any: `${TS_BASE}/2/basic-types.html#any`,
  unknown: `${TS_BASE}/2/basic-types.html#unknown`,
};

/**
 * Check if a type name is a built-in type
 */
export function isBuiltinType(typeName: string): boolean {
  return typeName in BUILTIN_TYPE_LINKS;
}

/**
 * Get the documentation URL for a built-in type
 */
export function getBuiltinTypeUrl(typeName: string): string | undefined {
  return BUILTIN_TYPE_LINKS[typeName];
}

// ============================================================================
// JSDoc Types
// ============================================================================

export interface JsDocTag {
  kind: string;
  name?: string;
  doc?: string;
}

export interface JsDoc {
  doc?: string;
  tags?: JsDocTag[];
}

// ============================================================================
// Type Definition Types
// ============================================================================

export interface TsTypeDef {
  repr: string;
  kind: string;
  keyword?: string;
  typeRef?: {
    typeParams: TsTypeDef[] | null;
    typeName: string;
  };
  array?: TsTypeDef;
  union?: TsTypeDef[];
  intersection?: TsTypeDef[];
  literal?: {
    kind: string;
    string?: string;
    number?: number;
    boolean?: boolean;
  };
  fnOrConstructor?: {
    constructor: boolean;
    typeParams: TsTypeParamDef[];
    params: ParamDef[];
    returnType: TsTypeDef;
  };
  typeOperator?: {
    operator: string;
    tsType: TsTypeDef;
  };
  tuple?: TsTypeDef[];
  typeLiteral?: {
    methods: MethodDef[];
    properties: PropertyDef[];
    callSignatures: CallSignatureDef[];
    indexSignatures: IndexSignatureDef[];
  };
}

export interface TsTypeParamDef {
  name: string;
  constraint?: TsTypeDef;
  default?: TsTypeDef;
}

// ============================================================================
// Parameter Types
// ============================================================================

export interface ParamDef {
  kind: string;
  name?: string;
  optional?: boolean;
  tsType?: TsTypeDef;
  left?: ParamDef;
  right?: string;
  elements?: ParamDef[];
  props?: PropertyDef[];
}

// ============================================================================
// Method and Property Types
// ============================================================================

export interface MethodDef {
  name: string;
  jsDoc?: JsDoc;
  accessibility?: "public" | "private" | "protected" | null;
  optional?: boolean;
  isAbstract?: boolean;
  isStatic?: boolean;
  typeParams: TsTypeParamDef[];
  params: ParamDef[];
  returnType?: TsTypeDef;
}

export interface PropertyDef {
  name: string;
  jsDoc?: JsDoc;
  tsType?: TsTypeDef;
  readonly?: boolean;
  accessibility?: "public" | "private" | "protected" | null;
  optional?: boolean;
  isAbstract?: boolean;
  isStatic?: boolean;
}

export interface CallSignatureDef {
  jsDoc?: JsDoc;
  typeParams: TsTypeParamDef[];
  params: ParamDef[];
  returnType?: TsTypeDef;
}

export interface IndexSignatureDef {
  readonly?: boolean;
  params: ParamDef[];
  tsType?: TsTypeDef;
}

// ============================================================================
// Definition Types (function, class, interface, etc.)
// ============================================================================

export interface FunctionDef {
  params: ParamDef[];
  returnType?: TsTypeDef;
  hasBody: boolean;
  isAsync: boolean;
  isGenerator: boolean;
  typeParams: TsTypeParamDef[];
}

export interface ConstructorDef {
  jsDoc?: JsDoc;
  accessibility?: "public" | "private" | "protected" | null;
  hasBody: boolean;
  name: string;
  params: ParamDef[];
}

export interface ClassDef {
  isAbstract: boolean;
  constructors: ConstructorDef[];
  properties: PropertyDef[];
  indexSignatures: IndexSignatureDef[];
  methods: MethodDef[];
  extends?: string;
  implements: TsTypeDef[];
  typeParams: TsTypeParamDef[];
  superTypeParams: TsTypeDef[];
}

export interface InterfaceDef {
  extends: TsTypeDef[];
  methods: MethodDef[];
  properties: PropertyDef[];
  callSignatures: CallSignatureDef[];
  indexSignatures: IndexSignatureDef[];
  typeParams: TsTypeParamDef[];
}

export interface TypeAliasDef {
  typeParams: TsTypeParamDef[];
  tsType: TsTypeDef;
}

export interface EnumMemberDef {
  name: string;
  jsDoc?: JsDoc;
  init?: TsTypeDef;
}

export interface EnumDef {
  members: EnumMemberDef[];
}

export interface VariableDef {
  tsType?: TsTypeDef;
  kind: "var" | "let" | "const";
}

export interface NamespaceDef {
  elements: DocNode[];
}

// ============================================================================
// DocNode - The main node type
// ============================================================================

export interface Location {
  filename: string;
  line: number;
  col: number;
  byteIndex: number;
}

export interface DocNode {
  name: string;
  isDefault?: boolean;
  location: Location;
  declarationKind: string;
  jsDoc?: JsDoc;
  kind:
    | "moduleDoc"
    | "function"
    | "class"
    | "interface"
    | "typeAlias"
    | "enum"
    | "variable"
    | "namespace"
    | "import";
  functionDef?: FunctionDef;
  classDef?: ClassDef;
  interfaceDef?: InterfaceDef;
  typeAliasDef?: TypeAliasDef;
  enumDef?: EnumDef;
  variableDef?: VariableDef;
  namespaceDef?: NamespaceDef;
}

// ============================================================================
// Package Documentation
// ============================================================================

export interface DenoDocOutput {
  version: number;
  nodes: DocNode[];
}

export interface PackageDoc {
  /** Package name (e.g., "probitas", "client-http") */
  name: string;
  /** Full package specifier (e.g., "@probitas/probitas") */
  specifier: string;
  /** Package version */
  version: string;
  /** Module-level documentation */
  moduleDoc?: string;
  /** Exported items */
  exports: DocNode[];
}

export interface ApiDocsIndex {
  /** All packages */
  packages: PackageInfo[];
}

export interface ExportCounts {
  classes: number;
  interfaces: number;
  functions: number;
  types: number;
  variables: number;
  enums: number;
}

export interface PackageInfo {
  name: string;
  specifier: string;
  version: string;
  exportCount: number;
  counts: ExportCounts;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format a type definition as a readable string
 */
export function formatType(type?: TsTypeDef): string {
  if (!type) return "unknown";

  switch (type.kind) {
    case "keyword":
      return type.keyword ?? type.repr;

    case "typeRef":
      if (type.typeRef) {
        const params = type.typeRef.typeParams;
        if (params && params.length > 0) {
          return `${type.typeRef.typeName}<${
            params.map(formatType).join(", ")
          }>`;
        }
        return type.typeRef.typeName;
      }
      return type.repr;

    case "array":
      return `${formatType(type.array)}[]`;

    case "union":
      return type.union?.map(formatType).join(" | ") ?? type.repr;

    case "intersection":
      return type.intersection?.map(formatType).join(" & ") ?? type.repr;

    case "literal":
      if (type.literal) {
        if (type.literal.kind === "string") return `"${type.literal.string}"`;
        if (type.literal.kind === "number") return String(type.literal.number);
        if (type.literal.kind === "boolean") {
          return String(type.literal.boolean);
        }
      }
      return type.repr;

    case "tuple":
      return `[${type.tuple?.map(formatType).join(", ") ?? ""}]`;

    case "fnOrConstructor": {
      const fn = type.fnOrConstructor;
      if (!fn) return type.repr;
      const params = fn.params.map((p) =>
        `${p.name ?? "_"}: ${formatType(p.tsType)}`
      ).join(", ");
      return `(${params}) => ${formatType(fn.returnType)}`;
    }

    case "typeOperator": {
      const op = type.typeOperator;
      if (!op) return type.repr;
      return `${op.operator} ${formatType(op.tsType)}`;
    }

    case "typeLiteral": {
      const lit = type.typeLiteral;
      if (!lit) return type.repr;
      const props = lit.properties.map((p) =>
        `${p.name}${p.optional ? "?" : ""}: ${formatType(p.tsType)}`
      ).join("; ");
      return `{ ${props} }`;
    }

    default:
      return type.repr || "unknown";
  }
}

/**
 * Format a parameter list as a readable string
 */
export function formatParams(params?: ParamDef[]): string {
  if (!params) return "";
  return params.map((p) => {
    const optional = p.optional ? "?" : "";
    const name = p.name ?? "_";
    const type = formatType(p.tsType);
    return `${name}${optional}: ${type}`;
  }).join(", ");
}

/**
 * Format type parameters (generics)
 */
export function formatTypeParams(typeParams?: TsTypeParamDef[]): string {
  if (!typeParams || typeParams.length === 0) return "";
  return `<${
    typeParams.map((p) => {
      let result = p.name;
      if (p.constraint) result += ` extends ${formatType(p.constraint)}`;
      if (p.default) result += ` = ${formatType(p.default)}`;
      return result;
    }).join(", ")
  }>`;
}

/**
 * Get the JSDoc description for a node
 */
export function getDescription(node: { jsDoc?: JsDoc }): string | undefined {
  return node.jsDoc?.doc;
}

/**
 * Get just the first sentence or line of the description (for summaries)
 */
export function getDescriptionSummary(
  node: { jsDoc?: JsDoc },
): string | undefined {
  const doc = node.jsDoc?.doc;
  if (!doc) return undefined;

  // Try to get first sentence (ending with period followed by space/newline)
  const sentenceMatch = doc.match(/^([^.]+\.)\s/);
  if (sentenceMatch) {
    return sentenceMatch[1];
  }

  // Otherwise get first line
  const firstLine = doc.split("\n")[0].trim();
  return firstLine || undefined;
}

/**
 * Get JSDoc tags by kind
 */
export function getTagsByKind(
  node: { jsDoc?: JsDoc },
  kind: string,
): JsDocTag[] {
  return node.jsDoc?.tags?.filter((t) => t.kind === kind) ?? [];
}

/**
 * Get the @example tags from a node
 */
export function getExamples(node: { jsDoc?: JsDoc }): string[] {
  return getTagsByKind(node, "example").map((t) => t.doc ?? "").filter(Boolean);
}

/**
 * Get the @param tags from a node
 */
export function getParamDocs(
  node: { jsDoc?: JsDoc },
): Map<string, string> {
  const result = new Map<string, string>();
  for (const tag of getTagsByKind(node, "param")) {
    if (tag.name && tag.doc) {
      result.set(tag.name, tag.doc);
    }
  }
  return result;
}

/**
 * Get the @return/@returns tag from a node
 */
export function getReturnDoc(node: { jsDoc?: JsDoc }): string | undefined {
  const returnTag = getTagsByKind(node, "return")[0] ??
    getTagsByKind(node, "returns")[0];
  return returnTag?.doc;
}

/**
 * Check if a node should be included in documentation (not private)
 */
export function isPublic(node: DocNode): boolean {
  // Skip private or internal items
  if (node.name.startsWith("_")) return false;

  // Skip moduleDoc entries (they're handled separately)
  if (node.kind === "moduleDoc") return false;

  // Check for @internal or @private tags
  const tags = node.jsDoc?.tags ?? [];
  if (tags.some((t) => t.kind === "internal" || t.kind === "private")) {
    return false;
  }

  return true;
}

/**
 * Group exports by kind for display
 */
export function groupByKind(
  nodes: DocNode[],
): Record<string, DocNode[]> {
  const groups: Record<string, DocNode[]> = {};
  for (const node of nodes) {
    const kind = node.kind;
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(node);
  }
  // Sort each group by name
  for (const kind of Object.keys(groups)) {
    groups[kind].sort((a, b) => a.name.localeCompare(b.name));
  }
  return groups;
}

/**
 * Deduplicate nodes by name (keep first occurrence)
 * This is needed because overloaded functions appear multiple times
 */
export function deduplicateByName(nodes: DocNode[]): DocNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    const key = `${node.kind}:${node.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group nodes by name to handle overloads
 * Returns a map where key is "kind:name" and value is array of all overloads
 */
export function groupByName(nodes: DocNode[]): Map<string, DocNode[]> {
  const groups = new Map<string, DocNode[]>();
  for (const node of nodes) {
    const key = `${node.kind}:${node.name}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(node);
  }
  return groups;
}
