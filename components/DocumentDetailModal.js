"use client";

import React, { useRef } from "react";
import styles from "../app/page.module.css";

export default function DocumentDetailModal({ isOpen, data, onClose }) {
    const contentRef = useRef(null);

    if (!isOpen || !data) return null;

    const documento = data?.data?.documento || {};
    const metadata = documento.metadata || {};
    const raw = JSON.stringify(data, null, 2);

    const handleDownloadPDF = async () => {
        try {
            // Carregar bibliotecas necessárias
            const jsPDFScript = window.document.createElement("script");
            jsPDFScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

            jsPDFScript.onload = () => {
                const html2canvasScript = window.document.createElement("script");
                html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

                html2canvasScript.onload = () => {
                    // Criar um elemento temporário com o conteúdo
                    const tempDiv = window.document.createElement("div");
                    tempDiv.style.position = "absolute";
                    tempDiv.style.left = "-9999px";
                    tempDiv.style.backgroundColor = "white";
                    tempDiv.style.padding = "20px";
                    tempDiv.style.fontFamily = "Arial, sans-serif";
                    tempDiv.style.width = "800px";

                    tempDiv.innerHTML = `
                        <h2>Detalhes do Documento</h2>
                        <hr />
                        <h3>Informações Principais</h3>
                        <p><strong>Nome do Arquivo:</strong> ${metadata.nome_arquivo || 'N/A'}</p>
                        <p><strong>Tamanho:</strong> ${metadata.tamanho || 'N/A'}</p>
                        <p><strong>Status:</strong> ${documento.status || 'N/A'}</p>
                        
                        <h3>Conteúdo Bruto</h3>
                        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 10px;">${raw.substring(0, 3000)}</pre>
                    `;

                    window.document.body.appendChild(tempDiv);

                    // Usar html2canvas para capturar o elemento
                    window.html2canvas(tempDiv, { scale: 2, logging: false }).then((canvas) => {
                        const imgData = canvas.toDataURL("image/png");
                        const pdf = new window.jspdf.jsPDF({
                            orientation: "portrait",
                            unit: "mm",
                            format: "a4",
                        });

                        const imgWidth = 190;
                        const pageHeight = 277;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;

                        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }

                        pdf.save(`${metadata.nome_arquivo || "documento"}.pdf`);
                        window.document.body.removeChild(tempDiv);
                    });
                };

                window.document.head.appendChild(html2canvasScript);
            };

            window.document.head.appendChild(jsPDFScript);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar o PDF. Tente novamente.");
        }
    };

    const handleDownloadJSON = () => {
        try {
            const element = window.document.createElement("a");
            const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            element.href = URL.createObjectURL(file);
            element.download = `${metadata.nome_arquivo || "documento"}.json`;
            window.document.body.appendChild(element);
            element.click();
            window.document.body.removeChild(element);
            URL.revokeObjectURL(element.href);
        } catch (error) {
            console.error("Erro ao gerar JSON:", error);
            alert("Erro ao gerar o JSON. Tente novamente.");
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className={styles.modalTitle}>Detalhes do Documento</h2>
                    <button className={styles.modalCloseButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <button
                        onClick={handleDownloadPDF}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#f78900",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "700",
                            fontFamily: "'PT Sans', sans-serif",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(247, 137, 0, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#e67d00";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 6px 16px rgba(247, 137, 0, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#f78900";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 12px rgba(247, 137, 0, 0.3)";
                        }}
                    >
                        <span style={{ fontSize: "18px" }}>📄</span> Baixar PDF
                    </button>
                    <button
                        onClick={handleDownloadJSON}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#401201",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "700",
                            fontFamily: "'PT Sans', sans-serif",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(64, 18, 1, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#5A3A2E";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 6px 16px rgba(64, 18, 1, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#401201";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 12px rgba(64, 18, 1, 0.3)";
                        }}
                    >
                        <span style={{ fontSize: "18px" }}>📋</span> Baixar JSON
                    </button>
                </div>

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
                <div ref={contentRef} style={{ padding: "10px" }}>
                    <h3>Detalhes do Documento</h3>

                    <h4>Informações Principais</h4>
                    <p><strong>Nome do Arquivo:</strong> {metadata.nome_arquivo || "N/A"}</p>
                    <p><strong>Tamanho:</strong> {metadata.tamanho || "N/A"}</p>
                    <p><strong>Status:</strong> {documento.status || "N/A"}</p>

                    <h4>Conteúdo Bruto</h4>
                    <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>{raw}</pre>
                </div>
            </div>
        </div>
    );
}
