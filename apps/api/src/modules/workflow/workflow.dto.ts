import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RunAiWorkflowDto {
  @ApiProperty({ example: 'PKM-001', required: false })
  @IsOptional()
  @IsString()
  puskesmasId?: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  periode!: string;
}

export class AiWorkflowStateQueryDto {
  @ApiProperty({ example: 'PKM-001', required: false })
  @IsOptional()
  @IsString()
  puskesmasId?: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  periode!: string;
}
