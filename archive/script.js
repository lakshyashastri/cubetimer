class CubeTimer {
	constructor() {
		this.timer = document.getElementById("timer");
		this.totalSolvesElement = document.getElementById("total-solves");
		this.bestTimeElement = document.getElementById("best-time");
		this.worstTimeElement = document.getElementById("worst-time");
		this.medianTimeElement = document.getElementById("median-time");
		this.averageTimeElement = document.getElementById("average-time");
		this.timesListElement = document.getElementById("times-list");
		this.clearButton = document.getElementById("clear-times");

		// Average elements
		this.averagesContainer = document.getElementById("averages-container");
		this.noAveragesMessage = document.getElementById("no-averages-message");
		this.avgContainers = {
			5: document.getElementById("avg5-container"),
			12: document.getElementById("avg12-container"),
			25: document.getElementById("avg25-container"),
			50: document.getElementById("avg50-container"),
			100: document.getElementById("avg100-container")
		};
		this.currentAvgElements = {
			5: document.getElementById("current-avg5"),
			12: document.getElementById("current-avg12"),
			25: document.getElementById("current-avg25"),
			50: document.getElementById("current-avg50"),
			100: document.getElementById("current-avg100")
		};
		this.bestAvgElements = {
			5: document.getElementById("best-avg5"),
			12: document.getElementById("best-avg12"),
			25: document.getElementById("best-avg25"),
			50: document.getElementById("best-avg50"),
			100: document.getElementById("best-avg100")
		};

		// Panel elements
		this.overviewCard = document.getElementById("overview-card");
		this.averagesCard = document.getElementById("averages-card");
		this.chartCard = document.getElementById("chart-card");
		this.timesPanel = document.getElementById("times-panel");
		this.statsFab = document.getElementById("stats-fab");
		this.closeOverview = document.getElementById("close-overview");
		this.closeAverages = document.getElementById("close-averages");
		this.closeChart = document.getElementById("close-chart");
		this.closeTimes = document.getElementById("close-times");

		// Chart elements
		this.chartCanvas = document.getElementById("performance-chart");
		this.chartCtx = this.chartCanvas.getContext("2d");
		this.chartTooltip = document.getElementById("chart-tooltip");

		this.state = "ready"; // ready, preparing, running, stopped
		this.startTime = null;
		this.endTime = null;
		this.prepareStartTime = null;
		this.interval = null;
		this.isSpacePressed = false;
		this.minPrepareTime = 100; // Minimum time to hold spacebar (ms)

		this.times = this.loadTimes();
		this.bestAverages = this.loadBestAverages();

		this.initEventListeners();
		this.initPanels();
		this.updateDisplay();
		this.updateStats();
		this.renderTimesList();
	}

	initEventListeners() {
		// Keyboard events
		document.addEventListener("keydown", e => this.handleKeyDown(e));
		document.addEventListener("keyup", e => this.handleKeyUp(e));

		// Clear button
		this.clearButton.addEventListener("click", () => this.clearAllTimes());

		// Prevent spacebar from scrolling the page
		document.addEventListener("keydown", e => {
			if (e.code === "Space") {
				e.preventDefault();
			}
		});
	}

	initPanels() {
		// Add event listeners for floating action buttons
		this.statsFab.addEventListener("click", () => this.toggleAllPanels());

		// Add event listeners for close buttons
		this.closeOverview.addEventListener("click", () =>
			this.hidePanel("overview")
		);
		this.closeAverages.addEventListener("click", () =>
			this.hidePanel("averages")
		);
		this.closeChart.addEventListener("click", () =>
			this.hidePanel("chart")
		);
		this.closeTimes.addEventListener("click", () =>
			this.hidePanel("times")
		);

		// Chart event listeners
		this.chartCanvas.addEventListener("mousemove", e =>
			this.handleChartMouseMove(e)
		);
		this.chartCanvas.addEventListener("mouseleave", () =>
			this.hideChartTooltip()
		);

		// Click outside functionality removed per user request
	}

	toggleAllPanels() {
		const overviewVisible = this.overviewCard.classList.contains("visible");
		const averagesVisible = this.averagesCard.classList.contains("visible");
		const chartVisible = this.chartCard.classList.contains("visible");
		const timesVisible = this.timesPanel.classList.contains("visible");

		if (
			overviewVisible ||
			averagesVisible ||
			chartVisible ||
			timesVisible
		) {
			// Hide all panels
			this.hidePanel("overview");
			this.hidePanel("averages");
			this.hidePanel("chart");
			this.hidePanel("times");
		} else {
			// Show all panels
			this.showPanel("overview");
			this.showPanel("averages");
			this.showPanel("chart");
			this.showPanel("times");
			this.drawChart();
		}
	}

	togglePanel(panelType) {
		const panel = this.getPanel(panelType);
		const isVisible = panel.classList.contains("visible");

		if (isVisible) {
			this.hidePanel(panelType);
		} else {
			this.showPanel(panelType);
		}
	}

	showPanel(panelType) {
		const panel = this.getPanel(panelType);
		panel.classList.add("visible");

		// Add body class for chart spacing
		if (panelType === "chart") {
			document.body.classList.add("chart-visible");
		}

		// Manage overview positioning for times panel
		this.updateTimesPosition();
	}

	hidePanel(panelType) {
		const panel = this.getPanel(panelType);
		panel.classList.remove("visible");

		// Remove body class for chart spacing
		if (panelType === "chart") {
			document.body.classList.remove("chart-visible");
		}

		// Manage overview positioning for times panel
		this.updateTimesPosition();
	}

	getPanel(panelType) {
		switch (panelType) {
			case "overview":
				return this.overviewCard;
			case "averages":
				return this.averagesCard;
			case "chart":
				return this.chartCard;
			case "times":
				return this.timesPanel;
			default:
				return null;
		}
	}

	handleKeyDown(e) {
		if (e.code !== "Space") return;

		// Prevent repeated keydown events
		if (this.isSpacePressed) return;
		this.isSpacePressed = true;

		if (this.state === "ready") {
			this.startPreparing();
		} else if (this.state === "running") {
			this.stopTimer();
		}
	}

	handleKeyUp(e) {
		if (e.code !== "Space") return;
		this.isSpacePressed = false;

		if (this.state === "preparing") {
			const prepareTime = Date.now() - this.prepareStartTime;
			if (prepareTime >= this.minPrepareTime) {
				this.startTimer();
			} else {
				this.resetToReady();
			}
		}
	}

	startPreparing() {
		this.state = "preparing";
		this.prepareStartTime = Date.now();
		this.timer.textContent = "HOLD...";
		this.timer.className = "timer preparing";
	}

	startTimer() {
		this.state = "running";
		this.startTime = performance.now();
		this.timer.className = "timer running";

		this.interval = setInterval(() => {
			const elapsed = performance.now() - this.startTime;
			this.timer.textContent = this.formatTime(elapsed);
		}, 10); // Update every 10ms for smooth display
	}

	stopTimer() {
		if (this.state !== "running") return;

		this.state = "stopped";
		this.endTime = performance.now();
		const finalTime = this.endTime - this.startTime;

		clearInterval(this.interval);

		this.timer.textContent = this.formatTime(finalTime);
		this.timer.className = "timer stopped";

		// Save the time
		this.saveTime(finalTime);

		// Reset to ready after a short delay
		setTimeout(() => this.resetToReady(), 2000);
	}

	resetToReady() {
		this.state = "ready";
		this.timer.textContent = "READY";
		this.timer.className = "timer ready";
		clearInterval(this.interval);
	}

	formatTime(milliseconds) {
		// Handle null, undefined, or NaN inputs directly
		if (
			milliseconds === null ||
			milliseconds === undefined ||
			isNaN(milliseconds)
		) {
			return "--";
		}

		const totalMs = Math.floor(milliseconds);
		const minutes = Math.floor(totalMs / 60000);
		const seconds = Math.floor((totalMs % 60000) / 1000);
		const centiseconds = Math.floor((totalMs % 1000) / 10);

		if (minutes > 0) {
			return `${minutes}:${seconds
				.toString()
				.padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
		} else {
			return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
		}
	}

	saveTime(time) {
		const timeEntry = {
			time: time,
			date: new Date().toISOString(),
			id: Date.now()
		};

		this.times.unshift(timeEntry); // Add to beginning of array
		this.saveTimes();
		this.updateStats();
		this.renderTimesList();

		// Update chart with animation if visible
		this.updateChartWithAnimation();
	}

	deleteTime(id) {
		this.times = this.times.filter(time => time.id !== id);
		this.saveTimes();
		this.updateStats();
		this.renderTimesList();
	}

	clearAllTimes() {
		if (this.times.length === 0) return;

		if (
			confirm(
				"Are you sure you want to clear all times? This will also reset all best averages."
			)
		) {
			this.times = [];
			this.bestAverages = {};
			this.saveTimes();
			this.saveBestAverages();
			this.updateStats();
			this.renderTimesList();
		}
	}

	loadTimes() {
		const saved = localStorage.getItem("cubeTimerTimes");
		return saved ? JSON.parse(saved) : [];
	}

	saveTimes() {
		localStorage.setItem("cubeTimerTimes", JSON.stringify(this.times));
	}

	loadBestAverages() {
		const saved = localStorage.getItem("cubeTimerBestAverages");
		return saved ? JSON.parse(saved) : {};
	}

	saveBestAverages() {
		localStorage.setItem(
			"cubeTimerBestAverages",
			JSON.stringify(this.bestAverages)
		);
	}

	updateStats() {
		const totalSolves = this.times.length;
		this.totalSolvesElement.textContent = totalSolves;

		if (totalSolves === 0) {
			this.bestTimeElement.textContent = "--";
			this.worstTimeElement.textContent = "--";
			this.medianTimeElement.textContent = "--";
			this.averageTimeElement.textContent = "--";
			this.hideAveragesContainer();
			return;
		}

		// Calculate best and worst times
		const timeValues = this.times.map(t => t.time);
		const bestTime = Math.min(...timeValues);
		const worstTime = Math.max(...timeValues);
		this.bestTimeElement.textContent = this.formatTime(bestTime);
		this.worstTimeElement.textContent = this.formatTime(worstTime);

		// Calculate median time
		const median = this.calculateMedian(timeValues);
		this.medianTimeElement.textContent = this.formatTime(median);

		// Calculate overall average
		const average = timeValues.reduce((sum, t) => sum + t, 0) / totalSolves;
		this.averageTimeElement.textContent = this.formatTime(average);

		// Update averages
		this.updateAverages();
	}

	// Helper to calculate median from an array of time values
	calculateMedian(timeValues) {
		if (!timeValues || timeValues.length === 0) return null;

		const sortedValues = [...timeValues].sort((a, b) => a - b);
		const length = sortedValues.length;

		if (length % 2 === 0) {
			// Even number of values - return average of two middle values
			const mid1 = sortedValues[length / 2 - 1];
			const mid2 = sortedValues[length / 2];
			return (mid1 + mid2) / 2;
		} else {
			// Odd number of values - return middle value
			return sortedValues[Math.floor(length / 2)];
		}
	}

	// Helper to calculate average from an array of time values according to standard trimming rules
	calculateAverageFromValues(timeValues, N) {
		if (!timeValues || timeValues.length < N) return null;

		let valuesToAverage = [...timeValues]; // Operate on a copy, ensure it's N items

		if (N >= 5) {
			valuesToAverage.sort((a, b) => a - b);
			const trimCount = Math.ceil(N * 0.05); // Standard 5% trim from each end

			if (valuesToAverage.length <= trimCount * 2) return null; // Not enough items after trimming

			const trimmedTimes = valuesToAverage.slice(
				trimCount,
				valuesToAverage.length - trimCount
			);

			if (trimmedTimes.length === 0) return null; // Should be caught by above, but defensive
			return (
				trimmedTimes.reduce((sum, time) => sum + time, 0) /
				trimmedTimes.length
			);
		} else {
			// For N < 5, calculate a simple mean of the N items
			if (valuesToAverage.length === 0) return null; // Should be caught by initial check
			return (
				valuesToAverage.reduce((sum, time) => sum + time, 0) /
				valuesToAverage.length
			);
		}
	}

	// Calculates the average for the 'N' most recent solves
	calculateAverage(N) {
		if (this.times.length < N) return null;
		const recentTimesValues = this.times.slice(0, N).map(t => t.time);
		return this.calculateAverageFromValues(recentTimesValues, N);
	}

	// Finds the best average of 'N' from all possible contiguous segments in the current this.times list
	findOverallBestAverage(N) {
		if (this.times.length < N) return null;

		let overallBest = null;
		for (let i = 0; i <= this.times.length - N; i++) {
			const windowTimeEntries = this.times.slice(i, i + N);
			const windowTimeValues = windowTimeEntries.map(t => t.time);

			const currentWindowAvg = this.calculateAverageFromValues(
				windowTimeValues,
				N
			);

			if (currentWindowAvg !== null) {
				if (overallBest === null || currentWindowAvg < overallBest) {
					overallBest = currentWindowAvg;
				}
			}
		}
		return overallBest;
	}

	updateAverages() {
		const avgSizes = [5, 12, 25, 50, 100];
		let hasAnyAverage = false;

		for (const size of avgSizes) {
			if (this.times.length >= size) {
				hasAnyAverage = true;
				const currentNMostRecentAvg = this.calculateAverage(size);
				const newOverallBestForSize = this.findOverallBestAverage(size);

				this.bestAverages[size] = newOverallBestForSize; // Update stored best

				this.currentAvgElements[size].textContent = this.formatTime(
					currentNMostRecentAvg
				);
				this.bestAvgElements[size].textContent = this.formatTime(
					newOverallBestForSize
				);
				this.avgContainers[size].style.display = "flex";
			} else {
				this.avgContainers[size].style.display = "none";
				this.bestAverages[size] = null; // Clear stored best if not enough solves
			}
		}
		this.saveBestAverages(); // Save all potentially updated bestAverages

		if (hasAnyAverage) {
			this.averagesContainer.style.display = "flex";
			this.noAveragesMessage.style.display = "none";
		} else {
			this.hideAveragesContainer();
		}
	}

	hideAveragesContainer() {
		this.averagesContainer.style.display = "none";
		this.noAveragesMessage.style.display = "block";
		for (const container of Object.values(this.avgContainers)) {
			container.style.display = "none";
		}
	}

	renderTimesList() {
		this.timesListElement.innerHTML = "";

		if (this.times.length === 0) {
			this.timesListElement.innerHTML =
				'<p style="color: #718096; font-style: italic;">No times recorded yet</p>';
			return;
		}

		this.times.forEach((timeEntry, index) => {
			const timeDiv = document.createElement("div");
			timeDiv.className = "time-entry";

			const date = new Date(timeEntry.date);
			const timeString = date.toLocaleTimeString();

			timeDiv.innerHTML = `
                <span class="time-index">#${this.times.length - index}</span>
                <span class="time-value">${this.formatTime(
					timeEntry.time
				)}</span>
                <button class="time-delete" onclick="cubeTimer.deleteTime(${
					timeEntry.id
				})" title="Delete time">×</button>
            `;

			this.timesListElement.appendChild(timeDiv);
		});
	}

	updateDisplay() {
		this.resetToReady();
	}

	// Panel positioning management
	updateTimesPosition() {
		const overviewVisible = this.overviewCard.classList.contains("visible");
		const timesVisible = this.timesPanel.classList.contains("visible");

		// Only move times panel if it's visible and overview is hidden
		if (timesVisible && !overviewVisible) {
			document.body.classList.add("overview-hidden");
		} else {
			document.body.classList.remove("overview-hidden");
		}
	}

	// Chart methods
	updateChartWithAnimation() {
		// Only update if chart is visible
		if (!this.chartCard.classList.contains("visible")) {
			return;
		}

		// Store animation state
		this.isAnimating = true;
		this.animationProgress = 0;
		this.animationStartTime = performance.now();
		this.animationDuration =
			Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000; // Random time between 3 and 6 seconds

		// Start animation loop
		this.animateChart();
	}

	animateChart() {
		if (!this.isAnimating) return;

		const currentTime = performance.now();
		const elapsed = currentTime - this.animationStartTime;
		this.animationProgress = Math.min(elapsed / this.animationDuration, 1);

		// Easing function for smooth animation
		const easeOutQuart = 1 - Math.pow(1 - this.animationProgress, 4);

		// Draw chart with animation progress
		this.drawChartAnimated(easeOutQuart);

		if (this.animationProgress < 1) {
			requestAnimationFrame(() => this.animateChart());
		} else {
			this.isAnimating = false;
			// Final draw without animation
			this.drawChart();
		}
	}

	drawChartAnimated(progress) {
		if (!this.chartCtx || this.times.length === 0) {
			this.drawEmptyChart();
			return;
		}

		const canvas = this.chartCanvas;
		const ctx = this.chartCtx;
		const dpr = window.devicePixelRatio || 1;

		// Set up high DPI canvas
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
		canvas.style.width = rect.width + "px";
		canvas.style.height = rect.height + "px";

		const width = rect.width;
		const height = rect.height;
		const padding = { top: 20, right: 20, bottom: 40, left: 60 };
		const chartWidth = width - padding.left - padding.right;
		const chartHeight = height - padding.top - padding.bottom;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Get last 50 solves for the chart
		const recentTimes = this.times.slice(0, 50).reverse();
		const timeValues = recentTimes.map(t => t.time);

		if (timeValues.length === 0) {
			this.drawEmptyChart();
			return;
		}

		const minTime = Math.min(...timeValues);
		const maxTime = Math.max(...timeValues);
		const timeRange = maxTime - minTime;
		const yPadding = timeRange * 0.1;
		const adjustedMin = Math.max(0, minTime - yPadding);
		const adjustedMax = maxTime + yPadding;
		const adjustedRange = adjustedMax - adjustedMin;

		// Store chart data for interactions
		this.chartData = {
			times: recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax,
			adjustedRange,
			width,
			height
		};

		// Draw grid lines
		this.drawGrid(
			ctx,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax
		);

		// Draw trend line
		this.drawTrendLine(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedRange
		);

		// Draw data points with animation
		this.drawDataLineAnimated(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedRange,
			progress
		);

		// Draw axes labels
		this.drawAxes(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax
		);
	}

	drawDataLineAnimated(
		ctx,
		times,
		padding,
		chartWidth,
		chartHeight,
		adjustedMin,
		adjustedRange,
		progress
	) {
		const points = [];

		// Calculate points
		times.forEach((time, index) => {
			const x = padding.left + (index / (times.length - 1)) * chartWidth;
			const y =
				padding.top +
				chartHeight -
				((time.time - adjustedMin) / adjustedRange) * chartHeight;
			points.push({ x, y, time: time.time, solve: times.length - index });
		});

		// Store points for hover interactions
		this.chartPoints = points;

		// Determine how many points to show based on animation progress
		const pointsToShow = Math.floor(points.length * progress);
		const showingPoints = points.slice(0, pointsToShow);

		// If we're showing the last point (newest), add special animation effect
		const isShowingNewest =
			pointsToShow === points.length && points.length > 1;
		const newestPoint = points[points.length - 1];

		// Draw connecting line up to animated progress
		if (showingPoints.length > 1) {
			ctx.strokeStyle = "#0088ff";
			ctx.lineWidth = 2;
			ctx.globalAlpha = 0.8;

			ctx.beginPath();
			showingPoints.forEach((point, index) => {
				if (index === 0) {
					ctx.moveTo(point.x, point.y);
				} else {
					ctx.lineTo(point.x, point.y);
				}
			});
			ctx.stroke();
		}

		// Draw data points
		ctx.globalAlpha = 1;
		showingPoints.forEach((point, index) => {
			const isPersonalBest = this.isPersonalBest(point.time, index);
			const isNewest =
				index === showingPoints.length - 1 && isShowingNewest;

			// Special animation for newest point
			let pointRadius = isPersonalBest ? 6 : 4;
			let glowIntensity = 0;

			if (isNewest) {
				// Pulse effect for the newest point
				const pulseProgress = (progress * 3) % 1; // Faster pulse
				pointRadius += Math.sin(pulseProgress * Math.PI) * 3;
				glowIntensity = Math.sin(pulseProgress * Math.PI) * 0.5;
			}

			// Glow effect for newest point
			if (isNewest && glowIntensity > 0) {
				ctx.shadowColor = isPersonalBest ? "#00ff88" : "#0088ff";
				ctx.shadowBlur = 20 * glowIntensity;
			}

			// Point background
			ctx.fillStyle = "#000000";
			ctx.beginPath();
			ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
			ctx.fill();

			// Point border
			ctx.strokeStyle = isPersonalBest ? "#00ff88" : "#0088ff";
			ctx.lineWidth = isPersonalBest ? 3 : 2;
			ctx.beginPath();
			ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
			ctx.stroke();

			// Reset shadow
			ctx.shadowBlur = 0;

			// PB indicator
			if (isPersonalBest) {
				ctx.fillStyle = "#00ff88";
				ctx.beginPath();
				ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
				ctx.fill();
			}
		});
	}

	drawChart() {
		if (!this.chartCtx || this.times.length === 0) {
			this.drawEmptyChart();
			return;
		}

		const canvas = this.chartCanvas;
		const ctx = this.chartCtx;
		const dpr = window.devicePixelRatio || 1;

		// Set up high DPI canvas
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
		canvas.style.width = rect.width + "px";
		canvas.style.height = rect.height + "px";

		const width = rect.width;
		const height = rect.height;
		const padding = { top: 20, right: 20, bottom: 40, left: 60 };
		const chartWidth = width - padding.left - padding.right;
		const chartHeight = height - padding.top - padding.bottom;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Get last 50 solves for the chart
		const recentTimes = this.times.slice(0, 50).reverse();
		const timeValues = recentTimes.map(t => t.time);

		if (timeValues.length === 0) {
			this.drawEmptyChart();
			return;
		}

		const minTime = Math.min(...timeValues);
		const maxTime = Math.max(...timeValues);
		const timeRange = maxTime - minTime;
		const yPadding = timeRange * 0.1; // 10% padding
		const adjustedMin = Math.max(0, minTime - yPadding);
		const adjustedMax = maxTime + yPadding;
		const adjustedRange = adjustedMax - adjustedMin;

		// Store chart data for interactions
		this.chartData = {
			times: recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax,
			adjustedRange,
			width,
			height
		};

		// Draw grid lines
		this.drawGrid(
			ctx,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax
		);

		// Draw trend line
		this.drawTrendLine(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedRange
		);

		// Draw data points and line
		this.drawDataLine(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedRange
		);

		// Draw axes labels
		this.drawAxes(
			ctx,
			recentTimes,
			padding,
			chartWidth,
			chartHeight,
			adjustedMin,
			adjustedMax
		);
	}

	drawEmptyChart() {
		const ctx = this.chartCtx;
		const canvas = this.chartCanvas;
		const rect = canvas.getBoundingClientRect();

		ctx.clearRect(0, 0, rect.width, rect.height);
		ctx.fillStyle = "#666666";
		ctx.font =
			"16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(
			"Complete some solves to see your progress",
			rect.width / 2,
			rect.height / 2
		);
	}

	drawGrid(ctx, padding, chartWidth, chartHeight, adjustedMin, adjustedMax) {
		const gridLines = 4;
		ctx.strokeStyle = "#222222";
		ctx.lineWidth = 1;

		// Horizontal grid lines
		for (let i = 0; i <= gridLines; i++) {
			const y = padding.top + (chartHeight / gridLines) * i;
			ctx.beginPath();
			ctx.moveTo(padding.left, y);
			ctx.lineTo(padding.left + chartWidth, y);
			ctx.stroke();
		}

		// Vertical grid lines
		const verticalLines = Math.min(10, this.chartData.times.length - 1);
		for (let i = 0; i <= verticalLines; i++) {
			const x = padding.left + (chartWidth / verticalLines) * i;
			ctx.beginPath();
			ctx.moveTo(x, padding.top);
			ctx.lineTo(x, padding.top + chartHeight);
			ctx.stroke();
		}
	}

	drawTrendLine(
		ctx,
		times,
		padding,
		chartWidth,
		chartHeight,
		adjustedMin,
		adjustedRange
	) {
		if (times.length < 2) return;

		// Calculate linear regression
		const n = times.length;
		let sumX = 0,
			sumY = 0,
			sumXY = 0,
			sumXX = 0;

		times.forEach((time, index) => {
			const x = index;
			const y = time.time;
			sumX += x;
			sumY += y;
			sumXY += x * y;
			sumXX += x * x;
		});

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		// Draw trend line
		ctx.strokeStyle = "#ff8800";
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.globalAlpha = 0.6;

		ctx.beginPath();
		const startY = intercept;
		const endY = slope * (n - 1) + intercept;

		const startYPos =
			padding.top +
			chartHeight -
			((startY - adjustedMin) / adjustedRange) * chartHeight;
		const endYPos =
			padding.top +
			chartHeight -
			((endY - adjustedMin) / adjustedRange) * chartHeight;

		ctx.moveTo(padding.left, startYPos);
		ctx.lineTo(padding.left + chartWidth, endYPos);
		ctx.stroke();

		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
	}

	drawDataLine(
		ctx,
		times,
		padding,
		chartWidth,
		chartHeight,
		adjustedMin,
		adjustedRange
	) {
		const points = [];

		// Calculate points
		times.forEach((time, index) => {
			const x = padding.left + (index / (times.length - 1)) * chartWidth;
			const y =
				padding.top +
				chartHeight -
				((time.time - adjustedMin) / adjustedRange) * chartHeight;
			points.push({ x, y, time: time.time, solve: times.length - index });
		});

		// Store points for hover interactions
		this.chartPoints = points;

		// Draw connecting line
		ctx.strokeStyle = "#0088ff";
		ctx.lineWidth = 2;
		ctx.globalAlpha = 0.8;

		ctx.beginPath();
		points.forEach((point, index) => {
			if (index === 0) {
				ctx.moveTo(point.x, point.y);
			} else {
				ctx.lineTo(point.x, point.y);
			}
		});
		ctx.stroke();

		// Draw data points
		ctx.globalAlpha = 1;
		points.forEach((point, index) => {
			const isPersonalBest = this.isPersonalBest(point.time, index);

			// Point background
			ctx.fillStyle = "#000000";
			ctx.beginPath();
			ctx.arc(point.x, point.y, isPersonalBest ? 6 : 4, 0, 2 * Math.PI);
			ctx.fill();

			// Point border
			ctx.strokeStyle = isPersonalBest ? "#00ff88" : "#0088ff";
			ctx.lineWidth = isPersonalBest ? 3 : 2;
			ctx.beginPath();
			ctx.arc(point.x, point.y, isPersonalBest ? 6 : 4, 0, 2 * Math.PI);
			ctx.stroke();

			// PB indicator
			if (isPersonalBest) {
				ctx.fillStyle = "#00ff88";
				ctx.beginPath();
				ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
				ctx.fill();
			}
		});
	}

	drawAxes(
		ctx,
		times,
		padding,
		chartWidth,
		chartHeight,
		adjustedMin,
		adjustedMax
	) {
		ctx.fillStyle = "#888888";
		ctx.font = "11px 'SF Mono', monospace";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";

		// X-axis labels (solve numbers)
		const labelCount = Math.min(6, times.length);
		for (let i = 0; i < labelCount; i++) {
			const solveIndex = Math.floor(
				(times.length - 1) * (i / (labelCount - 1))
			);
			const solve = times[solveIndex];
			const solveNumber = times.length - solveIndex;
			const x =
				padding.left + (solveIndex / (times.length - 1)) * chartWidth;
			ctx.fillText(
				solveNumber.toString(),
				x,
				padding.top + chartHeight + 10
			);
		}

		// Y-axis labels (times)
		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		const yLabelCount = 5;
		for (let i = 0; i < yLabelCount; i++) {
			const value =
				adjustedMin +
				(adjustedMax - adjustedMin) * (i / (yLabelCount - 1));
			const y =
				padding.top +
				chartHeight -
				(i / (yLabelCount - 1)) * chartHeight;
			ctx.fillText(this.formatTime(value), padding.left - 10, y);
		}

		// Axis titles
		ctx.fillStyle = "#aaaaaa";
		ctx.font =
			"12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText(
			"Solve Number",
			padding.left + chartWidth / 2,
			padding.top + chartHeight + 25
		);

		ctx.save();
		ctx.translate(15, padding.top + chartHeight / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Time", 0, 0);
		ctx.restore();
	}

	isPersonalBest(time, currentIndex) {
		// Check if this time was a personal best at the time it was achieved
		const futureTime = this.times.slice(
			0,
			this.times.length - currentIndex
		);
		const previousTimes = futureTime.slice(1); // Exclude current time

		if (previousTimes.length === 0) return true; // First solve is always PB

		const previousBest = Math.min(...previousTimes.map(t => t.time));
		return time < previousBest;
	}

	handleChartMouseMove(e) {
		if (!this.chartPoints || !this.chartData) return;

		const rect = this.chartCanvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Find closest point
		let closestPoint = null;
		let minDistance = Infinity;

		this.chartPoints.forEach(point => {
			const distance = Math.sqrt(
				Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
			);
			if (distance < minDistance && distance < 20) {
				minDistance = distance;
				closestPoint = point;
			}
		});

		if (closestPoint) {
			this.showChartTooltip(closestPoint, e.clientX, e.clientY);
		} else {
			this.hideChartTooltip();
		}
	}

	showChartTooltip(point, clientX, clientY) {
		const tooltip = this.chartTooltip;

		tooltip.innerHTML = `
			<div class="chart-tooltip-solve">Solve #${point.solve}</div>
			<div class="chart-tooltip-time">${this.formatTime(point.time)}</div>
		`;

		tooltip.style.left = clientX + 10 + "px";
		tooltip.style.top = clientY - 10 + "px";
		tooltip.classList.add("visible");
	}

	hideChartTooltip() {
		this.chartTooltip.classList.remove("visible");
	}
}

// Initialize the timer when the page loads
let cubeTimer;
document.addEventListener("DOMContentLoaded", () => {
	cubeTimer = new CubeTimer();
});

// Prevent context menu on spacebar
document.addEventListener("contextmenu", e => {
	e.preventDefault();
});
