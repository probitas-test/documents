/**
 * Type reference extraction utilities for API documentation
 *
 * These utilities recursively extract type names from TypeScript
 * type definitions for building cross-reference links.
 */
import type {
  ClassDef,
  FunctionDef,
  InterfaceDef,
  MethodDef,
  ParamDef,
  PropertyDef,
  TsTypeDef,
  TsTypeParamDef,
} from "./api-docs.ts";

/**
 * Extract all type names referenced in a TsTypeDef (recursively)
 */
export function extractTypeRefs(type: TsTypeDef | undefined): Set<string> {
  const refs = new Set<string>();
  if (!type) return refs;

  function walk(t: TsTypeDef) {
    switch (t.kind) {
      case "typeRef":
        if (t.typeRef?.typeName) {
          refs.add(t.typeRef.typeName);
          t.typeRef.typeParams?.forEach(walk);
        }
        break;
      case "array":
        if (t.array) walk(t.array);
        break;
      case "union":
        t.union?.forEach(walk);
        break;
      case "intersection":
        t.intersection?.forEach(walk);
        break;
      case "tuple":
        t.tuple?.forEach(walk);
        break;
      case "fnOrConstructor":
        if (t.fnOrConstructor) {
          t.fnOrConstructor.params.forEach((p) => {
            if (p.tsType) walk(p.tsType);
          });
          if (t.fnOrConstructor.returnType) walk(t.fnOrConstructor.returnType);
        }
        break;
      case "typeOperator":
        if (t.typeOperator?.tsType) walk(t.typeOperator.tsType);
        break;
      case "typeLiteral":
        if (t.typeLiteral) {
          t.typeLiteral.properties.forEach((p) => {
            if (p.tsType) walk(p.tsType);
          });
          t.typeLiteral.methods.forEach((m) => {
            m.params.forEach((p) => {
              if (p.tsType) walk(p.tsType);
            });
            if (m.returnType) walk(m.returnType);
          });
        }
        break;
    }
  }

  walk(type);
  return refs;
}

/**
 * Extract type refs from type parameters (constraints and defaults)
 */
export function extractTypeParamRefs(
  typeParams: TsTypeParamDef[] | undefined,
): Set<string> {
  const refs = new Set<string>();
  if (!typeParams) return refs;

  for (const p of typeParams) {
    if (p.constraint) {
      for (const ref of extractTypeRefs(p.constraint)) {
        refs.add(ref);
      }
    }
    if (p.default) {
      for (const ref of extractTypeRefs(p.default)) {
        refs.add(ref);
      }
    }
  }
  return refs;
}

/**
 * Extract type refs from an array of parameters
 */
export function extractParamRefs(params: ParamDef[] | undefined): Set<string> {
  const refs = new Set<string>();
  if (!params) return refs;

  for (const p of params) {
    if (p.tsType) {
      for (const ref of extractTypeRefs(p.tsType)) {
        refs.add(ref);
      }
    }
  }
  return refs;
}

/**
 * Extract type refs from an array of properties
 */
export function extractPropertyRefs(
  properties: PropertyDef[] | undefined,
): Set<string> {
  const refs = new Set<string>();
  if (!properties) return refs;

  for (const p of properties) {
    if (p.tsType) {
      for (const ref of extractTypeRefs(p.tsType)) {
        refs.add(ref);
      }
    }
  }
  return refs;
}

/**
 * Extract type refs from an array of methods
 */
export function extractMethodRefs(
  methods: MethodDef[] | undefined,
): Set<string> {
  const refs = new Set<string>();
  if (!methods) return refs;

  for (const m of methods) {
    // Type parameters
    for (const ref of extractTypeParamRefs(m.typeParams)) {
      refs.add(ref);
    }
    // Parameters
    for (const ref of extractParamRefs(m.params)) {
      refs.add(ref);
    }
    // Return type
    if (m.returnType) {
      for (const ref of extractTypeRefs(m.returnType)) {
        refs.add(ref);
      }
    }
  }
  return refs;
}

/**
 * Extract all type refs from a FunctionDef
 */
export function extractFunctionRefs(def: FunctionDef | undefined): Set<string> {
  const refs = new Set<string>();
  if (!def) return refs;

  // Type parameters (constraints and defaults)
  for (const ref of extractTypeParamRefs(def.typeParams)) {
    refs.add(ref);
  }
  // Parameters
  for (const ref of extractParamRefs(def.params)) {
    refs.add(ref);
  }
  // Return type
  if (def.returnType) {
    for (const ref of extractTypeRefs(def.returnType)) {
      refs.add(ref);
    }
  }
  return refs;
}

/**
 * Extract all type refs from a ClassDef
 */
export function extractClassRefs(def: ClassDef | undefined): Set<string> {
  const refs = new Set<string>();
  if (!def) return refs;

  // Type parameters
  for (const ref of extractTypeParamRefs(def.typeParams)) {
    refs.add(ref);
  }
  // Extends
  if (def.extends) {
    refs.add(def.extends);
  }
  // Super type params
  for (const t of def.superTypeParams ?? []) {
    for (const ref of extractTypeRefs(t)) {
      refs.add(ref);
    }
  }
  // Implements
  for (const t of def.implements ?? []) {
    for (const ref of extractTypeRefs(t)) {
      refs.add(ref);
    }
  }
  // Constructors
  for (const ctor of def.constructors ?? []) {
    for (const ref of extractParamRefs(ctor.params)) {
      refs.add(ref);
    }
  }
  // Properties
  for (const ref of extractPropertyRefs(def.properties)) {
    refs.add(ref);
  }
  // Methods
  for (const ref of extractMethodRefs(def.methods)) {
    refs.add(ref);
  }
  return refs;
}

/**
 * Extract all type refs from an InterfaceDef
 */
export function extractInterfaceRefs(
  def: InterfaceDef | undefined,
): Set<string> {
  const refs = new Set<string>();
  if (!def) return refs;

  // Type parameters
  for (const ref of extractTypeParamRefs(def.typeParams)) {
    refs.add(ref);
  }
  // Extends
  for (const t of def.extends ?? []) {
    for (const ref of extractTypeRefs(t)) {
      refs.add(ref);
    }
  }
  // Properties
  for (const ref of extractPropertyRefs(def.properties)) {
    refs.add(ref);
  }
  // Methods
  for (const ref of extractMethodRefs(def.methods)) {
    refs.add(ref);
  }
  // Call signatures
  for (const sig of def.callSignatures ?? []) {
    for (const ref of extractTypeParamRefs(sig.typeParams)) {
      refs.add(ref);
    }
    for (const ref of extractParamRefs(sig.params)) {
      refs.add(ref);
    }
    if (sig.returnType) {
      for (const ref of extractTypeRefs(sig.returnType)) {
        refs.add(ref);
      }
    }
  }
  // Index signatures
  for (const sig of def.indexSignatures ?? []) {
    for (const ref of extractParamRefs(sig.params)) {
      refs.add(ref);
    }
    if (sig.tsType) {
      for (const ref of extractTypeRefs(sig.tsType)) {
        refs.add(ref);
      }
    }
  }
  return refs;
}
