import { registerComponent } from "@components/registry";
import { useModuleConfig } from "@config";
import { useApi } from "@hooks/use-api";
import { FC } from "react";
import "./style.scss";

// API Imports
import * as skillsApi from '@api/skills';
import * as employmentsApi from '@api/employment';
import * as educationApi from '@api/education';
import * as certificationApi from '@api/certification';
import * as projectsApi from '@api/projects';
import * as achievementsApi from '@api/achievements';

const CvPreviewer: FC = () => {
    const personalInformation = useModuleConfig("personalInformation", {
        firstName: "", lastName: "", preferredName: "", headline: "",
        summary: "", avatar: "", email: "", phone: "", website: "",
        nationality: "", openToWork: "false", preferredRole: "",
        preferredLocation: "", remoteOnly: "false",
        component: "Admin/Config/PersonalInformationEditor"
    });

    const socialLinks = useModuleConfig("social-links", {
        github: null, stackoverflow: null, reddit: null, linkedin: null,
        discord: null, dev: null, hackernews: null,
        component: "Admin/Config/SocialLinksEditor"
    });

    // Data Fetching
    const [skills] = useApi(() => skillsApi.find('', 500), []);
    const [employment] = useApi(() => employmentsApi.find('', 500), []);
    const [education] = useApi(() => educationApi.find('', 500), []);
    const [certifications] = useApi(() => certificationApi.find('', 500), []);
    const [projects] = useApi(() => projectsApi.find('', 500), []);
    const [standaloneAchievements] = useApi(() => achievementsApi.find('', 500), []);

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
                            <a href={personalInformation.website} className="web-url">{personalInformation.website}</a>
                        </div>
                        <div className="info-block">
                            <label>Social Ecosystem</label>
                            <div className="social-links-container">
                                {Object.entries(socialLinks)
                                    .filter(([key, val]) => val && key !== 'component')
                                    .map(([key, val]) => (
                                        <a key={key} href={String(val)} target="_blank" rel="noreferrer" className="social-item">
                                            <span className="platform">{key}</span>
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
                        {/* EXPERIENCE SECTION */}
                        <h2 className="col-title">Professional Experience</h2>
                        {employment?.map((job: any) => (
                            <div key={job.id} className="experience-card">
                                <div className="card-header">
                                    <h3>{job.roleTitle}</h3>
                                    <span className="duration">{job.startDate} — {job.endDate || 'Present'}</span>
                                </div>
                                <div className="sub-header">
                                    <span className="company">{job.company}</span>
                                    <span className="industry">{job.industry}</span>
                                    <span className="location">{job.location}</span>
                                </div>
                                
                                <p className="job-summary">{job.summary}</p>

                                <ul className="role-tasks">
                                    {job.responsibilities?.map((res: string, i: number) => <li key={i}>{res}</li>)}
                                </ul>

                                {job.achievements?.length > 0 && (
                                    <div className="inline-achievements">
                                        <label>Key Impact</label>
                                        <ul>
                                            {job.achievements.map((ach: string, i: number) => <li key={i}>{ach}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* PROJECTS SECTION */}
                        <h2 className="col-title">Notable Projects</h2>
                        <div className="projects-grid">
                            {projects?.map((proj: any) => (
                                <div key={proj.id} className="project-card">
                                    <div className="project-head">
                                        <h4>{proj.projectTitle}</h4>
                                        <span className="cat">{proj.category}</span>
                                    </div>
                                    <p>{proj.projectDescription}</p>
                                    <div className="project-links">
                                        {proj.publishedUrl && <a href={proj.publishedUrl}>Live Demo</a>}
                                        {proj.repositoryUrl && <a href={proj.repositoryUrl}>Source</a>}
                                    </div>
                                    <div className="project-tags">
                                        {proj.tags?.map((tag: string) => <span key={tag}>#{tag}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="side-col">
                        {/* SKILLS */}
                        <div className="side-section">
                            <h2 className="col-title">Expertise</h2>
                            <div className="skill-meter-grid">
                                {skills?.map((s: any) => (
                                    <div key={s.id} className="skill-meter">
                                        <div className="skill-info">
                                            <span>{s.skillName}</span>
                                            <span className="years">{s.yearsOfExperience}Y</span>
                                        </div>
                                        <div className="meter-bar">
                                            <div className={`fill ${s.skillProficiency?.toLowerCase()}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STANDALONE ACHIEVEMENTS */}
                        {standaloneAchievements && standaloneAchievements?.length > 0 && (
                            <div className="side-section">
                                <h2 className="col-title">Awards</h2>
                                {standaloneAchievements.map((ach: any) => (
                                    <div key={ach.id} className="award-item">
                                        <strong>{ach.achievementTitle}</strong>
                                        <p>{ach.issuer} • {ach.awardDate}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* EDUCATION */}
                        <div className="side-section">
                            <h2 className="col-title">Education</h2>
                            {education?.map((edu: any) => (
                                <div key={edu.id} className="edu-card">
                                    <strong>{edu.qualificationType}</strong>
                                    <p>{edu.fieldOfStudy}</p>
                                    <span className="inst">{edu.institution}</span>
                                    <span className="grade">{edu.grade}</span>
                                </div>
                            ))}
                        </div>

                        {/* CERTIFICATIONS */}
                        <div className="side-section">
                            <h2 className="col-title">Certifications</h2>
                            {certifications?.map((cert: any) => (
                                <div key={cert.id} className="cert-card">
                                    <strong>{cert.certificationName}</strong>
                                    <p>{cert.issuer}</p>
                                    {cert.credentialId && <span className="cred-id">ID: {cert.credentialId}</span>}
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