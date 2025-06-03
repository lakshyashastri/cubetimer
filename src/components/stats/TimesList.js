import React, { useState } from "react"; // Added useState
import styles from "./TimesList.module.css";

const TimesList = ({
	times,
	formatTime,
	onDeleteTime,
	onRequestClearAllTimes
}) => {
	const [pendingDeleteId, setPendingDeleteId] = useState(null); // State for pending delete

	if (!times || times.length === 0) {
		return (
			<p
				style={{
					textAlign: "center",
					color: "#718096",
					fontStyle: "italic"
				}}
			>
				No times recorded yet.
			</p>
		);
	}

	const handleDeleteClick = timeId => {
		if (pendingDeleteId === timeId) {
			// This is the confirmation click
			onDeleteTime(timeId);
			setPendingDeleteId(null);
		} else {
			// This is the initial click, set for confirmation
			setPendingDeleteId(timeId);
		}
	};

	// If user clicks another delete button while one is pending, reset the first one
	const handleInitialDeleteClick = timeId => {
		setPendingDeleteId(timeId);
	};

	return (
		<>
			<div className={styles.timesControls}>
				<button
					onClick={onRequestClearAllTimes}
					className={styles.clearTimesBtn}
				>
					Clear All Times
				</button>
			</div>
			<div className={styles.timesList}>
				{times.map((timeEntry, index) => (
					<div key={timeEntry.id} className={styles.timeEntry}>
						<span className={styles.timeIndex}>
							#{times.length - index}
						</span>
						<span className={styles.timeValue}>
							{formatTime(timeEntry.time)}
						</span>
						{pendingDeleteId === timeEntry.id ? (
							<button
								className={`${styles.deleteBtn} ${styles.confirmDeleteBtn}`}
								onClick={() => handleDeleteClick(timeEntry.id)}
								title="Confirm delete"
								// onBlur={() => setPendingDeleteId(null)} // Optional: hide confirm on blur
							>
								Confirm?
							</button>
						) : (
							<button
								className={styles.deleteBtn}
								onClick={() =>
									handleInitialDeleteClick(timeEntry.id)
								}
								title="Delete time"
							>
								&times; {/* HTML entity for X */}
							</button>
						)}
					</div>
				))}
			</div>
		</>
	);
};

export default TimesList;
