import React from 'react';
import styles from './TimesList.module.css';

const TimesList = ({ times, formatTime, onDeleteTime, onClearAllTimes }) => {
  if (!times || times.length === 0) {
    return <p style={{ textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>No times recorded yet.</p>;
  }

  return (
    <>
      <div className={styles.timesControls}>
        <button onClick={onClearAllTimes} className={styles.clearTimesBtn}>
          Clear All Times
        </button>
      </div>
      <div className={styles.timesList}>
        {times.map((timeEntry, index) => (
          <div key={timeEntry.id} className={styles.timeEntry}>
            <span className={styles.timeIndex}>#{times.length - index}</span>
            <span className={styles.timeValue}>{formatTime(timeEntry.time)}</span>
            <button
              onClick={() => onDeleteTime(timeEntry.id)}
              className={styles.deleteBtn}
              title="Delete time"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default TimesList;
