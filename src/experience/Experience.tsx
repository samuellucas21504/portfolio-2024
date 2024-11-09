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
                <small><b>@</b> {company}</small>
            </header>
            <h2>
                {text.map((line) => <p key={line}>{line}</p>)}
            </h2>
        </section>
    );
}