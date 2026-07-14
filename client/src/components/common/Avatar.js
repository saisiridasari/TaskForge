import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const LIGHT_COLORS = [
  { bg: '#e3f2fd', text: '#0d47a1' }, // blue
  { bg: '#eef2e8', text: '#4a5738' }, // sage/green
  { bg: '#e2eafc', text: '#3d4f7a' }, // periwinkle
  { bg: '#f3e3de', text: '#8b4433' }, // rose/rust
  { bg: '#f7ecd6', text: '#7a5c26' }, // gold
  { bg: '#f0dcc8', text: '#8a5a2e' }, // amber
];

const DARK_COLORS = [
  { bg: '#16294a', text: '#90caf9' }, // blue
  { bg: '#1c2417', text: '#b8c9a8' }, // sage/green
  { bg: '#1a2340', text: '#abc4ff' }, // periwinkle
  { bg: '#2e1f1a', text: '#e8c4b8' }, // rose/rust
  { bg: '#2e2416', text: '#d9bc8a' }, // gold
  { bg: '#2e1b16', text: '#d97a63' }, // amber
];

function getColor(name = '', theme) {
  const palette = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const idx = name.charCodeAt(0) % palette.length;
  return palette[idx] || palette[0];
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name = '', src, size = 'md', style = {} }) {
  const { theme } = useTheme();
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const color = getColor(name, theme);

  return (
    <div
      className={`avatar ${sizeClass}`}
      style={{ background: color.bg, color: color.text, ...style }}
    >
      {src ? <img src={src} alt={name} /> : getInitials(name)}
    </div>
  );
}