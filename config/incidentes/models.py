from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from simple_history.models import HistoricalRecords

# ==========================================
# --- MENÚS DESPLEGABLES (CHOICES) ---
# ==========================================
class Severidad(models.TextChoices):
    BAJA = 'BAJA', 'Baja (Monitoreo)'
    MEDIA = 'MEDIA', 'Media (Análisis Requerido)'
    ALTA = 'ALTA', 'Alta (Impacto Operativo)'
    CRITICA = 'CRITICA', 'Crítica (Crisis de Negocio)'

class TLP(models.TextChoices):
    WHITE = 'WHITE', 'TLP:WHITE (Público)'
    GREEN = 'GREEN', 'TLP:GREEN (Comunidad)'
    AMBER = 'AMBER', 'TLP:AMBER (Restringido)'
    RED = 'RED', 'TLP:RED (Solo Involucrados)'

class Estado(models.TextChoices):
    ABIERTO = 'ABIERTO', 'Abierto / Triage'
    CONTENCION = 'CONTENCION', 'En Contención'
    ERRADICACION = 'ERRADICACION', 'En Erradicación'
    RECUPERACION = 'RECUPERACION', 'En Recuperación'
    CERRADO = 'CERRADO', 'Cerrado / Resuelto'

class TipoAtaque(models.TextChoices):
    PHISHING = 'PHISHING', 'Phishing / Ingeniería Social'
    RANSOMWARE = 'RANSOMWARE', 'Ransomware / Cifrado'
    MALWARE = 'MALWARE', 'Malware'
    DDOS = 'DDOS', 'Ataque de Denegación de Servicio (DDoS)'
    FUGA = 'FUGA', 'Fuga de Información'
    ACCESO = 'ACCESO', 'Acceso No Autorizado'
    VULNERABILIDAD = 'VULNERABILIDAD', 'Explotación de Vulnerabilidad'
    OTRO = 'OTRO', 'Otro / Por Determinar'

class TriadaCIA(models.TextChoices):
    CONFIDENCIALIDAD = 'CONFIDENCIALIDAD', 'Confidencialidad'
    INTEGRIDAD = 'INTEGRIDAD', 'Integridad'
    DISPONIBILIDAD = 'DISPONIBILIDAD', 'Disponibilidad'
    MULTIPLES = 'MULTIPLES', 'Múltiples'

class SistemaOperativo(models.TextChoices):
    WINDOWS = 'WINDOWS', 'Windows'
    LINUX = 'LINUX', 'Linux'
    MACOS = 'MACOS', 'macOS'
    RED = 'RED', 'Dispositivo de Red'
    NUBE = 'NUBE', 'Infraestructura Cloud'
    OTRO = 'OTRO', 'Otro'

class AccionContencion(models.TextChoices):
    NINGUNA = 'NINGUNA', 'Pendiente'
    MONITOREO = 'MONITOREO', 'Monitoreo Activo'
    AISLAMIENTO = 'AISLAMIENTO', 'Aislamiento de Red'
    APAGADO = 'APAGADO', 'Apagado Físico/Virtual'
    BLOQUEO = 'BLOQUEO', 'Bloqueo de Cuentas'
    RESTAURACION = 'RESTAURACION', 'Restauración de Respaldo'


# ==========================================
# --- 1. GESTIÓN DE EVENTOS (TRIAGE) ---
# ==========================================
class Evento(models.Model):
    codigo = models.CharField("ID Evento", max_length=20, unique=True, editable=False)
    titulo = models.CharField("Asunto del Evento", max_length=200)
    origen = models.CharField("Fuente de Detección", max_length=100)
    fecha_ocurrencia = models.DateTimeField("Fecha de Ocurrencia", default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    tipo = models.CharField("Vector de Ataque", max_length=20, choices=TipoAtaque.choices, default=TipoAtaque.OTRO)
    severidad = models.CharField("Nivel de Riesgo", max_length=10, choices=Severidad.choices, default=Severidad.BAJA)
    estado = models.CharField("Estado", max_length=15, choices=Estado.choices, default=Estado.ABIERTO)
    descripcion = models.TextField("Hallazgos", blank=True, null=True)
    detectado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    es_incidente = models.BooleanField("Escalar a Incidente", default=False)
    
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = "Evento de Seguridad"
        verbose_name_plural = "Gestión de Eventos"
        ordering = ['-fecha_ocurrencia']

    def save(self, *args, **kwargs):
        if not self.codigo:
            year = timezone.now().year
            ultimo = Evento.objects.filter(codigo__startswith=f"EVT-{year}").order_by('-codigo').first()
            if ultimo:
                self.codigo = f"EVT-{year}-{int(ultimo.codigo.split('-')[-1]) + 1:03d}"
            else:
                self.codigo = f"EVT-{year}-001"
        super().save(*args, **kwargs)

    def __str__(self): 
        return f"{self.codigo} | {self.titulo}"

class BitacoraEvento(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='bitacora')
    fecha = models.DateTimeField(default=timezone.now)
    accion = models.TextField("Acción")
    analista = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Registro de Evento"
        verbose_name_plural = "Bitácoras de Eventos"

    def __str__(self):
        usuario = self.analista.username if self.analista else "Sistema"
        return f"{self.fecha.strftime('%d/%m/%Y %H:%M')} - {usuario}"

class EvidenciaEvento(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='evidencias')
    archivo = models.FileField(upload_to='eventos/evidencias/')
    descripcion = models.CharField("Descripción", max_length=150, blank=True, null=True)

    class Meta:
        verbose_name = "Evidencia de Evento"
        verbose_name_plural = "Evidencias de Eventos"

    def __str__(self):
        return f"Evidencia: {self.descripcion or self.archivo.name}"


# ==========================================
# --- 2. GESTIÓN DE INCIDENTES MAYORES ---
# ==========================================
class Incidente(models.Model):
    codigo = models.CharField("Ticket ID", max_length=20, unique=True, editable=False)
    titulo = models.CharField("Resumen Ejecutivo", max_length=200)
    tipo_ataque = models.CharField("Categoría", max_length=20, choices=TipoAtaque.choices, default=TipoAtaque.OTRO)
    severidad = models.CharField("Criticidad", max_length=10, choices=Severidad.choices, default=Severidad.BAJA)
    tlp = models.CharField("Protocolo TLP", max_length=10, choices=TLP.choices, default=TLP.AMBER)
    estado = models.CharField("Estado", max_length=15, choices=Estado.choices, default=Estado.ABIERTO)
    descripcion_inicial = models.TextField("Narrativa del Incidente", blank=True, null=True)
    objetivo_afectado = models.CharField("Triada Afectada", max_length=20, choices=TriadaCIA.choices, blank=True, null=True)
    fecha_deteccion = models.DateTimeField("Fecha de Detección", default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_cierre = models.DateTimeField("Fecha de Cierre", null=True, blank=True)
    lider_incidente = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = "Incidente Mayor"
        verbose_name_plural = "Gestión de Incidentes"
        ordering = ['-fecha_deteccion']

    def save(self, *args, **kwargs):
        if not self.codigo:
            year = timezone.now().year
            ultimo = Incidente.objects.filter(codigo__startswith=f"INC-{year}").order_by('-codigo').first()
            if ultimo:
                self.codigo = f"INC-{year}-{int(ultimo.codigo.split('-')[-1]) + 1:03d}"
            else:
                self.codigo = f"INC-{year}-001"
        
        if self.estado == 'CERRADO' and not self.fecha_cierre: 
            self.fecha_cierre = timezone.now()
        elif self.estado != 'CERRADO' and self.fecha_cierre: 
            self.fecha_cierre = None
            
        super().save(*args, **kwargs)

    def __str__(self): 
        return f"{self.codigo} | {self.titulo}"

class ActivoAfectado(models.Model):
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE, related_name='activos')
    nombre_host = models.CharField("Hostname o Nombre", max_length=100)
    ip_address = models.GenericIPAddressField("Dirección IP", null=True, blank=True)
    sistema_operativo = models.CharField("Sistema", max_length=20, choices=SistemaOperativo.choices, default=SistemaOperativo.OTRO)
    accion_tomada = models.CharField("Acción Inmediata", max_length=20, choices=AccionContencion.choices, default=AccionContencion.NINGUNA)

    class Meta:
        verbose_name = "Activo Afectado"
        verbose_name_plural = "Inventario de Activos"

    def __str__(self):
        ip = f" ({self.ip_address})" if self.ip_address else ""
        return f"{self.nombre_host}{ip} - {self.get_sistema_operativo_display()}"

class BitacoraIncidente(models.Model):
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE, related_name='bitacora')
    fecha_hora = models.DateTimeField("Hora", default=timezone.now)
    actividad = models.TextField("Detalle de Actividad")
    responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Entrada de Bitácora"
        verbose_name_plural = "Línea de Tiempo"

    def __str__(self):
        usuario = self.responsable.username if self.responsable else "Sistema Automático"
        return f"[{self.fecha_hora.strftime('%d/%m/%Y %H:%M')}] {usuario}"

class EvidenciaIncidente(models.Model):
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE, related_name='evidencias_files')
    archivo = models.FileField(upload_to='incidentes/evidencias/')
    descripcion = models.CharField("Descripción", max_length=150, blank=True, null=True)

    class Meta:
        verbose_name = "Artefacto de Evidencia"
        verbose_name_plural = "Cadena de Custodia"

    def __str__(self):
        return self.descripcion if self.descripcion else f"Archivo: {self.archivo.name}"

class LeccionAprendida(models.Model):
    incidente = models.OneToOneField(Incidente, on_delete=models.CASCADE, related_name='lecciones')
    que_funciono = models.TextField("¿Qué funcionó bien?", blank=True, null=True)
    que_fallo = models.TextField("¿Qué falló?", blank=True, null=True)
    causa_raiz = models.CharField("Causa Raíz", max_length=250)
    mejoras_propuestas = models.TextField("Plan de Mejora")

    class Meta:
        verbose_name = "Reporte Post-Mortem"
        verbose_name_plural = "Lecciones Aprendidas"

    def __str__(self):
        return f"RCA - {self.incidente.codigo}"