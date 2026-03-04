import { Field } from "@decorators/entity";

/**
 * Abstract base class for all Codefolio content entities.
 *
 * Every entity that represents a JSON content file should extend `Content`,
 * gaining a consistent set of system-managed fields for identity and
 * auditing. These fields are populated and maintained by {@link ContentService}
 * rather than authored manually.
 *
 * @remarks
 * Because git is the underlying content store, `created` and `updated`
 * can be cross-referenced against the commit history for a full audit trail.
 * The fields here represent the materialised snapshot of that metadata,
 * baked into the JSON file itself for fast access without a git log query.
 *
 * @example
 * ```ts
 * @Entity("project")
 * export class ProjectEntity extends Content {
 *   @Field()
 *   title: string;
 *
 *   @Field({ required: false, default: "" })
 *   summary: string;
 * }
 * ```
 */
export abstract class Content {
  /**
   * Unique numeric identifier for this content item, assigned by
   * {@link ContentService} on creation. `undefined` until the content
   * has been saved for the first time.
   */
  @Field({ searchable: true, editable: false })
  public id: number | undefined;

  /**
   * The git username or identifier of the user who originally created
   * this content item. `undefined` until the content has been saved
   * for the first time.
   */
  @Field({ searchable: true, editable: false })
  public creator: string | undefined;

  /**
   * The timestamp at which this content item was first saved.
   * `undefined` until the content has been saved for the first time.
   */
  @Field({ editable: false })
  public created: Date | undefined;

  /**
   * The timestamp at which this content item was most recently modified.
   * Updated by {@link ContentService} on every successful save.
   */
  @Field({ editable: false })
  public updated: Date | undefined;
}