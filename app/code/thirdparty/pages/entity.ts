import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";

@Entity("page")
export class Page extends Content
{
    @Field({ searchable: true, required: true, default: "Untitled page" })
    public pageTitle: string | undefined;

    @Field({ 
        module: { 
            component: "Input", 
            data: { 
                label: 'Page Description', 
                kind: 'textarea', 
                type: 'textarea', 
                rows: 4 
            }, 
            children: [] 
        } 
    })
    public pageDescription: string | undefined;


}