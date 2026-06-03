import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';
import { InputsService } from './inputs.service';

@ApiTags('inputs')
@Controller('inputs')
export class InputsController {
  constructor(private readonly service: InputsService) {}

  @Post('diagnosis') createDiagnosis(@Body() body: DiagnosisInputDto) { return this.service.createDiagnosis(body); }
  @Post('gejala') createGejala(@Body() body: GejalaInputDto) { return this.service.createGejala(body); }
  @Post('konteks') createKonteks(@Body() body: KonteksInputDto) { return this.service.createKonteks(body); }
  @Post('stok') createStok(@Body() body: StokInputDto) { return this.service.createStok(body); }
  @Post('anamnesis') createAnamnesis(@Body() body: AnamnesisInputDto) { return this.service.createAnamnesis(body); }
}
