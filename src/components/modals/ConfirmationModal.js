import React from "react";
import styles from "./ConfirmationModal.module.css";

const ConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText,
	cancelText
}) => {
	if (!isOpen) return null;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			{" "}
			{/* Close on overlay click */}
			<div
				className={styles.modalContent}
				onClick={e => e.stopPropagation()}
			>
				{" "}
				{/* Prevent content click from closing */}
				<h2 className={styles.modalTitle}>
					<span
						role="img"
						aria-label="Warning"
						style={{ marginRight: "10px" }}
					>
						⚠️
					</span>
					{title}
				</h2>
				<p className={styles.modalMessage}>{message}</p>
				<div className={styles.modalActions}>
					<button
						onClick={onClose}
						className={`${styles.modalButton} ${styles.cancelButton}`}
					>
						{cancelText || "Cancel"}
					</button>
					<button
						onClick={onConfirm}
						className={`${styles.modalButton} ${styles.confirmButton}`}
					>
						{confirmText || "Confirm"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationModal;
