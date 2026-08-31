"""
Configuración de Django para la Plataforma de Operaciones de Seguridad (SecOps).
CSIRT - FEMSA Salud.
"""

import os
from pathlib import Path

# ==========================================
# 1. CONFIGURACIÓN BASE
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ADVERTENCIA DE SEGURIDAD: Mantén esta clave secreta en producción
SECRET_KEY = 'django-insecure-q#)0fp)an_+m6mv+wybxzf*$^8@%twy45rf+bi!^(7jty=d0hl'

DEBUG = True
ALLOWED_HOSTS = ['*']


# ==========================================
# 2. APLICACIONES Y MIDDLEWARE
# ==========================================
INSTALLED_APPS = [
    # Interfaz Enterprise
    'jazzmin',
    
    # Núcleo Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Módulos del CSIRT
    'incidentes',
    'simple_history', # Motor de Auditoría Forense
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware', # Rastreo de usuarios para auditoría
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ==========================================
# 3. BASE DE DATOS
# ==========================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ==========================================
# 4. VALIDACIÓN DE CONTRASEÑAS Y SEGURIDAD
# ==========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- SEGURIDAD DE SESIONES (POLÍTICA SOC) ---
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 1800 # Expiración en 30 minutos de inactividad


# ==========================================
# 5. REGIONALIZACIÓN Y TIEMPO FORENSE
# ==========================================
LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True


# ==========================================
# 6. RUTAS DE ARCHIVOS (ESTÁTICOS Y EVIDENCIAS)
# ==========================================
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# ==========================================
# 7. DISEÑO CORPORATIVO Y UI (JAZZMIN)
# ==========================================
JAZZMIN_SETTINGS = {
    "site_title": "Registro Incidente MRI",
    "site_header": "Registro Incidente MRI",
    "site_brand": "Registro Incidente MRI",
    
    # Al hacer clic en el logo, te lleva al Dashboard principal
    "site_url": "/admin/",
    
    # Asegúrate de que estas imágenes en tu carpeta static/img/ sean PNGs con fondo transparente
    "site_logo": "img/icono_femsa.png",
    "login_logo": "img/logo_femsa.png",
    "site_logo_classes": "img-fluid",
    
    "usermenu_links": [
        {"name": "Finalizar Sesión Segura", "url": "/admin/logout/", "icon": "fas fa-power-off", "new_window": False},
    ],
    
    "order_with_respect_to": ["incidentes", "incidentes.incidente", "incidentes.evento", "auth"],
    
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user-shield",
        "auth.Group": "fas fa-users",
        "incidentes.Evento": "fas fa-exclamation-triangle", 
        "incidentes.Incidente": "fas fa-biohazard",         
    },
    
    "custom_css": "css/custom_soc.css",
    
    # Formulario lineal profesional, previene bloqueos por pestañas ocultas
    "changeform_format": "single",
}

# --- PALETA VISUAL ENTERPRISE ---
JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": True,
    "body_small_text": False,
    "brand_small_text": False,
    
    # 🔴 SOLUCIÓN: Azul Marino Oscuro y Serio (Navy) para Seguridad
    "brand_colour": "navbar-navy", 
    "navbar": "navbar-dark navbar-navy", 
    "no_navbar_border": True, 
    
    "accent": "accent-primary",
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-navy", # Panel lateral azul noche para contraste
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": True,
    "theme": "lumen", # Tema limpio y moderno
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}