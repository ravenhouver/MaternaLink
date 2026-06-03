import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';
import { InputsService } from './inputs.service';

@ApiTags('inputs')
@Controller('inputs')
export class InputsController {
  constructor(private readonly service: InputsService) {}

  @ApiOperation({ summary: 'Upsert monthly diagnosis input' })
  @ApiResponse({ status: 201, description: 'Diagnosis input saved' })
  @Post('diagnosis') createDiagnosis(@Body() body: DiagnosisInputDto) { return this.service.createDiagnosis(body); }
  @ApiOperation({ summary: 'Upsert monthly symptom input' })
  @ApiResponse({ status: 201, description: 'Symptom input saved' })
  @Post('gejala') createGejala(@Body() body: GejalaInputDto) { return this.service.createGejala(body); }
  @ApiOperation({ summary: 'Upsert monthly puskesmas context input' })
  @ApiResponse({ status: 201, description: 'Context input saved' })
  @Post('konteks') createKonteks(@Body() body: KonteksInputDto) { return this.service.createKonteks(body); }
  @ApiOperation({ summary: 'Upsert monthly medicine stock input' })
  @ApiResponse({ status: 201, description: 'Stock input saved' })
  @Post('stok') createStok(@Body() body: StokInputDto) { return this.service.createStok(body); }
  @ApiOperation({ summary: 'Create raw anamnesis transcript input' })
  @ApiResponse({ status: 201, description: 'Anamnesis input saved' })
  @Post('anamnesis') createAnamnesis(@Body() body: AnamnesisInputDto) { return this.service.createAnamnesis(body); }
}
