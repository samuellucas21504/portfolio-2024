import React, { useState, useEffect } from 'react';
import styles from './Hero.module.css';
import { AnimatedCircle } from './AnimatedCircle';


export const Hero: React.FC = () => {
  const [cornerClass, setCornerClass] = useState('');

  useEffect(() => {
    const timer1 = setTimeout(() => {
        setCornerClass(`${styles.barExpanded}`);
    }, 500);

    return () => {
      clearTimeout(timer1);
    };
  }, []);

  return (
    <div className={styles.hero}>
        <div className={`${styles.topBar} ${cornerClass}`}/>
        <div className={`${styles.rightBar} ${cornerClass}`}/>
        <div className={`${styles.leftBar} ${cornerClass}`}/>

        <AnimatedCircle />
    </div>
  );
};