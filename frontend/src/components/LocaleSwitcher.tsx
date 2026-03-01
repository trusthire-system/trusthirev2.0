'use client';

import { useTransition } from 'react';
import { setUserLocale } from '@/services/locale';
import { Languages } from 'lucide-react';

export default function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
    const [isPending, startTransition] = useTransition();

    function onChange(value: string) {
        startTransition(() => {
            setUserLocale(value);
        });
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={18} color="var(--accent-color)" />
            <select
                defaultValue={currentLocale}
                disabled={isPending}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <option value="en">English (India)</option>
                <option value="hi">हिंदी (India)</option>
            </select>
        </div>
    );
}
