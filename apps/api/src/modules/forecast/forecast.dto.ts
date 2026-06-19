import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class RunForecastDto {
  @ApiProperty({ example: 'PKM-001' })
  @IsString()
  puskesmasId!: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  periode!: string;
}

export class ForecastCalendarQueryDto {
  @ApiProperty({ example: '2026-01', required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;

  @ApiProperty({ example: '2026-01-25', required: false })
  @IsOptional()
  @IsDateString()
  selectedDate?: string;
}
