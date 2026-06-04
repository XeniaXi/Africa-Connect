import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { FindBusinessInput } from '@connectafrica/types';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'AI-friendly intent-based business search' })
  search(@Body() input: FindBusinessInput) {
    return this.searchService.search(input);
  }
}
