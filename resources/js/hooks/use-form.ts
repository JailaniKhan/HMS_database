/**
 * Comprehensive form validation hook with TypeScript support
 * Provides unified validation, error handling, and form state management
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { logger } from '@/services/logger';
import { sanitizeFormData } from '@/utils/security';

// Base validation types
export type ValidationRule<T = unknown> = (value: T, formData?: Record<string, unknown>) => string | undefined;
export type ValidationResult = string | undefined;

// Form field configuration
export interface FormFieldConfig<T = unknown> {
  initialValue: T;
  validations?: ValidationRule<T>[];
  required?: boolean;
  sanitize?: boolean;
}

// Form configuration
export interface FormConfig<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormFieldConfig<T[K]>;
  };
  onSubmit?: (data: T) => Promise<void> | void;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  sanitizeOnSubmit?: boolean;
}

// Form state
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Validation functions
export const Validators = {
  required: (message = 'This field is required'): ValidationRule => {
    return (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return undefined;
    };
  },

  minLength: (min: number, message?: string): ValidationRule<string> => {
    return (value: string) => {
      if (value && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return undefined;
    };
  },

  maxLength: (max: number, message?: string): ValidationRule<string> => {
    return (value: string) => {
      if (value && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return undefined;
    };
  },

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => {
    return (value: string) => {
      if (!value) return undefined;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? message : undefined;
    };
  },

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> => {
    return (value: string) => {
      if (!value) return undefined;
      const cleanPhone = value.replace(/[\s\-\(\)\+\.]/g, '');
      const phoneRegex = /^\d{7,15}$/;
      return !phoneRegex.test(cleanPhone) ? message : undefined;
    };
  },

  number: (min?: number, max?: number, message?: string): ValidationRule<number | string> => {
    return (value: number | string) => {
      if (value === null || value === undefined || value === '') return undefined;
      
      const num = Number(value);
      if (isNaN(num)) {
        return message || 'Must be a valid number';
      }
      
      if (min !== undefined && num < min) {
        return message || `Must be at least ${min}`;
      }
      
      if (max !== undefined && num > max) {
        return message || `Must be no more than ${max}`;
      }
      
      return undefined;
    };
  },

  pattern: (pattern: RegExp, message: string): ValidationRule<string> => {
    return (value: string) => {
      if (value && !pattern.test(value)) {
        return message;
      }
      return undefined;
    };
  },

  custom: <T>(validator: ValidationRule<T>, message: string): ValidationRule<T> => {
    return (value: T, formData?: Record<string, unknown>) => {
      const result = validator(value, formData);
      return result ? message : undefined;
    };
  }
};

// Main form hook
export function useForm<T extends Record<string, unknown>>(config: FormConfig<T>) {
  // Initialize form state
  const initialFormState = useMemo((): FormState<T> => {
    const initialValues = {} as T;
    const initialErrors = {} as Partial<Record<keyof T, string>>;
    const initialTouched = {} as Partial<Record<keyof T, boolean>>;
    
    Object.keys(config.fields).forEach(key => {
      const fieldKey = key as keyof T;
      initialValues[fieldKey] = config.fields[fieldKey].initialValue;
      initialErrors[fieldKey] = undefined;
      initialTouched[fieldKey] = false;
    });
    
    return {
      values: initialValues,
      errors: initialErrors,
      touched: initialTouched,
      isSubmitting: false,
      isValid: false,
      isDirty: false
    };
  }, [config.fields]);

  const [formState, setFormState] = useState<FormState<T>>(initialFormState);

  // Check if form is valid
  const validateForm = useCallback((values: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(config.fields).forEach(key => {
      const fieldKey = key as keyof T;
      const fieldConfig = config.fields[fieldKey];
      const value = values[fieldKey];
      
      // Required validation
      if (fieldConfig.required) {
        const requiredError = Validators.required()(value);
        if (requiredError) {
          errors[fieldKey] = requiredError;
          return;
        }
      }
      
      // Custom validations
      if (fieldConfig.validations && value !== null && value !== undefined && value !== '') {
        for (const validator of fieldConfig.validations) {
          const error = validator(value, values);
          if (error) {
            errors[fieldKey] = error;
            break;
          }
        }
      }
    });
    
    return errors;
  }, [config.fields]);

  // Update validity on state changes
  useEffect(() => {
    const errors = validateForm(formState.values);
    const isValid = Object.keys(errors).every(key => !errors[key as keyof T]);
    const isDirty = JSON.stringify(formState.values) !== JSON.stringify(initialFormState.values);
    
    if (
      JSON.stringify(formState.errors) !== JSON.stringify(errors) ||
      formState.isValid !== isValid ||
      formState.isDirty !== isDirty
    ) {
      setFormState(prev => ({
        ...prev,
        errors,
        isValid,
        isDirty
      }));
    }
  }, [formState.values, validateForm, initialFormState.values, formState.errors, formState.isValid, formState.isDirty]);

  // Field change handler
  const handleChange = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value
      },
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));

    // Validate on change if configured
    if (config.validationMode === 'onChange' || config.validationMode === 'all') {
      const errors = validateForm({
        ...formState.values,
        [field]: value
      });
      
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          ...errors
        }
      }));
    }
  }, [config.validationMode, validateForm, formState.values]);

  // Field blur handler
  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));

    // Validate on blur if configured
    if (config.validationMode === 'onBlur' || config.validationMode === 'all') {
      const errors = validateForm(formState.values);
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          ...errors
        }
      }));
    }
  }, [config.validationMode, validateForm, formState.values]);

  // Manual validation trigger
  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const fieldConfig = config.fields[field];
    const value = formState.values[field];
    
    // Required validation
    if (fieldConfig.required) {
      const requiredError = Validators.required()(value);
      if (requiredError) {
        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: requiredError
          }
        }));
        return false;
      }
    }
    
    // Custom validations
    if (fieldConfig.validations && value !== null && value !== undefined && value !== '') {
      for (const validator of fieldConfig.validations) {
        const error = validator(value, formState.values);
        if (error) {
          setFormState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [field]: error
            }
          }));
          return false;
        }
      }
    }
    
    // Clear error if validation passes
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: undefined
      }
    }));
    
    return true;
  }, [config.fields, formState.values]);

  // Form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(config.fields).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);

    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        ...allTouched
      },
      isSubmitting: true
    }));

    // Validate entire form
    const errors = validateForm(formState.values);
    const isValid = Object.keys(errors).every(key => !errors[key as keyof T]);

    if (!isValid) {
      setFormState(prev => ({
        ...prev,
        errors,
        isSubmitting: false
      }));
      return false;
    }

    try {
      // Sanitize data if configured
      let submitData = { ...formState.values };
      if (config.sanitizeOnSubmit) {
        submitData = sanitizeFormData(submitData);
      }

      if (config.onSubmit) {
        await config.onSubmit(submitData);
      }

      return true;
    } catch (error) {
      logger.error('Form submission failed', { 
        formName: config.onSubmit?.name || 'UnnamedForm',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
      
      return false;
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
    }
  }, [config, validateForm, formState.values]);

  // Reset form
  const reset = useCallback(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  // Clear form
  const clear = useCallback(() => {
    const clearedValues = Object.keys(config.fields).reduce((acc, key) => {
      acc[key as keyof T] = '' as any;
      return acc;
    }, {} as T);
    
    setFormState(prev => ({
      ...prev,
      values: clearedValues,
      errors: {},
      touched: {},
      isDirty: false
    }));
  }, [config.fields]);

  // Get field props helper
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: formState.values[field],
      onChange: (value: T[K]) => handleChange(field, value),
      onBlur: () => handleBlur(field),
      error: formState.touched[field] ? formState.errors[field] : undefined
    };
  }, [formState.values, formState.touched, formState.errors, handleChange, handleBlur]);

  return {
    // State
    ...formState,
    
    // Methods
    handleChange,
    handleBlur,
    validateField,
    handleSubmit,
    reset,
    clear,
    getFieldProps,
    
    // Utilities
    setFieldValue: handleChange,
    setFieldTouched: handleBlur,
    setError: (field: keyof T, error: string) => {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: error
        }
      }));
    }
  };
}

// Pre-built form configurations for common use cases
export const FormPresets = {
  login: {
    username: {
      initialValue: '',
      validations: [Validators.required('Username is required')]
    },
    password: {
      initialValue: '',
      validations: [Validators.required('Password is required')]
    }
  },
  
  patient: {
    firstName: {
      initialValue: '',
      validations: [
        Validators.required('First name is required'),
        Validators.minLength(2, 'First name must be at least 2 characters')
      ]
    },
    lastName: {
      initialValue: '',
      validations: [
        Validators.required('Last name is required'),
        Validators.minLength(2, 'Last name must be at least 2 characters')
      ]
    },
    email: {
      initialValue: '',
      validations: [Validators.email()]
    },
    phone: {
      initialValue: '',
      validations: [Validators.phone()]
    }
  }
};