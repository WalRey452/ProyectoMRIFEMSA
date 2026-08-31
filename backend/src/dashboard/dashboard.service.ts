import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Incidente } from '../incidentes/entities/incidente.entity';
import { Evento } from '../eventos/entities/evento.entity';
import { BitacoraIncidente } from '../incidentes/entities/bitacora-incidente.entity';
import { EstadoIncidente, Severidad } from '../incidentes/enums/incidente.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Incidente)
    private readonly incidenteRepo: Repository<Incidente>,
    @InjectRepository(Evento)
    private readonly eventoRepo: Repository<Evento>,
    @InjectRepository(BitacoraIncidente)
    private readonly bitacoraRepo: Repository<BitacoraIncidente>,
  ) {}

  async getKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalIncidentes, incidentesAbiertos, incidentesCriticos, eventoHoy, totalEventos, incidentesCerradosMes] = await Promise.all([
      this.incidenteRepo.count(),
      this.incidenteRepo.count({ where: { estado: EstadoIncidente.ABIERTO } }),
      this.incidenteRepo.count({ where: { severidad: Severidad.CRITICA } }),
      this.eventoRepo.count({ where: { fechaDeteccion: Between(today, new Date(today.getTime() + 86400000)) } }),
      this.eventoRepo.count(),
      this.incidenteRepo.count({ where: { estado: EstadoIncidente.CERRADO, fechaCierre: Between(firstDayOfMonth, new Date()) } })
    ]);

    const { mttd, mttr } = await this.getMttrMttd();

    return {
      totalIncidentes,
      incidentesAbiertos,
      incidentesCriticos,
      eventoHoy,
      totalEventos,
      incidentesCerradosMes,
      tiempoPromedioResolucion: mttr
    };
  }

  async getSeveridadData() {
    return this.incidenteRepo.createQueryBuilder('i')
      .select('i.severidad', 'name')
      .addSelect('COUNT(*)', 'value')
      .groupBy('i.severidad')
      .getRawMany();
  }

  async getCategoriaData() {
    return this.incidenteRepo.createQueryBuilder('i')
      .select('i.categoria', 'name')
      .addSelect('COUNT(*)', 'value')
      .groupBy('i.categoria')
      .getRawMany();
  }

  async getEstadoData() {
    return this.incidenteRepo.createQueryBuilder('i')
      .select('i.estado', 'name')
      .addSelect('COUNT(*)', 'value')
      .groupBy('i.estado')
      .getRawMany();
  }

  async getTendenciaMensual() {
    const year = new Date().getFullYear();

    const rawIncidentes = await this.incidenteRepo.query(`
      SELECT TO_CHAR("fechaIdentificacion", 'YYYY-MM') as mes, COUNT(*) as count
      FROM incidentes
      WHERE EXTRACT(YEAR FROM "fechaIdentificacion") = $1
      GROUP BY mes ORDER BY mes ASC
    `, [year]);

    const rawEventos = await this.eventoRepo.query(`
      SELECT TO_CHAR("fechaDeteccion", 'YYYY-MM') as mes, COUNT(*) as count
      FROM eventos
      WHERE EXTRACT(YEAR FROM "fechaDeteccion") = $1
      GROUP BY mes ORDER BY mes ASC
    `, [year]);

    // Rellenar los 12 meses del año aunque no tengan datos
    const meses: string[] = [];
    for (let m = 1; m <= 12; m++) {
      meses.push(`${year}-${String(m).padStart(2, '0')}`);
    }

    const incMap = new Map(rawIncidentes.map((r: any) => [r.mes, parseInt(r.count, 10)]));
    const evMap  = new Map(rawEventos.map((r: any) => [r.mes, parseInt(r.count, 10)]));

    const incidentes = meses.map(m => ({ mes: m, count: incMap.get(m) ?? 0 }));
    const eventos    = meses.map(m => ({ mes: m, count: evMap.get(m)  ?? 0 }));

    return { incidentes, eventos };
  }

  // ── Centro de Operaciones: últimos incidentes registrados (sin duplicar) ─────
  async getRecentActivity() {
    const incidentes = await this.incidenteRepo.find({
      order: { fechaIdentificacion: 'DESC' },
      take: 10,
      relations: ['creadoPor'],
    });

    return incidentes.map(inc => {
      const creadoPorNombre = inc.creadoPor
        ? `${inc.creadoPor.firstName || ''} ${inc.creadoPor.lastName || ''}`.trim() || inc.creadoPor.username
        : inc.reportadoPor || 'Sistema';

      return {
        codigo:        inc.codigoIncidente,
        titulo:        inc.titulo,
        severidad:     inc.severidad,
        estado:        inc.estado,
        categoria:     inc.categoria,
        fechaRegistro: inc.fechaIdentificacion,
        creadoPor:     creadoPorNombre,
      };
    });
  }

  async getMttrMttd() {
    const incidentesCerrados = await this.incidenteRepo.find({
      where: { estado: EstadoIncidente.CERRADO }
    });

    let totalMttr = 0;
    let countMttr = 0;

    for (const inc of incidentesCerrados) {
      if (inc.fechaCierre) {
        const diffMs = inc.fechaCierre.getTime() - inc.fechaIdentificacion.getTime();
        totalMttr += diffMs / (1000 * 60 * 60);
        countMttr++;
      }
    }

    return {
      mttd: 2.5,
      mttr: countMttr > 0 ? (totalMttr / countMttr) : 0
    };
  }
}
