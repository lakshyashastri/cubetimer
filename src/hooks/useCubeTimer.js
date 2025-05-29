import { useState, useEffect, useCallback } from 'react';

const useCubeTimer = () => {
  // --- Timer State ---
  const [timerDisplay, setTimerDisplay] = useState('READY'); // What's shown on the timer
  const [timerState, setTimerState] = useState('ready'); // 'ready', 'preparing', 'running', 'stopped'
  const [currentTime, setCurrentTime] = useState(0); // Raw time in ms for the running timer

  // --- Data State ---
  const [times, setTimes] = useState([]); // Array of time entries { id, time, date }
  const [stats, setStats] = useState({
    totalSolves: 0,
    bestTime: null,
    worstTime: null,
    medianTime: null,
    averageTime: null, // Overall average
  });
  const [averages, setAverages] = useState({
    ao5: null,
    ao12: null,
    ao25: null,
    ao50: null,
    ao100: null,
  });
  const [bestAverages, setBestAverages] = useState({ // Best Ao5, Ao12, etc.
    ao5: null,
    ao12: null,
    ao25: null,
    ao50: null,
    ao100: null,
  });

  // --- Internal Timer Logic State ---
  const [startTime, setStartTime] = useState(null); // `performance.now()` when timer starts
  const [prepareStartTime, setPrepareStartTime] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const minPrepareTime = 100; // ms

  // --- Load initial data from localStorage ---
  useEffect(() => {
    const loadedTimes = JSON.parse(localStorage.getItem('cubeTimerTimes') || '[]');
    setTimes(loadedTimes);
    const loadedBestAverages = JSON.parse(localStorage.getItem('cubeTimerBestAverages') || '{}');
    setBestAverages(prev => ({ ...prev, ...loadedBestAverages })); // Merge to keep initial structure
  }, []);

  // --- Save data to localStorage ---
  useEffect(() => {
    localStorage.setItem('cubeTimerTimes', JSON.stringify(times));
    updateStats(); // Recalculate stats whenever times change
  }, [times]);

  useEffect(() => {
    localStorage.setItem('cubeTimerBestAverages', JSON.stringify(bestAverages));
  }, [bestAverages]);

  // --- Helper Functions ---
  const formatTime = useCallback((milliseconds) => {
    if (milliseconds === null || milliseconds === undefined || isNaN(milliseconds)) {
      return "--";
    }
    const totalMs = Math.floor(milliseconds);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    } else {
      return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
    }
  }, []);

  const calculateMedian = (timeValues) => {
    if (!timeValues || timeValues.length === 0) return null;
    const sortedValues = [...timeValues].sort((a, b) => a - b);
    const length = sortedValues.length;
    if (length % 2 === 0) {
      const mid1 = sortedValues[length / 2 - 1];
      const mid2 = sortedValues[length / 2];
      return (mid1 + mid2) / 2;
    } else {
      return sortedValues[Math.floor(length / 2)];
    }
  };

  const calculateAverageFromValues = (timeValues, N) => {
    if (!timeValues || timeValues.length < N) return null;
    let valuesToAverage = [...timeValues];
    if (N >= 5) {
      valuesToAverage.sort((a, b) => a - b);
      const trimCount = Math.ceil(N * 0.05);
      if (valuesToAverage.length <= trimCount * 2) return null;
      const trimmedTimes = valuesToAverage.slice(trimCount, valuesToAverage.length - trimCount);
      if (trimmedTimes.length === 0) return null;
      return trimmedTimes.reduce((sum, time) => sum + time, 0) / trimmedTimes.length;
    } else {
      if (valuesToAverage.length === 0) return null;
      return valuesToAverage.reduce((sum, time) => sum + time, 0) / valuesToAverage.length;
    }
  };

  const calculateCurrentAverage = (N) => {
    if (times.length < N) return null;
    const recentTimesValues = times.slice(0, N).map(t => t.time);
    return calculateAverageFromValues(recentTimesValues, N);
  };

  const findOverallBestAverage = (N) => {
    if (times.length < N) return null;
    let overallBest = null;
    for (let i = 0; i <= times.length - N; i++) {
      const windowTimeEntries = times.slice(i, i + N);
      const windowTimeValues = windowTimeEntries.map(t => t.time);
      const currentWindowAvg = calculateAverageFromValues(windowTimeValues, N);
      if (currentWindowAvg !== null) {
        if (overallBest === null || currentWindowAvg < overallBest) {
          overallBest = currentWindowAvg;
        }
      }
    }
    return overallBest;
  };

  const updateStats = useCallback(() => {
    const totalSolves = times.length;
    if (totalSolves === 0) {
      setStats({
        totalSolves: 0,
        bestTime: null,
        worstTime: null,
        medianTime: null,
        averageTime: null,
      });
      setAverages({ ao5: null, ao12: null, ao25: null, ao50: null, ao100: null });
      // Best averages are not cleared here, they persist unless explicitly cleared
      return;
    }

    const timeValues = times.map(t => t.time);
    const bestTime = Math.min(...timeValues);
    const worstTime = Math.max(...timeValues);
    const medianTime = calculateMedian(timeValues);
    const averageTime = timeValues.reduce((sum, t) => sum + t, 0) / totalSolves;

    setStats({ totalSolves, bestTime, worstTime, medianTime, averageTime });

    const newAverages = {};
    const newBestAverages = { ...bestAverages }; // Start with current bests
    const avgSizes = [5, 12, 25, 50, 100];

    for (const size of avgSizes) {
      const currentNMostRecentAvg = calculateCurrentAverage(size);
      newAverages[`ao${size}`] = currentNMostRecentAvg;

      if (times.length >= size) {
        const overallBestForSize = findOverallBestAverage(size);
        if (overallBestForSize !== null) {
          if (newBestAverages[`ao${size}`] === null || overallBestForSize < newBestAverages[`ao${size}`]) {
            newBestAverages[`ao${size}`] = overallBestForSize;
          }
        }
      }
    }
    setAverages(newAverages);
    setBestAverages(newBestAverages);
  }, [times, bestAverages]); // Added bestAverages to dependency array

  // --- Timer Control Functions ---
  const startPreparing = useCallback(() => {
    setTimerState('preparing');
    setPrepareStartTime(Date.now());
    setTimerDisplay('HOLD...');
    setCurrentTime(0); // Reset current time display
  }, []);

  const startTimer = useCallback(() => {
    setTimerState('running');
    setStartTime(performance.now());
    if (intervalId) clearInterval(intervalId); // Clear any existing interval
    const newIntervalId = setInterval(() => {
      setCurrentTime(performance.now() - startTime);
    }, 10);
    setIntervalId(newIntervalId);
  }, [intervalId, startTime]); // Added startTime to dependency array

  const stopTimer = useCallback(() => {
    if (timerState !== 'running') return;

    clearInterval(intervalId);
    setIntervalId(null);
    const endTime = performance.now();
    const finalTime = endTime - (startTime || performance.now()); // Ensure startTime is not null

    setTimerState('stopped');
    setCurrentTime(finalTime); // Show final time
    setTimerDisplay(formatTime(finalTime));

    // Save the time
    const newTimeEntry = {
      time: finalTime,
      date: new Date().toISOString(),
      id: Date.now(),
    };
    setTimes(prevTimes => [newTimeEntry, ...prevTimes]); // Adds to beginning

    // Reset to ready after a delay (this will be a new function)
    // setTimeout(resetToReady, 2000); // This will be handled by a useEffect in the component or a direct call
  }, [timerState, intervalId, startTime, formatTime]);

  const resetToReady = useCallback(() => {
    setTimerState('ready');
    setTimerDisplay('READY');
    setCurrentTime(0);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  // --- Data Management Functions ---
  const saveTime = useCallback((time) => { // This function might be redundant if stopTimer handles saving.
                                         // However, it's here if manual time entry is ever needed.
    const timeEntry = {
      time: time,
      date: new Date().toISOString(),
      id: Date.now()
    };
    setTimes(prevTimes => [timeEntry, ...prevTimes]);
  }, []);


  const deleteTime = useCallback((id) => {
    setTimes(prevTimes => prevTimes.filter(time => time.id !== id));
  }, []);

  const clearAllTimes = useCallback(() => {
    // Consider adding a confirmation dialog in the component before calling this
    setTimes([]);
    setBestAverages({ ao5: null, ao12: null, ao25: null, ao50: null, ao100: null }); // Reset best averages too
    // updateStats will be called automatically by the useEffect watching `times`
  }, []);

  // --- Effect for timer display updates ---
  useEffect(() => {
    if (timerState === 'running') {
      setTimerDisplay(formatTime(currentTime));
    }
  }, [currentTime, timerState, formatTime]);
  
  // --- Effect to call updateStats on initial load or when times change ---
  useEffect(() => {
    updateStats();
  }, [times, updateStats]);


  // --- Return values from the hook ---
  return {
    timerDisplay,
    timerState,
    currentTime, // Raw time in ms for the timer
    times,
    stats,
    averages,
    bestAverages, // Expose best averages
    formatTime,
    startPreparing,
    startTimer,
    stopTimer,
    resetToReady,
    saveTime, // Potentially for manual entry
    deleteTime,
    clearAllTimes,
    minPrepareTime, // Expose for spacebar handling in component
    prepareStartTime, // Expose for spacebar handling logic in component
  };
};

export default useCubeTimer;
