import React, {useState,} from 'react';
import { ActionButton, CheckboxSquare, RadioButton } from './Atoms';

export const PollDisplayContent = ({ pollData, toggleSettings }) => {
    // Деструктуризация данных, приходящих из PollWidget
    const { title, options, settings } = pollData;
    const { isAnonymous, endDate, endTime, multipleAnswers } = settings;

    // Форматирование информации для заголовка
    const anonymityStatus = isAnonymous ? 'Анонимно' : 'Неанонимно';
    const displayEndDate = endDate ? `До ${endDate.split('-').reverse().join('.')}` : 'Нет даты'; // Формат DD.MM.YY
    const displayTime = endTime || ''; // Время, если есть
    

    // Имитация процента (пока всегда 0%)
    const getPercentage = () => "0%"; 


    const [selectedOption, setSelectedOption] = useState();
    
    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

    return (
        <div 
            className="nodrag" 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                width: '100%',
                overflowY: 'auto', 
                overflowX: 'hidden',
                boxSizing: 'border-box',
                paddingRight: '5px'
            }}
            onWheel={(e) => e.stopPropagation()} // Перехватываем скролл для React Flow
        >
            {/* Верхний заголовок виджета (динамический) */}
            <div style={{
                fontSize: '14px',
                color: '#555',
                marginBottom: '20px',
                flexShrink: 0,
                paddingBottom: '10px',
                borderBottom: '1px solid #eee' // Разделитель
            }}>
                Опрос - {anonymityStatus} - {displayEndDate} {displayTime}
            </div>

            {/* Заголовок опроса */}
            <div style={{ flexShrink: 0, width: '100%' }}>
                <h3 style={{ 
                    fontSize: '22px', 
                    fontWeight: 'bold', 
                    color: '#000', 
                    marginBottom: '25px', 
                    lineHeight: '1.3',
                    wordBreak: 'break-word',
                    backgroundColor: '#e0e0e0', // Как на макете
                    padding: '12px 16px',
                    borderRadius: '0px'
                }}>
                    {title || 'Какую тему разобрать подробнее?'}
                </h3>
            </div>

            {/* Список вариантов ответов */}
            <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '5px' }}>
                {options.length > 0 ? options.map((optionText, index) => (
                    <div 
                        key={index} 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '15px',
                            cursor: 'pointer', // Чтобы было ощущение интерактивности
                        }}
                    >   
                        {multipleAnswers && <CheckboxSquare
                            value= {optionText}
                            />}
                        {!multipleAnswers && <RadioButton
                            name="myGroup" // Обязательно одно и то же имя для всех в группе
                            value= {optionText}
                            checked={selectedOption === optionText}
                            onChange={handleChange} />}
                        
                        {/* Текст варианта и процент */}
                        <div style={{ 
                            flexGrow: 1, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: '#e0e0e0', 
                            padding: '12px 16px',
                            fontSize: '16px',
                            color: '#333',
                            borderRadius: '0px',
                            overflow: 'hidden',
                        }}>
                            <span style={{ wordBreak: 'break-word', marginRight: '10px' }}>
                                {optionText}
                            </span>
                            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>
                                {getPercentage()}
                            </span>
                        </div>
                    </div>
                )) : (
                    <p style={{textAlign: 'center', color: '#777', marginTop: '30px'}}>Нет вариантов ответа.</p>
                )}
            </div>

            {/* Кнопка "Завершить досрочно" */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <ActionButton onClick={() => console.log('Завершить опрос досрочно')} 
                              style={{ width: '100%', backgroundColor: '#d9d9d9' }}>
                    Завершить досрочно
                </ActionButton>
            </div>
        </div>
    );
};