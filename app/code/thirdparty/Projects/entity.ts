import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("projects")
export class Projects extends Content
{

    @Field({ searchable: true, required: true })
    public projectTitle: string | undefined;

    @Field({ searchable: true, required: true })
    public projectDescription: string | undefined;

    @Field({  })
    public repositoryUrl: string | undefined;

    @Field({  })
    public publishedUrl: string | undefined;

    @Field({ searchable: true })
    public tags: string | undefined;

    @Field({ required: true })
    public category: string | undefined;

    @Field({
        module: {
            component: "SkillSearch",
            data: { label: "Tech Stack", name: "skillIds" },
            children: []
        }
    })
    public skillIds: number[] | undefined;

    @Field({ 
        required: true,
        module: {
            component: 'PageSelector',
            data: {
                name: 'documentationUrl',
                label: 'Link to documentation'
            },
            children: []
        }
    })
    public documentationUrl: string | undefined;
}
