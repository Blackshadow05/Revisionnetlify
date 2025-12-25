'use client';

import { memo } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import { Revision } from '@/types/revision';

interface RevisionItemCardProps {
  fieldKey: keyof Revision;
  value: string | number | boolean | null | undefined;
  label: string;
  delay: number;
  isEditing?: boolean;
  editedData?: Partial<Revision>;
  onInputChange?: (field: keyof Revision, value: string) => void;
  nonEditableFields?: string[];
}

const RevisionItemCard = memo(({
  fieldKey,
  value,
  label,
  delay,
  isEditing,
  editedData,
  onInputChange,
  nonEditableFields = []
}: RevisionItemCardProps) => {
  return (
    <FadeIn delay={delay}>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
        <h3 className="text-[11px] sm:text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">{label}</h3>
        {isEditing && editedData && !nonEditableFields.includes(fieldKey as string) ? (
          <input
            type="text"
            value={editedData[fieldKey] as string}
            onChange={(e) => onInputChange?.(fieldKey, e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
            placeholder={`Editar ${label?.toLowerCase() || 'campo'}...`}
          />
        ) : (
          <p className="text-base sm:text-lg font-black text-gray-950">
            {value || <span className="text-gray-500 italic font-normal">Sin información</span>}
          </p>
        )}
      </div>
    </FadeIn>
  );
});

RevisionItemCard.displayName = 'RevisionItemCard';

export default RevisionItemCard;