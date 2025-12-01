import React from 'react';
import { MenuDots } from './Atoms'; // Импорт MenuDots

// --- [2] MOLECULE: BaseWidgetCard ---
export const BaseWidgetCard = ({ title, children, style, toggleSettings, showMenuDots = true }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderLeft: '5px solid #007bff',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden', 
        ...style,
      }}
    >
      {/* Шапка */}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexShrink: 0 
      }}>
        {/* Заголовок */}
        <span style={{ 
            fontSize: '20px', 
            fontWeight: '400', // Not bold
            color: '#000',
            lineHeight: '1.2',
            wordBreak: 'break-word',
            marginRight: '10px'
        }}>
          {title}
        </span>
        {/* Кнопка настроек видна только если явно разрешено */}
        {showMenuDots && <MenuDots onClick={toggleSettings} />}
      </div>

      {/* Контент */}
      <div style={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden', 
          minHeight: 0 
      }}>
        {children}
      </div>
    </div>
  );
};