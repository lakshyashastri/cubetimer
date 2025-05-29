import React, { useState, useEffect, useCallback } from 'react';
import useCubeTimer from './hooks/useCubeTimer';
import TimerDisplay from './components/TimerDisplay';
import StatsPanel from './components/StatsPanel';
import ActionButton from './components/ActionButton';
import ConfirmationModal from './components/modals/ConfirmationModal'; // Import the modal
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
    clearAllTimes, // This function from the hook will be called on confirm
    minPrepareTime,
    prepareStartTime,
  } = useCubeTimer();

  const [panelVisibility, setPanelVisibility] = useState(initialPanelVisibility);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false); // State for modal

  const togglePanel = (panelName) => {
    setPanelVisibility(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  const toggleAllPanels = () => {
    const anyPanelVisible = Object.values(panelVisibility).some(visible => visible);
    if (anyPanelVisible) {
      setPanelVisibility({ overview: false, averages: false, times: false, chart: false });
    } else {
      setPanelVisibility({ overview: true, averages: true, times: true, chart: true });
    }
  };
  
  const handleKeyDown = useCallback((e) => {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    if (isClearConfirmOpen) return; // Prevent timer interaction when modal is open

    if (timerState === 'ready') {
      startPreparing();
    } else if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'stopped') {
      resetToReady();
    }
  }, [timerState, startPreparing, stopTimer, resetToReady, isClearConfirmOpen]);

  const handleKeyUp = useCallback((e) => {
    if (e.code !== 'Space') return;
    if (isClearConfirmOpen) return; // Prevent timer interaction when modal is open

    if (timerState === 'preparing') {
      const prepareTime = Date.now() - (prepareStartTime || 0);
      if (prepareTime >= minPrepareTime) {
        startTimer();
      } else {
        resetToReady(); 
      }
    }
  }, [timerState, prepareStartTime, minPrepareTime, startTimer, resetToReady, isClearConfirmOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const shouldTimerAreaShift = panelVisibility.chart;

  // Function to open the confirmation modal
  const handleRequestClearAll = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearAll = () => {
    clearAllTimes();
    setIsClearConfirmOpen(false);
  };

  return (
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
        // Pass handleRequestClearAll instead of clearAllTimes directly
        onRequestClearAllTimes={handleRequestClearAll} 
      />
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Confirm Clear All Times"
        message="Are you absolutely sure you want to delete all your solve times? This action is irreversible!"
        confirmText="Yes, Delete All"
        cancelText="Cancel"
      />
    </>
  );
}

export default App;
