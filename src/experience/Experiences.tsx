import { useState } from "react";
import Carousel from "../components/Carousel";
import { Experience, IExperienceProps } from "./Experience";
import styles from './Experience.module.css';

const roles: IExperienceProps[] = [
    {
        position: "Fullstack Developer",
        company: "nocartorio.com",
        text: [
            "Responsible for the development and maintenance of a notary’s office Saas application.",
            "The main technologies used are Laravel, Docker, MySQL and Redis."
        ]
    },
    {
        position: "Fullstack Developer",
        company: "ccobank",
        text: [
            "Responsible for developing the entire Flutter frontend.",
            "Additionally, was in charge of maintaining user services (JAVA), which included analyzing database relationships (modeled by the Hibernate ORM) and security validation testing on endpoints."
        ]
    },
    {
        position: "Intern It Analyst",
        company: "Techmind",
        text: [
            "Responsible for developing .NET services, analyzing and maintaining SQL Server queries flagged as defective by clients, and updating project versions, in addition to meetings with clients to align expectations.",
        ]
    },
    {
        position: "IT Analyst Trainee",
        company: "Cloudopss Solutions",
        text: [
            "Experience in developing web-scraping applications with Python, creating interfaces with React, container orchestration with Docker and Docker-Compose, creating pipelines with Jenkins, and deploying applications in Linux environments on AWS cloud.",
        ]
    },
];

export default function Experiences() {
    const [currentIndex, setCurrentIndex] = useState(0);

    return (
        <div className={styles.experience}>
            <h1>My Experience</h1>
            <Carousel
                currentIndex={currentIndex}
                handleCurrentIndexChange={setCurrentIndex}
            >
            {
                roles.map((role) => (
                <Experience 
                        key={role.company}
                        position={role.position}
                        company={role.company}
                        text={role.text}
                    />
                ))
            }
            </Carousel>
        </div>
    ) 
}
