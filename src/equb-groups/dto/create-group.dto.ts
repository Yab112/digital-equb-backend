import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { EqubFrequency } from '../entities/equb-group.entity';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  readonly description?: string;

  @IsNumber()
  @IsPositive({ message: 'Contribution amount must be a positive number.' })
  readonly contributionAmount: number;

  @IsEnum(EqubFrequency, {
    message: 'Frequency must be weekly, bi-weekly, or monthly.',
  })
  @IsNotEmpty()
  readonly frequency: EqubFrequency;
}
