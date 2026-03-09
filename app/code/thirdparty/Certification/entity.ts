import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("certification")
export class Certification extends Content
{
    @Field({ searchable: true, required: true })
    public certificationName: string | undefined;

    @Field({ searchable: true, required: true })
    public issuer: string | undefined;

    @Field()
    public issueDate: string | undefined;

    @Field()
    public expiryDate: string | undefined;     // null = no expiry

    @Field()
    public credentialUrl: string | undefined;

    @Field()
    public credentialId: string | undefined;

    @Field({
        module: {
            component: "SkillSearch",
            data: { label: "Related Skills", name: "skillIds" },
            children: []
        }
    })
    public skillIds: number[] | undefined;
}