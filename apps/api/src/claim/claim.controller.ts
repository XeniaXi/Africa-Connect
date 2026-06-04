import {
  Controller, Post, Get, Body, Param, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClaimService, SubmitClaimDto, VerifyOtpDto } from './claim.service';
import { JwtPayload } from '../common/auth/jwt.strategy';

@ApiTags('claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a business claim (JWT required)' })
  submit(@Body() dto: SubmitClaimDto, @Req() req: { user: JwtPayload; headers: Record<string, string> }) {
    return this.claimService.submitClaim(dto, req.user, req.headers['x-request-id']);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get claim status (JWT required — own claims only)' })
  getOne(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.claimService.getClaim(id, req.user);
  }

  @Post(':id/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP to complete phone/email-based claim' })
  verifyOtp(
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
    @Req() req: { user: JwtPayload; headers: Record<string, string> },
  ) {
    return this.claimService.verifyOtp(id, dto, req.user, req.headers['x-request-id']);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: approve a claim (ADMIN scope required)' })
  approve(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: { user: JwtPayload; headers: Record<string, string> },
  ) {
    return this.claimService.reviewClaim(id, 'APPROVED', notes ?? '', req.user, req.headers['x-request-id']);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: reject a claim (ADMIN scope required)' })
  reject(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: { user: JwtPayload; headers: Record<string, string> },
  ) {
    return this.claimService.reviewClaim(id, 'REJECTED', notes ?? '', req.user, req.headers['x-request-id']);
  }
}
