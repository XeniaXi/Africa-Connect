import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClaimService } from './claim.service';

// TODO: POST /claims — submit a new business claim
// TODO: GET  /claims/:id — get claim status
// TODO: POST /claims/:id/approve — admin approve (requires ADMIN scope)
// TODO: POST /claims/:id/reject  — admin reject  (requires ADMIN scope)
// TODO: POST /claims/:id/verify-otp — OTP verification step

@ApiTags('claims')
@Controller('claims')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}
}
