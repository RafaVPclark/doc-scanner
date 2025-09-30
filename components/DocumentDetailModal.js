"use client";

import React from "react";
import styles from "../app/page.module.css";

export default function DocumentDetailModal({ isOpen, data, onClose }) {
    if (!isOpen || !data) return null;

    const documento = data?.data?.documento || {};
    const metadata = documento.metadata || {};
    const raw = JSON.stringify(data, null, 2);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.modalCloseButton} onClick={onClose}>
                    ✕
                </button>

                <h2 className={styles.modalTitle}>Detalhes do Documento</h2>
                <p className={styles.modalSubtitle}>Informações Principais</p>

                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Nome do Arquivo</p>
                    <p className={styles.detailValue}>
                        {metadata.nome_arquivo || "N/A"}
                    </p>
                </div>

                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Tamanho</p>
                    <p className={styles.detailValue}>
                        {metadata.tamanho || "N/A"}
                    </p>
                </div>

                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Status</p>
                    <p className={styles.detailValue}>
                        {documento.status || "N/A"}
                    </p>
                </div>

                <p className={styles.modalSubtitle}>Conteúdo Bruto</p>
                <pre className={styles.rawContent}>{raw}</pre>
            </div>
        </div>
    );
}
