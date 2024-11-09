import { ReactElement, useState } from "react";

import styles from './Contact.module.css';
import { Copy } from "@phosphor-icons/react";

interface IIcon {
    component: ReactElement;
    link: string;
}

export interface IContactProps {
    icon?: IIcon,
    text?: string,
}

export default function Contact({icon, text}: IContactProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text!).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        });
    };

    if(icon != null) {
        return (
            <div>
                <a href={icon.link}>
                    {icon.component}
                </a>
            </div>
        );
    }

    if (text != null) {
        return (
            <div className={styles.textWrapper}>
                <div>
                    {text}
                </div>

                <div className={styles.copyButton}>
                    <Copy
                        size={20} 
                        onClick={handleCopy}  
                    />
                    {copied && <span className={styles.messageCopiedAlert}>E-mail copiado!</span>}
                </div>
            </div>
        )
    }

}