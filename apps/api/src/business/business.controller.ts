import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BusinessService } from './business.service';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  findOne(@Param('id') id: string) {
    return this.businessService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List businesses with filters' })
  findMany(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('verified') verified?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.businessService.findMany({
      categorySlug: category,
      city,
      state,
      verifiedOnly: verified === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }
}
