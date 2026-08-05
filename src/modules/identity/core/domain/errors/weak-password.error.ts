import { DomainError } from './domain.error';

export class WeakPasswordError extends DomainError {
  constructor() {
    super(
      'The password must be at least 8 characters long and include letters and numbers.',
    );
  }
}
