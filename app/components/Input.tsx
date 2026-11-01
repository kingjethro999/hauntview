'use client';

import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, variant = 'default', className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && (
          <label className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`${styles.input} ${styles[variant]} ${error ? styles.error : ''} ${className || ''}`}
          {...props}
        />
        {error && <div className={styles.errorText}>{error}</div>}
        {helperText && !error && <div className={styles.helperText}>{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
