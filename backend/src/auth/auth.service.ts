import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * Servicio de autenticacion.
 * Encapsula toda la logica de negocio relacionada con la gestion de sesiones,
 * tokens JWT, refresh tokens y el ciclo de vida de las contrasenas.
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Valida las credenciales del usuario comparando el hash de la contrasena.
   * Implementa bloqueo de cuenta tras multiples intentos fallidos.
   * Retorna el usuario sin el campo passwordHash si la autenticacion es exitosa,
   * o null si las credenciales son incorrectas.
   */
  async validateUser(usernameOrEmail: string, pass: string): Promise<any> {
    // Buscar por nombre de usuario; si no existe, intentar por correo electronico.
    let user = await this.usersService.findByUsername(usernameOrEmail);
    if (!user) {
      user = await this.usersService.findByEmail(usernameOrEmail);
    }
    if (!user) return null;

    // Verificar si la cuenta esta bloqueada por intentos fallidos previos.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada. Intente mas tarde.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (isMatch) {
      await this.usersService.resetFailedLogins(user.id);
      // Excluir el hash de la contrasena de la respuesta por seguridad.
      const { passwordHash, ...result } = user;
      return result;
    } else {
      await this.usersService.incrementFailedLogins(user.id);
      return null;
    }
  }

  /**
   * Genera un access token JWT y un refresh token persistido en base de datos
   * para el usuario autenticado.
   */
  async login(user: any) {
    const payload = { sub: user.id, username: user.username, role: user.role, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // Generar un refresh token criptograficamente aleatorio con vigencia de 7 dias.
    const tokenStr = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      token: tokenStr,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: tokenStr,
      user,
      mustChangePassword: user.mustChangePassword,
      passwordExpiresAt: this.checkPasswordExpiry(user),
    };
  }

  /**
   * Revoca el refresh token del usuario para invalidar la sesion activa.
   * El access token JWT seguira siendo valido hasta su expiracion natural;
   * la seguridad se basa en su corta vida util configurada.
   */
  async logout(userId: string, token: string) {
    await this.refreshTokenRepository.update({ userId, token }, { isRevoked: true });
    return { message: 'Sesion cerrada exitosamente' };
  }

  /**
   * Emite un nuevo access token a partir de un refresh token valido y no revocado.
   * Verifica que el usuario asociado siga activo en el sistema.
   */
  async refreshToken(token: string) {
    const rt = await this.refreshTokenRepository.findOne({ where: { token, isRevoked: false } });
    if (!rt || rt.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.usersService.findOne(rt.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario invalido');
    }

    const payload = { sub: user.id, username: user.username, role: user.role, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * Permite al usuario cambiar su contrasena verificando primero la actual.
   * Rechaza contrasenas previamente utilizadas segun el historial configurado.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);
    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Contrasena actual incorrecta');
    }

    await this.usersService.checkPasswordHistory(userId, dto.newPassword);

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(dto.newPassword, salt);

    await this.usersService.update(userId, {
      passwordHash: hash,
      mustChangePassword: false,
      lastPasswordChange: new Date(),
    });
    await this.usersService.savePasswordHistory(userId, hash);

    return { message: 'Contrasena actualizada exitosamente' };
  }

  /**
   * Inicia el flujo de recuperacion de contrasena.
   * Por diseno de seguridad, la respuesta es identica si el correo existe o no,
   * para evitar la enumeracion de usuarios registrados (user enumeration attack).
   *
   * IMPORTANTE: El token de reseteo debe enviarse unicamente por correo electronico
   * y NUNCA debe ser incluido en la respuesta HTTP de este endpoint.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Respuesta generica independiente de si el correo existe o no.
    if (!user) {
      return { message: 'Si el correo existe, se han enviado las instrucciones.' };
    }

    // Generar token de reseteo. En produccion debe persistirse en base de datos
    // con tiempo de expiracion y enviarse unicamente por SMTP.
    const token = randomBytes(32).toString('hex');

    // TODO: Implementar persistencia del token en tabla reset_tokens y envio por SMTP.
    // El token NO se incluye en esta respuesta HTTP por razones de seguridad.
    void token;

    return { message: 'Si el correo existe, se han enviado las instrucciones.' };
  }

  /**
   * Completa el flujo de reseteo de contrasena usando el token recibido por email.
   * Pendiente de implementacion completa con validacion de token contra la base de datos.
   */
  async resetPassword(dto: ResetPasswordDto) {
    // TODO: Implementar busqueda y validacion del token en la tabla reset_tokens.
    return { message: 'Contrasena restablecida exitosamente' };
  }

  /**
   * Calcula cuantos dias faltan para que expire la contrasena del usuario.
   * Retorna 0 si la contrasena ya expiro o si no tiene fecha de ultimo cambio.
   */
  checkPasswordExpiry(user: any): number {
    if (!user.lastPasswordChange) return 0;
    const diasVigencia = 90;
    const diff = new Date().getTime() - user.lastPasswordChange.getTime();
    const diasPasados = Math.floor(diff / (1000 * 3600 * 24));
    return Math.max(0, diasVigencia - diasPasados);
  }
}
