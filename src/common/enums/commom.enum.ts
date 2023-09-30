export enum EXCEPTION_DESCRIPTION {
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Mandatory header (missing or invalid), token error (user or system), other authentication error.',
  INTERNAL_SERVER_ERROR = 'For security reasons, we do not detail an internal error for the user, only a middleware error.',
}
