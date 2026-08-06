import { randomUUID } from 'node:crypto';

import { InvalidQualificationNameError } from '../errors/invalid-qualification-name.error';

const MIN_NAME_LENGTH = 2;

export interface QualificationProps {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Qualification {
  private readonly id: string;
  private name: string;
  private description?: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: QualificationProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: { name: string; description?: string }): Qualification {
    const now = new Date();

    return new Qualification({
      id: randomUUID(),
      name: Qualification.validateName(props.name),
      description: props.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: QualificationProps): Qualification {
    return new Qualification(props);
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();

    if (trimmed.length < MIN_NAME_LENGTH) {
      throw new InvalidQualificationNameError();
    }

    return trimmed;
  }

  update(props: { name?: string; description?: string }): void {
    if (props.name !== undefined) {
      this.name = Qualification.validateName(props.name);
    }

    if (props.description !== undefined) {
      this.description = props.description.trim() || undefined;
    }

    this.touch();
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

  getDescription(): string | undefined {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
