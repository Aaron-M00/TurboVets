import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('permissions')
@Unique(['action'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;
}
