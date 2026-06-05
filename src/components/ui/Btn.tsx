import React from 'react';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: 'primary' | 'ghost' | 'soft';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

export function Btn({ kind = 'primary', icon, iconRight, children, className = '', ...rest }: BtnProps) {
  const cls = `qk-btn ${kind === 'primary' ? 'qk-btn-primary' : kind === 'ghost' ? 'qk-btn-ghost' : 'qk-btn-soft'} ${className}`;
  return (
    <button className={cls} {...rest}>
      {icon}
      {children && <span>{children}</span>}
      {iconRight}
    </button>
  );
}

export function Chip({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button className={`qk-chip${on ? ' on' : ''}`} onClick={onClick}>{children}</button>
  );
}
