import { Entity, Field } from "@decorators/entity";
import { Content } from "../content/content";
import { CanvasNode } from "../frontend/types";

@Entity("employment")
export class Employment extends Content
{

    @Field({ searchable: true, required: true })
    public company: string | undefined;

    @Field({ searchable: true, required: true })
    public companyUrl: string | undefined;

    @Field({ searchable: true, required: true })
    public industry: string | undefined;

    @Field({ 
        module: { 
            component: "Input", 
            data: { 
                label: "Company size",
                name: "companySize",
                placeholder: "Select company size",
                kind: "select",
                options: [{"label":"Startup","value":"startup"},{"label":"Small","value":"small"},{"label":"Medium","value":"medium"},{"label":"Large","value":"large"},{"label":"Enterprise","value":"enterprise"}]
            }, 
            children: [] 
        } 
    })
    public companySize: string | undefined;

    @Field({ searchable: true, required: true })
    public roleTitle: string | undefined;

    @Field({ 
        module: { 
            component: "Input", 
            data: { 
                label: "Role type",
                name: "roleType",
                placeholder: "Select role type",
                kind: "select",
                options: [{"label":"Full time","value":"full-time"},{"label":"Part time","value":"part-time"},{"label":"Contract","value":"contract"},{"label":"Freelance","value":"freelance"},{"label":"Internship","value":"internship"},{"label":"Apprenticeship","value":"apprenticeship"}]
            }, 
            children: [] 
        } 
    })
    public roleType: string | undefined;

    @Field({  })
    public Department: string | undefined;

    @Field({  })
    public location: string | undefined;

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
        },
        required: true
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

    @Field({  })
    public summary: string | undefined;

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
            component: "StringList", 
            data: { 
                label: "Responsibilities",
                name: "responsibilities"
            }, 
            children: [] 
        } 
    })
    public responsibilities: string[] | undefined;

    @Field({ 
        module: { 
            component: "SkillSearch", 
            data: { 
                label: "Skills Used",
                name: "skillsUsed"
            }, 
            children: [] 
        } 
    })
    public skillsUsed: number[] | undefined;
}
