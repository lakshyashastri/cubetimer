import React from 'react';
import styles from './TimerDisplay.module.css';

const TimerDisplay = ({ displayTime, timerState }) => {
  // Define a mapping from timerState to CSS module class
  const stateToClass = {
    ready: styles.ready,
    preparing: styles.preparing,
    running: styles.running,
    stopped: styles.stopped,
  };

  // Construct the className string
  // Default to styles.timer and add the state-specific class if it exists
  const timerClasses = `${styles.timer} ${stateToClass[timerState] || ''}`;

  return (
    <div className={styles.timerWrapper}>
      <div className={timerClasses}>
        {displayTime}
      </div>
    </div>
  );
};

export default TimerDisplay;
