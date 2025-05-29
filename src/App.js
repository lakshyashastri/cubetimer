import React, { useState, useEffect, useCallback } from 'react';
import useCubeTimer from './hooks/useCubeTimer';
import TimerDisplay from './components/TimerDisplay';
import StatsPanel from './components/StatsPanel';
import ActionButton from './components/ActionButton';
import './index.css'; // Global styles

// Initial panel visibility state
const initialPanelVisibility = {
  overview: true,
  averages: true,
  times: true,
  chart: true,
};

function App() {
  const {
    timerDisplay,
    timerState,
    currentTime,
    times,
    stats,
    averages,
    bestAverages,
    formatTime,
    startPreparing,
    startTimer,
    stopTimer,
    resetToReady,
    // saveTime, // Not directly used by App, but by stopTimer
    deleteTime,
    clearAllTimes,
    minPrepareTime,
    prepareStartTime,
  } = useCubeTimer();

  const [panelVisibility, setPanelVisibility] = useState(initialPanelVisibility);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const togglePanel = (panelName) => {
    setPanelVisibility(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  const toggleAllPanels = () => {
    const anyPanelVisible = Object.values(panelVisibility).some(visible => visible);
    if (anyPanelVisible) {
      setPanelVisibility({ overview: false, averages: false, times: false, chart: false });
    } else {
      setPanelVisibility(initialPanelVisibility);
    }
  };
  
  // Timer control logic from useCubeTimer, adapted for spacebar
  const handleKeyDown = useCallback((e) => {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    setIsSpacePressed(true);

    if (timerState === 'ready') {
      startPreparing();
    } else if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'stopped') {
      resetToReady();
    }
  }, [timerState, startPreparing, stopTimer, resetToReady]);

  const handleKeyUp = useCallback((e) => {
    if (e.code !== 'Space') return;
    setIsSpacePressed(false);

    if (timerState === 'preparing') {
      const prepareTime = Date.now() - prepareStartTime;
      if (prepareTime >= minPrepareTime) {
        startTimer();
      } else {
        resetToReady(); // Not held long enough
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

  return (
    <>
      <TimerDisplay displayTime={timerDisplay} timerState={timerState} />
      <ActionButton onTogglePanels={toggleAllPanels} />
      <StatsPanel
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        stats={stats}
        averagesData={{ averages, bestAverages }} // Pass both current and best
        times={times}
        formatTime={formatTime}
        deleteTime={deleteTime}
        clearAllTimes={clearAllTimes}
      />
    </>
  );
}

export default App;
