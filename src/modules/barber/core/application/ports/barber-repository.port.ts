import { Barber } from '../../domain/entities/barber.entity';

export const BARBER_REPOSITORY = Symbol('BarberRepository');

export interface PaginatedBarbers {
  barbers: Barber[];
  total: number;
}

export interface BarberRepository {
  save(barber: Barber): Promise<void>;
  findById(id: string): Promise<Barber | null>;
  findAll(page: number, limit: number): Promise<PaginatedBarbers>;
  existsByQualificationId(qualificationId: string): Promise<boolean>;
}
