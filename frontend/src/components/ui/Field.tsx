'use client';

import React from 'react';
import { cn } from '@/lib/cn';

const BASE_FIELD =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-soft ' +
  'focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-transparent ' +
  'disabled:bg-sage-50 disabled:text-muted';

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="block text-xs font-semibold text-ink-strong mb-1.5">
          {label}
          {required ? <span className="text-neg-ink"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-neg-ink mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function borderFor(error?: string): string {
  return error ? 'border-neg-border' : 'border-line';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ id, label, hint, error, required, className, ...rest }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        {...rest}
        aria-invalid={error ? true : undefined}
        className={cn(BASE_FIELD, borderFor(error), className)}
      />
    </FieldShell>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ id, label, hint, error, required, className, ...rest }: TextareaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        {...rest}
        aria-invalid={error ? true : undefined}
        className={cn(BASE_FIELD, borderFor(error), 'resize-y', className)}
      />
    </FieldShell>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function Select({
  id,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        {...rest}
        aria-invalid={error ? true : undefined}
        className={cn(BASE_FIELD, borderFor(error), 'cursor-pointer', className)}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
