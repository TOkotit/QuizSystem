import React, { useState } from 'react';
import { ActionButton, CheckboxSquare, RadioButton } from './Atoms';

export const PollDisplayContent = ({ pollData, toggleSettings }) => {
    // Деструктуризация данных
    const { title, options, settings } = pollData;
    const { isAnonymous, endDate, endTime, multipleAnswers } = settings;

    // Форматирование информации
    const anonymityStatus = isAnonymous ? 'Анонимно' : 'Неанонимно';
    const displayEndDate = endDate ? `До ${endDate.split('-').reverse().join('.')}` : 'Нет даты';
    const displayTime = endTime || '';

    const getPercentage = () => "0%";

    const [isSaved, setIsSaved] = useState(false);
    // --- ЛОГИКА ДЛЯ RADIO BUTTON (Единичный выбор) ---
    const [selectedOption, setSelectedOption] = useState();

    const handleRadioChange = (event) => {
        setSelectedOption(event.target.value);
    };

    // --- ЛОГИКА ДЛЯ CHECKBOX (Множественный выбор) ---
    const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);

    const handleCheckboxChange = (optionValue) => {
        setSelectedCheckboxes((prevSelected) => {
            if (prevSelected.includes(optionValue)) {
                // Если уже выбрано -> удаляем из массива
                return prevSelected.filter((item) => item !== optionValue);
            } else {
                // Если не выбрано -> добавляем в массив
                return [...prevSelected, optionValue];
            }
        });
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
            onWheel={(e) => e.stopPropagation()}
        >
            {/* Верхний заголовок виджета */}
            {/* <div style={{
                fontSize: '14px',
                color: '#555',
                marginBottom: '20px',
                flexShrink: 0,
                paddingBottom: '10px',
                borderBottom: '1px solid #eee'
            }}>
                Опрос - {anonymityStatus} - {displayEndDate} {displayTime}
            </div> */}

            {/* Заголовок опроса */}
            <div style={{ flexShrink: 0, width: '100%' }}>
                <h3 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#000',
                    marginBottom: '25px',
                    lineHeight: '1.3',
                    wordBreak: 'break-word',
                    backgroundColor: '#e0e0e0',
                    padding: '12px 16px',
                    borderRadius: "10px"
                }}>
                    {title || 'Опрос'}
                </h3>
            </div>

            {/* Список вариантов ответов */}
            <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '5px' }}>
                {options.length > 0 ? options.map((optionText, index) => {
                    
                    // Определяем, активен ли этот пункт (для стилизации или логики)
                    const isChecked = multipleAnswers 
                        ? selectedCheckboxes.includes(optionText) 
                        : selectedOption === optionText;

                    return (
                        <div
                            key={index}
                            onClick={() => {
                                if (multipleAnswers) {
                                    handleCheckboxChange(optionText);
                                } else {
                                    // Эмуляция события для радио, если нужно, или прямой вызов сеттера
                                    setSelectedOption(optionText);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '15px',
                                cursor: 'pointer',
                                gap:"10px",
                                
                            }}
                        >
                            {multipleAnswers && (
                                <CheckboxSquare
                                    value={optionText}
                                    checked={isChecked} // Передаем true/false
                                    onChange={() => handleCheckboxChange(optionText)}
                                />
                            )}
                            
                            {!multipleAnswers && (
                                <RadioButton
                                    name="myGroup"
                                    value={optionText}
                                    checked={isChecked}
                                    onChange={handleRadioChange}
                                />
                            )}

                            {/* Текст варианта и процент */}
                            <div style={{
                                flexGrow: 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: isChecked ? '#d0d0d0' : '#e0e0e0', // (Опционально) Подсветка выбранного
                                padding: '12px 16px',
                                fontSize: '16px',
                                color: '#333',
                                borderRadius: "10px",
                                overflow: 'hidden',
                                transition: 'background-color 0.2s'
                            }}>
                                <span style={{ wordBreak: 'break-word', marginRight: '10px' }}>
                                    {optionText}
                                </span>
                                <span style={{ fontWeight: 'bold', flexShrink: 0 }}>
                                    {getPercentage()}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <p style={{ textAlign: 'center', color: '#777', marginTop: '30px' }}>Нет вариантов ответа.</p>
                )}
            </div>

            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <ActionButton 
                    onClick={() => {
                        console.log('Single Selection:', selectedOption);
                        console.log('Multiple Selection:', selectedCheckboxes);

                    }}
                    style={{ width: '100%', backgroundColor: '#d9d9d9', borderRadius: "10px" }}
                >
                    Сохранить
                </ActionButton>
            </div>


            {/* Кнопка "Завершить досрочно" Только для создателя */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
                <ActionButton 
                    onClick={() => {
                        console.log("Завершить досрочно");
                        
                    }}
                    style={{ width: '100%', backgroundColor: '#d9d9d9', borderRadius: "10px" }}
                >
                    Завершить досрочно(только для создателя)
                </ActionButton>
            </div>
        </div>
    );
};