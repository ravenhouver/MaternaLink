import { PartialType } from '@nestjs/mapped-types';
import { ExaminationSource } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ExaminationDiagnosisDto {
  @IsString()
  kondisiId!: string;

  @IsInt()
  @Min(1)
  jumlahKasus!: number;
}

export class ExaminationSymptomDto {
  @IsString()
  gejalaId!: string;

  @IsInt()
  @Min(1)
  jumlah!: number;
}

export class ExaminationMedicationDto {
  @IsString()
  obatId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  frequency?: number;

  @IsOptional()
  @IsString()
  frequencyUnit?: string;
}

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  queueId?: string;

  @IsString()
  patientId!: string;

  @IsString()
  pregnancyId!: string;

  @IsOptional()
  @IsEnum(ExaminationSource)
  source?: ExaminationSource;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  gestationalAge?: number;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationDiagnosisDto)
  diagnosis?: ExaminationDiagnosisDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationSymptomDto)
  symptoms?: ExaminationSymptomDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExaminationMedicationDto)
  medication?: ExaminationMedicationDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  riskSummary?: Record<string, unknown>;
}

export class UpdateExaminationDto extends PartialType(CreateExaminationDto) {}

export class AiExaminationDraftDto {
  @IsString()
  complaint!: string;

  @IsOptional()
  @IsString()
  period?: string;
}
