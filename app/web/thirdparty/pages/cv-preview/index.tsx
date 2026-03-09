import { registerComponent } from "@components/registry";
import { useModuleConfig } from "@config";
import { useApi } from "@hooks/use-api";
import { FC } from "react";
import "./style.scss";

import * as skillsApi from '@api/skills';
import * as employmentsApi from '@api/employment';
import * as educationApi from '@api/education';
import * as certificationApi from '@api/certification';

const CvPreviewer: FC = () => {
    const personalInformation = useModuleConfig("personalInformation", {
        firstName: "",
        lastName: "",
        preferredName: "",
        headline: "",
        summary: "",
        avatar: "",
        email: "",
        phone: "",
        website: "",
        nationality: "",
        openToWork: "false",
        preferredRole: "",
        preferredLocation: "",
        remoteOnly: "false",
        component: "Admin/Config/PersonalInformationEditor"
    });

    const socialLinks = useModuleConfig("social-links", {
        github: null,
        stackoverflow: null,
        reddit: null,
        linkedin: null,
        discord: null,
        dev: null,
        hackernews: null,
        component: "Admin/Config/SocialLinksEditor"
    });

    const [skills] = useApi(() => skillsApi.find('', 500), []);
    const [employment] = useApi(() => employmentsApi.find('', 500), []);
    const [education] = useApi(() => educationApi.find('', 500), []);
    const [certifications] = useApi(() => certificationApi.find('', 500), []);

    return (
        <div className='cv-canvas'>
            <div className="toolbar no-print">
                <button className="premium-btn" onClick={() => window.print()}>
                    Generate PDF
                </button>
            </div>

            <div className='cv-sheet'>
                <header className="premium-header">
                    <div className="name-brand">
                        <h1>
                            <span className="light">{personalInformation.firstName}</span>
                            <strong>{personalInformation.lastName}</strong>
                        </h1>
                        <div className="accent-bar" />
                        <p className="headline">{personalInformation.headline}</p>
                    </div>
                    
                    <div className="contact-grid">
                        <div className="info-block">
                            <label>Direct</label>
                            <p>{personalInformation.email}</p>
                            <p>{personalInformation.phone}</p>
                            <p className="web-url">{personalInformation.website}</p>
                        </div>
                        <div className="info-block">
                            <label>Social Ecosystem</label>
                            <div className="social-links-container">
                                {Object.entries(socialLinks)
                                    .filter(([key, val]) => val && key !== 'component')
                                    .map(([key, val]) => (
                                        <a key={key} href={String(val)} target="_blank" rel="noreferrer" className="social-item">
                                            <span className="platform">{key.replace('hackernews', 'hacker news')}</span>
                                            <span className="address">{String(val).replace(/^https?:\/\//, '')}</span>
                                        </a>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </header>

                <section className="premium-summary">
                    <p>{personalInformation.summary}</p>
                </section>

                <main className="premium-grid">
                    <div className="main-col">
                        <h2 className="col-title">Selected Experience</h2>
                        {employment?.map((job: any) => (
                            <div key={job.id} className="experience-card">
                                <div className="card-header">
                                    <h3>{job.roleTitle}</h3>
                                    <span className="duration">{job.startDate} — {job.endDate || 'Present'}</span>
                                </div>
                                <p className="company-link">{job.company} <span className="sep">/</span> {job.location}</p>
                                <ul className="role-tasks">
                                    {job.responsibilities.map((res: string, i: number) => (
                                        <li key={i}>{res}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <aside className="side-col">
                        <div className="side-section">
                            <h2 className="col-title">Tech Stack</h2>
                            <div className="skill-meter-grid">
                                {skills?.map((s: any) => (
                                    <div key={s.id} className="skill-meter">
                                        <div className="skill-info">
                                            <span>{s.skillName}</span>
                                            <span className="years">{s.yearsOfExperience}Y</span>
                                        </div>
                                        <div className="meter-bar">
                                            <div className={`fill ${s.skillProficiency.toLowerCase()}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="side-section">
                            <h2 className="col-title">Education</h2>
                            {education?.map((edu: any) => (
                                <div key={edu.id} className="edu-card">
                                    <strong>{edu.qualificationType}</strong>
                                    <p>{edu.fieldOfStudy}</p>
                                    <span className="inst">{edu.institution}</span>
                                </div>
                            ))}
                        </div>

                        <div className="side-section">
                            <h2 className="col-title">Certifications</h2>
                            {certifications?.map((cert: any) => (
                                <div key={cert.id} className="cert-card">
                                    <strong>{cert.certificationName}</strong>
                                    <p>{cert.issuer}</p>
                                </div>
                            ))}
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
};

registerComponent({
    name: '@pages/cv-preview',
    component: CvPreviewer,
    defaults: {}
});