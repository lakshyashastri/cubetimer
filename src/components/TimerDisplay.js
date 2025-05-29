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

  // Construct the className string for the timer itself
  const timerClasses = `${styles.timer} ${stateToClass[timerState] || ''}`;

  return (
    // The outer div no longer needs styles.timerWrapper,
    // as App.js now provides a wrapper with that style for centering and animation.
    // This div could be a React.Fragment if it serves no other purpose,
    // but keeping it as a div is also fine.
    <div> 
      <div className={timerClasses}>
        {displayTime}
      </div>
    </div>
  );
};

export default TimerDisplay;
