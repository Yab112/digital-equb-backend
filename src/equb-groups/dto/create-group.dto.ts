import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EqubFrequency } from '../entities/equb-group.entity';

export class CreateGroupDto {
  @ApiProperty({
    example: 'My Equb Group',
    description: 'Name of the Equb group',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({
    example: 'A group for monthly savings',
    description: 'Description of the Equb group',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  readonly description?: string;

  @ApiProperty({
    example: 1000.0,
    description: 'Contribution amount for each cycle',
  })
  @IsNumber()
  @IsPositive({ message: 'Contribution amount must be a positive number.' })
  readonly contributionAmount: number;

  @ApiProperty({
    example: 'monthly',
    description: 'Frequency of the Equb group',
    enum: ['weekly', 'bi-weekly', 'monthly'],
  })
  @IsEnum(EqubFrequency, {
    message: 'Frequency must be weekly, bi-weekly, or monthly.',
  })
  @IsNotEmpty()
  readonly frequency: EqubFrequency;
}
