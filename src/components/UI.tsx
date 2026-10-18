import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Moon, Sun, Workflow } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Brand({ to = '/' }: { to?: string }) {
  return <Link to={to} className="brand"><Workflow size={21} strokeWidth={1.7} aria-hidden="true" /><span>TraceGuard</span></Link>;
}

export function ThemeControl() {
  const { theme, toggleTheme } = useTheme();
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  return <button type="button" className="icon-button" onClick={toggleTheme} aria-label={label} title={label}>
    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
  </button>;
}

export function EmptyState({ title, description, retry }: { title: string; description?: string; retry?: () => void }) {
  return <div className="empty-state" role={retry ? 'alert' : 'status'}><p>{title}</p>{description && <span>{description}</span>}{retry && <button className="button" onClick={retry}>Retry</button>}</div>;
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setState('copied'); }
    catch { setState('failed'); }
    window.setTimeout(() => setState('idle'), 2000);
  };
  return <button className="button button-quiet" type="button" onClick={copy} aria-live="polite">
    {state === 'copied' ? <Check size={14} /> : <Copy size={14} />}
    {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
  </button>;
}

export function CodeBlock({ source, label = 'Source', numbered = false }: { source: string; label?: string; numbered?: boolean }) {
  return <pre className="code-block" tabIndex={0} aria-label={label}><code>{numbered ? source.split('\n').map((line, index) =>
    <span className="code-line" key={index}><span className="line-number" aria-hidden="true">{index + 1}</span>{line || ' '}{'\n'}</span>
  ) : source}</code></pre>;
}
