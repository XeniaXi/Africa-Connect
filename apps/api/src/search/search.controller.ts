import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { FindBusinessInput } from '@connectafrica/types';
import { Public } from '../common/auth/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @Public()   // AI agents call this unauthenticated
  @ApiOperation({ summary: 'AI-friendly intent-based business search' })
  search(@Body() input: FindBusinessInput) {
    return this.searchService.search(input);
  }
}
