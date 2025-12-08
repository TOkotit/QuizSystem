import React, { useState, useEffect } from 'react';
import { StyledInput, ActionButton, RadioButton, CheckboxSquare } from '../Atoms'; 

export const TestDisplayContent = ({ testData }) => {
    const { title, tasks, settings } = testData;
    const { completionTime, attemptNumber, endDate, endTime } = settings;


    const [displayViewMode, setDisplayViewMode] = useState('asViewer'); // asCreator/asViewer
    const [testBeginningMode, setTestBeginningMode] = useState(true);

    const [activeTaskIndex, setActiveTaskIndex] = useState(0);

    const initialCompletedTasks = testData.tasks.map((task, index) => ({
            id: index + Date.now(), 
            question: task.question,
            type: task.type,
            score: task.score,
            correctText: task.correctText,
            options: task.options.filter(opt => opt.trim() !== ''),
            correctRadioOption: task.correctRadioOption,
            correctBoxOptions: task.correctBoxOptions,

            // дополнительные поля
            completedText: '',
            completedRadioOption: '',
            completedBoxOptions: '',
    }));

    const [completedTasks, setCompletedTasks] = useState(initialCompletedTasks);

    
    // Обновление текущего задания
    const updateActiveCompletedTask = (field, value) => {
        if (activeTaskIndex === null) return;

        const updatedCTasks = [...completedTasks];
        updatedCTasks[activeTaskIndex] = {
            ...updatedCTasks[activeTaskIndex],
            [field]: value
        };
        setCompletedTasks(updatedCTasks);
    };

    const handleTestStart = () => {

        setTestBeginningMode(false);
    }

    const handleRadioChange = (optionValue) => {
        updateActiveCompletedTask('completedRadioOption', optionValue)
    };

    const handleCheckboxChange = (optionValue, correctBoxOptions) => {
        let res = []

        if (correctBoxOptions.includes(optionValue)) {
            // Если уже выбрано -> удаляем из массива
            res = correctBoxOptions.filter((item) => item !== optionValue);
        } else {
            // Если не выбрано -> добавляем в массив
            res =  [...correctBoxOptions, optionValue];
        }

        updateActiveCompletedTask('completedBoxOptions', res)
    };

    // Стили
    const oneSettingStyle = { 
        display: 'flex', gap: '10px', alignItems: 'center', 
    };
    
    // Стили для табов (вкладок) заданий
    const taskTabStyle = (isActive) => ({
        padding: '8px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#00a2ffff' : '#e0e0e0',
        color: isActive ? '#ffffffff' : '#333',
        
        borderRadius: '10px 10px 0 0',
        fontSize: '14px',
        fontWeight:'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    });
    

    return (
            <div style={{ display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    width: '100%', 
                    }}
                className='nodrag'>
            
                {/* Режим прохождения */}
                {displayViewMode === 'asViewer' && (
                    <div style={{height:'100%',}}>
                        {/* Заголовок теста */}
                        <div style={{ flexShrink: 0, width: '100%' }}>
                            <h3 style={{
                                fontSize: '22px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '25px',
                                lineHeight: '1.3',
                                wordBreak: 'break-word',
                            }}>
                                {title || 'Тест'}
                            </h3>
                        </div>
                        {/* Начальный экран */}
                        {testBeginningMode && (
                            <div>
                                <div style={{color:'#000', 
                                    marginBottom:'20px',
                                    display:'flex', 
                                    flexDirection:'column', 
                                    gap:'10px'}}>
                                    <label>Пройти до {endDate} {endTime}</label>
                                    <label>Время на прохождение {completionTime}</label>
                                    <label>Количество попыток {attemptNumber}</label>
                                </div>
                                <ActionButton onClick={() => handleTestStart()}>
                                    Начать тест
                                </ActionButton>
                            </div>
                        )}
                        {/* Прохождение теста */}
                        {!testBeginningMode && (
                            <div style={{display: 'flex', flexDirection:'column', height:'100%', gap:'10px'}}>
                                {/* НАВИГАЦИЯ ПО ЗАДАНИЯМ (ТАБЫ) */}
                                <div style={{ display: 'flex', 
                                    borderBottom: '2px solid #333' }}>
                                    {completedTasks.map((task, index) => (
                                        <div 
                                            key={task.id} 
                                            style={taskTabStyle(index === activeTaskIndex)}
                                            onClick={() => setActiveTaskIndex(index)}
                                        >
                                            Задание {index + 1}
                                        </div>
                                    ))}
                                </div>

                                {/* Обозреватель ТЕКУЩЕГО ЗАДАНИЯ */}
                                <div style={{
                                    padding:'10px',
                                    overflowY: 'auto',
                                    marginBottom:'20px',
                                    color: '#333', }}>
                                    {activeTaskIndex !== null && completedTasks[activeTaskIndex] ? (
                                        <div style={{display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px',
                                                }}>
                    
                                            <div style={{ display: 'flex', 
                                                flex:1,
                                                flexDirection: 'column',
                                                gap: '10px', }}>
                                                <label style={{fontSize: '18px',fontWeight:'bold',}}>Вопрос:</label>
                                                <label style={{fontSize: '18px',}}>{completedTasks[activeTaskIndex].question}</label>
                                            </div>
                                            
                                            <div style={oneSettingStyle}>
                                                <span>Баллы: {completedTasks[activeTaskIndex].score}</span>
                                            </div>
                                            
                                            {completedTasks[activeTaskIndex].type === 'text' && (
                                                <div>
                                                    <textarea
                                                        value={completedTasks[activeTaskIndex].completedText}
                                                        onChange={(e) => updateActiveCompletedTask('completedText', e.target.value)}
                                                        style={{ 
                                                            width: '100%',
                                                            minHeight:'100px',
                                                            fontSize: '18px',
                                                            resize: 'vertical',
                                                            color: '#333',
                                                            backgroundColor: '#ebebebff' }}
                                                        placeholder="Введите ответ..."
                                                    />
                                                </div>
                                            )}
                    
                                            {completedTasks[activeTaskIndex].type === 'single' && (
                                                <div style={{display: 'flex', flexDirection:'column', gap:'10px'}}>
                                                    {completedTasks[activeTaskIndex].options.map((opt, index) => (
                                                            <div key={activeTaskIndex + index} style={{display: 'flex', flexDirection:'row', gap:'10px'}}> 
                                                            <RadioButton 
                                                                checked={completedTasks[activeTaskIndex].completedRadioOption === opt}
                                                                onChange={() => handleRadioChange(opt)}
                                                                name={completedTasks[activeTaskIndex].id}
                                                            />
                                                            <label>{opt}</label>
                                                            </div>
                                                            ))}
                                                    
                                                </div>
                                            )}
                    
                                            {completedTasks[activeTaskIndex].type === 'multiple' && (
                                                <div style={{display: 'flex', flexDirection:'column', gap:'10px'}}>
                                                    {completedTasks[activeTaskIndex].options.map((opt, index) => (
                                                            <div key={activeTaskIndex + index} style={{display: 'flex', flexDirection:'row', gap:'10px'}}> 
                                                            <CheckboxSquare 
                                                                checked={completedTasks[activeTaskIndex].completedBoxOptions.includes(opt)}
                                                                onChange={() => handleCheckboxChange(opt, completedTasks[activeTaskIndex].completedBoxOptions)}
                                                            />
                                                            <label>{opt}</label>
                                                            </div>
                                                            ))}
                                                </div>
                                            )}
                                            
                                        </div>
                                    ) : (
                                        <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                                            Нет заданий.
                                        </div>
                                    )}
                                </div>
                            
                                <div style={{display:'flex', alignContent:'end', flexDirection:'row', justifyContent:'flex-end'}}>
                                    <ActionButton>
                                        Сохранить ответ
                                    </ActionButton>
                                </div>
                                {completedTasks.length - 1 === activeTaskIndex && (
                                    <div style={{display:'flex', alignContent:'end', flexDirection:'row', justifyContent:'flex-end'}}>
                                        <ActionButton>
                                            Завершить тест 
                                        </ActionButton>
                                    </div>
                                )}
                                
                            </div>
                    )}
                    </div>
                )} 

                    

            </div>
        );
}
