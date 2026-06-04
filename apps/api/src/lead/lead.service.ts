import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@connectafrica/database';

export interface CreateLeadDto {
  businessId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  message?: string;
  sourceChannel?: string;
  sourcePartner?: string;
}

export interface UpdateLeadStatusDto {
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';
}

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  async createLead(dto: CreateLeadDto, actorType = 'AGENT', requestId?: string): Promise<unknown> {
    if (!dto.customerPhone && !dto.customerEmail && !dto.message) {
      throw new BadRequestException('Lead must include at least one of: customerPhone, customerEmail, message');
    }

    const business = await prisma.business.findUnique({
      where: { id: dto.businessId },
      select: { id: true, displayName: true, status: true },
    });
    if (!business) throw new NotFoundException(`Business ${dto.businessId} not found`);
    if (business.status !== 'ACTIVE') {
      throw new BadRequestException(`Business "${business.displayName}" is not accepting leads`);
    }

    const lead = await prisma.lead.create({
      data: {
        businessId:    dto.businessId,
        customerName:  dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        message:       dto.message,
        sourceChannel: dto.sourceChannel ?? 'api',
        sourcePartner: dto.sourcePartner,
        status:        'NEW',
      },
    });

    await prisma.auditLog.create({
      data: {
        requestId,
        actorType: actorType as any,
        action:    'lead.create',
        resource:  'Lead',
        resourceId: lead.id,
        metadata: { businessId: dto.businessId, sourceChannel: dto.sourceChannel },
      },
    });

    this.logger.log(`Lead created ${lead.id} for business ${dto.businessId} via ${dto.sourceChannel ?? 'api'}`);
    return lead;
  }

  async findById(id: string, actorUserId?: string): Promise<unknown> {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { business: { select: { id: true, displayName: true, claimedByUserId: true } } },
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);

    // Only the business owner (claimed user) or an admin can read leads
    if (actorUserId && lead.business.claimedByUserId !== actorUserId) {
      throw new ForbiddenException('Access denied — only the business owner can view leads');
    }

    return lead;
  }

  async listForBusiness(businessId: string, actorUserId: string, limit = 50, offset = 0): Promise<unknown[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { claimedByUserId: true },
    });
    if (!business) throw new NotFoundException(`Business ${businessId} not found`);
    if (business.claimedByUserId !== actorUserId) {
      throw new ForbiddenException('Access denied — only the business owner can view leads');
    }

    return prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateLeadStatusDto,
    actorUserId: string,
    requestId?: string,
  ): Promise<unknown> {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { business: { select: { claimedByUserId: true } } },
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    if (lead.business.claimedByUserId !== actorUserId) {
      throw new ForbiddenException('Access denied — only the business owner can update lead status');
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status:      dto.status,
        convertedAt: dto.status === 'CONVERTED' ? new Date() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        requestId,
        actorId:    actorUserId,
        actorType:  'USER',
        action:     'lead.updateStatus',
        resource:   'Lead',
        resourceId: id,
        metadata:   { newStatus: dto.status },
      },
    });

    return updated;
  }
}
