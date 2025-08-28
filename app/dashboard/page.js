"use client";

import React, { useRef, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import styles from "./dashboard.module.css";

const galleryItems = [
    { src: "imgsTestes/img1.webp", alt: "Imagem 1" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 2" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 3" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 4" },
    { src: "imgsTestes/img1.webp", alt: "Imagem 5" },
];

export default function Dashboard() {
    const [activeIndex, setActiveIndex] = useState(2);
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
    // Função que calcula estilo dinâmico
    const getItemStyle = (index) => {
        const offset = (index - activeIndex + galleryItems.length) % galleryItems.length;
        let position = (offset - Math.floor(galleryItems.length / 2));

        // Escala: centro menor, extremidades maiores
        const scale = 1 + (Math.abs(position) * 0.2);
        // ex: centro = 1, 1 posição do lado = 1.2, extremidade = 1.4

        const left = 50 + position * 25;
        const zIndex = 10 - Math.abs(position);

        // Rotação no eixo Y
        const rotateY = position * -25;

        // Profundidade no eixo Z
        const depth = -Math.abs(position) * 120;

        return {
            transform: `translateX(-50%) scale(${scale}) rotateY(${rotateY}deg) translateZ(${depth}px)`,
            left: `${left}%`,
            zIndex,
            opacity: 1, // mantém visível
            transition: "transform 0.6s ease, left 0.6s ease",
        };
    };



    return (
        <section className={`${styles.dashboard} pt-5`}>
            <Container fluid className="">
                <Row className=" text-center ">
                    <Col md="8" className="mx-auto">
                        <Col md="10" className="mx-auto">
                            <h1 className={`${styles.textPrincipal}`}>
                                Escolha qual documento você deseja analisar os resultados
                            </h1>
                            <h4 className={`${styles.textSecundario}`}>
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
                <Row className="mt-5 ">
                    <Col className={`${styles.cardSlider}`}>
                        <Row>
                            <Col className={`${styles.gallery}`}>
                                <div
                                    className={`${styles.galleryContainer}`}
                                    onMouseDown={handleDragStart}
                                    onMouseUp={handleDragEnd}
                                    onTouchStart={handleDragStart}
                                    onTouchEnd={handleDragEnd}
                                >
                                    {galleryItems.map((item, index) => (
                                        <img
                                            key={index}
                                            className={styles.galleryItem}
                                            src={item.src}
                                            alt={item.alt}
                                            style={getItemStyle(index)}
                                        />
                                    ))}
                                </div>
                                <div className={`${styles.galleryControls}`}>
                                    <button
                                        className={styles.galleryControlsPrevious}
                                        onClick={handlePrev}
                                    ></button>
                                    <div className={styles.buttonSelect}>
                                        <a href="#"><h5>Selecionar Arquivo</h5></a>
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
        </section>
    );
}
