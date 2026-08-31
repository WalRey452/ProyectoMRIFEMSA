import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>) {
    const entry = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(entry);
  }

  async findAll(filters: any) {
    const query = this.auditLogRepository.createQueryBuilder('log');
    
    if (filters.userId) query.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters.action) query.andWhere('log.action = :action', { action: filters.action });
    if (filters.entityType) query.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    if (filters.startDate) query.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) query.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit).orderBy('log.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRecentActivity(limit = 20) {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserActivity(userId: string, pagination: any) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [items, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
