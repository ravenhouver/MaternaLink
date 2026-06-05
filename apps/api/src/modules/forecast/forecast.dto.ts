import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class RunForecastDto {
  @ApiProperty({ example: 'PKM-001' })
  @IsString()
  puskesmasId!: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  periode!: string;
}
