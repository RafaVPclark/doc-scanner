"use client";

import React, { useRef, useState } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import styles from "./dashboard.module.css";

// 1. DADOS ATUALIZADOS com Nome e Data
const galleryItems = [
    { src: "imgsTestes/img1.webp", alt: "Imagem 1", name: "Contrato A", date: "2023-10-01" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 2", name: "Fatura 456", date: "2023-10-15" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 3", name: "Balanço Mensal", date: "2023-11-05" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 4", name: "Relatório XPTO", date: "2023-11-20" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 5", name: "Pedido de Compra", date: "2023-12-03" },
];

export default function Dashboard() {
    const [activeIndex, setActiveIndex] = useState(2);
    const [viewMode, setViewMode] = useState("carousel"); // "carousel" ou "grid"
    const startXRef = useRef(null);

    const handleNext = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % galleryItems.length);
    };

    const handlePrev = () => {
        setActiveIndex((prevIndex) =>
            prevIndex === 0 ? galleryItems.length - 1 : prevIndex - 1
        );
    };

    const handleDragStart = (e) => {
        startXRef.current =
            e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    };

    const handleDragEnd = (e) => {
        if (startXRef.current === null) return;
        const endX =
            e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
        const diff = endX - startXRef.current;
        if (Math.abs(diff) > 50) {
            if (diff < 0) handleNext();
            else handlePrev();
        }
        startXRef.current = null;
    };

    // Estilos do carrossel
    const getItemStyle = (index) => {
        const offset = (index - activeIndex + galleryItems.length) % galleryItems.length;
        let position = offset - Math.floor(galleryItems.length / 2);

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

    return (
        <section className={`${styles.dashboard} pt-5`}>
            <Container fluid className="text-center">
                <Button
                    color="primary"
                    onClick={() =>
                        setViewMode(viewMode === "carousel" ? "grid" : "carousel")
                    }
                >
                    {viewMode === "carousel" ? "Ver em Grade" : "Ver em Carrossel"}
                </Button>
            </Container>

            {viewMode === "carousel" && (
                <Container fluid className="ContainerCaroussel mt-3">
                    <Row className="text-center">
                        <Col md="8" className="mx-auto">
                            <Col md="10" className="mx-auto">
                                <h1 className={styles.textPrincipal}>
                                    Escolha qual documento você deseja analisar os resultados
                                </h1>
                                <h4 className={styles.textSecundario}>
                                    Transforme documentos físicos em informações digitais de forma rápida,
                                    segura e inteligente. Nosso sistema organiza, interpreta e entrega os
                                    dados prontos para uso, reduzindo erros manuais e acelerando decisões.
                                </h4>
                            </Col>
                            <img
                                src="/ChooseFile.png"
                                alt="Choose your file"
                                className={styles.arrowChoose}
                            />
                        </Col>
                    </Row>
                    <Row className="mt-5">
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
                                        {/* 2. INCLUSÃO DE NOME E DATA NO CARROSSEL */}
                                        {galleryItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className={styles.galleryItemWrapper} // Adicionei um wrapper para o conteúdo
                                                style={getItemStyle(index)}
                                            >
                                                <img
                                                    className={styles.galleryImage}
                                                    src={item.src}
                                                    alt={item.alt}
                                                />
                                                {/* Exibe as informações APENAS para o item ativo */}
                                                {index === activeIndex && (
                                                    <div className={styles.carouselInfo}>
                                                        <h6 className={styles.carouselName}>{item.name}</h6>
                                                        <p className={styles.carouselDate}>Data: {item.date}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.galleryControls}>
                                        <button
                                            className={styles.galleryControlsPrevious}
                                            onClick={handlePrev}
                                        ></button>
                                        <div className={styles.buttonSelect}>
                                            <a href="#">
                                                <h5>Selecionar Arquivo</h5>
                                            </a>
                                        </div>
                                        <button
                                            className={styles.galleryControlsNext}
                                            onClick={handleNext}
                                        ></button>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            )}

            {viewMode === "grid" && (
                <Container fluid className="ContainerGrid mt-3">
                    <Row className="justify-content-center">
                        {galleryItems.map((item, index) => (
                            <Col
                                key={index}
                                xs="6"
                                sm="4"
                                md="3"
                                className="mb-4 d-flex flex-column align-items-center"
                            >
                                <div className={styles.CardGridItem}>
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        className="img-fluid rounded mb-2"
                                    />
                                    {/* 3. INCLUSÃO DE NOME E DATA NA GRADE */}
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