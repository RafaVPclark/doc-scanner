"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

const UPLOAD_ENDPOINT = "http://127.0.0.1:8000/api/document/analyze/smart/";

// 🔹 Componente para visualizar detalhes do documento em modal
const DocumentDetailModal = ({ isOpen, data, onClose }) => {
  if (!isOpen || !data) return null;

  const document = data.data.documento;
  const remessa = data.data.dados_remessa;
  const transporte = data.data.transporte;
  const tabela = data.data.tabelas_detectadas[0];

  const DetailItem = ({ label, value }) => (
    <div className={styles.detailItem}>
      <p className={styles.detailLabel}>{label}:</p>
      <h6 className={styles.detailValue}>{value}</h6>
    </div>
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.modalCloseButton} onClick={onClose}>
          &times;
        </button>

        <h2 className={styles.modalTitle}>
          {document.tipo_documento.replace(/_/g, " ").toUpperCase()}
        </h2>
        <hr />

        {/* Seção de Metadados e Remessa */}
        <div className={styles.detailGrid}>
          <DetailItem label="Nome do Arquivo" value={document.metadata.nome_arquivo} />
          <DetailItem label="Processado em" value={new Date(document.metadata.processado_em).toLocaleDateString()} />
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
        <pre className={styles.rawContent}>{document.conteudo_completo}</pre>
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
