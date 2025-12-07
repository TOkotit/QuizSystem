import React, { useState } from 'react';
import { StyledInput, ActionButton } from '../Atoms'; // Убрал CheckboxSquare, если не используется

export const TestCreatorContent = (onSave, onDataChange, initialData) => {
    // --- Общие параметры теста ---
    const [title, setTitle] = useState('');
    
    // Состояние для списка заданий и активного индекса
    const [tasks, setTasks] = useState([]);
    const [activeTaskIndex, setActiveTaskIndex] = useState(null);

    // Видимость настройки задания
    const [taskSettingsVisibility, setTaskSettingsVisibility] = useState(false);


    // Добавление нового задания
    const handleAddTask = () => {
        const newTask = {
            id: Date.now(), // Уникальный ID
            question: '',   // Текст вопроса
            type: 'text',   // Тип вопроса (по умолчанию) text/single/multiple
            score: 1,       // Баллы
        };

        const newTasks = [...tasks, newTask];
        setTasks(newTasks);
        setActiveTaskIndex(newTasks.length - 1); // Переключаемся на только что созданное
    };

    // Обновление текущего задания
    const updateActiveTask = (field, value) => {
        if (activeTaskIndex === null) return;

        const updatedTasks = [...tasks];
        updatedTasks[activeTaskIndex] = {
            ...updatedTasks[activeTaskIndex],
            [field]: value
        };
        setTasks(updatedTasks);
    };

    // Удаление задания (опционально)
    const handleDeleteTask = (index, e) => {
        e.stopPropagation();
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
        // Корректируем активный индекс
        if (activeTaskIndex >= newTasks.length) {
            setActiveTaskIndex(newTasks.length > 0 ? newTasks.length - 1 : null);
        } else if (index < activeTaskIndex) {
            setActiveTaskIndex(activeTaskIndex - 1);
        }
    };


    // Стили
    const oneSettingStyle = { 
        display: 'flex', gap: '10px', alignItems: 'center', 
    };
    const dateTimeInputStyle = {
        boxSizing: 'border-box', padding: '10px', backgroundColor: '#e0e0e0',
        border: 'none', fontSize: '14px', outline: 'none', color: '#333', width: '100%'
    };
    
    // Стили для табов (вкладок) заданий
    const taskTabStyle = (isActive) => ({
        padding: '8px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#ccc' : '#e0e0e0',
        color: '#333',
        border: '1px solid #ccc',
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
            
            {/* 1. Заголовок теста */}
            <div>
                <StyledInput
                    placeholder="Название теста" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ fontSize: '20px', 
                        fontWeight: 'bold', 
                        borderRadius: '10px'
                        }}
                />
            </div> 

            {/* 3. НАВИГАЦИЯ ПО ЗАДАНИЯМ (ТАБЫ) */}
            <div style={{ display: 'flex', 
                borderBottom: '2px solid #333' }}>
                {tasks.map((task, index) => (
                    <div 
                        key={task.id} 
                        style={taskTabStyle(index === activeTaskIndex)}
                        onClick={() => setActiveTaskIndex(index)}
                    >
                        Задание {index + 1}
                        <span 
                            onClick={(e) => handleDeleteTask(index, e)}
                            style={{ fontSize: '10px', 
                                color: 'red', 
                                fontWeight: 'bold' }}
                        >
                            ✕
                        </span>
                    </div>
                ))}
            </div>

            {/* 4. РЕДАКТОР ТЕКУЩЕГО ЗАДАНИЯ */}
            <div style={{
                padding:'10px',
                marginBottom:'20px',
                height:'100%',
                color: '#333', }}>
                {activeTaskIndex !== null && tasks[activeTaskIndex] ? (
                    <div style={{display: 'flex', 
                            flexDirection: 'column',
                            gap: '10px', }}>

                        <div style={{ display: 'flex', 
                            flexDirection: 'column',
                            gap: '10px', }}>
                            <label style={{fontSize: '18px',fontWeight:'bold',}}>Вопрос:</label>
                            <textarea
                                value={tasks[activeTaskIndex].question}
                                onChange={(e) => updateActiveTask('question', e.target.value)}
                                style={{ 
                                    width: '100%',
                                    minHeight: '80px',
                                    fontSize: '18px',
                                    resize: 'vertical',
                                    color: '#333',
                                    backgroundColor: '#ebebebff' }}
                                placeholder="Введите текст вопроса..."
                            />
                        </div>
                        <div 
                            onClick={() => setTaskSettingsVisibility(!taskSettingsVisibility)} 
                            style={{cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', display: 'flex'}}
                        >
                            <span>Параметры задания</span>
                            <span>{taskSettingsVisibility ? '▲' : '▼'}</span>
                        </div>
                        {taskSettingsVisibility && (
                            <div style={{ display: 'flex', 
                            flexDirection: 'column',
                            gap: '10px',
                            width:'50%' }}>
                            <div style={oneSettingStyle}>
                                <span>Тип:</span>
                                <select 
                                    value={tasks[activeTaskIndex].type}
                                    onChange={(e) => updateActiveTask('type', e.target.value)}
                                    style={dateTimeInputStyle}
                                >
                                    <option value="text">Текст</option>
                                    <option value="single">Один выбор</option>
                                    <option value="multiple">Множ. выбор</option>
                                </select>
                            </div>
                            <div style={oneSettingStyle}>
                                <span>Баллы:</span>
                                <input 
                                    type="number" 
                                    value={tasks[activeTaskIndex].score} 
                                    onChange={(e) => updateActiveTask('score', e.target.value)}
                                    style={dateTimeInputStyle} 
                                />
                            </div>
                        </div>)}
                    </div>
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        Нет активных заданий. Нажмите "Добавить задание".
                    </div>
                )}
            </div>

            {/* 5. Кнопки действий */}
            <div style={{
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                 }}>
                <ActionButton onClick={handleAddTask}
                    style={{borderRadius:'10px'}}>
                    + Добавить задание
                </ActionButton>

                <ActionButton onClick={() => console.log({ title, settings: { completionTime, endDate }, tasks })}
                    style={{borderRadius:'10px'}}>
                    Сохранить тест
                </ActionButton>
            </div>

        </div>
    );
};