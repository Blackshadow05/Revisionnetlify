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
      <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
        <h3 className="text-sm font-semibold text-[#ff8c42] mb-2">{label}</h3>
        {isEditing && editedData && !nonEditableFields.includes(fieldKey as string) ? (
          <input
            type="text"
            value={editedData[fieldKey] as string}
            onChange={(e) => onInputChange?.(fieldKey, e.target.value)}
            className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
            placeholder={`Editar ${label?.toLowerCase() || 'campo'}...`}
          />
        ) : (
          <p className="text-gray-300">
            {value || <span className="text-gray-500 italic">Sin información</span>}
          </p>
        )}
      </div>
    </FadeIn>
  );
});

RevisionItemCard.displayName = 'RevisionItemCard';

export default RevisionItemCard;