export const removeNonAlphanumericCharacters = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9]/g, '')
}
