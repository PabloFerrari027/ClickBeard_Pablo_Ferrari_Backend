import { DomainError } from './domain.error';

export class WeakPasswordError extends DomainError {
  constructor() {
    super(
      'A senha deve ter no mínimo 8 caracteres, incluindo letras e números.',
    );
  }
}
