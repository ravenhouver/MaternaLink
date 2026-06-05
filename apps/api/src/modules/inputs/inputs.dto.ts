import { ApiProperty } from '@nestjs/swagger';
import { DiagnosisSource, RainyAccess, Season } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class DiagnosisInputDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: 'K01' }) @IsString() kondisiId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ example: 12 }) @IsInt() @Min(0) jumlahKasus!: number;
  @ApiProperty({ enum: DiagnosisSource, default: DiagnosisSource.IMPORT }) @IsEnum(DiagnosisSource) source!: DiagnosisSource;
}

export class GejalaInputDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: 'G01' }) @IsString() gejalaId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ example: 20 }) @IsInt() @Min(0) jumlah!: number;
}

export class KonteksInputDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ enum: Season }) @IsEnum(Season) season!: Season;
  @ApiProperty({ example: 0 }) @IsInt() @Min(0) accessScore!: number;
  @ApiProperty({ enum: RainyAccess }) @IsEnum(RainyAccess) rainyAccess!: RainyAccess;
  @ApiProperty({ example: false }) @IsBoolean() routeDisrupted!: boolean;
  @ApiProperty({ example: 10, required: false }) @IsOptional() @IsInt() @Min(0) jumlahBumilT1?: number;
  @ApiProperty({ example: 15, required: false }) @IsOptional() @IsInt() @Min(0) jumlahBumilT2?: number;
  @ApiProperty({ example: 12, required: false }) @IsOptional() @IsInt() @Min(0) jumlahBumilT3?: number;
  @ApiProperty({ example: false, required: false }) @IsOptional() @IsBoolean() statusKlb?: boolean;
  @ApiProperty({ example: { 'OBT-010': 2 }, required: false }) @IsOptional() @IsObject() riwayatStockout6Bln?: Record<string, number>;
}

export class StokInputDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: 'OBT-001' }) @IsString() obatId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ example: 100 }) @IsInt() @Min(0) stokAwal!: number;
  @ApiProperty({ example: 80 }) @IsInt() @Min(0) konsumsiPeriode!: number;
  @ApiProperty({ example: 20 }) @IsInt() @Min(0) stokSaatIni!: number;
}

export class AnamnesisInputDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ example: '/audio/pkm001_202504_001.webm', required: false }) @IsOptional() @IsString() audioPath?: string;
  @ApiProperty({ example: 'Ibu hamil mengeluh lemas dan pusing.' }) @IsString() transkrip!: string;
  @ApiProperty({ example: { gejala: 'Demam tinggi', confidence: 0.95 }, required: false }) @IsOptional() @IsObject() gejalaExtracted?: Record<string, unknown>;
  @ApiProperty({ example: { gejala: 'Demam tinggi', confirmed: true }, required: false }) @IsOptional() @IsObject() gejalaValidated?: Record<string, unknown>;
  @ApiProperty({ example: 'whisper-small', required: false }) @IsOptional() @IsString() sttModel?: string;
  @ApiProperty({ example: 'bert-ner-symptom', required: false }) @IsOptional() @IsString() extractionModel?: string;
}
