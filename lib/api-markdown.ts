/**
 * Generate Markdown documentation for API packages
 *
 * This module converts PackageDoc data into a Markdown representation
 * suitable for LLMs and programmatic consumption. Type references are
 * collected and output as a Related Links section at the end.
 */
import type {
  ClassDef,
  DocNode,
  FunctionDef,
  InterfaceDef,
  PackageDoc,
  TsTypeDef,
  TsTypeParamDef,
  TypeAliasDef,
} from "./api-docs.ts";
import {
  BUILTIN_TYPE_LINKS,
  deduplicateByName,
  formatType,
  getDescription,
  getExamples,
  getParamDocs,
  getReturnDoc,
  groupByName,
  isPublic,
} from "./api-docs.ts";
import {
  formatClassSignature,
  formatConstructorSignature,
  formatFunctionSignature,
  formatInterfaceSignature,
  formatMethodSignature,
  formatTypeAliasSignature,
} from "./signature-formatters.ts";

// ============================================================================
// Type Reference Collector
// ============================================================================

interface TypeLinkInfo {
  name: string;
  href: string;
  isBuiltin: boolean;
  isLocal: boolean;
  isCrossPackage: boolean;
}

/**
 * Collects type references and resolves them to links
 */
class TypeReferenceCollector {
  private refs = new Set<string>();
  private localTypes: Set<string>;
  private typeToPackage: Map<string, string>;
  private currentPackage: string;
  private baseUrl: string;

  constructor(
    localTypes: Set<string>,
    typeToPackage: Map<string, string>,
    currentPackage: string,
    baseUrl = "https://documents.probitas.deno.net",
  ) {
    this.localTypes = localTypes;
    this.typeToPackage = typeToPackage;
    this.currentPackage = currentPackage;
    this.baseUrl = baseUrl;
  }

  /**
   * Add a type reference
   */
  add(typeName: string): void {
    this.refs.add(typeName);
  }

  /**
   * Extract and add all type references from a TsTypeDef
   */
  extractFrom(type: TsTypeDef | undefined): void {
    if (!type) return;

    switch (type.kind) {
      case "typeRef":
        if (type.typeRef?.typeName) {
          this.add(type.typeRef.typeName);
          type.typeRef.typeParams?.forEach((t) => this.extractFrom(t));
        }
        break;
      case "array":
        this.extractFrom(type.array);
        break;
      case "union":
        type.union?.forEach((t) => this.extractFrom(t));
        break;
      case "intersection":
        type.intersection?.forEach((t) => this.extractFrom(t));
        break;
      case "tuple":
        type.tuple?.forEach((t) => this.extractFrom(t));
        break;
      case "fnOrConstructor":
        if (type.fnOrConstructor) {
          type.fnOrConstructor.params.forEach((p) =>
            this.extractFrom(p.tsType)
          );
          this.extractFrom(type.fnOrConstructor.returnType);
        }
        break;
      case "typeOperator":
        this.extractFrom(type.typeOperator?.tsType);
        break;
      case "typeLiteral":
        if (type.typeLiteral) {
          type.typeLiteral.properties.forEach((p) =>
            this.extractFrom(p.tsType)
          );
          type.typeLiteral.methods.forEach((m) => {
            m.params.forEach((p) => this.extractFrom(p.tsType));
            this.extractFrom(m.returnType);
          });
        }
        break;
    }
  }

  /**
   * Extract type refs from type parameters
   */
  extractFromTypeParams(typeParams: TsTypeParamDef[] | undefined): void {
    if (!typeParams) return;
    for (const p of typeParams) {
      this.extractFrom(p.constraint);
      this.extractFrom(p.default);
    }
  }

  /**
   * Get all collected links, sorted and categorized
   */
  getLinks(): TypeLinkInfo[] {
    const links: TypeLinkInfo[] = [];

    for (const name of this.refs) {
      // Check if built-in type
      if (name in BUILTIN_TYPE_LINKS) {
        links.push({
          name,
          href: BUILTIN_TYPE_LINKS[name],
          isBuiltin: true,
          isLocal: false,
          isCrossPackage: false,
        });
        continue;
      }

      // Check if local type
      if (this.localTypes.has(name)) {
        links.push({
          name,
          href: `${this.baseUrl}/api/${this.currentPackage}#${name}`,
          isBuiltin: false,
          isLocal: true,
          isCrossPackage: false,
        });
        continue;
      }

      // Check if cross-package type
      if (this.typeToPackage.has(name)) {
        const pkg = this.typeToPackage.get(name)!;
        if (pkg !== this.currentPackage) {
          links.push({
            name,
            href: `${this.baseUrl}/api/${pkg}#${name}`,
            isBuiltin: false,
            isLocal: false,
            isCrossPackage: true,
          });
        }
      }
    }

    // Sort: local first, then cross-package, then builtin
    return links.sort((a, b) => {
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      if (a.isCrossPackage !== b.isCrossPackage) {
        return a.isCrossPackage ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
}

// ============================================================================
// Section Generators
// ============================================================================

function generateFunctionMarkdown(
  node: DocNode,
  def: FunctionDef,
  collector: TypeReferenceCollector,
): string {
  const lines: string[] = [];

  lines.push(`### \`${node.name}\``);
  lines.push("");
  lines.push("```typescript");
  lines.push(formatFunctionSignature(node.name, def));
  lines.push("```");
  lines.push("");

  // Extract type refs
  collector.extractFromTypeParams(def.typeParams);
  def.params.forEach((p) => collector.extractFrom(p.tsType));
  collector.extractFrom(def.returnType);

  // Description
  const description = getDescription(node);
  if (description) {
    lines.push(description);
    lines.push("");
  }

  // Parameters
  if (def.params.length > 0) {
    const paramDocs = getParamDocs(node);
    lines.push("**Parameters:**");
    lines.push("");
    for (const param of def.params) {
      const name = param.name ?? "_";
      const optional = param.optional ? " (optional)" : "";
      const type = formatType(param.tsType);
      const doc = paramDocs.get(name);
      lines.push(
        `- \`${name}\`: \`${type}\`${optional}${doc ? ` — ${doc}` : ""}`,
      );
    }
    lines.push("");
  }

  // Returns
  const returnDoc = getReturnDoc(node);
  if (def.returnType || returnDoc) {
    lines.push("**Returns:** `" + formatType(def.returnType) + "`");
    if (returnDoc) {
      lines.push("");
      lines.push(returnDoc);
    }
    lines.push("");
  }

  // Examples
  const examples = getExamples(node);
  if (examples.length > 0) {
    lines.push("**Example:**");
    lines.push("");
    for (const example of examples) {
      const trimmed = example.trim();
      if (trimmed.startsWith("```")) {
        lines.push(trimmed);
      } else {
        lines.push("```typescript");
        lines.push(trimmed);
        lines.push("```");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function generateClassMarkdown(
  node: DocNode,
  def: ClassDef,
  collector: TypeReferenceCollector,
): string {
  const lines: string[] = [];

  lines.push(`### \`${node.name}\``);
  lines.push("");
  lines.push("```typescript");
  lines.push(formatClassSignature(node.name, def));
  lines.push("```");
  lines.push("");

  // Extract type refs
  collector.extractFromTypeParams(def.typeParams);
  def.implements.forEach((t) => collector.extractFrom(t));

  // Description
  const description = getDescription(node);
  if (description) {
    lines.push(description);
    lines.push("");
  }

  // Constructor
  if (def.constructors.length > 0) {
    lines.push("**Constructor:**");
    lines.push("");
    for (const ctor of def.constructors) {
      lines.push("```typescript");
      lines.push(formatConstructorSignature(node.name, ctor.params));
      lines.push("```");
      lines.push("");
      ctor.params.forEach((p) => collector.extractFrom(p.tsType));
    }
  }

  // Properties
  const publicProps = def.properties.filter(
    (p) => p.accessibility !== "private" && !p.name.startsWith("_"),
  );
  if (publicProps.length > 0) {
    lines.push("**Properties:**");
    lines.push("");
    for (const prop of publicProps) {
      collector.extractFrom(prop.tsType);
      const modifiers: string[] = [];
      if (prop.isStatic) modifiers.push("static");
      if (prop.readonly) modifiers.push("readonly");
      const prefix = modifiers.length > 0 ? `[${modifiers.join(", ")}] ` : "";
      const optional = prop.optional ? "?" : "";
      const desc = getDescription(prop);
      lines.push(
        `- ${prefix}\`${prop.name}${optional}\`: \`${
          formatType(prop.tsType)
        }\`${desc ? ` — ${desc}` : ""}`,
      );
    }
    lines.push("");
  }

  // Methods
  const publicMethods = def.methods.filter(
    (m) => m.accessibility !== "private" && !m.name.startsWith("_"),
  );
  if (publicMethods.length > 0) {
    lines.push("**Methods:**");
    lines.push("");
    for (const method of publicMethods) {
      lines.push("```typescript");
      lines.push(formatMethodSignature(method));
      lines.push("```");

      collector.extractFromTypeParams(method.typeParams);
      method.params?.forEach((p) => collector.extractFrom(p.tsType));
      collector.extractFrom(method.returnType);

      const desc = getDescription(method);
      if (desc) {
        lines.push("");
        lines.push(desc);
      }
      lines.push("");
    }
  }

  // Examples
  const examples = getExamples(node);
  if (examples.length > 0) {
    lines.push("**Example:**");
    lines.push("");
    for (const example of examples) {
      const trimmed = example.trim();
      if (trimmed.startsWith("```")) {
        lines.push(trimmed);
      } else {
        lines.push("```typescript");
        lines.push(trimmed);
        lines.push("```");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function generateInterfaceMarkdown(
  node: DocNode,
  def: InterfaceDef,
  collector: TypeReferenceCollector,
): string {
  const lines: string[] = [];

  lines.push(`### \`${node.name}\``);
  lines.push("");
  lines.push("```typescript");
  lines.push(formatInterfaceSignature(node.name, def));
  lines.push("```");
  lines.push("");

  // Extract type refs
  collector.extractFromTypeParams(def.typeParams);
  def.extends.forEach((t) => collector.extractFrom(t));

  // Description
  const description = getDescription(node);
  if (description) {
    lines.push(description);
    lines.push("");
  }

  // Properties
  if (def.properties.length > 0) {
    lines.push("**Properties:**");
    lines.push("");
    for (const prop of def.properties) {
      collector.extractFrom(prop.tsType);
      const readonly = prop.readonly ? "[readonly] " : "";
      const optional = prop.optional ? "?" : "";
      const desc = getDescription(prop);
      lines.push(
        `- ${readonly}\`${prop.name}${optional}\`: \`${
          formatType(prop.tsType)
        }\`${desc ? ` — ${desc}` : ""}`,
      );
    }
    lines.push("");
  }

  // Methods
  if (def.methods.length > 0) {
    lines.push("**Methods:**");
    lines.push("");
    for (const method of def.methods) {
      lines.push("```typescript");
      lines.push(formatMethodSignature(method));
      lines.push("```");

      collector.extractFromTypeParams(method.typeParams);
      method.params?.forEach((p) => collector.extractFrom(p.tsType));
      collector.extractFrom(method.returnType);

      const desc = getDescription(method);
      if (desc) {
        lines.push("");
        lines.push(desc);
      }
      lines.push("");
    }
  }

  // Examples
  const examples = getExamples(node);
  if (examples.length > 0) {
    lines.push("**Example:**");
    lines.push("");
    for (const example of examples) {
      const trimmed = example.trim();
      if (trimmed.startsWith("```")) {
        lines.push(trimmed);
      } else {
        lines.push("```typescript");
        lines.push(trimmed);
        lines.push("```");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function generateTypeAliasMarkdown(
  node: DocNode,
  def: TypeAliasDef,
  collector: TypeReferenceCollector,
): string {
  const lines: string[] = [];

  lines.push(`### \`${node.name}\``);
  lines.push("");
  lines.push("```typescript");
  lines.push(formatTypeAliasSignature(node.name, def));
  lines.push("```");
  lines.push("");

  // Extract type refs
  collector.extractFromTypeParams(def.typeParams);
  collector.extractFrom(def.tsType);

  // Description
  const description = getDescription(node);
  if (description) {
    lines.push(description);
    lines.push("");
  }

  return lines.join("\n");
}

function generateVariableMarkdown(
  node: DocNode,
  collector: TypeReferenceCollector,
): string {
  const lines: string[] = [];
  const def = node.variableDef;
  const kind = def?.kind ?? "const";

  lines.push(`### \`${node.name}\``);
  lines.push("");
  lines.push("```typescript");
  lines.push(`${kind} ${node.name}: ${formatType(def?.tsType)}`);
  lines.push("```");
  lines.push("");

  // Extract type refs
  collector.extractFrom(def?.tsType);

  // Description
  const description = getDescription(node);
  if (description) {
    lines.push(description);
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================================================
// Main Generator
// ============================================================================

export interface ApiMarkdownOptions {
  /** All packages for cross-package linking */
  allPackages?: PackageDoc[];
  /** Base URL for links */
  baseUrl?: string;
}

/**
 * Generate Markdown documentation for a package
 */
export function generateApiMarkdown(
  pkg: PackageDoc,
  options: ApiMarkdownOptions = {},
): string {
  const lines: string[] = [];
  const { allPackages = [], baseUrl = "https://documents.probitas.deno.net" } =
    options;

  // Build local types set
  const localTypes = new Set<string>();
  for (const node of pkg.exports) {
    if (isPublic(node)) {
      localTypes.add(node.name);
    }
  }

  // Build cross-package type map
  const typeToPackage = new Map<string, string>();
  for (const p of allPackages) {
    if (p.name !== pkg.name) {
      for (const node of p.exports) {
        if (isPublic(node)) {
          typeToPackage.set(node.name, p.name);
        }
      }
    }
  }

  // Create collector
  const collector = new TypeReferenceCollector(
    localTypes,
    typeToPackage,
    pkg.name,
    baseUrl,
  );

  // Header
  lines.push(`# @probitas/${pkg.name}`);
  lines.push("");
  lines.push(`> Version: ${pkg.version}`);
  lines.push("");

  // Module documentation
  if (pkg.moduleDoc) {
    lines.push(pkg.moduleDoc);
    lines.push("");
  }

  // Filter and deduplicate exports
  const publicExports = deduplicateByName(pkg.exports.filter(isPublic));
  const overloadGroups = groupByName(pkg.exports.filter(isPublic));

  // Group by kind
  const classes = publicExports.filter((n) => n.kind === "class");
  const interfaces = publicExports.filter((n) => n.kind === "interface");
  const functions = publicExports.filter((n) => n.kind === "function");
  const types = publicExports.filter((n) => n.kind === "typeAlias");
  const variables = publicExports.filter((n) => n.kind === "variable");

  // Classes
  if (classes.length > 0) {
    lines.push("## Classes");
    lines.push("");
    for (const node of classes) {
      if (node.classDef) {
        lines.push(generateClassMarkdown(node, node.classDef, collector));
        lines.push("---");
        lines.push("");
      }
    }
  }

  // Interfaces
  if (interfaces.length > 0) {
    lines.push("## Interfaces");
    lines.push("");
    for (const node of interfaces) {
      if (node.interfaceDef) {
        lines.push(
          generateInterfaceMarkdown(node, node.interfaceDef, collector),
        );
        lines.push("---");
        lines.push("");
      }
    }
  }

  // Functions
  if (functions.length > 0) {
    lines.push("## Functions");
    lines.push("");
    for (const node of functions) {
      if (node.functionDef) {
        // Check for overloads
        const overloads = overloadGroups.get(`function:${node.name}`);
        if (overloads && overloads.length > 1) {
          lines.push(`### \`${node.name}\` (${overloads.length} overloads)`);
          lines.push("");
          for (let i = 0; i < overloads.length; i++) {
            const overload = overloads[i];
            if (overload.functionDef) {
              lines.push(`**Overload ${i + 1}:**`);
              lines.push("");
              lines.push("```typescript");
              lines.push(
                formatFunctionSignature(node.name, overload.functionDef),
              );
              lines.push("```");
              lines.push("");

              collector.extractFromTypeParams(overload.functionDef.typeParams);
              overload.functionDef.params.forEach((p) =>
                collector.extractFrom(p.tsType)
              );
              collector.extractFrom(overload.functionDef.returnType);

              const desc = getDescription(overload);
              if (desc) {
                lines.push(desc);
                lines.push("");
              }
            }
          }
          lines.push("---");
          lines.push("");
        } else {
          lines.push(
            generateFunctionMarkdown(node, node.functionDef, collector),
          );
          lines.push("---");
          lines.push("");
        }
      }
    }
  }

  // Types
  if (types.length > 0) {
    lines.push("## Types");
    lines.push("");
    for (const node of types) {
      if (node.typeAliasDef) {
        lines.push(
          generateTypeAliasMarkdown(node, node.typeAliasDef, collector),
        );
        lines.push("---");
        lines.push("");
      }
    }
  }

  // Variables
  if (variables.length > 0) {
    lines.push("## Variables");
    lines.push("");
    for (const node of variables) {
      lines.push(generateVariableMarkdown(node, collector));
      lines.push("---");
      lines.push("");
    }
  }

  // Related Links section
  const links = collector.getLinks();
  if (links.length > 0) {
    lines.push("## Related Links");
    lines.push("");

    const localLinks = links.filter((l) => l.isLocal);
    const crossPkgLinks = links.filter((l) => l.isCrossPackage);
    const builtinLinks = links.filter((l) => l.isBuiltin);

    if (localLinks.length > 0) {
      lines.push("### This Package");
      lines.push("");
      for (const link of localLinks) {
        lines.push(`- [\`${link.name}\`](${link.href})`);
      }
      lines.push("");
    }

    if (crossPkgLinks.length > 0) {
      lines.push("### Other Packages");
      lines.push("");
      for (const link of crossPkgLinks) {
        const pkg = typeToPackage.get(link.name);
        lines.push(`- [\`${link.name}\`](${link.href}) (@probitas/${pkg})`);
      }
      lines.push("");
    }

    if (builtinLinks.length > 0) {
      lines.push("### Built-in Types");
      lines.push("");
      for (const link of builtinLinks) {
        lines.push(`- [\`${link.name}\`](${link.href})`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
