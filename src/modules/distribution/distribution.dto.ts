import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
