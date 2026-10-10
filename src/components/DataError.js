import { createElement as h } from 'react';

export default function DataError({ onRetry, className = '' }) {
  return h('div', { role: 'alert', className: `card p-6 ${className}` },
    h('p', { className: 'text-sm text-muted' }, 'ข้อมูลไม่พร้อมชั่วคราว ลองใหม่อีกครั้ง'),
    h('button', { type: 'button', onClick: onRetry, className: 'btn btn-secondary mt-4' }, 'ลองใหม่'));
}
