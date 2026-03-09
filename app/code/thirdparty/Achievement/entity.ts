import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("achievements")
export class Achievement extends Content
{
    @Field({ searchable: true, required: true })
    public achievementTitle: string | undefined;

    @Field({ searchable: true })
    public issuer: string | undefined;

    @Field({
        module: {
            component: "Input",
            data: {
                label: "Type",
                name: "achievementType",
                kind: "select",
                options: [
                    { label: "Award",       value: "award" },
                    { label: "Recognition", value: "recognition" },
                    { label: "Publication", value: "publication" },
                    { label: "Speaking",    value: "speaking" },
                    { label: "Milestone",   value: "milestone" },
                    { label: "Other",       value: "other" },
                ]
            },
            children: []
        }
    })
    public achievementType: string | undefined;

    @Field({ 
        module: {
            component: 'Input',
            data: {
                kind: 'text',
                type: 'date',
                label: 'Award date',
                name: 'awardDate'
            },
            children: []
        }
    })
    public awardDate: string | undefined;

    @Field()
    public url: string | undefined;

    @Field({ searchable: true })
    public description: string | undefined;
}