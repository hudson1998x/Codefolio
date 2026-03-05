import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("blog")
export class Blog extends Content
{

    @Field({ searchable: true, required: true, default: "Untitled article" })
    public pageTitle: string | undefined;

    @Field({ 
        module: { 
            component: "CanvasEditor", 
            data: { 
                label: "Page content"
            }, 
            children: [] 
        } 
    })
    public content: CanvasNode | undefined;

    @Field({ searchable: true })
    public keywords: string | undefined;

    @Field({  })
    public pageDescription: string | undefined;

    @Field({  })
    public category: string | undefined;

    @Field({
        module: {
            component: "Blog/TagEditor",
            data: {
                label: "Tags"
            },
            children: []
        }
    })
    public tags: string[] | undefined;
}
