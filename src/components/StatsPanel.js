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
  const { overview: isOverviewVisible, averages: isAveragesVisible, chart: isChartVisible, times: isTimesPanelVisible } = panelVisibility;

  // Condition for Times panel to shift up
  const shouldTimesPanelShiftUp = !isOverviewVisible && isTimesPanelVisible;

  // Helper to build class names for panels
  const getPanelClasses = (panelName, specificClass, isShifted = false, shiftedClass = '') => {
    let classList = `${styles.panel} ${specificClass}`;
    if (panelVisibility[panelName]) {
      classList += ` ${styles.visible}`;
      if (panelName === 'chart') { // Specific transform for chart when visible
        classList += ` ${styles.chartPanelVisibleTransform}`;
      }
    }
    if (isShifted) {
      classList += ` ${shiftedClass}`;
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
          {isOverviewVisible && <Overview stats={stats} formatTime={formatTime} />}
        </div>
      </div>

      {/* Averages Panel */}
      <div className={getPanelClasses('averages', styles.averagesPanel)}>
        <div className={styles.panelHeader}>
          <h3>Averages</h3>
          <button onClick={() => togglePanel('averages')} className={styles.closeBtn} title="Close Averages">×</button>
        </div>
        <div className={styles.panelContent}>
          {isAveragesVisible && <Averages averages={averagesData.averages} bestAverages={averagesData.bestAverages} formatTime={formatTime} timesCount={times.length} />}
        </div>
      </div>
      
      {/* Performance Chart Panel */}
      <div className={getPanelClasses('chart', styles.chartPanel)}>
        <div className={styles.panelHeader}>
          <h3>Chart</h3>
          <button onClick={() => togglePanel('chart')} className={styles.closeBtn} title="Close Chart">×</button>
        </div>
        <div className={styles.panelContent}>
          {isChartVisible && <PerformanceChart times={times} formatTime={formatTime} />}
        </div>
      </div>

      {/* Times List Panel */}
      <div className={getPanelClasses('times', styles.timesPanel, shouldTimesPanelShiftUp, styles.timesPanelShiftedUp)}>
        <div className={styles.panelHeader}>
          <h3>Times</h3>
          <button onClick={() => togglePanel('times')} className={styles.closeBtn} title="Close Times List">×</button>
        </div>
        <div className={styles.panelContent}>
          {isTimesPanelVisible && <TimesList times={times} formatTime={formatTime} onDeleteTime={deleteTime} onClearAllTimes={clearAllTimes} />}
        </div>
      </div>
    </>
  );
};

export default StatsPanel;
