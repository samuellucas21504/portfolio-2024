import React from 'react';
import { RootState } from './app/store';
import { useSelector } from 'react-redux';

import { Hero } from './hero/Hero';
import { Presentation } from './presentation/Presentation';
import Experiences from './experience/Experiences';
import ContactSection from './contact/ContactSection';

import styles from './App.module.css';
import './global.css';

const App: React.FC = () => {
  const animationComplete = useSelector((state: RootState) => state.animation.animationComplete); 

  return (
    <div className={styles.App}>
      <Hero />
      {animationComplete && (
        <>
          <Presentation />
          <Experiences />
          <ContactSection />
        </>
      )}
    </div>
  );
}

export default App;
;
