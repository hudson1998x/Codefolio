import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("skills")
export class Skills extends Content
{

    @Field({ searchable: true, required: true })
    public skillName: string | undefined;

    @Field({ searchable: true })
    public skillCategory: string | undefined;

    @Field({ 
        module: { 
            component: "Input", 
            data: { 
                label: "Proficiency",
                name: "skillProficiency",
                placeholder: "Select experience level",
                kind: "select",
                options: [{"label":"Beginner","value":"beginner"},{"label":"Intermediate","value":"intermediate"},{"label":"Advanced","value":"advanced"},{"label":"Expert","value":"expert"}]
            }, 
            children: [] 
        } 
    })
    public skillProficiency: string | undefined;

    @Field({ required: true })
    public yearsOfExperience: number | undefined;

    @Field({  })
    public lastUsed: string | undefined;
}
