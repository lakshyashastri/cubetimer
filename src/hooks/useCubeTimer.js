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
  }, [times]);

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

  // Updated average calculation logic
  const calculateAverageFromValues = useCallback((timeValuesInput, N) => {
    // Ensure we are working with an array of N numbers
    if (!timeValuesInput || timeValuesInput.length !== N) return null;
    
    // Filter out any non-numeric or null times to be safe, though data should be clean
    const timeValues = timeValuesInput.filter(t => typeof t === 'number' && !isNaN(t));
    if (timeValues.length !== N) return null; // If filtering changed length, input was not N valid numbers

    if (N < 3) return null; // Meaningful average requires at least 3 times (e.g., Ao3)

    const sortedTimes = [...timeValues].sort((a, b) => a - b);

    if (N >= 5) {
      // Standard cubing average: remove 1 best and 1 worst
      const trimmedTimes = sortedTimes.slice(1, -1); 
      // This slice handles N=5 (slice(1,4) -> 3 items), N=12 (slice(1,11) -> 10 items)
      // If N is large, e.g. N=100, slice(1, 99) -> 98 items.
      // This is the standard for Ao5, Ao12, etc.
      // For larger N like Ao50, Ao100, the 5% rule might be used elsewhere,
      // but for typical speedcubing AoX, it's 1 best/1 worst.
      // If the problem implies a strict 5% for *all* N>=5, this part would need adjustment.
      // Assuming 1 best/1 worst for N>=5 as per common cubing practice for Ao5/Ao12.
      if (trimmedTimes.length === 0) return null; // Should not happen if N >= 3 after slice(1,-1) from N>=5
      return trimmedTimes.reduce((sum, t) => sum + t, 0) / trimmedTimes.length;
    } else { 
      // For N = 3 or N = 4 (simple mean of all N times)
      return sortedTimes.reduce((sum, t) => sum + t, 0) / sortedTimes.length;
    }
  }, []);

  const calculateCurrentAverage = useCallback((N) => {
    if (times.length < N) return null;
    // Get the N most recent times for "current" average
    const recentTimesValues = times.slice(0, N).map(t => t.time);
    return calculateAverageFromValues(recentTimesValues, N); // Pass exactly N times
  }, [times, calculateAverageFromValues]);

  const findOverallBestAverage = useCallback((N) => {
    if (times.length < N) return null;
    let overallBest = null;
    // Iterate through all possible contiguous segments of N times
    for (let i = 0; i <= times.length - N; i++) {
      const windowTimeEntries = times.slice(i, i + N);
      const windowTimeValues = windowTimeEntries.map(t => t.time);
      // Pass exactly N times to calculateAverageFromValues
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
    const averageTime = timeValues.reduce((sum, t) => sum + t, 0) / totalSolves; // Overall mean
    setStats({ totalSolves, bestTime, worstTime, medianTime, averageTime });

    const newAverages = {};
    const newBestAverages = { ...bestAverages }; // Preserve existing bests
    const avgSizes = [5, 12, 25, 50, 100]; // Standard average categories

    for (const size of avgSizes) {
      const currentNMostRecentAvg = calculateCurrentAverage(size);
      newAverages[`ao${size}`] = currentNMostRecentAvg; 

      // Only update best average if there are enough solves for that category
      if (times.length >= size) {
        const overallBestForSize = findOverallBestAverage(size);
        if (overallBestForSize !== null) {
          // If no current best for this size, or new one is better
          if (newBestAverages[`ao${size}`] === null || overallBestForSize < newBestAverages[`ao${size}`]) {
            newBestAverages[`ao${size}`] = overallBestForSize;
          }
        }
      }
    }
    setAverages(newAverages);
    setBestAverages(newBestAverages);
  }, [times, bestAverages, calculateMedian, calculateCurrentAverage, findOverallBestAverage]);

  // --- Timer Control Functions ---
  const startPreparing = useCallback(() => {
    setTimerState('preparing');
    setPrepareStartTime(Date.now());
    setTimerDisplay('HOLD...');
    setCurrentTime(0);
  }, []);

  const startTimer = useCallback(() => {
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
  }, [timerState, formatTime]); 

  const resetToReady = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    startTimeRef.current = null;
    setTimerState('ready');
    setTimerDisplay('READY');
    setCurrentTime(0);
  }, []);

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
  }, []);

  // --- Effect for timer display updates during 'running' state ---
  useEffect(() => {
    if (timerState === 'running') {
      setTimerDisplay(formatTime(currentTime));
    }
  }, [currentTime, timerState, formatTime]);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
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
