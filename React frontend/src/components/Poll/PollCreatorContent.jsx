import React, { useState, useEffect, useRef } from 'react';
import { StyledInput, ActionButton, CheckboxSquare } from '../Atoms';

export const PollCreatorContent = ({ onSave, onDataChange, initialData }) => {
  // Инициализация state. Убеждаемся, что options имеет хотя бы один пустой элемент
  const initialOptions = (initialData?.options && initialData.options.length > 0 && initialData.options.some(o => o.trim() === '')) 
    ? initialData.options
    : [...(initialData?.options?.filter(o => o.trim() !== '') || []), '']; 

  const [title, setTitle] = useState(initialData?.title || '');
  const [options, setOptions] = useState(initialOptions);
  const optionsEndRef = useRef(null);

  // Обновляем данные для родителя (ПРОМЕЖУТОЧНОЕ СОХРАНЕНИЕ в state PollWidget)
  useEffect(() => {
    // Отправляем только непустые опции, чтобы родитель мог их передать в API
    onDataChange({ title, options: options.filter(o => o.trim() !== '') });
  }, [title, options, onDataChange]);
 
  // --- ЛОГИКА ИЗМЕНЕНИЯ ОПЦИИ И УПРАВЛЕНИЯ СПИСКОМ ---
  const handleOptionChange = (index, value) => {
    let newOptions = [...options];
    newOptions[index] = value;
    
    // Если мы ввели текст в последний пустой элемент, добавляем еще один пустой
    if (index === newOptions.length - 1 && value.trim() !== '') {
      newOptions.push('');
    }
    
    // Удаляем пустые элементы, кроме последнего
    newOptions = newOptions.filter((opt, i) => opt.trim() !== '' || i === newOptions.length - 1);

    setOptions(newOptions);
  };

  // Прокрутка вниз при добавлении новой опции
  useEffect(() => {
    if (optionsEndRef.current && options.length > 1 && options[options.length - 1].trim() === '') {
      optionsEndRef.current.scrollIntoView({ behavior: "smooth" });
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
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <StyledInput 
              placeholder={`Вариант ${index + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              style={{ flexGrow: 1, marginBottom: '10px' }}
            />
          </div>
        ))}
        <div ref={optionsEndRef} />
      </div>

      {/* Кнопка "Сохранить" */}
      <div style={{ flexShrink: 0, marginTop: '20px' }}>
          <ActionButton 
              // onSave вызывает handleSave в PollWidget, который делает API-вызов
              onClick={() => onSave()} 
              style={{ width: '100%' }}
          >
              Сохранить опрос
          </ActionButton>
      </div>
    </div>
  );
};