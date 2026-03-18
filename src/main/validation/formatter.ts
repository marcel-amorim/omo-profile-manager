import { z } from 'zod';

export interface FormattedValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormattedValidationResult {
  success: false;
  errors: FormattedValidationError[];
  summary: string;
}

function getPathString(path: PropertyKey[]): string {
  return path
    .map((segment, index) => {
      const str = String(segment);
      if (index === 0) return str;
      if (typeof segment === 'number') return `[${segment}]`;
      return `.${str}`;
    })
    .join('');
}

function getErrorMessage(issue: z.ZodIssue): string {
  if (issue.message) {
    return issue.message;
  }

  const code = issue.code;

  switch (code) {
    case 'invalid_type': {
      const typeIssue = issue as z.ZodIssue & { expected: string; received: string };
      return `Expected ${typeIssue.expected}, received ${typeIssue.received}`;
    }

    case 'too_small': {
      const smallIssue = issue as z.ZodIssue & { minimum: number; type: string };
      if (smallIssue.type === 'string') {
        return smallIssue.minimum === 1
          ? 'This field is required'
          : `Must be at least ${smallIssue.minimum} characters`;
      }
      if (smallIssue.type === 'number') {
        return `Must be at least ${smallIssue.minimum}`;
      }
      if (smallIssue.type === 'array') {
        return `Must have at least ${smallIssue.minimum} items`;
      }
      return `Value is too small`;
    }

    case 'too_big': {
      const bigIssue = issue as z.ZodIssue & { maximum: number; type: string };
      if (bigIssue.type === 'string') {
        return `Must be at most ${bigIssue.maximum} characters`;
      }
      if (bigIssue.type === 'number') {
        return `Must be at most ${bigIssue.maximum}`;
      }
      if (bigIssue.type === 'array') {
        return `Must have at most ${bigIssue.maximum} items`;
      }
      return `Value is too large`;
    }

    case 'invalid_format': {
      return 'Invalid format';
    }

    case 'custom':
      return issue.message || 'Validation failed';

    default:
      return issue.message || 'Validation failed';
  }
}

export function formatZodError(error: z.ZodError): FormattedValidationResult {
  const errors: FormattedValidationError[] = error.issues.map((issue) => ({
    field: getPathString(issue.path),
    message: getErrorMessage(issue),
    code: issue.code,
  }));

  const fieldList = errors.length === 1 
    ? errors[0].field 
    : `${errors.length} fields`;

  return {
    success: false,
    errors,
    summary: `Validation failed for ${fieldList}`,
  };
}

export function formatZodErrorsFlat(error: z.ZodError): string {
  const formatted = formatZodError(error);
  return formatted.errors
    .map((e) => `${e.field}: ${e.message}`)
    .join('\n');
}

export function formatZodErrorsForDisplay(error: z.ZodError): string {
  const formatted = formatZodError(error);
  
  if (formatted.errors.length === 0) {
    return 'Validation failed';
  }

  if (formatted.errors.length === 1) {
    const err = formatted.errors[0];
    return err.field ? `${err.field}: ${err.message}` : err.message;
  }

  const lines = formatted.errors.map((e) => {
    const field = e.field || 'value';
    return `  • ${field}: ${e.message}`;
  });

  return `Validation failed:\n${lines.join('\n')}`;
}

export function getFieldErrors(error: z.ZodError, fieldPath: string): string[] {
  return error.issues
    .filter((issue) => getPathString(issue.path) === fieldPath)
    .map((issue) => getErrorMessage(issue));
}

export function hasFieldError(error: z.ZodError, fieldPath: string): boolean {
  return error.issues.some((issue) => getPathString(issue.path) === fieldPath);
}

export function getFirstError(error: z.ZodError): FormattedValidationError | null {
  if (error.issues.length === 0) return null;
  
  const issue = error.issues[0];
  return {
    field: getPathString(issue.path),
    message: getErrorMessage(issue),
    code: issue.code,
  };
}
