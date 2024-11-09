import { LinkedinLogo } from '@phosphor-icons/react';
import styles from './Contact.module.css';
import Contact, { IContactProps } from './Contact';

const contacts: IContactProps[] = [
    {
        text: "samuellucasrdg@gmail.com",
    },
    {
        icon: {
            component: <LinkedinLogo size={32} />,
            link: "https://www.linkedin.com/in/samuel-lucas-rdg/"
        }
    }
]

export default function ContactSection() {
    return (
        <footer className={styles.wrapper}>
            {
                contacts.map((info) => (
                    <Contact 
                        key={info.icon?.link ?? info.text}
                        icon={info.icon} 
                        text={info.text} 
                    />
                ))
            }
        </footer>
    );
}