"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
// Assumindo que você tem acesso a estas bibliotecas no seu ambiente Next.js com reactstrap
import { Container, Row, Col, Button } from "reactstrap";
import { useRouter } from 'next/navigation';
import styles from "./dashboard.module.css"; // Estilos do componente Dashboard

// URL da API para listar todos os documentos (GET)
const API_URL_LIST = "http://127.0.0.1:8000/api/document/get-all-json-from-blob/";

/**
 * Componente de Modal para exibir os detalhes estruturados de um documento.
 * Adaptado para usar a estrutura de dados retornada pela sua API real.
 */
const DocumentDetailModal = ({ isOpen, data, onClose }) => {
    const contentRef = React.useRef(null);

    if (!isOpen || !data) return null;

    // Acessa as propriedades da estrutura de dados real
    const documentoData = data.documento || {};
    const remessa = data.dados_remessa || {};
    const transporte = data.transporte || {};
    // Pega a primeira tabela, se existir, e garante que é um array com dados estruturados
    const tabela = data.tabelas_detectadas?.[0];
    const dadosEstruturados = tabela?.dados_estruturados || [];

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
                        <h2>${documentoData.tipo_documento?.replace(/_/g, ' ').toUpperCase() || "DETALHES DO DOCUMENTO"}</h2>
                        <hr />
                        
                        <h3>Metadados e Remessa</h3>
                        <p><strong>Nome do Arquivo:</strong> ${documentoData.metadata?.nome_arquivo || 'N/A'}</p>
                        <p><strong>Processado em:</strong> ${documentoData.metadata?.processado_em ? new Date(documentoData.metadata.processado_em).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p><strong>N° Documento:</strong> ${remessa.número_do_documento?.valor || 'N/A'}</p>
                        <p><strong>Data de Saída:</strong> ${remessa.data_de_saída?.valor || 'N/A'}</p>
                        <p><strong>Responsável:</strong> ${remessa.responsável_pela_expedição?.valor || 'N/A'}</p>
                        
                        <h3>Detalhes do Transporte</h3>
                        <p><strong>Motorista:</strong> ${transporte.nome_do_caminhoneiro?.valor || 'N/A'}</p>
                        <p><strong>Placa:</strong> ${transporte.placa_do_veículo?.valor || 'N/A'}</p>
                        <p><strong>Valor do Frete:</strong> ${transporte.valor_do_frete?.valor || 'N/A'}</p>
                        <p><strong>CPF Motorista:</strong> ${transporte.cpf?.valor || 'N/A'}</p>
                        <p><strong>Modelo Caminhão:</strong> ${transporte.modelo_do_caminhão?.valor || 'N/A'}</p>
                        
                        ${dadosEstruturados.length > 1 ? `
                          <h3>Produtos Enviados</h3>
                          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                            <thead>
                              <tr style="background-color: #f2f2f2;">
                                ${dadosEstruturados[1].map((header) => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${header || 'Coluna'}</th>`).join('')}
                              </tr>
                            </thead>
                            <tbody>
                              ${dadosEstruturados.slice(2).map((row) => `
                                <tr>
                                  ${row.map((cell) => `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`).join('')}
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        ` : ''}
                        
                        <h3>Conteúdo Bruto (OCR)</h3>
                        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 10px;">${(documentoData.conteudo_completo || 'Conteúdo não disponível.').substring(0, 2000)}</pre>
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

                        pdf.save(`${documentoData.metadata?.nome_arquivo || "documento"}.pdf`);
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
            element.download = `${documentoData.metadata?.nome_arquivo || "documento"}.json`;
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
        <Col xs="12" md="6" className={styles.detailItem}>
            <p className={styles.detailLabel}>{label}:</p>
            <h6 className={styles.detailValue}>{value || "N/A"}</h6>
        </Col>
    );

    // Converte o JSON completo em string formatada para o Conteúdo Bruto
    const rawContentJson = JSON.stringify(data, null, 2);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className={styles.modalTitle}>
                        {documentoData.tipo_documento?.replace(/_/g, ' ').toUpperCase() || "DETALHES DO DOCUMENTO"}
                    </h2>
                    <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
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

                {/* Seção de Metadados e Remessa (Dados Extraídos) */}
                <h3 className={styles.modalSubtitle}>Metadados e Remessa</h3>
                <Row ref={contentRef} className="mb-4">
                    <DetailItem label="Nome do Arquivo" value={documentoData.metadata?.nome_arquivo} />
                    <DetailItem label="Processado em" value={
                        documentoData.metadata?.processado_em ?
                            new Date(documentoData.metadata.processado_em).toLocaleDateString('pt-BR')
                            : 'N/A'
                    } />
                    <DetailItem label="N° Documento" value={remessa.número_do_documento?.valor} />
                    <DetailItem label="Data de Saída" value={remessa.data_de_saída?.valor} />
                    <DetailItem label="Responsável" value={remessa.responsável_pela_expedição?.valor} />
                </Row>

                {/* Detalhes do Transporte */}
                <h3 className={styles.modalSubtitle}>Detalhes do Transporte</h3>
                <Row className="mb-4">
                    <DetailItem label="Motorista" value={transporte.nome_do_caminhoneiro?.valor} />
                    <DetailItem label="Placa" value={transporte.placa_do_veículo?.valor} />
                    <DetailItem label="Valor do Frete" value={transporte.valor_do_frete?.valor} />
                    {/* Adicionando campos extras da sua API, como CPF e Modelo do Caminhão */}
                    <DetailItem label="CPF Motorista" value={transporte.cpf?.valor} />
                    <DetailItem label="Modelo Caminhão" value={transporte.modelo_do_caminhão?.valor} />
                </Row>

                {/* Tabela de Produtos */}
                {dadosEstruturados.length > 1 && (
                    <>
                        <h3 className={styles.modalSubtitle}>Produtos Enviados</h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTablet}>
                                <thead>
                                    <tr>
                                        {/* A primeira linha (índice 0) contém os cabeçalhos agrupados. 
                                            Vamos tentar extrair os cabeçalhos reais da terceira linha se possível,
                                            ou usar a primeira se a estrutura for inconsistente.
                                            Aqui vamos usar a segunda linha (índice 1) que parece ter os nomes mais limpos (Produto, etc.)
                                            e garantir que usamos o índice 2 em diante para os dados.
                                        */}
                                        {dadosEstruturados[1].map((header, i) => (
                                            <th key={i}>{header || 'Coluna'}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Começa a iteração a partir da terceira linha (índice 2), que contém os dados */}
                                    {dadosEstruturados.slice(2).map((row, i) => (
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

                {/* Conteúdo Completo (OCR Bruto) */}
                <h3 className={styles.modalSubtitle}>Conteúdo Bruto do Documento (OCR)</h3>
                <pre className={styles.rawContent}>{document.conteudo_completo || "Conteúdo não disponível."}</pre>

                {/* JSON Completo (útil para conferência) */}
                <h3 className={styles.modalSubtitle}>JSON Completo da Resposta da API</h3>
                <pre className={styles.rawContent}>{rawContentJson}</pre>
            </div>
        </div>
    );
};


export default function Dashboard() {
    const router = useRouter();
    const [documents, setDocuments] = useState([]); // Armazena a lista de documentos da API
    const [activeIndex, setActiveIndex] = useState(0); // Começa no primeiro item
    const [viewMode, setViewMode] = useState("grid");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null); // Dados do documento selecionado para o modal
    const [isLoading, setIsLoading] = useState(true); // Novo estado para loading
    const startXRef = useRef(null);

    // Função para buscar os documentos da API com retry (backoff exponencial)
    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            const MAX_RETRIES = 3;
            for (let i = 0; i < MAX_RETRIES; i++) {
                try {
                    const response = await fetch(API_URL_LIST, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (!response.ok) {
                        throw new Error(`Erro de rede: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.success && Array.isArray(result.files)) {
                        // Mapeia os dados da API para a estrutura necessária para o carrossel/grid
                        const mappedDocuments = result.files.map((file, index) => {
                            const nomeArquivo = file.documento?.metadata?.nome_arquivo || `Documento ${index + 1}`;
                            const dataProcessamento = file.documento?.metadata?.processado_em
                                ? new Date(file.documento.metadata.processado_em).toLocaleDateString('pt-BR')
                                : 'Data Indisponível';

                            return {
                                id: index,
                                data: file, // Objeto de dados completo
                                src: "/imgsTestes/img1.webp", // Mock do caminho da imagem
                                alt: nomeArquivo,
                                name: nomeArquivo,
                                date: dataProcessamento,
                            };
                        });
                        setDocuments(mappedDocuments);
                        setIsLoading(false);
                        // Define o item ativo inicial
                        if (mappedDocuments.length > 0) {
                            setActiveIndex(0);
                        }
                        return;
                    } else {
                        console.error("Resposta da API inválida ou 'files' ausente:", result);
                        throw new Error("Resposta da API inválida.");
                    }
                } catch (error) {
                    console.error(`Erro ao buscar documentos (tentativa ${i + 1}):`, error);
                    if (i < MAX_RETRIES - 1) {
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        setIsLoading(false);
                        console.error("Falha final ao carregar documentos.");
                    }
                }
            }
        };
        fetchDocuments();
    }, []); // Array de dependências vazio para rodar apenas no mount

    // Abre o modal, passando os dados completos do documento
    const openModal = useCallback((data) => {
        setModalData(data);
        setIsModalOpen(true);
    }, []);

    const handleNext = () => {
        if (documents.length > 0) {
            setActiveIndex((prevIndex) => (prevIndex + 1) % documents.length);
        }
    };

    const handlePrev = () => {
        if (documents.length > 0) {
            setActiveIndex((prevIndex) =>
                prevIndex === 0 ? documents.length - 1 : prevIndex - 1
            );
        }
    };

    // Função para selecionar um item e abrir o modal
    const handleSelect = (index) => {
        setActiveIndex(index);
        const selectedItem = documents[index];
        if (selectedItem) {
            openModal(selectedItem.data); // Usa o objeto de dados completo
        }
    };

    // Lógica de drag (mantida com a referência correta ao array 'documents')
    const handleDragStart = (e) => {
        startXRef.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    };

    const handleDragEnd = (e) => {
        if (startXRef.current === null || documents.length === 0) return;
        const endX = e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
        const diff = endX - startXRef.current;
        if (Math.abs(diff) > 50) {
            if (diff < 0) handleNext();
            else handlePrev();
        }
        startXRef.current = null;
    };

    // Estilos do carrossel (mantida com a referência correta ao array 'documents')
    const getItemStyle = (index) => {
        if (documents.length === 0) return {};
        const offset = (index - activeIndex + documents.length) % documents.length;
        let position = offset - Math.floor(documents.length / 2);
        const scale = 1 + Math.abs(position) * 0.2;
        const left = 50 + position * 25;
        const zIndex = 10 - Math.abs(position);
        const rotateY = position * -25;
        const depth = -Math.abs(position) * 120;
        return {
            transform: `translateX(-50%) scale(${scale}) rotateY(${rotateY}deg) translateZ(${depth}px)`,
            left: `${left}%`,
            zIndex,
            opacity: 1,
            transition: "transform 0.6s ease, left 0.6s ease",
            position: "absolute",
        };
    };

    // Exibição de carregamento
    if (isLoading) {
        return (
            <section className={`${styles.dashboard} pt-5`}>
                <Container className="contentInicial text-center">
                    <h1 className={styles.textPrincipal}>Carregando Documentos...</h1>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </Container>
            </section>
        );
    }

    // Mensagem se não houver documentos
    if (documents.length === 0) {
        return (
            <section className={`${styles.dashboard} pt-5`}>
                <Container className="contentInicial text-center">
                    <h1 className={styles.textPrincipal}>Nenhum Documento Encontrado</h1>
                    <h4 className={styles.textSecundario}>Verifique sua API ou adicione arquivos para processamento.</h4>
                </Container>
            </section>
        );
    }


    return (
        <section className={`${styles.dashboard} pt-5`}>
            {/* 1. RENDERIZAÇÃO DO MODAL */}
            <DocumentDetailModal
                isOpen={isModalOpen}
                data={modalData}
                onClose={() => setIsModalOpen(false)}
            />

            <Container className="contentInicial">
                {/* Botão Voltar */}
                <Row className="mb-3">
                    <Col xs="12" className="text-start">
                        <Button
                            color="secondary"
                            size="md"
                            onClick={() => router.push('/')}
                            className={styles.btnCustomChangeView}
                        >
                            Voltar para Upload
                        </Button>
                    </Col>
                </Row>

                <Row className="text-center">
                    <Col md="8" className="mx-auto">
                        <Col md="10" className="mx-auto">
                            <h1 className={styles.textPrincipal}>
                                Escolha qual documento você deseja analisar os resultados
                            </h1>
                            <h4 className={styles.textSecundario}>
                                Transforme documentos físicos em informações digitais de forma rápida,
                                segura e inteligente.
                            </h4>
                        </Col>
                        <img
                            src="/ChooseFile.png"
                            alt="Choose your file"
                            className={`${styles.arrowChoose} d-none d-md-block`}
                        />
                    </Col>
                </Row>
            </Container>
            <Container fluid className="text-center">
                <Button
                    color="primary"
                    className={`mt-3 mb-3 d-none d-md-block mx-auto ${styles.btnCustomChangeView}`}
                    onClick={() => setViewMode(viewMode === "carousel" ? "grid" : "carousel")}
                >
                    {viewMode === "carousel" ? "Ver em Grade" : "Ver em Carrossel"}
                </Button>
            </Container>

            {viewMode === "carousel" && (
                <Container fluid className="d-none d-md-block ContainerCaroussel mt-3">
                    <Row className="mt-2">
                        <Col className={styles.cardSlider}>
                            <Row>
                                <Col className={styles.gallery}>
                                    <div
                                        className={styles.galleryContainer}
                                        onMouseDown={handleDragStart}
                                        onMouseUp={handleDragEnd}
                                        onTouchStart={handleDragStart}
                                        onTouchEnd={handleDragEnd}
                                        style={{ position: "relative", height: "300px" }}
                                    >
                                        {documents.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`${styles.galleryItemWrapper} ${index === activeIndex ? styles.activeItem : ''}`}
                                                style={getItemStyle(index)}
                                                onClick={() => handleSelect(index)}
                                            >
                                                <img
                                                    className={styles.galleryImage}
                                                    src={item.src}
                                                    alt={item.alt}
                                                />
                                                <div className={styles.carouselInfo}>
                                                    <h6 className={styles.carouselName}>{item.name}</h6>
                                                    <p className={styles.carouselDate}>Data: {item.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.galleryControls}>
                                        <button className={styles.galleryControlsPrevious} onClick={handlePrev}></button>
                                        <div className={`${styles.buttonSelect} mt-4`}>
                                            <a onClick={() => handleSelect(activeIndex)}>
                                                <h5 className={`${styles.btnCustomSelectFile}`}>Selecionar Arquivo</h5>
                                            </a>
                                        </div>
                                        <button className={styles.galleryControlsNext} onClick={handleNext}></button>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            )}

            {viewMode === "grid" && (
                <Container className="ContainerGrid mt-3">
                    <Row className="justify-content-center">
                        {documents.map((item, index) => (
                            <Col
                                key={index}
                                xs="6"
                                sm="4"
                                md="3"
                                className="mb-4 d-flex flex-column align-items-center"
                            >
                                <div
                                    className={styles.CardGridItem}
                                    onClick={() => handleSelect(index)}
                                >
                                    <img src={item.src} alt={item.alt} className="img-fluid rounded mb-2" />
                                    <h6 className={styles.gridName}>{item.name}</h6>
                                    <p className={styles.gridDate}>Data: {item.date}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            )}
        </section>
    );
}
