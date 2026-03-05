import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("prefab")
export class Prefab extends Content
{

    @Field({ searchable: true, required: true, default: "Untitled Prefab" })
    public prefabName: string | undefined;

    @Field({ 
        module: { 
            component: "CanvasEditor", 
            data: { 
                label: "Prefab Editor"
            }, 
            children: [] 
        } 
    })
    public prefabJson: CanvasNode | undefined;

    @Field({ searchable: true, default: "All" })
    public category: string | undefined;
}
