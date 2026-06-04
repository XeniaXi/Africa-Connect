import { Injectable } from '@nestjs/common';

// TODO: Implement phone OTP send (Termii / Africa's Talking provider)
// TODO: Implement phone OTP verify — upserts VerificationRecord, bumps verificationLevel to 1
// TODO: Implement email verification flow — bumps verificationLevel to 2
// TODO: Implement document upload verification — bumps verificationLevel to 3
// TODO: Implement address verification — bumps verificationLevel to 4
// TODO: Re-trigger trust score computation after every successful verification
// TODO: VerificationRecord is append-only — never delete or update status to lower value
// TODO: Emit AuditLog on every verification state change

@Injectable()
export class VerificationService {}
