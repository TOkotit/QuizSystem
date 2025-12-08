import React, { useState, useEffect } from 'react';
import { StyledInput, ActionButton, RadioButton, CheckboxSquare } from '../Atoms'; 

export const TestDisplayContent = ({ testData }) => {
    const { title, tasks,  settings } = testData;
    const { completionTime, attemptNumber, endDate, endTime } = settings;


    const [displayViewMode, setDisplayViewMode] = useState('asViewer'); // asCreator/asViewer

    const [activeTaskIndex, setActiveTaskIndex] = useState(testData?.activeTaskIndex ||null);

    const [completedTasks, setCompletedTasks] = useState([]);
    

    setCompletedTasks(tasks.map((task, index) => {
        return {
            id: Date.now(), 
            question: task.question,
            type: task.type,
            score: task.score,
            correctText: task.correctText,
            options: task.options,
            correctRadioOption: task.correctRadioOption,
            correctBoxOptions: task.correctBoxOptions,

            // дополнительные поля
            completedText: '',
            completedRadioOption: '',
            completedBoxOptions: '',
        };
    }));

    return (
            <div style={{ display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    width: '100%', 
                    }}
                className='nodrag'>
                
                {/* Режим прохождения */}
                {displayViewMode === 'asViewer' && (
                    <div>
                        {/* Заголовок теста */}
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
                                {title || 'Тест'}
                            </h3>
                        </div>

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
                            height:'100%',
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
                                            
                                        </div>
                                    )}
            
                                    {completedTasks[activeTaskIndex].type === 'single' && (
                                        <div style={{}}>
                                            
                                        </div>
                                    )}
            
                                    {completedTasks[activeTaskIndex].type === 'multiple' && (
                                        <div style={{}}>
                                            
                                        </div>
                                    )}
                                    
                                </div>
                            ) : (
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                                    Нет заданий.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
    
                
    
                {/* 5. Кнопки действий */}
                <div style={{
                    
                    display: 'flex', 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                     }}>
    
                    <ActionButton onClick={() => onSave(tasks)}
                        style={{borderRadius:'10px'}}>
                        Сохранить тест
                    </ActionButton>
                </div>
    
            </div>
        );
}
