import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('charts')
  async getCharts() {
    const severidad = await this.dashboardService.getSeveridadData();
    const categoria = await this.dashboardService.getCategoriaData();
    const estado = await this.dashboardService.getEstadoData();
    const tendencia = await this.dashboardService.getTendenciaMensual();
    
    return { severidad, categoria, estado, tendencia };
  }

  @Get('activity')
  getActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('mttr-mttd')
  getMttrMttd() {
    return this.dashboardService.getMttrMttd();
  }
}
