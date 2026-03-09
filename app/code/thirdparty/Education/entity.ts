import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";

@Entity("education")
export class Education extends Content
{
    @Field({ searchable: true, required: true })
    public institution: string | undefined;

    @Field({ searchable: true })
    public institutionUrl: string | undefined;

    @Field({ searchable: true, required: true })
    public qualificationType: string | undefined; // e.g. "Bachelor's", "Master's", "PhD", "Bootcamp", "Certificate"

    @Field({ searchable: true, required: true })
    public fieldOfStudy: string | undefined;

    @Field({
        module: {
            component: "Input",
            data: {
                label: "Status",
                name: "status",
                kind: "select",
                options: [
                    { label: "Completed", value: "completed" },
                    { label: "In Progress", value: "in_progress" },
                    { label: "Incomplete", value: "incomplete" },
                    { label: "Deferred", value: "deferred" }
                ]
            },
            children: []
        }
    })
    public status: string | undefined;

    @Field({ 
        module: {
            component: 'Input',
            data: {
                kind: 'text',
                type: 'date',
                label: 'Start date',
                name: 'startDate'
            },
            children: []
        }
    })
    public startDate: string | undefined;

    @Field({ 
        module: {
            component: 'Input',
            data: {
                kind: 'text',
                type: 'date',
                label: 'End date',
                name: 'endDate'
            },
            children: []
        }
    })
    public endDate: string | undefined;

    @Field()
    public grade: string | undefined;

    @Field()
    public description: string | undefined;

    @Field({
        module: {
            component: "StringList",
            data: {
                label: "Modules / Subjects",
                name: "modules"
            },
            children: []
        }
    })
    public modules: string[] | undefined;

    @Field({
        module: {
            component: "StringList",
            data: {
                label: "Achievements",
                name: "achievements"
            },
            children: []
        }
    })
    public achievements: string[] | undefined;

    @Field({
        module: {
            component: "SkillSearch",
            data: {
                label: "Related Skills",
                name: "skillIds"
            },
            children: []
        }
    })
    public skillIds: number[] | undefined;
}