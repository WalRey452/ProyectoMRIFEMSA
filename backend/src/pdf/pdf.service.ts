import { Injectable } from '@nestjs/common';
// import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generateIncidentePdf(incidente: any): Promise<Buffer> {
    // Logica real de puppeteer requiere instalacion de la libreria
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Incidente - ${incidente.codigoIncidente}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #272257; padding-bottom: 20px; }
          .header h1 { color: #272257; margin: 0; }
          .section { margin-top: 30px; }
          .section-title { background-color: #272257; color: white; padding: 10px; font-size: 18px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; color: white; }
          .tlp-amber { background-color: #ffc107; color: black; }
          .tlp-red { background-color: #dc3545; }
          .tlp-green { background-color: #28a745; }
          .tlp-white { background-color: #f8f9fa; color: black; border: 1px solid #ccc; }
          .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Reporte de Incidente</h1>
            <p><strong>FEMSA Salud</strong> | Seguridad de la Información</p>
          </div>
          <div>
            <h2>${incidente.codigoIncidente}</h2>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resumen Ejecutivo</div>
          <p>${incidente.resumenEjecutivo}</p>
        </div>

        <div class="section">
          <div class="section-title">Clasificación</div>
          <table>
            <tr>
              <th>Severidad</th>
              <td>${incidente.severidad}</td>
              <th>Estado</th>
              <td>${incidente.estado}</td>
            </tr>
            <tr>
              <th>Categoría</th>
              <td>${incidente.categoria}</td>
              <th>TLP</th>
              <td><span class="badge tlp-${incidente.tlp.toLowerCase()}">${incidente.tlp}</span></td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          Generado automáticamente por Registro MRI &copy; ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `;

    // await page.setContent(html);
    // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // await browser.close();
    
    // Return dummy buffer por ahora (requiere npm install puppeteer)
    return Buffer.from(html);
  }

  async generateEventoPdf(evento: any): Promise<Buffer> {
    const html = `<html><body><h1>Evento ${evento.codigoEvento}</h1></body></html>`;
    return Buffer.from(html);
  }
}
