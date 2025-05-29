import React from 'react';
import styles from './StatsPanel.module.css';
import Overview from './stats/Overview';
import Averages from './stats/Averages';
import TimesList from './stats/TimesList';
import PerformanceChart from './stats/PerformanceChart';

const StatsPanel = ({
  panelVisibility,
  togglePanel,
  stats,
  averagesData, // Contains .averages and .bestAverages
  times,
  formatTime,
  deleteTime,
  clearAllTimes,
}) => {
  const { overview, averages, chart, times: timesPanelVisible } = panelVisibility; // Renamed 'times' from visibility to avoid conflict

  // Helper to build class names for panels
  const getPanelClasses = (panelName, specificClass) => {
    let classList = `${styles.panel} ${specificClass}`;
    if (panelVisibility[panelName]) {
      classList += ` ${styles.visible}`;
      // Special handling for chart centering when visible
      if (panelName === 'chart') {
        classList += ` ${styles.chartPanelVisibleTransform}`;
      }
    }
    return classList;
  };

  return (
    <>
      {/* Overview Panel */}
      <div className={getPanelClasses('overview', styles.overviewPanel)}>
        <div className={styles.panelHeader}>
          <h3>Overview</h3>
          <button onClick={() => togglePanel('overview')} className={styles.closeBtn} title="Close Overview">×</button>
        </div>
        <div className={styles.panelContent}>
          {overview && <Overview stats={stats} formatTime={formatTime} />}
        </div>
      </div>

      {/* Averages Panel */}
      <div className={getPanelClasses('averages', styles.averagesPanel)}>
        <div className={styles.panelHeader}>
          <h3>Averages</h3>
          <button onClick={() => togglePanel('averages')} className={styles.closeBtn} title="Close Averages">×</button>
        </div>
        <div className={styles.panelContent}>
          {averages && <Averages averages={averagesData.averages} bestAverages={averagesData.bestAverages} formatTime={formatTime} timesCount={times.length} />}
        </div>
      </div>
      
      {/* Performance Chart Panel */}
      <div className={getPanelClasses('chart', styles.chartPanel)}>
        <div className={styles.panelHeader}>
          <h3>Chart</h3>
          <button onClick={() => togglePanel('chart')} className={styles.closeBtn} title="Close Chart">×</button>
        </div>
        <div className={styles.panelContent}>
          {chart && <PerformanceChart times={times} formatTime={formatTime} />}
        </div>
      </div>

      {/* Times List Panel */}
      <div className={getPanelClasses('times', styles.timesPanel)}>
        <div className={styles.panelHeader}>
          <h3>Times</h3>
          <button onClick={() => togglePanel('times')} className={styles.closeBtn} title="Close Times List">×</button>
        </div>
        <div className={styles.panelContent}>
          {timesPanelVisible && <TimesList times={times} formatTime={formatTime} onDeleteTime={deleteTime} onClearAllTimes={clearAllTimes} />}
        </div>
      </div>
    </>
  );
};

export default StatsPanel;
