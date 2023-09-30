import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { PropertyMetadataDto } from 'modules/property/dto/property.dto'

@ValidatorConstraint({ name: 'MetadataValidator', async: false })
export class MetadataValidator implements ValidatorConstraintInterface {
  validate(metadataItems: PropertyMetadataDto[], _args: ValidationArguments) {
    const allowedTypes = [
      'bedroom',
      'bathroom',
      'garage',
      'dependencies',
      'suites',
    ]
    const hasNegativeAmount = metadataItems.some(item => item.amount < 0)
    const hasValidTypes = metadataItems.every(item =>
      allowedTypes.includes(item.type),
    )
    return !hasNegativeAmount && hasValidTypes
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Propriedade metadata inválida. Metadata precisa ter 5 objetos com as propriedades type e amount cada um.`
  }
}
