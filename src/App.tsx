import React, { useState } from 'react';
import { Hero } from './hero/Hero';
import styles from './App.module.css';
import './global.css';
import { useSelector } from 'react-redux';
import { RootState } from './app/store';
import { Presentation } from './presentation/Presentation';
import { Experience } from './experience/Experience';

const App: React.FC = () => {
  const animationComplete = useSelector((state: RootState) => state.animation.animationComplete); 

  return (
    <div className={styles.App}>
      <Hero />
      {animationComplete && (
        <>
          <Presentation />
          <Experience />
        </>
      )}
    </div>
  );
}

export default App;
;
