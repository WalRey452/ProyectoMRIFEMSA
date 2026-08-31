from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.template.loader import get_template
from django.db.models import Count
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from xhtml2pdf import pisa
from .models import Incidente, Evento
from django.contrib import admin

# ==========================================
# 1. EXPORTACIÓN: PDF DE UN INCIDENTE ESPECÍFICO
# ==========================================
@login_required(login_url='/admin/login/')
def generar_pdf_incidente(request, incidente_id):
    incidente = get_object_or_404(Incidente, id=incidente_id)
    
    context = {
        'incidente': incidente,
        'activos': incidente.activos.all(),
        'bitacora': incidente.bitacora.all().order_by('fecha_hora'),
        'evidencias': incidente.evidencias_files.all(),
        'leccion': getattr(incidente, 'lecciones', None),
    }

    template_path = 'incidentes/reporte_pdf.html'
    template = get_template(template_path)
    html = template.render(context)

    response = HttpResponse(content_type='application/pdf')
    filename = f"Reporte_Ejecutivo_{incidente.codigo}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    pisa_status = pisa.CreatePDF(html, dest=response)

    if pisa_status.err:
        return HttpResponse('Tuvimos algunos errores procesando el documento <pre>' + html + '</pre>')
    return response


# ==========================================
# 2. MOTOR DEL DASHBOARD SECOPS (INICIO SECUESTRADO)
# ==========================================
@login_required(login_url='/admin/login/')
def dashboard_view(request, extra_context=None): # 🔴 CORRECCIÓN CRÍTICA: Aceptar extra_context
    # 1. Capturar filtros de fecha desde la URL (si existen)
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')

    # 2. Base de datos inicial (Todos los registros)
    incidentes_qs = Incidente.objects.all()
    eventos_qs = Evento.objects.all()

    # 3. Aplicar inteligencia de filtros
    if fecha_inicio and fecha_fin:
        incidentes_qs = incidentes_qs.filter(fecha_deteccion__range=[fecha_inicio, fecha_fin + " 23:59:59"])
        eventos_qs = eventos_qs.filter(fecha_ocurrencia__range=[fecha_inicio, fecha_fin + " 23:59:59"])

    # 4. Cálculo de Métricas Clave de Rendimiento (KPIs)
    total_incidentes = incidentes_qs.count()
    incidentes_abiertos = incidentes_qs.filter(estado__in=['ABIERTO', 'CONTENCION', 'ERRADICACION']).count()
    incidentes_criticos = incidentes_qs.filter(severidad='CRITICA').count()
    eventos_hoy = Evento.objects.filter(fecha_ocurrencia__date=timezone.now().date()).count()

    # 5. Agrupación para las Gráficas
    data_severidad = incidentes_qs.values('severidad').annotate(total=Count('severidad'))
    data_tipos = incidentes_qs.values('tipo_ataque').annotate(total=Count('tipo_ataque')).order_by('-total')[:5]

    # 6. FEED DE AUDITORÍA: Extraer los últimos 15 cambios
    historial_cambios = Incidente.history.select_related('history_user').order_by('-history_date')[:15]

    context = {
        'title': 'Registro Incidente MRI', # 🔴 CORRECCIÓN CRÍTICA: Borra el texto "Sitio de administración"
        'total_incidentes': total_incidentes,
        'incidentes_abiertos': incidentes_abiertos,
        'incidentes_criticos': incidentes_criticos,
        'eventos_hoy': eventos_hoy,
        'data_severidad': list(data_severidad),
        'data_tipos': list(data_tipos),
        'historial_cambios': historial_cambios,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
    }
    
    # Inyectar el menú lateral corporativo de Jazzmin
    context.update(admin.site.each_context(request))
    
    # Sincronizar el contexto extra del inicio secuestrado
    if extra_context:
        context.update(extra_context)
        
    return render(request, 'incidentes/dashboard.html', context)


# ==========================================
# 3. EXPORTACIÓN: PDF GERENCIAL DEL DASHBOARD
# ==========================================
@login_required(login_url='/admin/login/')
def exportar_dashboard_pdf(request):
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')

    incidentes_qs = Incidente.objects.all()
    if fecha_inicio and fecha_fin:
        incidentes_qs = incidentes_qs.filter(fecha_deteccion__range=[fecha_inicio, fecha_fin + " 23:59:59"])

    # Generamos un diseño corporativo exclusivo para las estadísticas generales
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Helvetica, sans-serif; color: #333; }}
            h1 {{ color: #004b87; border-bottom: 2px solid #004b87; padding-bottom: 10px; font-size: 16pt; }}
            h3 {{ color: #555; font-size: 12pt; margin-top: 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background-color: #004b87; color: white; padding: 10px; text-align: left; font-size: 11pt; }}
            td {{ border-bottom: 1px solid #ddd; padding: 10px; font-size: 11pt; }}
            .critico {{ color: #dc3545; font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>REPORTE ESTADÍSTICO - REGISTRO INCIDENTE MRI</h1>
        <h3>Centro de Operaciones de Seguridad - FEMSA Salud</h3>
        
        <p><strong>Fecha de Generación:</strong> {timezone.now().strftime('%d/%m/%Y %H:%M')}</p>
        <p><strong>Filtro Aplicado:</strong> {fecha_inicio or 'Histórico'} al {fecha_fin or 'Actualidad'}</p>
        
        <table>
            <tr>
                <th style="width: 70%;">Indicador de Riesgo (KPI)</th>
                <th style="width: 30%;">Volumen Actual</th>
            </tr>
            <tr>
                <td>Total de Incidentes Registrados</td>
                <td><strong>{incidentes_qs.count()}</strong></td>
            </tr>
            <tr>
                <td>Casos Abiertos o En Fase de Contención</td>
                <td>{incidentes_qs.filter(estado__in=['ABIERTO', 'CONTENCION', 'ERRADICACION']).count()}</td>
            </tr>
            <tr>
                <td>Alertas de Nivel CRÍTICO Activas</td>
                <td class="critico">{incidentes_qs.filter(severidad='CRITICA').count()}</td>
            </tr>
        </table>
        
        <p style="margin-top: 40px; font-size: 8pt; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 10px;">
            Documento estrictamente confidencial. Generado automáticamente por la Plataforma SecOps.
        </p>
    </body>
    </html>
    """

    response = HttpResponse(content_type='application/pdf')
    filename = f"Estadisticas_MRI_{timezone.now().strftime('%Y%m%d')}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    pisa_status = pisa.CreatePDF(html_content, dest=response)
    if pisa_status.err:
        return HttpResponse('Tuvimos algunos errores procesando el documento PDF de Estadísticas.')
    return response