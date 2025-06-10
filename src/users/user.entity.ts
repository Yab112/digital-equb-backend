import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true }) // Email can be null for SMS-only users
  email: string | null;

  @Column({ nullable: true })
  name: string | null;

  @Column({ name: 'google_id', unique: true, nullable: true })
  googleId: string | null;

  // --- NEW FIELD ---
  @Column({ name: 'phone_number', unique: true, nullable: true })
  phoneNumber: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_number_verified', default: false })
  isPhoneNumberVerified: boolean;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;
}
