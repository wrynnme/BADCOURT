// ════ MatchModeSelector Component (Stub) ════
import React from 'react';
import type { MatchMode } from '../../types';

interface MatchModeSelectorProps {
  value: MatchMode;
  onChange: (mode: MatchMode) => void;
}

const modes: { value: MatchMode; label: string; description: string }[] = [
  { value: 'random', label: 'สุ่ม', description: 'สุ่มจับคู่ผู้เล่น' },
  { value: 'rotation', label: 'หมุนเวียน', description: 'คนเล่นน้อยได้เล่นก่อน' },
  { value: 'winner_stays', label: 'ชนะอยู่', description: 'ทีมชนะเล่นต่อ ทีมแพ้ลงคิว' },
  { value: 'manual', label: 'เลือกเอง', description: 'แอดมินจัดคู่เอง' },
];

export default function MatchModeSelector({ value, onChange }: MatchModeSelectorProps) {
  return (
    <div className="space-y-2">
      {modes.map((mode) => (
        <label
          key={mode.value}
          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            value === mode.value ? 'border-primary-500 bg-primary-50' : ''
          }`}
        >
          <input
            type="radio"
            name="matchMode"
            value={mode.value}
            checked={value === mode.value}
            onChange={() => onChange(mode.value)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            value === mode.value ? 'border-primary-500' : 'border-gray-300'
          }`}>
            {value === mode.value && (
              <div className="w-3 h-3 rounded-full bg-primary-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{mode.label}</div>
            <div className="text-sm text-gray-500">{mode.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}
