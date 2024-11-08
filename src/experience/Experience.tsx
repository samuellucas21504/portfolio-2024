export interface IExperienceProps {
    position: string;
    company: string;
    text: string[];
}

export const Experience = ({position, company, text}: IExperienceProps) => {
    return (
        <section>
            <header>
                <h1>{position}</h1>
                <small>@ {company}</small>
            </header>
            <h2>
                {text.map((line) => <p>{line}</p>)}
            </h2>
        </section>
    );
}