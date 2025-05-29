import React, { useEffect, useRef, useState } from 'react';
import styles from './PerformanceChart.module.css';

const PerformanceChart = ({ times, formatTime }) => {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const [chartData, setChartData] = useState(null); // For storing data needed for tooltip
  const [chartPoints, setChartPoints] = useState([]); // For storing drawn points for tooltip

  const drawEmptyChart = (ctx, canvas) => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#666666";
    ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Complete some solves to see your progress",
      rect.width / 2,
      rect.height / 2
    );
  };

  const drawGrid = (ctx, padding, chartWidth, chartHeight, adjustedMin, adjustedMax, recentTimes) => {
    const gridLines = 4;
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    const verticalLines = Math.min(10, (recentTimes?.length || 1) - 1);
     if (verticalLines > 0) {
        for (let i = 0; i <= verticalLines; i++) {
            const x = padding.left + (chartWidth / verticalLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();
        }
    }
  };

  const drawTrendLine = (ctx, times, padding, chartWidth, chartHeight, adjustedMin, adjustedRange) => {
    if (times.length < 2) return;
    const n = times.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    times.forEach((time, index) => {
      const x = index;
      const yVal = time.time;
      sumX += x;
      sumY += yVal;
      sumXY += x * yVal;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    const startY = intercept;
    const endY = slope * (n - 1) + intercept;
    const startYPos = padding.top + chartHeight - ((startY - adjustedMin) / adjustedRange) * chartHeight;
    const endYPos = padding.top + chartHeight - ((endY - adjustedMin) / adjustedRange) * chartHeight;
    ctx.moveTo(padding.left, startYPos);
    ctx.lineTo(padding.left + chartWidth, endYPos);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  const isPersonalBest = (timeValue, index, allTimes) => {
    const currentSolveTime = timeValue;
    const previousSolves = allTimes.slice(0, index).map(t => t.time);
    if (previousSolves.length === 0) return true;
    return currentSolveTime < Math.min(...previousSolves);
  };
  
  const drawDataLine = (ctx, localTimes, padding, chartWidth, chartHeight, adjustedMin, adjustedRange) => {
    const points = [];
    localTimes.forEach((time, index) => {
      const x = padding.left + (index / Math.max(1, localTimes.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((time.time - adjustedMin) / Math.max(1, adjustedRange)) * chartHeight;
      points.push({ x, y, time: time.time, solve: localTimes.length - index, originalIndex: index });
    });

    setChartPoints(points); // Save points for tooltip

    if (points.length > 1) {
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    points.forEach((point) => {
      // Personal best logic needs to be relative to the original full times array, not just 'recentTimes'
      // This requires passing the full 'times' array or modifying 'isPersonalBest'
      const pb = isPersonalBest(point.time, point.originalIndex, times.slice().reverse()); // Use original times, reversed to match chart order

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(point.x, point.y, pb ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = pb ? "#00ff88" : "#0088ff";
      ctx.lineWidth = pb ? 3 : 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pb ? 6 : 4, 0, 2 * Math.PI);
      ctx.stroke();
      if (pb) {
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  const drawAxes = (ctx, localTimes, padding, chartWidth, chartHeight, adjustedMin, adjustedMax) => {
    ctx.fillStyle = "#888888";
    ctx.font = "11px 'SF Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const labelCount = Math.min(6, localTimes.length);
    if (labelCount > 0) {
        for (let i = 0; i < labelCount; i++) {
            const solveIndex = Math.floor((localTimes.length - 1) * (i / Math.max(1, labelCount - 1)));
            const solveNumber = times.length - (localTimes.length - 1 - solveIndex); // Calculate original solve number
            const x = padding.left + (solveIndex / Math.max(1, localTimes.length - 1)) * chartWidth;
            ctx.fillText(solveNumber.toString(), x, padding.top + chartHeight + 10);
        }
    }
    

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yLabelCount = 5;
    for (let i = 0; i < yLabelCount; i++) {
      const value = adjustedMin + (adjustedMax - adjustedMin) * (i / (yLabelCount - 1));
      const y = padding.top + chartHeight - (i / (yLabelCount - 1)) * chartHeight;
      ctx.fillText(formatTime(value), padding.left - 10, y);
    }

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Solve Number", padding.left + chartWidth / 2, padding.top + chartHeight + 25);
    ctx.save();
    ctx.translate(15, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Time", 0, 0);
    ctx.restore();
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (!times || times.length === 0) {
      drawEmptyChart(ctx, canvas);
      setChartPoints([]); // Clear points if no times
      return;
    }

    const recentTimes = times.slice(0, 50).reverse(); // Show last 50, reversed for chronological order on chart
    const timeValues = recentTimes.map(t => t.time);

    if (timeValues.length === 0) {
        drawEmptyChart(ctx, canvas);
        setChartPoints([]);
        return;
    }

    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const timeRange = Math.max(1, maxTime - minTime); // Avoid division by zero if all times are same
    const yPadding = timeRange * 0.1;
    const adjustedMin = Math.max(0, minTime - yPadding);
    const adjustedMax = maxTime + yPadding;
    const adjustedRange = Math.max(1, adjustedMax - adjustedMin);

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    setChartData({ padding, chartWidth, chartHeight, adjustedMin, adjustedMax, adjustedRange, width: rect.width, height: rect.height });

    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, padding, chartWidth, chartHeight, adjustedMin, adjustedMax, recentTimes);
    drawTrendLine(ctx, recentTimes, padding, chartWidth, chartHeight, adjustedMin, adjustedRange);
    drawDataLine(ctx, recentTimes, padding, chartWidth, chartHeight, adjustedMin, adjustedRange);
    drawAxes(ctx, recentTimes, padding, chartWidth, chartHeight, adjustedMin, adjustedMax);

  }, [times, formatTime]); // Redraw chart when times or formatTime change

  const handleMouseMove = (e) => {
    if (!chartPoints || !chartData || !tooltipRef.current || !canvasRef.current) return;
    const tooltip = tooltipRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestPoint = null;
    let minDistance = Infinity;

    chartPoints.forEach(point => {
      const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
      if (distance < minDistance && distance < 20) { // 20px hover radius
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      tooltip.innerHTML = `
        <div class="${styles.tooltipSolve}">Solve #${closestPoint.solve}</div>
        <div class="${styles.tooltipTime}">${formatTime(closestPoint.time)}</div>
      `;
      // Position tooltip relative to the canvas, not the viewport
      tooltip.style.left = `${closestPoint.x}px`; 
      tooltip.style.top = `${closestPoint.y}px`;
      tooltip.classList.add(styles.visible);
    } else {
      tooltip.classList.remove(styles.visible);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove(styles.visible);
    }
  };

  return (
    <div className={styles.chartContainer}>
      <canvas 
        ref={canvasRef} 
        className={styles.performanceChartCanvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        // Set initial width and height for SSR or if rect calculation is delayed
        width="760" 
        height="300" 
      />
      <div ref={tooltipRef} className={styles.chartTooltip}></div>
    </div>
  );
};

export default PerformanceChart;
