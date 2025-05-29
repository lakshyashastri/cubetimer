import { useState, useEffect, useCallback, useRef } from 'react';

const useCubeTimer = () => {
  // --- Timer State ---
  const [timerDisplay, setTimerDisplay] = useState('READY');
  const [timerState, setTimerState] = useState('ready'); // 'ready', 'preparing', 'running', 'stopped'
  const [currentTime, setCurrentTime] = useState(0);

  // --- Data State ---
  const [times, setTimes] = useState([]);
  const [stats, setStats] = useState({
    totalSolves: 0,
    bestTime: null,
    worstTime: null,
    medianTime: null,
    averageTime: null,
  });
  const [averages, setAverages] = useState({
    ao5: null, ao12: null, ao25: null, ao50: null, ao100: null,
  });
  const [bestAverages, setBestAverages] = useState({
    ao5: null, ao12: null, ao25: null, ao50: null, ao100: null,
  });

  // --- Internal Timer Logic Refs and State ---
  const startTimeRef = useRef(null);
  const intervalIdRef = useRef(null);
  const autoResetTimerIdRef = useRef(null); // Ref for the auto-reset timeout
  const [prepareStartTime, setPrepareStartTime] = useState(null);
  const minPrepareTime = 100; // ms

  // --- Load initial data from localStorage ---
  useEffect(() => {
    const loadedTimes = JSON.parse(localStorage.getItem('cubeTimerTimes') || '[]');
    setTimes(loadedTimes);
    const loadedBestAverages = JSON.parse(localStorage.getItem('cubeTimerBestAverages') || '{}');
    setBestAverages(prev => ({ ...prev, ...loadedBestAverages }));
  }, []);

  // --- Save data to localStorage & Update Stats ---
  useEffect(() => {
    localStorage.setItem('cubeTimerTimes', JSON.stringify(times));
    updateStats(); 
  }, [times]); // updateStats is memoized

  useEffect(() => {
    localStorage.setItem('cubeTimerBestAverages', JSON.stringify(bestAverages));
  }, [bestAverages]);

  // --- Helper Functions (memoized) ---
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
    }
    return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
  }, []);

  const calculateMedian = useCallback((timeValues) => {
    if (!timeValues || timeValues.length === 0) return null;
    const sortedValues = [...timeValues].sort((a, b) => a - b);
    const length = sortedValues.length;
    if (length % 2 === 0) {
      const mid1 = sortedValues[length / 2 - 1];
      const mid2 = sortedValues[length / 2];
      return (mid1 + mid2) / 2;
    }
    return sortedValues[Math.floor(length / 2)];
  }, []);

  const calculateAverageFromValues = useCallback((timeValuesInput, N) => {
    if (!timeValuesInput || timeValuesInput.length !== N) return null;
    const timeValues = timeValuesInput.filter(t => typeof t === 'number' && !isNaN(t));
    if (timeValues.length !== N) return null;
    if (N < 3) return null;
    const sortedTimes = [...timeValues].sort((a, b) => a - b);
    if (N >= 5) {
      const trimmedTimes = sortedTimes.slice(1, -1); 
      if (trimmedTimes.length === 0) return null;
      return trimmedTimes.reduce((sum, t) => sum + t, 0) / trimmedTimes.length;
    } else { 
      return sortedTimes.reduce((sum, t) => sum + t, 0) / sortedTimes.length;
    }
  }, []);

  const calculateCurrentAverage = useCallback((N) => {
    if (times.length < N) return null;
    const recentTimesValues = times.slice(0, N).map(t => t.time);
    return calculateAverageFromValues(recentTimesValues, N);
  }, [times, calculateAverageFromValues]);

  const findOverallBestAverage = useCallback((N) => {
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
  }, [times, calculateAverageFromValues]);

  const updateStats = useCallback(() => {
    const totalSolves = times.length;
    if (totalSolves === 0) {
      setStats({ totalSolves: 0, bestTime: null, worstTime: null, medianTime: null, averageTime: null });
      setAverages({ ao5: null, ao12: null, ao25: null, ao50: null, ao100: null });
      return;
    }
    const timeValues = times.map(t => t.time);
    const bestTime = Math.min(...timeValues);
    const worstTime = Math.max(...timeValues);
    const medianTime = calculateMedian(timeValues);
    const averageTime = timeValues.reduce((sum, t) => sum + t, 0) / totalSolves;
    setStats({ totalSolves, bestTime, worstTime, medianTime, averageTime });

    const newAverages = {};
    const newBestAverages = { ...bestAverages };
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
  }, [times, bestAverages, calculateMedian, calculateCurrentAverage, findOverallBestAverage]);


  const resetToReady = useCallback(() => {
    if (autoResetTimerIdRef.current) {
      clearTimeout(autoResetTimerIdRef.current);
      autoResetTimerIdRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    startTimeRef.current = null;
    setTimerState('ready');
    setTimerDisplay('READY');
    setCurrentTime(0);
  }, []); // formatTime not needed here as display is static 'READY'

  const startPreparing = useCallback(() => {
    if (autoResetTimerIdRef.current) { // Clear pending auto-reset
      clearTimeout(autoResetTimerIdRef.current);
      autoResetTimerIdRef.current = null;
    }
    // Also ensure timer is fully reset if preparing from a 'stopped' state via quick space press
    if (timerState === 'stopped') {
        resetToReady(); // This will clear intervals and set display/state correctly before preparing
    }

    setTimerState('preparing');
    setPrepareStartTime(Date.now());
    setTimerDisplay('HOLD...');
    setCurrentTime(0);
  }, [resetToReady, timerState]);


  const startTimer = useCallback(() => {
    if (autoResetTimerIdRef.current) { // Should ideally be cleared by startPreparing
        clearTimeout(autoResetTimerIdRef.current);
        autoResetTimerIdRef.current = null;
    }
    setTimerState('running');
    startTimeRef.current = performance.now();
    setCurrentTime(0); 
    setTimerDisplay(formatTime(0));

    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    intervalIdRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        setCurrentTime(performance.now() - startTimeRef.current);
      }
    }, 10);
  }, [formatTime]); 

  const stopTimer = useCallback(() => {
    if (timerState !== 'running' || startTimeRef.current === null) return;

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    const finalTime = performance.now() - startTimeRef.current;
    startTimeRef.current = null; 

    setTimerState('stopped');
    setCurrentTime(finalTime);
    setTimerDisplay(formatTime(finalTime));

    const newTimeEntry = {
      time: finalTime,
      date: new Date().toISOString(),
      id: Date.now(),
    };
    setTimes(prevTimes => [newTimeEntry, ...prevTimes]);

    // Clear any existing auto-reset timeout before setting a new one
    if (autoResetTimerIdRef.current) {
      clearTimeout(autoResetTimerIdRef.current);
    }
    autoResetTimerIdRef.current = setTimeout(() => {
      resetToReady(); // resetToReady already nullifies autoResetTimerIdRef.current
    }, 750);

  }, [timerState, formatTime, resetToReady]); 

  // --- Data Management Functions ---
  const saveTime = useCallback((time) => {
    const timeEntry = { time, date: new Date().toISOString(), id: Date.now() };
    setTimes(prevTimes => [timeEntry, ...prevTimes]);
  }, []);

  const deleteTime = useCallback((id) => {
    setTimes(prevTimes => prevTimes.filter(time => time.id !== id));
  }, []);

  const clearAllTimes = useCallback(() => {
    setTimes([]);
    setBestAverages({ ao5: null, ao12: null, ao25: null, ao50: null, ao100: null });
    // Clear any pending auto-reset if all times are cleared
    if (autoResetTimerIdRef.current) {
        clearTimeout(autoResetTimerIdRef.current);
        autoResetTimerIdRef.current = null;
    }
  }, []);

  // --- Effect for timer display updates during 'running' state ---
  useEffect(() => {
    if (timerState === 'running') {
      setTimerDisplay(formatTime(currentTime));
    }
  }, [currentTime, timerState, formatTime]);
  
  // Cleanup interval and auto-reset timeout on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (autoResetTimerIdRef.current) {
        clearTimeout(autoResetTimerIdRef.current);
      }
    };
  }, []);

  return {
    timerDisplay, timerState, currentTime, times, stats, averages, bestAverages,
    formatTime, startPreparing, startTimer, stopTimer, resetToReady,
    saveTime, deleteTime, clearAllTimes,
    minPrepareTime, prepareStartTime,
  };
};

export default useCubeTimer;
