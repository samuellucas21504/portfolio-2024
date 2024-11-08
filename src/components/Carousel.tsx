import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";

import styles from "./Carousel.module.css";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface ICarouselProps {
  children: ReactNode;
  currentIndex: number;
  handleCurrentIndexChange: Dispatch<SetStateAction<number>>
}

export default function Carousel({ children, currentIndex, handleCurrentIndexChange}: ICarouselProps) {
  const childrenArray = React.Children.toArray(children) || [];

  const nextSlide = () => {
    handleCurrentIndexChange((prevIndex) => (prevIndex + 1) % childrenArray.length);
  };

  const prevSlide = () => {
    handleCurrentIndexChange((prevIndex) => (prevIndex - 1 + childrenArray.length) % childrenArray.length);
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselSlide}>
        <button onClick={prevSlide}><CaretLeft size={32} /></button>
          <div>
            {childrenArray[currentIndex]}
          </div>
        <button onClick={nextSlide}><CaretRight size={32} /></button>
      </div>
    </div>
  );
};
