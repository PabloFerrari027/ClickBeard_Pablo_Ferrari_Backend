import { BarberMustHaveAtLeastOneQualificationError } from '../errors/barber-must-have-at-least-one-qualification.error';
import { InvalidHiringDateError } from '../errors/invalid-hiring-date.error';
import { QualificationAlreadyAssignedError } from '../errors/qualification-already-assigned.error';
import { QualificationNotAssignedError } from '../errors/qualification-not-assigned.error';
import { Age } from '../value-objects/age.value-object';

export interface BarberProps {
  id: string;
  name: string;
  age: Age;
  hiredAt: Date;
  qualificationIds: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Barber {
  private readonly id: string;
  private readonly name: string;
  private age: Age;
  private hiredAt: Date;
  private qualificationIds: string[];
  private active: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: BarberProps) {
    this.id = props.id;
    this.name = props.name;
    this.age = props.age;
    this.hiredAt = props.hiredAt;
    this.qualificationIds = props.qualificationIds;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    userId: string;
    name: string;
    age: Age;
    hiredAt: Date;
    qualificationIds: string[];
  }): Barber {
    const uniqueQualificationIds = Array.from(new Set(props.qualificationIds));

    if (uniqueQualificationIds.length === 0) {
      throw new BarberMustHaveAtLeastOneQualificationError();
    }

    const now = new Date();

    return new Barber({
      id: props.userId,
      name: props.name,
      age: props.age,
      hiredAt: Barber.validateHiredAt(props.hiredAt),
      qualificationIds: uniqueQualificationIds,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: BarberProps): Barber {
    return new Barber(props);
  }

  private static validateHiredAt(hiredAt: Date): Date {
    if (hiredAt.getTime() > Date.now()) {
      throw new InvalidHiringDateError();
    }

    return hiredAt;
  }

  updateAge(age: Age): void {
    this.age = age;
    this.touch();
  }

  updateHiredAt(hiredAt: Date): void {
    this.hiredAt = Barber.validateHiredAt(hiredAt);
    this.touch();
  }

  addQualification(qualificationId: string): void {
    if (this.qualificationIds.includes(qualificationId)) {
      throw new QualificationAlreadyAssignedError();
    }

    this.qualificationIds = [...this.qualificationIds, qualificationId];
    this.touch();
  }

  removeQualification(qualificationId: string): void {
    if (!this.qualificationIds.includes(qualificationId)) {
      throw new QualificationNotAssignedError();
    }

    if (this.qualificationIds.length === 1) {
      throw new BarberMustHaveAtLeastOneQualificationError();
    }

    this.qualificationIds = this.qualificationIds.filter(
      (id) => id !== qualificationId,
    );
    this.touch();
  }

  /** Drops the profile out of search/booking without losing its data — see `reactivate`. */
  deactivate(): void {
    this.active = false;
    this.touch();
  }

  /** Restores a demoted-then-promoted-again barber's original profile as-is, untouched since `deactivate`. */
  reactivate(): void {
    this.active = true;
    this.touch();
  }

  isActive(): boolean {
    return this.active;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getAge(): Age {
    return this.age;
  }

  getHiredAt(): Date {
    return this.hiredAt;
  }

  getQualificationIds(): string[] {
    return [...this.qualificationIds];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
