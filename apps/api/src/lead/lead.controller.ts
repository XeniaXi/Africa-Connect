import {
  Controller, Post, Get, Patch, Body, Param, Query,
  Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadService, CreateLeadDto, UpdateLeadStatusDto } from './lead.service';
import { Public } from '../common/auth/public.decorator';
import { JwtPayload } from '../common/auth/jwt.strategy';

@ApiTags('leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  /**
   * Create a lead — called by MCP agents and public web UI.
   * No JWT required (agents don't hold user tokens).
   * Actor type is read from X-Actor-Type header (AGENT, USER, SYSTEM).
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a customer lead (public — no JWT required)' })
  create(
    @Body() dto: CreateLeadDto,
    @Req() req: { headers: Record<string, string> },
  ): Promise<unknown> {
    const actorType = req.headers['x-actor-type'] ?? 'AGENT';
    return this.leadService.createLead(dto, actorType, req.headers['x-request-id']);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead by ID (business owner JWT required)' })
  findOne(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ): Promise<unknown> {
    return this.leadService.findById(id, req.user.sub);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List leads for a business (business owner JWT required)' })
  listForBusiness(
    @Query('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: { user: JwtPayload },
  ): Promise<unknown[]> {
    return this.leadService.listForBusiness(
      businessId,
      req!.user.sub,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status (business owner JWT required)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: { user: JwtPayload; headers: Record<string, string> },
  ): Promise<unknown> {
    return this.leadService.updateStatus(id, dto, req.user.sub, req.headers['x-request-id']);
  }
}
