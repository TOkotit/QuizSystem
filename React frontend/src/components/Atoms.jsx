import React from 'react';

// --- [1] ATOM: StyledInput ---
export const StyledInput = ({ placeholder, value, onChange, style, autoFocus, type = 'text' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    autoFocus={autoFocus} 
    className="nodrag" 
    style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 16px',
      marginBottom: '12px',
      backgroundColor: '#e0e0e0',
      border: 'none',
      borderRadius: '0px',
      fontSize: '16px',
      color: '#333',
      outline: 'none',
      fontFamily: 'Arial, sans-serif',
      ...style,
    }}
  />
);

// --- [2] ATOM: ActionButton ---
export const ActionButton = ({ onClick, children, style }) => (
  <button
    onClick={onClick}
    className="nodrag" 
    style={{
      padding: '10px 30px',
      backgroundColor: '#d9d9d9',
      border: 'none',
      borderRadius: '0px',
      fontSize: '18px',
      color: '#000',
      cursor: 'pointer',
      fontWeight: '400',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
      ...style
    }}
    onMouseOver={(e) => e.target.style.backgroundColor = '#c0c0c0'}
    onMouseOut={(e) => e.target.style.backgroundColor = '#d9d9d9'}
  >
    {children}
  </button>
);

// --- [3] ATOM: ToggleSwitch ---
export const ToggleSwitch = ({ checked, onChange }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    <span style={{
      width: '50px',
      height: '28px',
      backgroundColor: checked ? '#007bff' : '#ccc', // Blue when checked, gray when unchecked
      borderRadius: '14px',
      position: 'relative',
      transition: 'background-color 0.2s',
      flexShrink: 0
    }}>
      <span style={{
        content: '""',
        position: 'absolute',
        top: '2px',
        left: checked ? '24px' : '2px', // Moves right/left
        width: '24px',
        height: '24px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        transition: 'left 0.2s',
      }} />
    </span>
  </label>
);

// --- [4] ATOM: MenuDots ---
export const MenuDots = ({ onClick }) => (
  <div 
    onClick={onClick}
    className="nodrag" // Crucial to prevent React Flow from capturing the click as a drag action
    style={{ 
        display: 'flex', 
        gap: '6px', 
        cursor: 'pointer', 
        flexShrink: 0, 
        padding: '5px' // For easier clicking
    }}
  >
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#757575',
        }}
      />
    ))}
  </div>
);