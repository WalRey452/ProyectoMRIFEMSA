import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private datePipe = new DatePipe('en-US');
  private readonly brandColor = [39, 34, 87]; // #272257 (Azul corporativo)
  private readonly accentColor = [37, 99, 235]; // #2563eb (Azul brillante)
  private readonly textColor = [50, 50, 50]; 
  private readonly mutedColor = [100, 100, 100]; 

  constructor() {}

  async generateIncidentePdf(data: any) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // 1. Portada
    await this.drawCoverPage(pdf, 'INFORME TÉCNICO DE INCIDENTE', data.titulo, data.codigoIncidente || data.codigo, data.fechaIdentificacion);
    
    pdf.addPage();
    let y = 35;

    // Helper para títulos de sección
    const addSectionTitle = (title: string) => {
      if (y > 250) {
        pdf.addPage();
        y = 35;
      }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
      pdf.text(title, 14, y);
      y += 5;
    };

    // 1. Resumen Ejecutivo
    addSectionTitle('1. Resumen Ejecutivo');
    autoTable(pdf, {
      margin: { top: 35, bottom: 30, left: 14, right: 14 },
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: this.brandColor as any },
      body: [
        ['Categoría', data.categoria || 'N/A', 'Severidad', data.severidad || 'N/A'],
        ['Estado', data.estado || 'N/A', 'TLP', data.tlp || 'N/A'],
        ['Fecha Identificación', this.datePipe.transform(data.fechaIdentificacion, 'medium') || 'N/A', 'Responsable', data.liderIncidenteId || data.liderId || 'N/A'],
        ['Creado Por', (data.creadoPor ? `${data.creadoPor.firstName} ${data.creadoPor.lastName}` : data.reportadoPor) || 'Sistema', '', '']
      ]
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    autoTable(pdf, {
      margin: { top: 35, bottom: 30, left: 14, right: 14 },
      startY: y,
      theme: 'grid',
      head: [['Descripción del Incidente']],
      headStyles: { fillColor: this.accentColor as any },
      body: [[data.resumenEjecutivo || 'Sin descripción disponible.']]
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    // 2. Origen y Diagnóstico
    addSectionTitle('2. Origen y Diagnóstico');
    autoTable(pdf, {
      margin: { top: 35, bottom: 30, left: 14, right: 14 },
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: this.brandColor as any },
      body: [
        ['Origen', data.origen || 'N/A', 'Fuente / Herramienta', data.fuenteHerramienta || 'N/A'],
        ['Criticidad del Activo', data.criticidadActivo || 'N/A', 'Riesgo Asociado', data.riesgoAsociado || 'N/A']
      ]
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    // 3. Impacto y Afectación
    addSectionTitle('3. Impacto y Afectación al Negocio');
    autoTable(pdf, {
      margin: { top: 35, bottom: 30, left: 14, right: 14 },
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: this.brandColor as any },
      body: [
        ['Negocio Afectado', data.negocioAfectado || 'N/A', 'Proceso Interno', data.procesoInternoAfectado || 'N/A'],
        ['Afectación', data.afectacion || 'N/A', 'Tipo de Afectación', data.tipoAfectacion || 'N/A'],
        ['¿Tiene Respaldo?', data.tieneRespaldo || 'Desconocido', '¿Plan de Continuidad?', data.tienePlanContinuidad || 'Desconocido']
      ]
    });
    y = (pdf as any).lastAutoTable.finalY + 5;

    if (data.impacto) {
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        head: [['Impacto Detallado']],
        headStyles: { fillColor: this.accentColor as any },
        body: [[data.impacto]]
      });
      y = (pdf as any).lastAutoTable.finalY + 10;
    } else {
      y += 5;
    }

    // 4. Activos Comprometidos
    if (data.activos && data.activos.length > 0) {
      addSectionTitle('4. Activos Comprometidos');
      const activosBody = data.activos.map((a: any) => [
        a.ipHostname || 'N/A',
        a.tipoActivo || 'N/A',
        a.sistemaOperativo || 'N/A',
        a.accionTomada || 'N/A'
      ]);
      autoTable(pdf, {
        startY: y,
        head: [['IP / Hostname', 'Tipo', 'Sistema Operativo', 'Acción Tomada']],
        headStyles: { fillColor: this.brandColor as any },
        body: activosBody
      });
      y = (pdf as any).lastAutoTable.finalY + 10;
    }

    // 5. Cronología de Acciones
    if (data.bitacoras && data.bitacoras.length > 0) {
      addSectionTitle('5. Cronología de Acciones (Bitácora)');
      const bitacoraBody = data.bitacoras.map((b: any) => [
        this.datePipe.transform(b.fechaHora, 'dd/MM/yyyy HH:mm') || '',
        b.responsableNombre || 'Sistema',
        b.accionDetallada || ''
      ]);
      autoTable(pdf, {
        startY: y,
        head: [['Fecha/Hora', 'Responsable', 'Acción Detallada']],
        headStyles: { fillColor: this.brandColor as any },
        body: bitacoraBody,
        columnStyles: { 2: { cellWidth: 100 } }
      });
      y = (pdf as any).lastAutoTable.finalY + 10;
    }

    // 6. Plan de Acción
    if (data.planAccion || data.responsablePlanAccion) {
      addSectionTitle('6. Plan de Acción');
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: this.brandColor as any },
        body: [
          ['Responsable', data.responsablePlanAccion || 'N/A', 'Fecha Estimada Cierre', data.fechaCierrePlanAccion ? (this.datePipe.transform(data.fechaCierrePlanAccion, 'mediumDate') || 'N/A') : 'N/A'],
          ['Reportado a Externos', data.reportadoEntesExternos || 'NO', '', '']
        ]
      });
      y = (pdf as any).lastAutoTable.finalY + 5;

      if (data.planAccion) {
        autoTable(pdf, {
          startY: y,
          theme: 'grid',
          head: [['Plan de Acción a Ejecutar']],
          headStyles: { fillColor: this.accentColor as any },
          body: [[data.planAccion]]
        });
        y = (pdf as any).lastAutoTable.finalY + 10;
      } else {
        y += 5;
      }
    }

    // 7. Lecciones Aprendidas
    if (data.leccionAprendida && (data.leccionAprendida.funcionoBien || data.leccionAprendida.fallo || data.leccionAprendida.mejoras)) {
      addSectionTitle('7. Lecciones Aprendidas');
      const lecciones = [];
      if (data.leccionAprendida.funcionoBien) lecciones.push([{ content: '¿Qué funcionó bien?', styles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' } }, data.leccionAprendida.funcionoBien]);
      if (data.leccionAprendida.fallo) lecciones.push([{ content: '¿Qué falló?', styles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' } }, data.leccionAprendida.fallo]);
      if (data.leccionAprendida.mejoras) lecciones.push([{ content: 'Plan de Mejora Continua', styles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' } }, data.leccionAprendida.mejoras]);
      
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        body: lecciones,
        columnStyles: { 0: { cellWidth: 50 } }
      });
      y = (pdf as any).lastAutoTable.finalY + 10;
    }

    // 8. Anexos Fotográficos
    if (data.evidencias && data.evidencias.length > 0) {
      addSectionTitle('8. Anexos - Evidencias Adjuntas');
      for (let i = 0; i < data.evidencias.length; i++) {
        const ev = data.evidencias[i];
        if (ev.mimeType && ev.mimeType.startsWith('image/')) {
          if (y > 200) { pdf.addPage(); y = 35; } 
          y = await this.drawEvidenceImage(pdf, ev, i + 1, y);
        }
      }
    }

    // Contraportada
    await this.drawBackCover(pdf);
    await this.applyGlobalHeadersAndFooters(pdf, 'INFORME DE INCIDENTE', data.codigoIncidente || data.codigo);

    const cleanTitle = (data.titulo || 'Informe').replace(/[^a-zA-Z0-9]/g, '_');
    const code = data.codigoIncidente || data.codigo || 'INC';
    pdf.save(`${code}_${cleanTitle}_Reporte.pdf`);
  }

  async generateEventoPdf(data: any) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    await this.drawCoverPage(pdf, 'INFORME TÉCNICO DE EVENTO', data.titulo, data.codigoEvento || data.codigo, data.fechaDeteccion);
    pdf.addPage();
    let y = 35;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
    pdf.text('1. Detalles del Evento', 14, y);
    y += 5;

    autoTable(pdf, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: this.brandColor as any },
      body: [
        ['Tipo de Evento', data.tipo || 'N/A', 'Severidad', data.severidad || 'N/A'],
        ['Origen', data.origen || 'N/A', 'Creado Por', (data.creadoPor ? `${data.creadoPor.firstName} ${data.creadoPor.lastName}` : data.creadoPorId) || 'Sistema']
      ]
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    autoTable(pdf, {
      startY: y,
      theme: 'grid',
      head: [['Descripción Técnica']],
      headStyles: { fillColor: this.accentColor as any },
      body: [[data.descripcion || 'Sin descripción disponible.']]
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    if (data.evidencias && data.evidencias.length > 0) {
      if (y > 250) {
        pdf.addPage();
        y = 35;
      }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
      pdf.text('2. Anexos - Evidencias Adjuntas', 14, y);
      y += 5;

      for (let i = 0; i < data.evidencias.length; i++) {
        const ev = data.evidencias[i];
        if (ev.mimeType && ev.mimeType.startsWith('image/')) {
          if (y > 200) { pdf.addPage(); y = 35; } 
          y = await this.drawEvidenceImage(pdf, ev, i + 1, y);
        }
      }
    }

    await this.drawBackCover(pdf);
    await this.applyGlobalHeadersAndFooters(pdf, 'INFORME DE EVENTO', data.codigoEvento || data.codigo);

    const cleanTitle = (data.titulo || 'Evento').replace(/[^a-zA-Z0-9]/g, '_');
    const code = data.codigoEvento || data.codigo || 'EVT';
    pdf.save(`${code}_${cleanTitle}_Reporte.pdf`);
  }

  private async drawCoverPage(pdf: jsPDF, docType: string, title: string, code: string, date: string) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFillColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    let textStartY = 160;

    try {
      const img = new Image();
      img.src = 'assets/logo-full.png';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      let imgHeight = 120; // Increased logo height significantly
      let imgWidth = (img.width * imgHeight) / img.height;
      if (imgWidth > 180) { imgWidth = 180; imgHeight = (img.height * imgWidth) / img.width; } // Increased max width
      pdf.addImage(img, 'PNG', (pageWidth - imgWidth) / 2, 30, imgWidth, imgHeight);
      textStartY = 30 + imgHeight + 45;
    } catch(e) {}
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.text(docType, pageWidth / 2, textStartY, { align: 'center' });
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 4, textStartY + 8, (pageWidth * 3) / 4, textStartY + 8);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    const titleLines = pdf.splitTextToSize(title || 'Sin Título', pageWidth - 40);
    pdf.text(titleLines, pageWidth / 2, textStartY + 20, { align: 'center' });
    
    pdf.setFontSize(14);
    const codeY = textStartY + 20 + (titleLines.length * 6) + 15;
    pdf.text(`Código de Referencia: ${code || 'N/A'}`, pageWidth / 2, codeY, { align: 'center' });
    
    const formattedDate = this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || '';
    pdf.text(`Fecha: ${formattedDate}`, pageWidth / 2, codeY + 10, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Confidencial - Propiedad de FEMSA Salud', pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  private async drawBackCover(pdf: jsPDF) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addPage();
    pdf.setFillColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    try {
      const img = new Image();
      img.src = 'assets/logo-full.png';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      let imgHeight = 120;
      let imgWidth = (img.width * imgHeight) / img.height;
      if (imgWidth > 180) { imgWidth = 180; imgHeight = (img.height * imgWidth) / img.width; }
      pdf.addImage(img, 'PNG', (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
    } catch(e) {}
  }

  private async applyGlobalHeadersAndFooters(pdf: jsPDF, docType: string, docCode: string) {
    const totalPages = (pdf as any).internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 2; i < totalPages; i++) {
      pdf.setPage(i);
      
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(14, 20, pageWidth - 14, 20); 

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(this.mutedColor[0], this.mutedColor[1], this.mutedColor[2]);
      pdf.text(`FEMSA Salud | ${docType}`, 14, 16);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Ref: ${docCode}`, pageWidth - 14, 16, { align: 'right' });

      pdf.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20); 
      
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text('Confidencial - Uso Exclusivo FEMSA Salud', 14, pageHeight - 12);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Página ${i - 1} de ${totalPages - 2}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
    }
  }

  private async drawEvidenceImage(pdf: jsPDF, ev: any, index: number, y: number): Promise<number> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    const maxW = pageWidth - margin * 2;
    const maxH = 160; 
    
    try {
      // Direct backend URL
      const url = `http://localhost:3000${ev.archivoUrl}`;
      const imgData = await this.fetchImageAsBase64(url);
      
      const htmlImg = new Image();
      htmlImg.src = imgData;
      await new Promise((res) => { htmlImg.onload = res; htmlImg.onerror = res; });
      
      let printW = maxW;
      let printH = (htmlImg.height * maxW) / htmlImg.width;
      
      if (printH > maxH) {
        printH = maxH;
        printW = (htmlImg.width * maxH) / htmlImg.height;
      }

      const xPos = margin + ((maxW - printW) / 2);
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.rect(xPos - 2, y - 2, printW + 4, printH + 4);

      pdf.addImage(imgData, 'JPEG', xPos, y, printW, printH);
      y += printH + 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Anexo ${index}: ${ev.descripcion || 'Imagen adjunta'}`, pageWidth / 2, y, { align: 'center' });
      
      return y + 15;
    } catch (e) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`[Error cargando imagen: ${ev.archivoUrl}]`, margin, y);
      return y + 10;
    }
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load image');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async generateDashboardPdf(element: HTMLElement) {
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      
      // Asumimos un ancho de página A4 (210mm)
      const pdfWidth = 210;
      // Calculamos la altura proporcional
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Crear un PDF con altura dinámica para que no se corte nada (mínimo A4)
      const pageHeight = Math.max(297, pdfHeight + 30);
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pageHeight]);
      
      pdf.setFillColor(this.brandColor[0], this.brandColor[1], this.brandColor[2]);
      pdf.rect(0, 0, pdfWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`FEMSA Salud - REPORTE EJECUTIVO - DASHBOARD`, 10, 10);
      
      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
      const formattedDate = this.datePipe.transform(new Date(), 'dd_MM_yyyy') || '';
      pdf.save(`Dashboard_Reporte_${formattedDate}.pdf`);
    } catch (error) {
      console.error('Error generando PDF del Dashboard', error);
      throw error;
    }
  }
}
