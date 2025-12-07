/**
 * API documentation components
 */
import type { Child } from "hono/jsx";
import type {
  ClassDef,
  DocNode,
  FunctionDef,
  InterfaceDef,
  MethodDef,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
  TypeAliasDef,
} from "../../lib/api-docs.ts";
import {
  formatType,
  formatTypeParams,
  getDescription,
  getExamples,
  getParamDocs,
  getReturnDoc,
} from "../../lib/api-docs.ts";
import { parseMarkdown } from "../../lib/markdown.ts";
import {
  formatClassSignature,
  formatConstructorSignature,
  formatFunctionSignature,
  formatInterfaceSignature,
  formatMethodSignature,
  formatTypeAliasSignature,
} from "../../lib/signature-formatters.ts";
import {
  extractTypeParamRefs,
  extractTypeRefs,
} from "../../lib/type-references.ts";

// ============================================================================
// Type Display Components (with linking)
// ============================================================================

interface TypeLinkContext {
  /** Set of local type names that should link to anchors on this page */
  localTypes?: Set<string>;
  /** Map from type name to package name for cross-package linking */
  typeToPackage?: Map<string, string>;
  /** Current package name (to avoid linking to self) */
  currentPackage?: string;
}

interface TypeDisplayProps extends TypeLinkContext {
  type?: TsTypeDef;
}

export function TypeDisplay(
  { type, localTypes, typeToPackage, currentPackage }: TypeDisplayProps,
) {
  if (!type) return <span class="type-unknown">unknown</span>;
  const ctx: TypeLinkContext = { localTypes, typeToPackage, currentPackage };
  return <code class="type-code">{renderType(type, ctx)}</code>;
}

/**
 * Render a type definition as JSX with links
 */
function renderType(type: TsTypeDef | undefined, ctx: TypeLinkContext): Child {
  if (!type) return "unknown";

  switch (type.kind) {
    case "keyword":
      return renderTypeName(type.keyword ?? type.repr, ctx);

    case "typeRef": {
      if (!type.typeRef) return type.repr;
      const typeName = type.typeRef.typeName;
      const params = type.typeRef.typeParams;

      if (params && params.length > 0) {
        return (
          <>
            {renderTypeName(typeName, ctx)}
            {"<"}
            {params.map((p, i) => (
              <>
                {i > 0 && ", "}
                {renderType(p, ctx)}
              </>
            ))}
            {">"}
          </>
        );
      }
      return renderTypeName(typeName, ctx);
    }

    case "array":
      return (
        <>
          {renderType(type.array!, ctx)}
          {"[]"}
        </>
      );

    case "union":
      return (
        <>
          {type.union?.map((t, i) => (
            <>
              {i > 0 && " | "}
              {renderType(t, ctx)}
            </>
          ))}
        </>
      );

    case "intersection":
      return (
        <>
          {type.intersection?.map((t, i) => (
            <>
              {i > 0 && " & "}
              {renderType(t, ctx)}
            </>
          ))}
        </>
      );

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
      return (
        <>
          {"["}
          {type.tuple?.map((t, i) => (
            <>
              {i > 0 && ", "}
              {renderType(t, ctx)}
            </>
          ))}
          {"]"}
        </>
      );

    case "fnOrConstructor": {
      const fn = type.fnOrConstructor;
      if (!fn) return type.repr;
      return (
        <>
          {"("}
          {fn.params.map((p, i) => (
            <>
              {i > 0 && ", "}
              {p.name ?? "_"}: {renderType(p.tsType, ctx)}
            </>
          ))}
          {") => "}
          {renderType(fn.returnType, ctx)}
        </>
      );
    }

    case "typeOperator": {
      const op = type.typeOperator;
      if (!op) return type.repr;
      return (
        <>
          {op.operator} {renderType(op.tsType, ctx)}
        </>
      );
    }

    case "typeLiteral": {
      const lit = type.typeLiteral;
      if (!lit) return type.repr;
      return (
        <>
          {"{ "}
          {lit.properties.map((p, i) => (
            <>
              {i > 0 && "; "}
              {p.name}
              {p.optional && "?"}
              {": "}
              {renderType(p.tsType, ctx)}
            </>
          ))}
          {" }"}
        </>
      );
    }

    default:
      return type.repr || "unknown";
  }
}

/**
 * Render a type name with appropriate link
 *
 * Link priority:
 * 1. Local types (defined in current package) - same-page anchor
 * 2. Cross-package types (defined in other packages) - link to that package
 * 3. Built-in types and unknown types - no link (user prefers no external links)
 */
function renderTypeName(name: string, ctx: TypeLinkContext): Child {
  const { localTypes, typeToPackage, currentPackage } = ctx;

  // Check for local type (defined in this package - same-page anchor)
  if (localTypes?.has(name)) {
    return (
      <a href={`#${name}`} class="type-link type-link-local">
        {name}
      </a>
    );
  }

  // Check for cross-package type
  if (typeToPackage?.has(name)) {
    const targetPackage = typeToPackage.get(name)!;
    // Don't link to self (already handled by localTypes)
    if (targetPackage !== currentPackage) {
      return (
        <a
          href={`/api/${targetPackage}#${name}`}
          class="type-link type-link-cross-package"
        >
          {name}
        </a>
      );
    }
  }

  // Built-in types and unknown types - no link
  return name;
}

// ============================================================================
// Type Reference Linking
// ============================================================================

/**
 * Filter type refs to only linkable ones (local or cross-package)
 */
interface LinkableType {
  name: string;
  href: string;
  isCrossPackage: boolean;
}

function getLinkableTypes(
  refs: Set<string>,
  localTypes: Set<string> | undefined,
  typeToPackage: Map<string, string> | undefined,
  currentPackage: string | undefined,
): LinkableType[] {
  const result: LinkableType[] = [];

  for (const name of refs) {
    // Local type
    if (localTypes?.has(name)) {
      result.push({
        name,
        href: `#${name}`,
        isCrossPackage: false,
      });
      continue;
    }

    // Cross-package type
    if (typeToPackage?.has(name)) {
      const targetPackage = typeToPackage.get(name)!;
      if (targetPackage !== currentPackage) {
        result.push({
          name,
          href: `/api/${targetPackage}#${name}`,
          isCrossPackage: true,
        });
      }
    }
  }

  // Sort alphabetically
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Related Types section component
 */
interface RelatedTypesProps extends TypeLinkContext {
  /** All type refs extracted from the signature */
  typeRefs: Set<string>;
}

function RelatedTypes(
  { typeRefs, localTypes, typeToPackage, currentPackage }: RelatedTypesProps,
) {
  const linkable = getLinkableTypes(
    typeRefs,
    localTypes,
    typeToPackage,
    currentPackage,
  );

  if (linkable.length === 0) return null;

  return (
    <div class="api-related-types">
      <h5>
        <i class="ti ti-link" /> Links
      </h5>
      <ul class="related-types-list">
        {linkable.map((t) => (
          <li key={t.name}>
            <a
              href={t.href}
              class={`type-link ${
                t.isCrossPackage ? "type-link-cross-package" : "type-link-local"
              }`}
            >
              {t.name}
            </a>
            {t.isCrossPackage && (
              <span class="related-type-package">
                {typeToPackage?.get(t.name)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TypeParamsDisplayProps {
  typeParams: TsTypeParamDef[];
}

export function TypeParamsDisplay({ typeParams }: TypeParamsDisplayProps) {
  if (typeParams.length === 0) return null;
  return <span class="type-params">{formatTypeParams(typeParams)}</span>;
}

// ============================================================================
// Parameter Display
// ============================================================================

interface ParamListProps extends TypeLinkContext {
  params: ParamDef[];
  paramDocs?: Map<string, string>;
}

export function ParamList(
  { params, paramDocs, localTypes, typeToPackage, currentPackage }:
    ParamListProps,
) {
  if (params.length === 0) return null;

  return (
    <div class="api-params">
      <h5>Parameters</h5>
      <ul class="param-list">
        {params.map((param) => {
          const name = param.name ?? "_";
          const doc = paramDocs?.get(name);
          return (
            <li key={name} class="param-item">
              <div class="param-header">
                <code class="param-name">
                  {name}
                  {param.optional && <span class="param-optional">?</span>}
                </code>
                <span class="param-type">
                  <TypeDisplay
                    type={param.tsType}
                    localTypes={localTypes}
                    typeToPackage={typeToPackage}
                    currentPackage={currentPackage}
                  />
                </span>
              </div>
              {doc && (
                <div
                  class="param-desc api-markdown"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(doc) }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================================================
// JSDoc Display
// ============================================================================

interface DescriptionProps {
  text?: string;
}

export function Description({ text }: DescriptionProps) {
  if (!text) return null;
  // Parse as Markdown for rich formatting
  const html = parseMarkdown(text);
  return (
    <div
      class="api-description api-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface ExamplesProps {
  examples: string[];
}

export function Examples({ examples }: ExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <div class="api-examples">
      <h5>Examples</h5>
      {examples.map((example, i) => {
        const trimmed = example.trim();
        // Always parse as markdown - examples may contain description text
        // followed by code blocks (e.g., "Basic usage\n```ts\n...")
        const html = parseMarkdown(trimmed);
        return (
          <div
            key={i}
            class="example-markdown"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Function Documentation
// ============================================================================

interface FunctionDocProps extends TypeLinkContext {
  node: DocNode;
  def: FunctionDef;
  /** All overloads of this function (including the main one) */
  overloads?: DocNode[];
}

export function FunctionDoc(
  { node, def, overloads, localTypes, typeToPackage, currentPackage }:
    FunctionDocProps,
) {
  const description = getDescription(node);
  const examples = getExamples(node);
  const paramDocs = getParamDocs(node);
  const returnDoc = getReturnDoc(node);

  const hasOverloads = overloads && overloads.length > 1;

  return (
    <div class="api-item api-function" id={node.name}>
      <div class="api-item-header">
        <span class="api-kind">function</span>
        <h4>
          <a href={`#${node.name}`} class="anchor-link">#</a>
          {node.name}
          {hasOverloads && (
            <span class="overload-count">({overloads.length} overloads)</span>
          )}
        </h4>
      </div>

      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {formatFunctionSignature(node.name, def)}
          </code>
        </pre>
      </div>

      <Description text={description} />

      <ParamList
        params={def.params}
        paramDocs={paramDocs}
        localTypes={localTypes}
        typeToPackage={typeToPackage}
        currentPackage={currentPackage}
      />

      {returnDoc && (
        <div class="api-returns">
          <h5>Returns</h5>
          <p>
            <TypeDisplay
              type={def.returnType}
              localTypes={localTypes}
              typeToPackage={typeToPackage}
              currentPackage={currentPackage}
            />{" "}
            — {returnDoc}
          </p>
        </div>
      )}

      <Examples examples={examples} />

      {/* Additional overloads */}
      {hasOverloads && (
        <details class="api-overloads">
          <summary>
            <i class="ti ti-chevron-right" />
            Show all {overloads.length} overloads
          </summary>
          <div class="overloads-content">
            {overloads.map((overloadNode, index) => {
              const overloadDef = overloadNode.functionDef;
              if (!overloadDef) return null;
              return (
                <FunctionOverloadItem
                  key={index}
                  index={index + 1}
                  node={overloadNode}
                  def={overloadDef}
                  localTypes={localTypes}
                  typeToPackage={typeToPackage}
                  currentPackage={currentPackage}
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

interface FunctionOverloadItemProps extends TypeLinkContext {
  index: number;
  node: DocNode;
  def: FunctionDef;
}

function FunctionOverloadItem(
  { index, node, def, localTypes, typeToPackage, currentPackage }:
    FunctionOverloadItemProps,
) {
  const description = getDescription(node);
  const paramDocs = getParamDocs(node);
  const returnDoc = getReturnDoc(node);

  return (
    <div class="overload-item">
      <div class="overload-header">
        <span class="overload-index">#{index}</span>
      </div>
      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {formatFunctionSignature(node.name, def)}
          </code>
        </pre>
      </div>
      {description && <Description text={description} />}
      <ParamList
        params={def.params}
        paramDocs={paramDocs}
        localTypes={localTypes}
        typeToPackage={typeToPackage}
        currentPackage={currentPackage}
      />
      {returnDoc && (
        <div class="api-returns">
          <h5>Returns</h5>
          <p>
            <TypeDisplay
              type={def.returnType}
              localTypes={localTypes}
              typeToPackage={typeToPackage}
              currentPackage={currentPackage}
            />{" "}
            — {returnDoc}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Class Documentation
// ============================================================================

interface ClassDocProps extends TypeLinkContext {
  node: DocNode;
  def: ClassDef;
}

export function ClassDoc(
  { node, def, localTypes, typeToPackage, currentPackage }: ClassDocProps,
) {
  const description = getDescription(node);
  const examples = getExamples(node);

  // Filter public members
  const publicMethods = def.methods.filter((m) =>
    m.accessibility !== "private" && !m.name.startsWith("_")
  );
  const publicProps = def.properties.filter((p) =>
    p.accessibility !== "private" && !p.name.startsWith("_")
  );

  return (
    <div class="api-item api-class" id={node.name}>
      <div class="api-item-header">
        <span class="api-kind">class</span>
        <h4>
          <a href={`#${node.name}`} class="anchor-link">#</a>
          {node.name}
        </h4>
      </div>

      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {formatClassSignature(node.name, def)}
          </code>
        </pre>
      </div>

      <Description text={description} />
      <Examples examples={examples} />

      {/* Constructor */}
      {def.constructors.length > 0 && (
        <div class="api-constructor">
          <h5>Constructor</h5>
          {def.constructors.map((ctor, i) => (
            <div key={i} class="constructor-signature api-signature">
              <pre>
                <code class="language-typescript">
                  {formatConstructorSignature(node.name, ctor.params)}
                </code>
              </pre>
              {ctor.jsDoc?.doc && (
                <div
                  class="constructor-desc api-markdown"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(ctor.jsDoc.doc),
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Properties */}
      {publicProps.length > 0 && (
        <div class="api-properties">
          <h5>Properties</h5>
          <ul class="property-list">
            {publicProps.map((prop) => {
              const desc = getDescription(prop);
              return (
                <li key={prop.name} class="property-item">
                  <div class="property-header">
                    {prop.isStatic && (
                      <span class="member-badge member-static">static</span>
                    )}
                    {prop.readonly && (
                      <span class="member-badge member-readonly">readonly</span>
                    )}
                    <code class="property-name">
                      {prop.name}
                      {prop.optional && <span class="param-optional">?</span>}
                    </code>
                    <span class="property-type">
                      <TypeDisplay
                        type={prop.tsType}
                        localTypes={localTypes}
                        typeToPackage={typeToPackage}
                        currentPackage={currentPackage}
                      />
                    </span>
                  </div>
                  {desc && (
                    <div
                      class="property-desc api-markdown"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(desc) }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Methods */}
      {publicMethods.length > 0 && (
        <div class="api-methods">
          <h5>Methods</h5>
          {publicMethods.map((method) => (
            <MethodDisplay
              key={method.name}
              method={method}
              localTypes={localTypes}
              typeToPackage={typeToPackage}
              currentPackage={currentPackage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MethodDisplayProps extends TypeLinkContext {
  method: MethodDef;
}

function MethodDisplay(
  { method, localTypes, typeToPackage, currentPackage }: MethodDisplayProps,
) {
  const paramDocs = method.jsDoc?.tags
    ?.filter((t) => t.kind === "param")
    .reduce((acc, t) => {
      if (t.name && t.doc) acc.set(t.name, t.doc);
      return acc;
    }, new Map<string, string>());

  return (
    <div class="method-item">
      <div class="method-signature api-signature">
        <pre>
          <code class="language-typescript">
            {formatMethodSignature(method)}
          </code>
        </pre>
      </div>
      {method.jsDoc?.doc && (
        <div
          class="method-desc api-markdown"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(method.jsDoc.doc) }}
        />
      )}
      {method.params && method.params.length > 0 && (
        <ParamList
          params={method.params}
          paramDocs={paramDocs}
          localTypes={localTypes}
          typeToPackage={typeToPackage}
          currentPackage={currentPackage}
        />
      )}
    </div>
  );
}

// ============================================================================
// Interface Documentation
// ============================================================================

interface InterfaceDocProps extends TypeLinkContext {
  node: DocNode;
  def: InterfaceDef;
}

export function InterfaceDoc(
  { node, def, localTypes, typeToPackage, currentPackage }: InterfaceDocProps,
) {
  const description = getDescription(node);
  const examples = getExamples(node);

  return (
    <div class="api-item api-interface" id={node.name}>
      <div class="api-item-header">
        <span class="api-kind">interface</span>
        <h4>
          <a href={`#${node.name}`} class="anchor-link">#</a>
          {node.name}
        </h4>
      </div>

      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {formatInterfaceSignature(node.name, def)}
          </code>
        </pre>
      </div>

      <Description text={description} />
      <Examples examples={examples} />

      {/* Properties */}
      {def.properties.length > 0 && (
        <div class="api-properties">
          <h5>Properties</h5>
          <ul class="property-list">
            {def.properties.map((prop) => {
              const desc = getDescription(prop);
              return (
                <li key={prop.name} class="property-item">
                  <div class="property-header">
                    {prop.readonly && (
                      <span class="member-badge member-readonly">readonly</span>
                    )}
                    <code class="property-name">
                      {prop.name}
                      {prop.optional && <span class="param-optional">?</span>}
                    </code>
                    <span class="property-type">
                      <TypeDisplay
                        type={prop.tsType}
                        localTypes={localTypes}
                        typeToPackage={typeToPackage}
                        currentPackage={currentPackage}
                      />
                    </span>
                  </div>
                  {desc && (
                    <div
                      class="property-desc api-markdown"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(desc) }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Methods */}
      {def.methods.length > 0 && (
        <div class="api-methods">
          <h5>Methods</h5>
          {def.methods.map((method) => (
            <MethodDisplay
              key={method.name}
              method={method}
              localTypes={localTypes}
              typeToPackage={typeToPackage}
              currentPackage={currentPackage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Type Alias Documentation
// ============================================================================

interface TypeAliasDocProps extends TypeLinkContext {
  node: DocNode;
  def: TypeAliasDef;
}

export function TypeAliasDoc(
  { node, def, localTypes, typeToPackage, currentPackage }: TypeAliasDocProps,
) {
  const description = getDescription(node);

  // Collect all type refs from the type alias
  const typeRefs = new Set<string>();
  for (const ref of extractTypeRefs(def.tsType)) {
    typeRefs.add(ref);
  }
  for (const ref of extractTypeParamRefs(def.typeParams)) {
    typeRefs.add(ref);
  }

  return (
    <div class="api-item api-type-alias" id={node.name}>
      <div class="api-item-header">
        <span class="api-kind">type</span>
        <h4>
          <a href={`#${node.name}`} class="anchor-link">#</a>
          {node.name}
        </h4>
      </div>

      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {formatTypeAliasSignature(node.name, def)}
          </code>
        </pre>
      </div>

      <Description text={description} />

      <RelatedTypes
        typeRefs={typeRefs}
        localTypes={localTypes}
        typeToPackage={typeToPackage}
        currentPackage={currentPackage}
      />
    </div>
  );
}

// ============================================================================
// Variable Documentation
// ============================================================================

interface VariableDocProps extends TypeLinkContext {
  node: DocNode;
}

export function VariableDoc(
  { node, localTypes, typeToPackage, currentPackage }: VariableDocProps,
) {
  const description = getDescription(node);
  const def = node.variableDef;
  const kind = def?.kind ?? "const";

  // Collect type refs from the variable type
  const typeRefs = extractTypeRefs(def?.tsType);

  return (
    <div class="api-item api-variable" id={node.name}>
      <div class="api-item-header">
        <span class="api-kind">{kind}</span>
        <h4>
          <a href={`#${node.name}`} class="anchor-link">#</a>
          {node.name}
        </h4>
      </div>

      <div class="api-signature">
        <pre>
          <code class="language-typescript">
            {`${kind} ${node.name}: ${formatType(def?.tsType)}`}
          </code>
        </pre>
      </div>

      <Description text={description} />

      <RelatedTypes
        typeRefs={typeRefs}
        localTypes={localTypes}
        typeToPackage={typeToPackage}
        currentPackage={currentPackage}
      />
    </div>
  );
}

// ============================================================================
// Generic Doc Node Renderer
// ============================================================================

interface DocNodeRendererProps extends TypeLinkContext {
  node: DocNode;
  /** All overloads for this node (used for functions) */
  overloads?: DocNode[];
}

export function DocNodeRenderer(
  { node, overloads, localTypes, typeToPackage, currentPackage }:
    DocNodeRendererProps,
) {
  const ctx = { localTypes, typeToPackage, currentPackage };

  switch (node.kind) {
    case "function":
      if (node.functionDef) {
        return (
          <FunctionDoc
            node={node}
            def={node.functionDef}
            overloads={overloads}
            {...ctx}
          />
        );
      }
      break;
    case "class":
      if (node.classDef) {
        return <ClassDoc node={node} def={node.classDef} {...ctx} />;
      }
      break;
    case "interface":
      if (node.interfaceDef) {
        return <InterfaceDoc node={node} def={node.interfaceDef} {...ctx} />;
      }
      break;
    case "typeAlias":
      if (node.typeAliasDef) {
        return <TypeAliasDoc node={node} def={node.typeAliasDef} {...ctx} />;
      }
      break;
    case "variable":
      return <VariableDoc node={node} {...ctx} />;
    default:
      // Skip unsupported types
      return null;
  }
  return null;
}

// ============================================================================
// TOC for API items
// ============================================================================

interface ApiTocProps {
  nodes: DocNode[];
}

export function ApiToc({ nodes }: ApiTocProps) {
  // Group by kind
  const functions = nodes.filter((n) => n.kind === "function");
  const classes = nodes.filter((n) => n.kind === "class");
  const interfaces = nodes.filter((n) => n.kind === "interface");
  const types = nodes.filter((n) => n.kind === "typeAlias");
  const variables = nodes.filter((n) => n.kind === "variable");

  return (
    <nav class="scrollable-nav api-toc">
      <h3>On this page</h3>
      {classes.length > 0 && (
        <TocGroup title="Classes" icon="ti-box" items={classes} />
      )}
      {interfaces.length > 0 && (
        <TocGroup title="Interfaces" icon="ti-puzzle" items={interfaces} />
      )}
      {functions.length > 0 && (
        <TocGroup title="Functions" icon="ti-code" items={functions} />
      )}
      {types.length > 0 && (
        <TocGroup title="Types" icon="ti-tag" items={types} />
      )}
      {variables.length > 0 && (
        <TocGroup title="Variables" icon="ti-variable" items={variables} />
      )}
    </nav>
  );
}

interface TocGroupProps {
  title: string;
  icon: string;
  items: DocNode[];
}

function TocGroup({ title, icon, items }: TocGroupProps) {
  return (
    <div class="toc-group">
      <h4>
        <i class={`ti ${icon}`} /> {title}
      </h4>
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            <a href={`#${item.name}`}>{item.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Package Sidebar
// ============================================================================

interface PackageSidebarProps {
  groups: Array<{ name: string; packages: Array<{ name: string }> }>;
  currentPackage?: string;
}

export function PackageSidebar(
  { groups, currentPackage }: PackageSidebarProps,
) {
  return (
    <>
      {/* Mobile: Package selector dropdown */}
      <div class="api-package-select-wrapper">
        <i class="ti ti-package" />
        <select
          class="api-package-select"
          onchange="location.href = '/api/' + this.value"
          aria-label="Select package"
        >
          <option value="" disabled selected={!currentPackage}>
            Select a package...
          </option>
          {groups.map((group) => (
            <optgroup key={group.name} label={group.name}>
              {group.packages.map((pkg) => (
                <option
                  key={pkg.name}
                  value={pkg.name}
                  selected={pkg.name === currentPackage}
                >
                  @probitas/{pkg.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <i class="ti ti-chevron-down" />
      </div>

      {/* Desktop: Full navigation */}
      <nav class="scrollable-nav api-package-nav">
        <h3>Packages</h3>
        {groups.map((group) => (
          <div key={group.name} class="package-group">
            <h4>{group.name}</h4>
            <ul>
              {group.packages.map((pkg) => (
                <li
                  key={pkg.name}
                  class={pkg.name === currentPackage ? "active" : ""}
                >
                  <a href={`/api/${pkg.name}`}>{pkg.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
