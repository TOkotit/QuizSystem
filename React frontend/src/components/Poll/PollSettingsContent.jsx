import React, { useState, useEffect } from 'react';
import { ToggleSwitch, ActionButton, CheckboxSquare } from '../Atoms';

// --- ORGANISM: PollSettingsContent ---
export const PollSettingsContent = ({ onDataChange, initialData, toggleSettings }) => {
  // Инициализация состояний для настроек
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);
  const [multipleAnswers, setMultipleAnswers] = useState(initialData?.multipleAnswers || false);
  
  // Разделяем дату и время на отдельные состояния для нативных input'ов
  const [endDate, setEndDate] = useState(initialData?.endDate || ''); 
  const [endTime, setEndTime] = useState(initialData?.endTime || '');

  // Обновляем данные при изменении настроек
  useEffect(() => {
    // Передаем оба поля: дату и время
    onDataChange({ isAnonymous, multipleAnswers, endDate, endTime });
  }, [isAnonymous, multipleAnswers, endDate, endTime, onDataChange]);


  // Единый стиль для полей ввода даты/времени
  const dateTimeInputStyle = {
      boxSizing: 'border-box',
      padding: '12px 16px',
      backgroundColor: '#e0e0e0',
      border: 'none',
      borderRadius: '15px',
      fontSize: '16px',
      color: '#333',
      outline: 'none',
      fontFamily: 'Arial, sans-serif',
      flex: 1, // To take up equal space in the container
  };


  return (
    <div className="nodrag" style={{ 
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
        Параметры опроса
      </h3>

      {/* Анонимность */}
        <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center', 
            marginBottom: '25px', 
        }}>
          <CheckboxSquare checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
          <span style={{ fontSize: '18px', color: '#333' }}>Анонимность</span>
        </div>

        {/* Несколько ответов */}
        <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center', 
            marginBottom: '25px', 
        }}>
          <CheckboxSquare checked={multipleAnswers} onChange={() => setMultipleAnswers(!multipleAnswers)} />
          <span style={{ fontSize: '18px', color: '#333' }}>Несколько ответов</span>
        </div>

        {/* Дата и время окончания (разделено на два поля) */}
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: '18px', color: '#333', marginBottom: '10px', display: 'block' }}>
            Дата и время окончания
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
              {/* Поле для выбора даты - type="date" */}
              <input 
                  type="date" 
                  className="nodrag" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={dateTimeInputStyle}
              />
              {/* Поле для выбора времени - type="time" */}
              <input 
                  type="time" 
                  className="nodrag" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={dateTimeInputStyle}
              />
          </div>
        </div>
      
      {/* <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-start', paddingTop: '30px' }}>
        <ActionButton onClick={()=>{}} style={{ borderRadius: '5px', backgroundColor: '#ff8080ff' }}>
          Удалить опрос
        </ActionButton>
      </div> */}

      {/* Кнопка "Назад" для возврата к созданию опроса */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
        <ActionButton onClick={toggleSettings} style={{ width: '100%', borderRadius: '5px' }}>
          Назад к опросу
        </ActionButton>
      </div>

    </div>
  );
};