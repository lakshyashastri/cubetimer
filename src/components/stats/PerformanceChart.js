import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PerformanceChart.module.css';

const PerformanceChart = ({ times, formatTime }) => {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationFrameIdRef = useRef(null);
  const animationStartTimeRef = useRef(null);
  const animationDurationRef = useRef(500);
  const prevTimesLengthRef = useRef(times.length);

  const [chartRenderData, setChartRenderData] = useState(null); 
  const [allCalculatedPoints, setAllCalculatedPoints] = useState([]);

  // Memoized isPersonalBest function
  const isPersonalBest = useCallback((timeValue, solveIndexInAllTimesReversed, allTimesReversed) => {
    // `solveIndexInAllTimesReversed` is the index in `allTimesReversed` (0 = newest solve overall)
    const previousSolves = allTimesReversed.slice(solveIndexInAllTimesReversed + 1).map(t => t.time);
    if (allTimesReversed.length > 0 && solveIndexInAllTimesReversed === allTimesReversed.length - 1) { // This is the very first solve
        return true;
    }
    if (previousSolves.length === 0) return false; // Should not happen if not the first solve
    return timeValue < Math.min(...previousSolves);
  }, []);


  const memoizedDrawEmptyChart = useCallback((ctx, canvas) => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#666666";
    ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Complete some solves to see your progress", rect.width / 2, rect.height / 2);
  }, []);

  const memoizedDrawGrid = useCallback((ctx, padding, chartWidth, chartHeight, adjustedMin, adjustedMax, pointsToDraw) => {
    const gridLines = 4;
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartWidth, y); ctx.stroke();
    }
    const verticalLines = Math.min(10, (pointsToDraw?.length || 1) - 1);
     if (verticalLines > 0 && pointsToDraw && pointsToDraw.length > 1) {
        for (let i = 0; i <= verticalLines; i++) {
            const x = padding.left + (chartWidth / verticalLines) * i;
            ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + chartHeight); ctx.stroke();
        }
    }
  }, []);

  const memoizedDrawTrendLine = useCallback((ctx, pointsToDraw, padding, chartWidth, chartHeight, adjustedMin, adjustedRange) => {
    if (!pointsToDraw || pointsToDraw.length < 2) return;
    const trendLineTimes = pointsToDraw.map(p => ({time: p.time})); // Use only time for trend
    const n = trendLineTimes.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    trendLineTimes.forEach((pointData, index) => {
      const x = index; const yVal = pointData.time;
      sumX += x; sumY += yVal; sumXY += x * yVal; sumXX += x * x;
    });
    if ((n * sumXX - sumX * sumX) === 0) return;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    ctx.strokeStyle = "#ff8800"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.globalAlpha = 0.6;
    ctx.beginPath();
    const startYVal = intercept; const endYVal = slope * (n - 1) + intercept;
    const startYPos = padding.top + chartHeight - ((startYVal - adjustedMin) / Math.max(1, adjustedRange)) * chartHeight;
    const endYPos = padding.top + chartHeight - ((endYVal - adjustedMin) / Math.max(1, adjustedRange)) * chartHeight;
    const firstPointX = pointsToDraw[0].x; const lastPointX = pointsToDraw[n-1].x;
    ctx.moveTo(firstPointX, startYPos); ctx.lineTo(lastPointX, endYPos); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }, []);
  
  const memoizedDrawDataLine = useCallback((ctx, pointsToDraw) => { // Removed allTimesReversed from args, will get from closure/chartRenderData if needed by point structure
    if (!pointsToDraw || pointsToDraw.length === 0) return;

    // Draw connecting line for all points to be drawn
    if (pointsToDraw.length > 1) {
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        pointsToDraw.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    pointsToDraw.forEach((point) => {
      const isActuallyTheOverallMostRecent = (point.indexInAllTimesReversed === 0);
      const isPB = point.isPB;

      let pointRadius = 4;
      let pointBorderColor = '#0088ff'; // Default color
      let pointFillColor = '#000000';
      let shadowBlur = 0;
      let shadowColor = 'transparent';
      let customLineWidth = 2;

      if (isActuallyTheOverallMostRecent) {
        pointRadius = 7;
        pointBorderColor = '#FFFF00'; // Bright yellow
        shadowBlur = 10;
        shadowColor = '#FFFF00';
        customLineWidth = 3;
      } else if (isPB) {
        pointBorderColor = '#00ff88'; // Green for PBs
        pointRadius = 5; 
        customLineWidth = 2; // Or 2.5
      }

      ctx.shadowBlur = shadowBlur;
      ctx.shadowColor = shadowColor;

      ctx.fillStyle = pointFillColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = pointBorderColor;
      ctx.lineWidth = customLineWidth;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.shadowBlur = 0; // Reset shadow

      if (isPB && !isActuallyTheOverallMostRecent) { // Small inner dot for non-most-recent PBs
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, []); // Removed isPersonalBest from here, point.isPB is now pre-calculated


  const memoizedDrawAxes = useCallback((ctx, pointsToDraw, padding, chartWidth, chartHeight, adjustedMin, adjustedMax) => {
    if (!pointsToDraw || pointsToDraw.length === 0) return;
    ctx.fillStyle = "#888888"; ctx.font = "11px 'SF Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    const labelCount = Math.min(6, pointsToDraw.length);
    if (labelCount > 0) {
        for (let i = 0; i < labelCount; i++) {
            const pointIndex = Math.floor((pointsToDraw.length - 1) * (i / Math.max(1, labelCount - 1)));
            const point = pointsToDraw[pointIndex];
            const solveDisplayNumber = point.solve; 
            const x = point.x;
            ctx.fillText(solveDisplayNumber.toString(), x, padding.top + chartHeight + 10);
        }
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    const yLabelCount = 5;
    for (let i = 0; i < yLabelCount; i++) {
      const value = adjustedMin + (adjustedMax - adjustedMin) * (i / (yLabelCount - 1));
      const y = padding.top + chartHeight - (i / (yLabelCount - 1)) * chartHeight;
      ctx.fillText(formatTime(value), padding.left - 10, y);
    }
    ctx.fillStyle = "#aaaaaa"; ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Solve Number", padding.left + chartWidth / 2, padding.top + chartHeight + 25);
    ctx.save(); ctx.translate(15, padding.top + chartHeight / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("Time", 0, 0); ctx.restore();
  }, [formatTime]);
  

  const executeDraw = useCallback((currentProgress) => {
    const canvas = canvasRef.current;
    if (!canvas || !chartRenderData) return;
    const ctx = canvas.getContext('2d');
    const { padding, chartWidth, chartHeight, adjustedMin, adjustedMax, adjustedRange, width, height } = chartRenderData;
    
    ctx.clearRect(0, 0, width, height);

    const pointsToRenderCount = Math.floor(allCalculatedPoints.length * currentProgress);
    const pointsToDraw = allCalculatedPoints.slice(0, pointsToRenderCount);

    memoizedDrawGrid(ctx, padding, chartWidth, chartHeight, adjustedMin, adjustedMax, pointsToDraw);
    memoizedDrawTrendLine(ctx, pointsToDraw, padding, chartWidth, chartHeight, adjustedMin, adjustedRange);
    memoizedDrawDataLine(ctx, pointsToDraw); 
    memoizedDrawAxes(ctx, pointsToDraw, padding, chartWidth, chartHeight, adjustedMin, adjustedMax);

  }, [chartRenderData, allCalculatedPoints, memoizedDrawGrid, memoizedDrawTrendLine, memoizedDrawDataLine, memoizedDrawAxes]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const allTimesReversed = times.slice().reverse(); // Newest solve is at index 0

    if (!times || times.length === 0) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
      memoizedDrawEmptyChart(ctx, canvas);
      setAllCalculatedPoints([]); setChartRenderData(null); return;
    }

    const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;

    const recentTimes = times.slice(0, 50).reverse(); // Oldest of the 50 is at index 0
    const timeValues = recentTimes.map(t => t.time);
    const minTime = Math.min(...timeValues); const maxTime = Math.max(...timeValues);
    const timeRange = Math.max(1, maxTime - minTime); const yPadding = timeRange * 0.1;
    const adjustedMin = Math.max(0, minTime - yPadding); const adjustedMax = maxTime + yPadding;
    const adjustedRange = Math.max(1, adjustedMax - adjustedMin);
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    setChartRenderData({ padding, chartWidth, chartHeight, adjustedMin, adjustedMax, adjustedRange, width: rect.width, height: rect.height, recentTimes });

    const points = [];
    recentTimes.forEach((timeItem, indexInRecentTimes) => { // timeItem is oldest of the recentTimes at index 0
      const x = padding.left + (indexInRecentTimes / Math.max(1, recentTimes.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((timeItem.time - adjustedMin) / Math.max(1, adjustedRange)) * chartHeight;
      
      const indexInAllReversed = allTimesReversed.findIndex(t => t.id === timeItem.id);
      const isPB = isPersonalBest(timeItem.time, indexInAllReversed, allTimesReversed);
      
      points.push({ 
        x, y, 
        time: timeItem.time, 
        id: timeItem.id,
        solve: times.length - indexInAllReversed, // Corrected: Overall solve number (1 = oldest, times.length = newest)
        originalIndexInRecentTimes: indexInRecentTimes, 
        indexInAllTimesReversed: indexInAllReversed, // 0 = newest overall
        isPB: isPB 
      });
    });
    setAllCalculatedPoints(points);

  }, [times, memoizedDrawEmptyChart, isPersonalBest]);


  const animate = useCallback(() => {
    const elapsed = performance.now() - animationStartTimeRef.current;
    let progress = Math.min(elapsed / animationDurationRef.current, 1);
    setAnimationProgress(progress);
    if (progress < 1) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false); setAnimationProgress(1);
    }
  }, []);

  useEffect(() => {
    if (times.length > prevTimesLengthRef.current && prevTimesLengthRef.current !== 0) {
      setIsAnimating(true); setAnimationProgress(0);
      animationStartTimeRef.current = performance.now();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else if (prevTimesLengthRef.current === 0 && times.length > 0) {
      setIsAnimating(false); setAnimationProgress(1);
    }
    prevTimesLengthRef.current = times.length;
    return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [times, animate]);

  useEffect(() => {
    if (chartRenderData && allCalculatedPoints.length > 0) {
      if (isAnimating) {
        executeDraw(animationProgress);
      } else {
        executeDraw(1); 
      }
    } else if (canvasRef.current && times.length === 0) {
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
        memoizedDrawEmptyChart(ctx, canvas);
    }
  }, [isAnimating, animationProgress, executeDraw, chartRenderData, allCalculatedPoints, times.length, memoizedDrawEmptyChart]);

  const handleMouseMove = (e) => {
    if (!allCalculatedPoints || !chartRenderData || !tooltipRef.current || !canvasRef.current) return;
    const tooltip = tooltipRef.current; const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    let closestPoint = null; let minDistance = Infinity;
    const pointsToConsiderCount = isAnimating ? Math.floor(allCalculatedPoints.length * animationProgress) : allCalculatedPoints.length;
    const visiblePoints = allCalculatedPoints.slice(0, pointsToConsiderCount);

    visiblePoints.forEach(point => {
      const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
      if (distance < minDistance && distance < 20) { 
        minDistance = distance; closestPoint = point;
      }
    });
    if (closestPoint) {
      tooltip.innerHTML = `<div class="${styles.tooltipSolve}">Solve #${closestPoint.solve}</div><div class="${styles.tooltipTime}">${formatTime(closestPoint.time)}</div>`;
      tooltip.style.left = `${closestPoint.x}px`; tooltip.style.top = `${closestPoint.y}px`;
      tooltip.classList.add(styles.visible);
    } else {
      tooltip.classList.remove(styles.visible);
    }
  };

  const handleMouseLeave = () => { if (tooltipRef.current) tooltipRef.current.classList.remove(styles.visible); };

  return (
    <div className={styles.chartContainer}>
      <canvas ref={canvasRef} className={styles.performanceChartCanvas} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      <div ref={tooltipRef} className={styles.chartTooltip}></div>
    </div>
  );
};

export default PerformanceChart;
