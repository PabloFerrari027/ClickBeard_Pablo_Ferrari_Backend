import { Qualification } from '../../domain/entities/qualification.entity';

export const QUALIFICATION_REPOSITORY = Symbol('QualificationRepository');

export interface QualificationRepository {
  save(qualification: Qualification): Promise<void>;
  findById(id: string): Promise<Qualification | null>;
  findByName(name: string): Promise<Qualification | null>;
  findAll(): Promise<Qualification[]>;
  listByBarberId(barberId: string): Promise<Qualification[]>;
  delete(id: string): Promise<void>;
}
