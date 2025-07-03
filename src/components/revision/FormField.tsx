import React from 'react';

interface Props {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  highlight?: boolean;
  icon?: React.ReactNode;
  fieldName?: string;
}

export default function FormField({ 
  label, 
  children, 
  required = false, 
  highlight = false, 
  icon,
  fieldName 
}: Props) {
  return (
    <div className="space-y-3">
      <label className="form-label bg-black/40 text-white px-3 py-1 rounded-lg shadow-sm inline-flex items-center gap-2">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={highlight ? 'form-field-highlight' : ''}>
        {children}
      </div>
    </div>
  );
} 