import React from "react";
import styles from "./Overview.module.css";

const Overview = ({ stats, formatTime }) => {
	if (!stats) {
		return <p>No stats available yet.</p>;
	}

	return (
		<div className={styles.overviewStats}>
			{/* Row 1 */}
			<div className={styles.statItem}>
				<span className={styles.statLabel}>Best Time</span>
				<span className={styles.statValue}>
					{formatTime(stats.bestTime)}
				</span>
			</div>
			<div className={styles.statItem}>
				<span className={styles.statLabel}>Worst Time</span>
				<span className={styles.statValue}>
					{formatTime(stats.worstTime)}
				</span>
			</div>

			{/* Row 2 */}
			<div className={styles.statItem}>
				<span className={styles.statLabel}>Median Time</span>
				<span className={styles.statValue}>
					{formatTime(stats.medianTime)}
				</span>
			</div>
			<div className={styles.statItem}>
				<span className={styles.statLabel}>Average Time</span>
				<span className={styles.statValue}>
					{formatTime(stats.averageTime)}
				</span>
			</div>

			{/* Row 3 - Full Width */}
			<div className={`${styles.statItem} ${styles.fullWidth}`}>
				<span className={styles.statLabel}>Total Solves</span>
				<span className={styles.statValue}>
					{stats.totalSolves || 0}
				</span>
			</div>
		</div>
	);
};

export default Overview;
