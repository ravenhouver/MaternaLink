import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecommendationStatus, TrackingStatus } from '@prisma/client';

export class AllocationPlanItemDto {
  @ApiProperty({ example: 'OBT-001' }) @IsString() obatId!: string;
  @ApiProperty({ example: 40 }) @IsInt() @Min(0) jumlah!: number;
  @ApiProperty({ example: 'Prioritas anemia', required: false }) @IsOptional() @IsString() note?: string;
}

export class CreateAllocationPlanDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ type: [AllocationPlanItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => AllocationPlanItemDto) items!: AllocationPlanItemDto[];
}

export class UpdateAllocationPlanDto extends PartialType(CreateAllocationPlanDto) {}

export class UpdateRecommendationItemDto {
  @ApiProperty({ example: 24, required: false }) @IsOptional() @IsInt() @Min(0) overrideQuantity?: number;
  @ApiProperty({ example: 'Adjusted for active preeclampsia cases', required: false }) @IsOptional() @IsString() overrideReason?: string;
}

export class ReorderRecommendationsDto {
  @ApiProperty({ example: ['REC-DEMO-001', 'REC-DEMO-002'] }) @IsArray() @IsString({ each: true }) orderedIds!: string[];
}

export class RejectRecommendationDto {
  @ApiProperty({ example: 'Stock already allocated from emergency buffer' }) @IsString() note!: string;
}

export class TrackingEventDto {
  @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.DISPATCHED }) @IsEnum(TrackingStatus) status!: TrackingStatus;
  @ApiProperty({ example: 'Courier departed from IFK Sleman', required: false }) @IsOptional() @IsString() note?: string;
}

export class ListRecommendationsQueryDto {
  @ApiProperty({ enum: RecommendationStatus, required: false }) @IsOptional() @IsEnum(RecommendationStatus) status?: RecommendationStatus;
  @ApiProperty({ example: 'PKM-001', required: false }) @IsOptional() @IsString() puskesmasId?: string;
}

export class CreateShipmentRequestDto {
  @ApiProperty({ example: 'PKM-001' }) @IsString() puskesmasId!: string;
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
  @ApiProperty({ type: [AllocationPlanItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => AllocationPlanItemDto) items!: AllocationPlanItemDto[];
  @ApiProperty({ example: 'Forecast stockout risk', required: false }) @IsOptional() @IsString() justification?: string;
}

export class RunAiAllocationDto {
  @ApiProperty({ example: '2025-03-01' }) @IsDateString() periode!: string;
}
