import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("documents")
export class Documents extends Content
{

    @Field({ searchable: true, required: true })
    public pageTitle: string | undefined;

    @Field({  })
    public pageDescription: string | undefined;

    @Field({ 
        module: { 
            component: "CanvasEditor", 
            data: { 
                label: "Page Content"
            }, 
            children: [] 
        } 
    })
    public content: CanvasNode | undefined;

    @Field({ 
        searchable: true, 
        default: "0", 
        module: {
            component: "DocumentationSelector",
            data: {
                label: "Select parent page"
            },
            children: []
        }
    })
    public parentPage: number | undefined;

    @Field({ searchable: true })
    public keywords: string | undefined;

    @Field({ searchable: true })
    public tags: string | undefined;
}
