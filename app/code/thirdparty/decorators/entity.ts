import "reflect-metadata";
import { META } from "../../metadata";
import { CanvasNode } from "../frontend/types";

/**
 * Describes the structure of a single field within an {@link Entity} schema,
 * as stored in reflect metadata by the {@link Field} decorator.
 */
export interface FieldMetadata {
  /** The property key this field metadata was defined on. */
  key: string;
  /** The primitive or constructor type of the field, inferred via `design:type`. */
  type: any;
  /** Whether this field must be present in the JSON payload. Defaults to `true`. */
  required: boolean;
  /** Fallback value used when the field is absent from the JSON payload. */
  default?: any;
  /** marks a field as an index. */
  searchable?: boolean;
  /** use a custom input? */
  module?: CanvasNode;
  /** is this field editable? */
  editable?: boolean
}

/**
 * Class decorator that marks a class as a Codefolio content entity —
 * the high-level schema contract for a JSON content file.
 *
 * Registers the decorated class in the global entity registry under
 * {@link META.entities} so the framework can validate, generate, and
 * document content schemas at bootstrap time.
 *
 * @remarks
 * An entity defines the **shape** of a content JSON file. Pair with the
 * {@link Field} decorator on each property to describe individual fields.
 * The entity name is used as the registry key and should match the content
 * collection it describes.
 *
 * @param name - A unique identifier for this entity (e.g. `"project"`,
 *               `"profile"`). Used as the registry key and in generated
 *               schema documentation.
 *
 * @returns A {@link ClassDecorator} that registers the target class in the
 *          global entity registry.
 *
 * @example
 * ```ts
 * @Entity("project")
 * export class ProjectEntity {
 *   @Field({ required: true })
 *   title: string;
 *
 *   @Field({ required: false, default: "" })
 *   summary: string;
 *
 *   @Field({ required: false })
 *   tags: string[];
 * }
 * ```
 */
export function Entity(name: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(META.entity, name, target);

    const entities = Reflect.getMetadata(META.entities, global) || [];
    entities.push(target);
    Reflect.defineMetadata(META.entities, entities, global);
  };
}

/**
 * Property decorator that registers a class property as a typed field
 * within an {@link Entity} schema.
 *
 * Type information is inferred automatically from TypeScript's
 * `emitDecoratorMetadata` — no need to specify it manually unless you
 * need to override the inferred type.
 *
 * @param options          - Field configuration options.
 * @param options.required - Whether the field is required. Defaults to `true`.
 * @param options.default  - Fallback value when the field is absent.
 *
 * @returns A {@link PropertyDecorator} that appends a {@link FieldMetadata}
 *          entry to the class's reflect metadata.
 *
 * @example
 * ```ts
 * @Entity("profile")
 * export class ProfileEntity {
 *   @Field()
 *   name: string;
 *
 *   @Field({ required: false, default: "A developer" })
 *   bio: string;
 * }
 * ```
 */
export function Field(options: { required?: boolean; default?: any, searchable?: boolean, module?: CanvasNode, editable?: boolean} = {}): PropertyDecorator {
  return (target, key) => {
    const fields: FieldMetadata[] = Reflect.getOwnMetadata(META.fields, target.constructor) || [];

    const type = Reflect.getMetadata("design:type", target, key);

    fields.push({
      key: key.toString(),
      type,
      required: options.required ?? false,
      default: options.default,
      searchable: options.searchable,
      module: options.module,
      editable: options.editable === undefined ? true : options.editable
    });

    Reflect.defineMetadata(META.fields, fields, target.constructor);
  };
}

/**
 * Returns the {@link FieldMetadata} array registered on a given entity class,
 * describing each field's key, type, and validation constraints.
 *
 * @param target - The entity class constructor to inspect.
 * @returns An ordered array of field descriptors, or an empty array if none
 *          are registered.
 *
 * @example
 * ```ts
 * const fields = getEntityFields(ProjectEntity);
 * // [{ key: 'title', type: String, required: true }, ...]
 * ```
 */
export function getEntityFields(target: any): FieldMetadata[] {
  const allFields: FieldMetadata[] = [];
  const visitedKeys = new Set<string>();

  // Ensure we are working with the Constructor (the Class)
  let currentTarget = typeof target === 'function' ? target : target.constructor;

  while (currentTarget && currentTarget !== Object && currentTarget !== Function.prototype) {
    // Read ONLY from this specific class level
    const fields: FieldMetadata[] = Reflect.getOwnMetadata(META.fields, currentTarget) || [];

    for (const field of fields) {
      if (!visitedKeys.has(field.key)) {
        allFields.push(field);
        visitedKeys.add(field.key);
      }
    }
    currentTarget = Object.getPrototypeOf(currentTarget);
  }

  return allFields;
}

/**
 * Returns all classes registered via the {@link Entity} decorator, in
 * registration order.
 *
 * @returns A shallow copy of the global entity registry.
 *
 * @example
 * ```ts
 * const entities = getRegisteredEntities();
 * // [ProjectEntity, ProfileEntity, ...]
 * ```
 */
export function getRegisteredEntities(): any[] {
  return [...(Reflect.getMetadata(META.entities, global) || [])];
}