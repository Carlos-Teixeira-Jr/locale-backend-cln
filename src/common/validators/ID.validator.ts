import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'IDValidator', async: false })
export class IDValidator implements ValidatorConstraintInterface {
  private readonly objectIdRegex = /^[0-9a-fA-F]{24}$/

  validate(objectId: string, _args: ValidationArguments): boolean {
    return this.objectIdRegex.test(objectId)
  }

  defaultMessage(_args?: ValidationArguments): string {
    return `ObjectId inválido '${_args.property}: ${_args.value}', tente novamente com um ObjectId válido!`
  }
}
