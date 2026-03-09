import { getEntityFields } from "@decorators/entity";
import { Get } from "@decorators/routes";
import { IncomingMessage, ServerResponse } from "http";
import { CanvasNode } from "../frontend/types";
import { Content } from "./content";
import { ContentController } from "./controller";
import { canvasAsPage } from "../utils";

/**
 * Abstract base controller that provides auto-generated admin UI pages
 * for CRUD operations on a content entity. Extend this class to get
 * list, edit, and add pages wired up automatically via entity field metadata.
 *
 * @typeParam T - The {@link Content} entity type this controller manages.
 */
export abstract class AdminController<T extends Content> extends ContentController<T> {

    /**
     * Maps a TypeScript constructor type to its corresponding UI input type.
     *
     * @param type - The field's runtime type (e.g. `Number`, `String`).
     * @returns The UI input type string: `"number"`, `"select"`, or `"text"` as the default fallback.
     */
    protected mapTypeToUi(type: any): "text" | "number" | "select" {
        if (type === Number) return "number";
        return "text";
    }

    /**
     * Returns the subset of entity fields that are marked as searchable,
     * formatted for use in table/list views. The `id` field is always
     * sorted to the front.
     *
     * @returns An array of formatted field descriptors filtered to searchable fields.
     */
    protected getSearchableFields() {
        const entity = this.getTargetEntity();
        return getEntityFields(entity)
            .filter(f => f.searchable)
            .map(f => this.formatField(f))
            .sort((a, b) => a.key == 'id' ? -1 : 0);
    }

    /**
     * Returns the subset of entity fields that are marked as editable,
     * formatted for use in add/edit forms. Fields with `editable: false`
     * are excluded; all others are included by default.
     *
     * @returns An array of formatted field descriptors filtered to editable fields.
     */
    protected getEditableFields() {
        const entity = this.getTargetEntity();
        return getEntityFields(entity)
            .filter(f => f.editable !== false)
            .map(f => this.formatField(f));
    }

    /**
     * Normalizes a raw entity field descriptor into the shape expected by UI components.
     * The label is derived by capitalizing the first character of the field key.
     *
     * @param f - The raw field metadata object from {@link getEntityFields}.
     * @returns A formatted field descriptor with `key`, `label`, `type`, `required`, `default`, and `module`.
     */
    private formatField(f: any) {
        return {
            key: f.key,
            label: f.key.charAt(0).toUpperCase() + f.key.slice(1),
            type: this.mapTypeToUi(f.type),
            required: f.required,
            default: f.default,
            module: f.module
        };
    }

    /**
     * Renders a form for creating or editing an entity instance.
     *
     * Each field is rendered as either a `<ui-Canvas>` (if the field has an associated
     * module) or a `<ui-Input>`. Fields with a `module` have their `data.name` set to
     * the field key before rendering.
     *
     * @param endpoint - The API endpoint the form submits to.
     * @param method   - The HTTP method for the form submission.
     * @param title    - The heading rendered above the form.
     * @param fields   - The list of formatted field descriptors to render as inputs.
     * @param submitLabel - The label shown on the submit button.
     * @returns A {@link CanvasNode} rendering a `<ui-Section>` containing the form.
     */
    private renderEntityForm(
        endpoint: string,
        method: string,
        title: string,
        fields: ReturnType<typeof this.getEditableFields>,
        submitLabel: string
    ): CanvasNode {
        return canvasAsPage(
            <ui-Section className='autoform'>
                <div className='form-title'>{title}</div>
                <ui-Form endpoint={endpoint} method={method} isAutoForm={true}>
                    {fields.map(field => {
                        if (field.module) {
                            field.module.data.name = field.key;
                            field.module.data.value = (field as any).value || field.default;
                            field.module.data.defaultValue = (field as any).value || field.default;
                            return <ui-Canvas>{field.module}</ui-Canvas>;
                        }

                        return (
                            <ui-Input
                                name={field.key}
                                label={field.label}
                                type={field.type}
                                required={field.required}
                                defaultValue={(field as any).value || field.default}
                            />
                        );
                    })}
                    <ui-Button type="submit">{submitLabel}</ui-Button>
                </ui-Form>
            </ui-Section>,
            {
                pageTitle: title
            }
        );
    }

    /**
     * Renders the list/search page for this entity collection.
     * Responds to `GET /<collection>/page.json`.
     *
     * @returns A {@link CanvasNode} rendering an `<ui-AutoList>` populated with
     * the collection's API URL and searchable field definitions.
     */
    @Get("page.json")
    public async listPage(): Promise<CanvasNode> {
        return canvasAsPage(
            <ui-AutoList
                apiUrl={'/api/' + this.getCollectionName()}
                listUrl={'/en-admin/' + this.getCollectionName()}
                searchFields={this.getSearchableFields()}
                columns={this.getSearchableFields()}
            />, 
            {
                pageTitle: `View all ${this.getTargetEntity().name}`
            }
        );
    }

    /**
     * Renders the edit form for an existing entity by ID.
     * Responds to `GET /<collection>/:id/page.json`.
     *
     * @param req       - The incoming HTTP request.
     * @param res       - The HTTP server response.
     * @param currentId - The numeric ID of the entity to edit, extracted from the route parameter.
     * @returns A {@link CanvasNode} rendering a form POSTing to `/api/<collection>/<currentId>`.
     */
    @Get("/:id/page.json")
    public async editPage(req: IncomingMessage, res: ServerResponse, currentId: number): Promise<CanvasNode> {
        const entity = await this.service.load(currentId);
        const fields = this.getEditableFields().map(f => ({
            ...f,
            value: (entity as any)?.[f.key]
        }));

        return this.renderEntityForm(
            `/api/${this.getCollectionName()}/${currentId}`,
            "PATCH",
            `Edit ${this.getTargetEntity().name}`,
            fields,
            "Save Changes"
        );
    }

    /**
     * Renders the creation form for a new entity instance.
     * Responds to `GET /<collection>/add/page.json`.
     *
     * System-managed fields (`id`, `creator`, `updated`, `created`) are automatically
     * excluded from the form since they should not be set manually during creation.
     *
     * @returns A {@link CanvasNode} rendering a form POSTing to `/api/<collection>`.
     */
    @Get("/add/page.json")
    public async addPage(): Promise<CanvasNode> {
        const sysFields = ["id", "creator", "updated", "created"];
        const fields = this.getEditableFields().filter(f => !sysFields.includes(f.key));

        return this.renderEntityForm(
            `/api/${this.getCollectionName()}`,
            "POST",
            `Add ${this.getTargetEntity().name}`,
            fields,
            `Create ${this.getTargetEntity().name}`
        );
    }
}