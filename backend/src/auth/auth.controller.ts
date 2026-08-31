import { Controller, Post, Get, Body, Req, UseGuards, Headers, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controlador de autenticacion.
 * Gestiona el ciclo de vida de sesiones: inicio, cierre, refresco de tokens
 * y administracion de contrasenas.
 *
 * Todos los endpoints sensibles requieren autenticacion JWT activa.
 * No existe ningun endpoint de administracion de emergencia expuesto;
 * cualquier reseteo de credenciales debe realizarse directamente desde
 * la base de datos usando el script seed-admin.ts con acceso controlado.
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Inicia sesion con credenciales locales (usuario/email + contrasena).
   * La validacion es realizada por LocalAuthGuard mediante Passport.
   * Rate limiting especifico: max 5 intentos por minuto por IP.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  /**
   * Cierra la sesion activa del usuario autenticado.
   * Revoca el refresh token asociado en la base de datos.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user, @Headers('x-refresh-token') refreshToken: string) {
    return this.authService.logout(user.id, refreshToken);
  }

  /**
   * Emite un nuevo access token usando un refresh token valido.
   * No requiere autenticacion JWT previa; el refresh token actua como credencial.
   */
  @Post('refresh')
  async refresh(@Headers('x-refresh-token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Permite al usuario autenticado cambiar su contrasena.
   * Requiere proporcionar la contrasena actual como verificacion de identidad.
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@CurrentUser() user, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  /**
   * Inicia el flujo de recuperacion de contrasena por correo electronico.
   * Por seguridad, siempre retorna el mismo mensaje independientemente
   * de si el correo existe o no (evita enumeracion de usuarios).
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Finaliza el flujo de reseteo de contrasena usando el token recibido por email.
   * NOTA: Endpoint no implementado completamente. Se desactiva para evitar
   * que devuelva exito falso sin realizar ninguna accion real.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    throw new ServiceUnavailableException(
      'La recuperación de contraseña no está habilitada. Contacte al administrador del sistema.'
    );
  }

  /**
   * Retorna el perfil del usuario actualmente autenticado a partir del JWT.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user) {
    return user;
  }

  /**
   * Informa cuantos dias faltan para que expire la contrasena del usuario actual.
   */
  @UseGuards(JwtAuthGuard)
  @Get('password-status')
  getPasswordStatus(@CurrentUser() user) {
    return { expiresInDays: this.authService.checkPasswordExpiry(user) };
  }
}
