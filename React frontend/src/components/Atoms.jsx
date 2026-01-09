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
export const ActionButton = ({ onClick, children, style, disabled }) => (
  <button
    onClick={!disabled ? onClick : undefined} // Блокируем клик, если disabled
    disabled={disabled}                       // Стандартный атрибут HTML
    className="nodrag" 
    style={{
      padding: '10px 30px',
      backgroundColor: disabled ? '#f0f0f0' : '#d9d9d9', // Светлее, если выключена
      border: 'none',
      borderRadius: '0px',
      fontSize: '18px',
      color: disabled ? '#999' : '#000',               // Серый текст, если выключена
      cursor: disabled ? 'not-allowed' : 'pointer',    // Меняем курсор
      fontWeight: '400',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
      opacity: disabled ? 0.7 : 1,                     // Добавляем прозрачность
      ...style
    }}
    onMouseOver={(e) => {
      if (!disabled) e.target.style.backgroundColor = '#c0c0c0';
    }}
    onMouseOut={(e) => {
      if (!disabled) e.target.style.backgroundColor = style?.backgroundColor || '#d9d9d9';
    }}
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
      backgroundColor: checked ? '#000' : '#ccc', // Blue when checked, gray when unchecked
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
// Переключатель с галочкой как в фигме
export const CheckboxSquare = ({ checked, onChange }) => (
  <label
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      position: 'relative',
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{
        opacity: 0,
        width: 0,
        height: 0,
        position: 'absolute',
      }}
    />
    <span
      style={{
        display: 'inline-block',
        width: '24px', 
        height: '24px',
        border: `2px solid ${checked ? '#000' : '#6c757d'}`, 
        borderRadius: '4px', 
        backgroundColor: checked ? '#000' : '#fff', 
        transition: 'background-color 0.2s, border-color 0.2s',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {checked && (
        <span
          style={{
            content: '""',
            position: 'absolute',
            left: '8px', 
            top: '3px',  
            width: '6px',
            height: '14px',
            border: 'solid white', 
            borderWidth: '0 3px 3px 0',
            transform: 'rotate(45deg)',
            transition: 'opacity 0.2s',
            opacity: checked ? 1 : 0,
          }}
        />
      )}
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

/**
 * @param {string} id - Уникальный ID для связи input и label.
 * @param {string} name - Имя группы radio-кнопок (обязательно для правильной работы).
 * @param {string} value - Значение этой радиокнопки.
 * @param {boolean} checked - Указывает, выбрана ли кнопка.
 * @param {function} onChange - Обработчик изменения.
 */
export const RadioButton = ({ id, name, value, checked, onChange, children }) => (
  <label
    htmlFor={id}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
    }}
  >
    {/* Скрытый нативный элемент radio */}
    <input
      id={id}
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      style={{
        // Полностью скрываем нативный вид, но оставляем функциональность
        opacity: 0,
        width: 0,
        height: 0,
        position: 'absolute',
      }}
    />
    
    {/* Кастомный круглый индикатор */}
    <span
      style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        borderRadius: '50%', // Делает его круглым
        border: `2px solid ${checked ? '#000' : '#6c757d'}`, // Синяя рамка при checked
        backgroundColor: '#fff',
        position: 'relative',
        flexShrink: 0,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Внутренняя точка, которая появляется при выборе */}
      {checked && (
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px', // Размер внутренней точки
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#000', // Синяя внутренняя точка
            transition: 'opacity 0.2s',
            opacity: 1,
          }}
        />
      )}
    </span>
    {/* Текст/содержимое рядом с кнопкой */}
    {children}
  </label>
);