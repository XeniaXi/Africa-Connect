import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark an endpoint as publicly accessible — skips JWT auth check. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
