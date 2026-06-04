import {
  Controller, Post, Get, Body, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PartnerService } from './partner.service';
import { PartnerApiKeyGuard } from '../common/auth/partner-api-key.guard';
import { Public } from '../common/auth/public.decorator';
import { PartnerUpsertPayload } from '@connectafrica/types';

@ApiTags('partner')
@ApiSecurity('X-API-Key')
@UseGuards(PartnerApiKeyGuard)
@Public()  // skips JWT — partner endpoints use API key auth instead
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post('businesses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert a single business profile (partner API key required)' })
  upsert(@Body() payload: PartnerUpsertPayload, @Req() req: any): Promise<unknown> {
    return this.partnerService.upsertBusiness(
      payload,
      req.partner,
      req.headers['x-request-id'],
    );
  }

  @Post('businesses/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch upsert up to 500 business profiles (partner API key required)' })
  batchUpsert(@Body() payloads: PartnerUpsertPayload[], @Req() req: any) {
    return this.partnerService.batchUpsert(
      payloads,
      req.partner,
      req.headers['x-request-id'],
    );
  }

  @Get('businesses')
  @ApiOperation({ summary: "List partner's own businesses" })
  listOwn(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<unknown> {
    return this.partnerService.listOwnBusinesses(
      req.partner,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('sync-logs')
  @ApiOperation({ summary: 'List sync history for this partner' })
  syncLogs(@Req() req: any, @Query('limit') limit?: string): Promise<unknown> {
    return this.partnerService.listSyncLogs(req.partner, limit ? parseInt(limit) : undefined);
  }
}
