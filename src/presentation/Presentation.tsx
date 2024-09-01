import styles from './Presentation.module.css';

export const Presentation = () => {
    return (
        <div className={styles.presentation}>
            <div className={styles.content}>
                <p>I am a <span className={styles.emphasis}>Brazilian</span></p>
                <p><span className={styles.emphasis}>Developer</span> and</p>
                <p><span className={`${styles.emphasis} ${styles.inverse}`}>Designer</span></p>
            </div>
        </div>
    )
}