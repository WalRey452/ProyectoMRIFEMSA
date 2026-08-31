"""
Enrutador Principal (URL Dispatcher) para la Plataforma SecOps.
CSIRT - FEMSA Salud.
"""

from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

# Importaciones de nuestras vistas
from incidentes.views import (
    dashboard_view, 
    generar_pdf_incidente, 
    exportar_dashboard_pdf
)

# ==========================================
# 🚀 SECUESTRO DEL PANEL NATIVO DE DJANGO
# ==========================================
# Obligamos a Django a usar nuestro Dashboard como la página de "Inicio" oficial
def admin_index_override(request, extra_context=None):
    return dashboard_view(request, extra_context)

admin.site.index = admin_index_override
# ------------------------------------------

urlpatterns = [
    # ==========================================
    # 1. RUTAS PRINCIPALES Y NÚCLEO SOC
    # ==========================================
    # Si alguien entra a la raíz, va directo al administrador (que ahora es el dashboard)
    path('', RedirectView.as_view(url='/admin/', permanent=True)),
    
    # Núcleo del sistema y gestión de bases de datos
    path('admin/', admin.site.urls),
    
    # ==========================================
    # 2. GENERACIÓN DE REPORTES Y EXPORTACIÓN
    # ==========================================
    # Reporte PDF Ejecutivo (Por Incidente Específico)
    path('reporte/pdf/<int:incidente_id>/', generar_pdf_incidente, name='pdf_incidente'),
    
    # Reporte PDF Gerencial (Todo el Dashboard con sus filtros)
    path('admin/exportar-dashboard/', exportar_dashboard_pdf, name='exportar_dashboard'),
]

# ==========================================
# 3. RUTAS PARA CADENA DE CUSTODIA (EVIDENCIAS)
# ==========================================
# Esto asegura que Django pueda servir y mostrar las imágenes y logs subidos
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)