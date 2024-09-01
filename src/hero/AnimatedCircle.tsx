import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from './AnimatedCircle.module.css';
import { setAnimationComplete } from "../features/animation/animationSlice";
import { RootState } from "../app/store";

export const AnimatedCircle = () => {
    const dispatch = useDispatch();

    const animationComplete = useSelector((state: RootState) => state.animation.animationComplete);
    const [circleClass, setCircleClass] = useState(styles.circle);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setCircleClass(`${styles.circle} ${styles.grow}`);
        }, 500);

        const timer2 = setTimeout(() => {
        dispatch(setAnimationComplete(true));
        }, 3000);

        return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        };
    }, [dispatch]);

    return (
        <div className={styles.animationWrapper}>
          {animationComplete && <div className={styles.pulse} />}
          <div className={`${circleClass} ${animationComplete && styles.border}`}>
            {animationComplete && (
              <>
                <div className={styles.headerText}>My name is</div>
                <div className={styles.text}>Samuel</div>
              </>
            )}
          </div>
        </div>
    );
}