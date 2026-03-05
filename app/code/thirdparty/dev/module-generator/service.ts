import { Service } from "@decorators/service";
import { CanvasNode } from "../../frontend/types";
import fs from 'fs'

export type ServiceEntityField = {
    name: string,
    type: number | boolean | null | undefined | string,
    module?: CanvasNode,
    searchable: boolean, 
    required: boolean, 
    default: string,
    editable: boolean
}

@Service()
export class ModuleGenerator
{
    async createModule(name: string, fields: ServiceEntityField[], isThirdParty: boolean = false): Promise<void> 
    {
        console.log(`[DEV] (Auto Generation) - ${name}`)
        const targetPath = isThirdParty ? 'app/code/thirdparty/' + name : 'app/code/user/' + name;

        if (fs.existsSync(targetPath))
        {
            throw new Error(`Module already exists, delete the directory '${targetPath}' first`);
        }

        console.log(`Creating module directory in: ${targetPath}`);

        fs.mkdirSync(targetPath);

        fs.writeFileSync(`${targetPath}/entity.ts`,          this.generateEntity(name, fields, isThirdParty), 'utf8');
        fs.writeFileSync(`${targetPath}/service.ts`,         this.generateService(name, isThirdParty), 'utf8');
        fs.writeFileSync(`${targetPath}/controller.ts`,      this.generateApiController(name, isThirdParty), 'utf8');
        fs.writeFileSync(`${targetPath}/admincontroller.ts`, this.generateAdminController(name, isThirdParty), 'utf8');
        fs.writeFileSync(`${targetPath}/index.ts`,           this.generateIndex(), 'utf8');

        console.log(`Module created at: ${targetPath}`);
    }

    // ── Generators ────────────────────────────────────────────────────────────

    private generateEntity(name: string, fields: ServiceEntityField[], isThirdParty: boolean): string
    {
        const prefix = !isThirdParty ? '../thirdparty/' : '';

        let source = `import { Entity, Field } from "@decorators/entity";
import { Content } from "../${prefix}content/content";
import { CanvasNode } from "../${prefix}frontend/types";

@Entity("${name.toLowerCase()}")
export class ${name} extends Content
{
`;
        fields.forEach(field => {
            source += this.generateField(field);
        });

        source += '}\n';

        return source;
    }

    private generateService(name: string, isThirdParty: boolean): string
    {
        const prefix = !isThirdParty ? '../thirdparty/' : '';

        return `import { Service } from "@decorators/service";
import { ContentService } from "../${prefix}content/service";
import { ${name} } from "./entity";

@Service()
export class ${name}Service extends ContentService<${name}>
{
    protected getCollectionName(): string {
        return "${name.toLowerCase()}"
    }
}
`;
    }

    private generateApiController(name: string, isThirdParty: boolean): string
    {
        const prefix = !isThirdParty ? '../thirdparty/' : '';

        return `import { Controller } from "@decorators/controller";
import { ContentController } from "../${prefix}content/controller";
import { ${name} } from "./entity";
import { ${name}Service } from "./service";
import { Container } from "@decorators/di-container";

/**
 * REST API controller for the {@link ${name}} entity, mounted at \`/api/${name.toLowerCase()}\`.
 *
 * Inherits standard CRUD route handling from {@link ContentController} and
 * wires up the {@link ${name}Service} as the underlying data service via DI.
 */
@Controller("/api/${name.toLowerCase()}")
export class ${name}Controller extends ContentController<${name}>
{
    /**
     * The service instance used for all data operations on {@link ${name}} entities.
     * Resolved automatically from the DI container.
     */
    protected service: ${name}Service = Container.resolve(${name}Service);

    /**
     * Returns the {@link ${name}} entity constructor, used by the base controller
     * to introspect field metadata via \`@Entity\` decorators.
     *
     * @returns The {@link ${name}} class reference.
     */
    public getTargetEntity(): Function {
        return ${name};
    }
}
`;
    }

    private generateAdminController(name: string, isThirdParty: boolean): string
    {
        const prefix = !isThirdParty ? '../thirdparty/' : '';

        return `import { Container } from "@decorators/di-container";
import { AdminController } from "../${prefix}content/admincontroller";
import { ${name} } from "./entity";
import { ${name}Service } from "./service";
import { Controller } from "@decorators/controller";

/**
 * Admin controller for the {@link ${name}} entity, mounted at \`content/en-admin/${name.toLowerCase()}\`.
 *
 * Inherits list, edit, and add page rendering from {@link AdminController} and
 * wires up the {@link ${name}Service} as the underlying data service via DI.
 */
@Controller('content/en-admin/${name.toLowerCase()}')
export class ${name}AdminController extends AdminController<${name}>
{
    /**
     * The service instance used for all data operations on {@link ${name}} entities.
     * Resolved automatically from the DI container.
     */
    protected service: ${name}Service = Container.resolve(${name}Service);

    /**
     * Returns the {@link ${name}} entity constructor, used by the base controller
     * to introspect field metadata via \`@Entity\` decorators.
     *
     * @returns The {@link ${name}} class reference.
     */
    public getTargetEntity(): Function {
        return ${name};
    }
}
`;
    }

    private generateIndex(): string
    {
        return `import './entity'
import './service'
import './controller'
import './admincontroller'
`;
    }

    // ── Field helpers ─────────────────────────────────────────────────────────

    private generateField(field: ServiceEntityField): string
    {
        const decoratorArgs = this.buildDecoratorArgs(field);
        const typeName = this.resolveTypeName(field);

        return `
    @Field(${decoratorArgs})
    public ${field.name}: ${typeName} | undefined;\n`;
    }

    private buildDecoratorArgs(field: ServiceEntityField): string
    {
        if (field.module) {
            return this.buildModuleDecorator(field.module);
        }

        const parts: string[] = [];

        if (field.searchable) parts.push(`searchable: true`);
        if (field.required)   parts.push(`required: true`);
        if (field.default)    parts.push(`default: ${JSON.stringify(field.default)}`);
        if (!field.editable)  parts.push(`editable: false`);

        return `{ ${parts.join(', ')} }`;
    }

    private buildModuleDecorator(module: CanvasNode): string
    {
        const dataEntries = Object.entries(module.data ?? {})
            .map(([k, v]) => `                ${k}: ${JSON.stringify(v)}`)
            .join(',\n');

        return `{ 
        module: { 
            component: ${JSON.stringify(module.component)}, 
            data: { 
${dataEntries}
            }, 
            children: [] 
        } 
    }`;
    }

    private resolveTypeName(field: ServiceEntityField): string
    {
        switch (typeof field.type) {
            case 'number':  return 'number';
            case 'boolean': return 'boolean';
            case 'string':  return 'string';
            default:        return 'CanvasNode';
        }
    }
}