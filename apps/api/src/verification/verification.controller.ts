import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';

// TODO: POST /verification/phone/send   — send OTP to business phone number
// TODO: POST /verification/phone/verify — verify OTP code, set verificationLevel >= 1
// TODO: POST /verification/email/send   — send email verification link
// TODO: POST /verification/email/verify — verify token, set verificationLevel >= 2
// TODO: POST /verification/document     — upload CAC / RC document (multipart)
// TODO: GET  /verification/:businessId  — list verification records for a business

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}
}
