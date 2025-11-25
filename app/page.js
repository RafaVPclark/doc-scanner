"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

const UPLOAD_ENDPOINT = "http://127.0.0.1:8000/api/document/analyze/smart/";

// 🔹 Componente para visualizar detalhes do documento em modal
const DocumentDetailModal = ({ isOpen, data, onClose }) => {
  const contentRef = useRef(null);

  if (!isOpen || !data) return null;

  const documentoData = data.data.documento;
  const remessa = data.data.dados_remessa;
  const transporte = data.data.transporte;
  const tabela = data.data.tabelas_detectadas[0];

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
            <h2>${documentoData.tipo_documento.replace(/_/g, " ").toUpperCase()}</h2>
            <hr />
            <h3>Informações Principais</h3>
            <p><strong>Nome do Arquivo:</strong> ${documentoData.metadata.nome_arquivo}</p>
            <p><strong>Processado em:</strong> ${new Date(documentoData.metadata.processado_em).toLocaleDateString()}</p>
            <p><strong>N° Documento:</strong> ${remessa.número_do_documento.valor}</p>
            <p><strong>Data de Saída:</strong> ${remessa.data_de_saída.valor}</p>
            <p><strong>Responsável:</strong> ${remessa.responsável_pela_expedição.valor}</p>
            
            <h3>Detalhes do Transporte</h3>
            <p><strong>Motorista:</strong> ${transporte.nome_do_caminhoneiro.valor}</p>
            <p><strong>Placa:</strong> ${transporte.placa_do_veículo.valor}</p>
            <p><strong>Valor do Frete:</strong> ${transporte.valor_do_frete.valor}</p>
            
            ${tabela ? `
              <h3>Produtos Enviados</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    ${tabela.dados_estruturados[0].map((header) => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${tabela.dados_estruturados.slice(1).map((row) => `
                    <tr>
                      ${row.map((cell) => `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            <h3>Conteúdo Bruto (OCR)</h3>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 10px;">${documentoData.conteudo_completo.substring(0, 2000)}</pre>
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

            pdf.save(`${documentoData.metadata.nome_arquivo || "documento"}.pdf`);
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
      element.download = `${documentoData.metadata.nome_arquivo || "documento"}.json`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } catch (error) {
      console.error("Erro ao gerar JSON:", error);
      alert("Erro ao gerar o JSON. Tente novamente.");
    }
  };

  const DetailItem = ({ label, value }) => (
    <div className={styles.detailItem}>
      <p className={styles.detailLabel}>{label}:</p>
      <h6 className={styles.detailValue}>{value}</h6>
    </div>
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.modalTitle}>
            {documentoData.tipo_documento.replace(/_/g, " ").toUpperCase()}
          </h2>
          <button className={styles.modalCloseButton} onClick={onClose}>
            &times;
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

        <hr />

        {/* Seção de Metadados e Remessa */}
        <div ref={contentRef} className={styles.detailGrid}>
          <DetailItem label="Nome do Arquivo" value={documentoData.metadata.nome_arquivo} />
          <DetailItem label="Processado em" value={new Date(documentoData.metadata.processado_em).toLocaleDateString()} />
          <DetailItem label="N° Documento" value={remessa.número_do_documento.valor} />
          <DetailItem label="Data de Saída" value={remessa.data_de_saída.valor} />
          <DetailItem label="Responsável" value={remessa.responsável_pela_expedição.valor} />
        </div>

        <h3 className={styles.modalSubtitle}>Detalhes do Transporte</h3>
        <div className={styles.detailGrid}>
          <DetailItem label="Motorista" value={transporte.nome_do_caminhoneiro.valor} />
          <DetailItem label="Placa" value={transporte.placa_do_veículo.valor} />
          <DetailItem label="Valor do Frete" value={transporte.valor_do_frete.valor} />
        </div>

        {/* Tabela de Produtos */}
        {tabela && (
          <>
            <h3 className={styles.modalSubtitle}>Produtos Enviados</h3>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {tabela.dados_estruturados[0].map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabela.dados_estruturados.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 className={styles.modalSubtitle}>Conteúdo Bruto (OCR)</h3>
        <pre className={styles.rawContent}>{documentoData.conteudo_completo}</pre>
      </div>
    </div>
  );
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setSelectedFile(file);
      setUploadStatus(`Arquivo selecionado: ${file.name}`);
    } else {
      setSelectedFile(null);
      setUploadStatus("Por favor, selecione um arquivo de imagem ou PDF.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadStatus("Nenhum arquivo selecionado para envio.");
      return;
    }

    setUploadStatus("Enviando arquivo e aguardando análise...");

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("📌 Resposta completa da API:", result); // 🔹 DEBUG no console

        setApiResponse(result);
        setUploadStatus("Sucesso! Documento processado.");
        setSelectedFile(null);
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          setUploadStatus(`Erro: ${errorJson.detail || JSON.stringify(errorJson).substring(0, 100)}...`);
        } catch {
          setUploadStatus(`Erro ao enviar: ${response.status} - ${errorText.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      setUploadStatus(`Erro de conexão: ${error.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <Link href="/dashboard" passHref className={styles.dashboardLink}>
        <i className={styles.dashboardIcon}></i>
        <span>Meus Documentos</span>
      </Link>

      <main className={styles.main}>
        <h1 className={styles.title}>Doc-Scanner</h1>
        <p className={styles.subtitle}>Transforme documentos físicos em dados digitais rapidamente.</p>

        <form className={styles.uploadForm} onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*, application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button type="button" className={styles.selectButton} onClick={() => fileInputRef.current.click()}>
            {selectedFile ? "Trocar Arquivo" : "Selecionar Documento"}
          </button>

          <p className={styles.statusText}>{uploadStatus || "Nenhum arquivo selecionado."}</p>

          <button type="submit" className={styles.submitButton} disabled={!selectedFile}>
            Enviar para Análise
          </button>
        </form>

        {/* 🔹 Exibe botão e resumo dos dados após upload */}
        {apiResponse && (
          <div className={styles.resultContainer}>
            <button className={`${styles.detailsButton} mx-auto `} onClick={() => setIsModalOpen(true)}>
              Ver Detalhes do Documento
            </button>

            {/* 🔹 Campos principais renderizados direto abaixo */}
            <div className={styles.resultPreview}>
              <h3>Resumo Rápido</h3>
              <p><b>Arquivo:</b> {apiResponse.data.documento.metadata.nome_arquivo}</p>
              <p><b>Tipo:</b> {apiResponse.data.documento.tipo_documento}</p>
              <p><b>Número Documento:</b> {apiResponse.data.dados_remessa.número_do_documento.valor}</p>
              <p><b>Data Saída:</b> {apiResponse.data.dados_remessa.data_de_saída.valor}</p>
              <p><b>Motorista:</b> {apiResponse.data.transporte.nome_do_caminhoneiro.valor}</p>
            </div>
          </div>
        )}
      </main>

      {/* 🔹 Modal */}
      <DocumentDetailModal isOpen={isModalOpen} data={apiResponse} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
