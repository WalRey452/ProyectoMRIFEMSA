import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordHistory)
    private passwordHistoryRepository: Repository<PasswordHistory>,
  ) {}

  async create(dto: CreateUserDto) {
    // Auto-generar username desde el correo si no se proporcionó
    const autoUsername = dto.username || dto.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

    const exists = await this.usersRepository.findOne({
      where: [{ username: autoUsername }, { email: dto.email }],
    });
    if (exists) {
      throw new BadRequestException('El usuario o email ya existe');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(dto.password, salt);

    const user = this.usersRepository.create({
      username: autoUsername,
      email: dto.email,
      firstName: dto.firstName || autoUsername,
      lastName: dto.lastName || '',
      cargo: dto.cargo || 'Sin cargo asignado',
      role: dto.role || Role.VIEWER,
      passwordHash: hash,
      mustChangePassword: true,
    });

    const savedUser = await this.usersRepository.save(user);
    await this.savePasswordHistory(savedUser.id, hash);
    return savedUser;
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto | Partial<User>) {
    const user = await this.findOne(id);
    this.usersRepository.merge(user, dto as any);
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findOne(id);
    this.usersRepository.merge(user, dto);
    return this.usersRepository.save(user);
  }

  async deactivate(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async updateAvatar(id: string, filename: string) {
    const user = await this.findOne(id);
    user.avatarUrl = filename;
    return this.usersRepository.save(user);
  }

  async checkPasswordHistory(userId: string, newPassword: string) {
    const history = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const record of history) {
      const isMatch = await bcrypt.compare(newPassword, record.passwordHash);
      if (isMatch) {
        throw new BadRequestException('La contraseña ya ha sido utilizada recientemente. Elija otra.');
      }
    }
  }

  async savePasswordHistory(userId: string, passwordHash: string) {
    const history = this.passwordHistoryRepository.create({ userId, passwordHash });
    return this.passwordHistoryRepository.save(history);
  }

  async incrementFailedLogins(id: string) {
    const user = await this.findOne(id);
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    }
    await this.usersRepository.save(user);
  }

  async resetFailedLogins(id: string) {
    const user = await this.findOne(id);
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.usersRepository.save(user);
    }
  }
}
