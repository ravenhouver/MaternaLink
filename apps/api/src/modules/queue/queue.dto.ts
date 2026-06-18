import { QueueStatus } from '@prisma/client';
import { IsArray, IsInt, IsObject, IsOptional, IsString, IsEnum } from 'class-validator';

export class QueueScreeningDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsInt()
  gestationalAge?: number;

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  riskFactors?: string[];

  @IsOptional()
  @IsArray()
  routineMedication?: string[];

  @IsOptional()
  @IsString()
  responsibleDoctor?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsObject()
  riskSummary?: Record<string, unknown>;
}

export class CreateQueueDto {
  @IsString()
  patientId!: string;

  @IsString()
  pregnancyId!: string;

  @IsOptional()
  @IsString()
  assignedDoctor?: string;

  @IsOptional()
  @IsObject()
  screening?: QueueScreeningDto;
}

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus)
  status!: QueueStatus;

  @IsOptional()
  @IsString()
  assignedDoctor?: string;
}
