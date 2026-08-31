from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    Evento, BitacoraEvento, EvidenciaEvento,
    Incidente, ActivoAfectado, BitacoraIncidente, EvidenciaIncidente, LeccionAprendida
)

# ==========================================
# 🛡️ POLÍTICAS DE SEGURIDAD CSIRT (RBAC)
# ==========================================
class CSIRTSecurityMixin:
    """
    Norma de Retención y Auditoría:
    1. Previene la eliminación de registros (solo el SuperAdmin de TI puede).
    2. Activa el modo 'Solo Lectura' automático para auditores o CISO.
    """
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def get_readonly_fields(self, request, obj=None):
        if request.user.groups.filter(name='CISO (Lectura)').exists():
            return [field.name for field in self.model._meta.fields]
        return self.readonly_fields


# ==========================================
# --- 1. GESTIÓN DE EVENTOS (FASE DE TRIAGE) ---
# ==========================================
class BitacoraEventoInline(admin.TabularInline):
    model = BitacoraEvento
    extra = 0
    # Bloqueamos el analista para que se llene automáticamente
    readonly_fields = ('analista', 'fecha')
    verbose_name = "Registro de Actividad"
    verbose_name_plural = "LÍNEA DE TIEMPO (TIMELINE)"
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

class EvidenciaEventoInline(admin.TabularInline):
    model = EvidenciaEvento
    extra = 0
    verbose_name = "Artefacto Digital"
    verbose_name_plural = "REPOSITORIO DE EVIDENCIAS"
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

@admin.register(Evento)
class EventoAdmin(CSIRTSecurityMixin, SimpleHistoryAdmin):
    list_display = ('codigo', 'titulo', 'badge_severidad', 'estado', 'fecha_ocurrencia', 'es_incidente')
    list_filter = ('severidad', 'estado', 'tipo', 'es_incidente', 'fecha_ocurrencia')
    search_fields = ('titulo', 'codigo', 'descripcion')
    readonly_fields = ('codigo', 'fecha_actualizacion', 'detectado_por') 
    
    inlines = [BitacoraEventoInline, EvidenciaEventoInline]
    
    fieldsets = (
        ('Identificación y Clasificación de Triage', {
            'fields': ('codigo', 'titulo', 'origen', 'tipo', 'severidad')
        }),
        ('Contexto Técnico y Resolución', {
            'fields': ('descripcion', 'estado', 'es_incidente')
        }),
        ('Metadatos de Auditoría', {
            'fields': ('detectado_por', 'fecha_ocurrencia', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def badge_severidad(self, obj):
        colores = {'BAJA': '#28a745', 'MEDIA': '#ffc107', 'ALTA': '#fd7e14', 'CRITICA': '#dc3545'}
        color = colores.get(obj.severidad, 'grey')
        return format_html('<span style="background-color:{}; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;">{}</span>', color, obj.get_severidad_display())
    badge_severidad.short_description = 'Nivel de Riesgo'

    def save_model(self, request, obj, form, change):
        if not obj.detectado_por:
            obj.detectado_por = request.user
        super().save_model(request, obj, form, change)

    # 🔒 FIRMA FORENSE AUTOMÁTICA EN BITÁCORA
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, BitacoraEvento) and not instance.analista:
                instance.analista = request.user
            instance.save()
        formset.save_m2m()


# ==========================================
# --- 2. GESTIÓN DE INCIDENTES MAYORES ---
# ==========================================
class ActivoInline(admin.TabularInline):
    model = ActivoAfectado
    extra = 0
    verbose_name = "Activo Comprometido"
    verbose_name_plural = "INVENTARIO DE ACTIVOS AFECTADOS"
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

class BitacoraIncidenteInline(admin.TabularInline):
    model = BitacoraIncidente
    extra = 0
    # Bloqueamos para evitar suplantación de identidad
    readonly_fields = ('responsable', 'fecha_hora')
    verbose_name = "Entrada de Bitácora"
    verbose_name_plural = "BITÁCORA OFICIAL DE RESPUESTA (TIMELINE)"
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

class EvidenciaIncidenteInline(admin.TabularInline):
    model = EvidenciaIncidente
    extra = 0
    verbose_name = "Artefacto Digital"
    verbose_name_plural = "CADENA DE CUSTODIA (EVIDENCIAS)"
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

class LeccionInline(admin.StackedInline):
    model = LeccionAprendida
    extra = 0
    verbose_name = "Registro de Lección"
    verbose_name_plural = "FASE POST-INCIDENTE (LECCIONES APRENDIDAS)"
    classes = ['collapse'] 
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser

@admin.register(Incidente)
class IncidenteAdmin(CSIRTSecurityMixin, SimpleHistoryAdmin): # 🔴 BUG CORREGIDO AQUÍ
    list_display = ('codigo', 'titulo', 'tipo_ataque', 'badge_severidad', 'badge_estado', 'descargar_reporte')
    list_filter = ('estado', 'severidad', 'tipo_ataque', 'fecha_deteccion')
    search_fields = ('titulo', 'codigo', 'descripcion_inicial')
    
    readonly_fields = ('codigo', 'fecha_actualizacion', 'fecha_cierre', 'lider_incidente')
    
    inlines = [ActivoInline, BitacoraIncidenteInline, EvidenciaIncidenteInline, LeccionInline]
    
    fieldsets = (
        ('Identificación y Clasificación Inicial', {
            'fields': (
                'codigo', 
                'titulo', 
                ('tipo_ataque', 'severidad', 'tlp')
            )
        }),
        ('Alcance y Narrativa del Incidente', {
            'fields': (
                'descripcion_inicial', 
                'objetivo_afectado'
            )
        }),
        ('Asignación y Seguimiento', {
            'fields': (
                ('estado', 'lider_incidente'),
            )
        }),
        ('Registros Forenses de Auditoría', {
            'fields': (
                ('fecha_deteccion', 'fecha_actualizacion', 'fecha_cierre'),
            ),
            'classes': ('collapse',)
        }),
    )

    def badge_severidad(self, obj):
        colores = {'BAJA': '#28a745', 'MEDIA': '#ffc107', 'ALTA': '#fd7e14', 'CRITICA': '#dc3545'}
        return format_html('<span style="background-color:{}; color:white; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:11px;">{}</span>', colores.get(obj.severidad, 'grey'), obj.get_severidad_display())
    badge_severidad.short_description = 'Criticidad'

    def badge_estado(self, obj):
        color = '#28a745' if obj.estado == 'CERRADO' else '#004b87'
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', color, obj.get_estado_display())
    badge_estado.short_description = 'Estado Actual'

    def descargar_reporte(self, obj):
        if obj.id:
            return format_html('<a class="button" href="{}" target="_blank" style="background-color:#004b87; color:white; padding:4px 10px; border-radius:3px; font-weight:bold; font-size:11px; text-decoration:none;">📄 Generar PDF</a>', reverse('pdf_incidente', args=[obj.id]))
        return "-"
    descargar_reporte.short_description = "Reporte Ejecutivo"

    def save_model(self, request, obj, form, change):
        if not obj.lider_incidente: 
            obj.lider_incidente = request.user
        super().save_model(request, obj, form, change)

    # 🔒 FIRMA FORENSE AUTOMÁTICA EN BITÁCORA
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, BitacoraIncidente) and not instance.responsable:
                instance.responsable = request.user
            instance.save()
        formset.save_m2m()