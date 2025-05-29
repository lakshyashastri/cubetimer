import React from 'react';
import styles from './Averages.module.css';

const AverageItem = ({ label, currentTime, bestTime, formatTime }) => (
  <div className={styles.avgItem}>
    <span className={styles.avgLabel}>{label}</span>
    <div className={styles.avgValues}>
      <span className={styles.avgCurrent}>{formatTime(currentTime)}</span>
      {bestTime !== null && bestTime !== undefined && (
        <div className={styles.avgBestContainer}>
          <span className={styles.avgBestPrefix}>best:</span>
          <span className={styles.avgBest}>{formatTime(bestTime)}</span>
        </div>
      )}
    </div>
  </div>
);

const Averages = ({ averages, bestAverages, formatTime, timesCount }) => {
  if (timesCount < 1) { // Show message if no solves yet, or adjust to < 5 for first Ao5
    return <p className={styles.noAveragesMessage}>Complete some solves to see averages.</p>;
  }

  const averageTypes = [
    { key: 'ao5', label: 'Ao5' },
    { key: 'ao12', label: 'Ao12' },
    { key: 'ao25', label: 'Ao25' },
    { key: 'ao50', label: 'Ao50' },
    { key: 'ao100', label: 'Ao100' },
  ];

  // Filter out averages that don't have enough solves yet (current average will be null)
  const availableAverages = averageTypes.filter(avg => averages[avg.key] !== null || (bestAverages && bestAverages[avg.key] !== null));

  if (availableAverages.length === 0 && timesCount < 5) {
     return <p className={styles.noAveragesMessage}>Complete at least 5 solves for Ao5.</p>;
  }


  return (
    <div className={styles.averagesContainer}>
      {availableAverages.length > 0 ? (
        availableAverages.map(avg => (
          <AverageItem
            key={avg.key}
            label={avg.label}
            currentTime={averages[avg.key]}
            bestTime={bestAverages ? bestAverages[avg.key] : null}
            formatTime={formatTime}
          />
        ))
      ) : (
         <p className={styles.noAveragesMessage}>Not enough solves for current averages.</p>
      )}
    </div>
  );
};

export default Averages;
