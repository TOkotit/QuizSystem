import React, { useState, useEffect } from 'react';
import { ToggleSwitch, ActionButton, CheckboxSquare } from '../Atoms';

export const TestSettingsContent = ({ onDataChange, initialData, toggleSettings }) => {
  
  // Настройки теста
  const [completionTime, setCompletionTime] = useState(initialData?.completionTime || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [attemptNumber, setAttemptNumber] = useState(initialData?.attemptNumber || '');
  
  // Обновляем данные при изменении настроек
  useEffect(() => {
    // Передаем оба поля: дату и время
    onDataChange({completionTime, attemptNumber, endDate, endTime });
  }, [completionTime, attemptNumber, endDate, endTime, onDataChange]);


  // Единый стиль для полей ввода даты/времени
  const dateTimeInputStyle = {
      boxSizing: 'border-box',
      padding: '12px 16px',
      backgroundColor: '#e0e0e0',
      border: 'none',
      fontSize: '16px',
      color: '#333',
      outline: 'none',
      fontFamily: 'Arial, sans-serif',
      flex: 1, // To take up equal space in the container
      borderRadius: '10px'
  };
  const oneSettingStyle = { 
        display: 'flex', gap: '10px', alignItems: 'center', color:'#333'
    };

  return (
    <div className="nodrag" 
        style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        width: '100%',
        paddingRight: '5px', 
        overflowY: 'auto', 
        overflowX: 'hidden',
        boxSizing: 'border-box'
    }}>
      
      <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#000', 
          marginBottom: '25px', 
          flexShrink: 0 
      }}>
        Параметры теста
      </h3>

      <div style={{ display:'flex',
          flexDirection:'column',
          gap: '10px',
      }}>
          <div style={oneSettingStyle}>
              <span>Время (мин):</span>
              <input type="number" value={completionTime} 
              onChange={(e) => setCompletionTime(e.target.value)} 
              placeholder='Неограниченно'
              style={dateTimeInputStyle} />
          </div>
          <div style={oneSettingStyle}>
              <span style={{ }}>Пройти до</span>
              <input type="date" value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={dateTimeInputStyle} />
              <input type="time" value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                style={dateTimeInputStyle} />
          </div>
          <div style={oneSettingStyle}>
              <span style={{ }}>Кол-во попыток:</span>
              <input type="number" value={attemptNumber} 
                onChange={(e) => setAttemptNumber(e.target.value)} 
                style={dateTimeInputStyle}
                placeholder='Неограниченно' />
          </div>
      </div>

      {/* Кнопка "Назад" для возврата к созданию опроса */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
        <ActionButton onClick={toggleSettings} style={{ width: '100%', borderRadius: '5px' }}>
          Назад к тесту
        </ActionButton>
      </div>

    </div>
  );
};