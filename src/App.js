import React, { useState, useEffect, useCallback } from 'react';
import useCubeTimer from './hooks/useCubeTimer';
import TimerDisplay from './components/TimerDisplay';
import StatsPanel from './components/StatsPanel';
import ActionButton from './components/ActionButton';
import './index.css'; // Global styles
import appStyles from './App.module.css'; // For app-specific layout styles
import timerDisplayStyles from './components/TimerDisplay.module.css'; // For timerWrapper

// Initial panel visibility state - set to false for default hidden
const initialPanelVisibility = {
  overview: false,
  averages: false,
  times: false,
  chart: false,
};

function App() {
  const {
    timerDisplay,
    timerState,
    // currentTime, // Not directly used in App's render
    times,
    stats,
    averages,
    bestAverages,
    formatTime,
    startPreparing,
    startTimer,
    stopTimer,
    resetToReady,
    deleteTime,
    clearAllTimes,
    minPrepareTime,
    prepareStartTime,
  } = useCubeTimer();

  const [panelVisibility, setPanelVisibility] = useState(initialPanelVisibility);
  // const [isSpacePressed, setIsSpacePressed] = useState(false); // Not directly needed in App state

  const togglePanel = (panelName) => {
    setPanelVisibility(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  const toggleAllPanels = () => {
    const anyPanelVisible = Object.values(panelVisibility).some(visible => visible);
    if (anyPanelVisible) {
      // If any panel is visible, hide all
      setPanelVisibility({ overview: false, averages: false, times: false, chart: false });
    } else {
      // If no panels are visible, show all (or a default set)
      setPanelVisibility({ overview: true, averages: true, times: true, chart: true });
    }
  };
  
  const handleKeyDown = useCallback((e) => {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    // setIsSpacePressed(true); // Managed by keyUp

    if (timerState === 'ready') {
      startPreparing();
    } else if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'stopped') { // Allow resetting from stopped state
      resetToReady();
    }
  }, [timerState, startPreparing, stopTimer, resetToReady]);

  const handleKeyUp = useCallback((e) => {
    if (e.code !== 'Space') return;
    // setIsSpacePressed(false);

    if (timerState === 'preparing') {
      const prepareTime = Date.now() - (prepareStartTime || 0); // Ensure prepareStartTime is not null
      if (prepareTime >= minPrepareTime) {
        startTimer();
      } else {
        resetToReady(); 
      }
    }
  }, [timerState, prepareStartTime, minPrepareTime, startTimer, resetToReady]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Updated logic: Timer area shifts only if the chart panel is visible
  const shouldTimerAreaShift = panelVisibility.chart;

  return (
    // Using a fragment as appStyles.appContainer isn't strictly necessary yet
    <> 
      <div className={`${timerDisplayStyles.timerWrapper} ${shouldTimerAreaShift ? appStyles.timerAreaShifted : ''}`}>
        <TimerDisplay displayTime={timerDisplay} timerState={timerState} />
      </div>
      <ActionButton onTogglePanels={toggleAllPanels} />
      <StatsPanel
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        stats={stats}
        averagesData={{ averages, bestAverages }}
        times={times}
        formatTime={formatTime}
        deleteTime={deleteTime}
        clearAllTimes={clearAllTimes}
      />
    </>
  );
}

export default App;
