import React from "react";
import styles from "./ActionButton.module.css";

const ActionButton = ({ onTogglePanels }) => {
	return (
		<div className={styles.floatingButtonsContainer}>
			<button
				className={styles.fab}
				onClick={onTogglePanels}
				title="Toggle Stats Panels"
			>
				<span className={styles.icon}>📊</span>
			</button>
			{/* You could add more FABs here if needed, e.g., a settings button */}
		</div>
	);
};

export default ActionButton;
