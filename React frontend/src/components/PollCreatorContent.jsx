import React, { useState, useEffect, useRef } from 'react';
import { StyledInput, ActionButton, CheckboxSquare } from './Atoms';

// --- [3] ORGANISM: PollCreatorContent ---
export const PollCreatorContent = ({ onSave, onDataChange, initialData }) => {
  // Инициализация state. Убеждаемся, что options имеет хотя бы один пустой элемент
  const initialOptions = (initialData?.options && initialData.options.length > 0 && initialData.options.some(o => o.trim() === '')) 
    ? initialData.options
    : [...(initialData?.options?.filter(o => o.trim() !== '') || []), '']; // Add an empty one if none exists or options is empty/null

  const [title, setTitle] = useState(initialData?.title || '');
  const [options, setOptions] = useState(initialOptions);
  const optionsEndRef = useRef(null);

  // Обновляем данные для родителя при изменении title или options
  useEffect(() => {
    // Pass only non-empty options to the parent component
    onDataChange({ title, options: options.filter(o => o.trim() !== '') });
  }, [title, options, onDataChange]);

  // --- ЛОГИКА ИЗМЕНЕНИЯ ОПЦИИ И УПРАВЛЕНИЯ СПИСКОМ ---
  const handleOptionChange = (index, value) => {
    let newOptions = [...options];
    newOptions[index] = value;
    
    // 1. Извлекаем все непустые варианты из обновленного списка.
    const nonEmpties = newOptions.filter(opt => opt.trim() !== '');

    // 2. Формируем новый список: (Все непустые варианты) + (Ровно один пустой вариант-плейсхолдер).
    // This logic ensures we always have one blank line for new input, and remove others if they become blank.
    const resultOptions = [...nonEmpties, ''];

    // 3. Обновляем state.
    setOptions(resultOptions);
  };

  useEffect(() => {
    // Scroll down when an element is added (when the list length increases)
    if (optionsEndRef.current) {
       optionsEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [options.length]);

  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        width: '100%', 
        overflow: 'hidden' 
    }}>
      
      <div style={{ flexShrink: 0, width: '100%' }}>
        <StyledInput 
            placeholder="Название опроса" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
                fontSize: '20px', 
                padding: '14px 16px', 
                marginBottom: '20px',
                color: '#333',
                fontWeight: 'bold'
            }} 
        />
      </div>

      <div 
        className="scroll-container nowheel"
        onWheel={(e) => e.stopPropagation()} 
        style={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            paddingRight: '5px', 
            marginBottom: '10px',
            width: '100%',
      }}>
        {options.map((opt, index) => (
          <StyledInput 
            key={index}
            placeholder={`Вариант ${index + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
          />
        ))}
        <div ref={optionsEndRef} />
      </div>

      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <ActionButton onClick={() => onSave({ title, options: options.filter(o => o.trim() !== '') })}>
          Сохранить
        </ActionButton>
      </div>
    </div>
  );
};