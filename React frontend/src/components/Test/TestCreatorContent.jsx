import React, { useState, useEffect } from 'react';
import { StyledInput, ActionButton, RadioButton, CheckboxSquare } from '../Atoms';

export const TestCreatorContent = ({onSave, onDataChange, initialData}) => {
    // --- Общие параметры теста ---
    const [title, setTitle] = useState(initialData?.title || '');
    
    // Состояние для списка заданий и активного индекса
    const [tasks, setTasks] = useState(initialData?.tasks || []);
    const [activeTaskIndex, setActiveTaskIndex] = useState(initialData?.activeTaskIndex ||null);

    // Обновляем данные при изменении настроек
    useEffect(() => {
        onDataChange({title, tasks, activeTaskIndex});
      }, [title, tasks, activeTaskIndex, onDataChange]);

    // Видимость настройки задания
    const [taskSettingsVisibility, setTaskSettingsVisibility] = useState(true);


    // Добавление нового задания
    const handleAddTask = () => {
        const newTask = {
            id: Date.now(), // Уникальный ID
            question: '',   // Текст вопроса
            type: 'text',   // Тип вопроса (по умолчанию) text/single/multiple
            score: 1,       // Баллы
            correctText: '',
            options: [''],
            correctRadioOption: '',
            correctBoxOptions: [],
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

    const handleSetPreviousTask = () => {
        if (activeTaskIndex > 0){
            setActiveTaskIndex(activeTaskIndex - 1)
        }
    }

    const handleSetNextTask = () => {
        if (activeTaskIndex < tasks.length-1){
            setActiveTaskIndex(activeTaskIndex + 1)
        }
    }

    const handleOptionChange = (index, value) => {
        let newOptions = [...tasks[activeTaskIndex].options];
        newOptions[index] = value;
        
        const nonEmpties = newOptions.filter(opt => opt.trim() !== '');

        const resultOptions = [...nonEmpties, ''];

        updateActiveTask('options', resultOptions)
    };

    const handleRadioChange = (optionValue) => {
        updateActiveTask('correctRadioOption', optionValue)
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

        updateActiveTask('correctBoxOptions', res)
    };
    // Стили
    const oneSettingStyle = { 
        display: 'flex', gap: '10px', alignItems: 'center', whiteSpace: 'nowrap'
    };
    const dateTimeInputStyle = {
        boxSizing: 'border-box', padding: '10px', backgroundColor: '#e0e0e0',
        border: 'none', fontSize: '14px', outline: 'none', color: '#333', width: '100%', borderRadius: '10px'
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
        gap: '5px',
        whiteSpace: 'nowrap'
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
                <ActionButton onClick={handleSetPreviousTask}
                    style={{borderRadius:'10px'}}>
                    {"←"}
                </ActionButton>
                <div style={{ display: 'flex', overflowX: 'auto'}}>
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
                                    fontWeight: 'bold' }}
                            >
                                ✕
                            </span>
                        </div>
                    ))}
                </div>
                <ActionButton onClick={handleSetNextTask}
                    style={{borderRadius:'10px', marginLeft: 'auto'}}>
                    {"→"}
                </ActionButton>
            </div>

            {/* 4. РЕДАКТОР ТЕКУЩЕГО ЗАДАНИЯ */}
            <div style={{
                padding:'10px',
                height:'100%',
                overflowY: 'auto',
                marginBottom:'20px',
                color: '#333', }}>
                {activeTaskIndex !== null && tasks[activeTaskIndex] ? (
                    <div style={{display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                             }}>

                        <div style={{ display: 'flex', 
                            flex:1,
                            flexDirection: 'column',
                            gap: '10px', }}>
                            <label style={{fontSize: '18px',fontWeight:'bold',}}>Вопрос:</label>
                            <textarea
                                value={tasks[activeTaskIndex].question}
                                onChange={(e) => updateActiveTask('question', e.target.value)}
                                style={{ 
                                    width: '100%',
                                    minHeight:'200px',
                                    fontSize: '18px',
                                    resize: 'vertical',
                                    color: '#333',
                                    backgroundColor: '#ebebebff' }}
                                placeholder="Введите текст вопроса..."
                            />
                        </div>
                        <div 
                            onClick={() => setTaskSettingsVisibility(!taskSettingsVisibility)} 
                            style={{cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', display: 'flex', gap:'5px'}}
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
                                <span>Баллы: {tasks[activeTaskIndex].score}</span>
                                <input 
                                    type="range" 
                                    min="1"      
                                    max="50"
                                    value={tasks[activeTaskIndex].score} 
                                    onChange={(e) => updateActiveTask('score', e.target.value)}
                                    style={dateTimeInputStyle} 
                                />
                            </div>
                        </div>)}
                        
                        {tasks[activeTaskIndex].type === 'text' && (
                            <textarea
                            value={tasks[activeTaskIndex].correctText}
                            onChange={(e) => updateActiveTask('correctText', e.target.value)}
                            style={{ 
                                width: '100%',
                                minHeight: '80px',
                                fontSize: '18px',
                                resize: 'vertical',
                                color: '#333',
                                backgroundColor: '#ebebebff' }}
                            placeholder="Введите правильные варианты с разделением через ENTER"
                        />
                        )}

                        {tasks[activeTaskIndex].type === 'single' && (
                            <div style={{}}>
                                {tasks[activeTaskIndex].options.map((opt, index) => (
                                        <div key={index} style={{display: 'flex', flexDirection:'row', gap:'10px'}}> 
                                        {opt != '' && (<RadioButton 
                                        checked={tasks[activeTaskIndex].correctRadioOption === opt}
                                        onChange={() => handleRadioChange(opt)}
                                        name={tasks[activeTaskIndex].id}
                                        />)}
                                        <StyledInput 
                                            placeholder={`Вариант ${index + 1}`}
                                            value={opt}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            style={{borderRadius: '15px'}}
                                        />
                                        </div>
                                        ))}
                            </div>
                        )}

                        {tasks[activeTaskIndex].type === 'multiple' && (
                            <div style={{}}>
                                {tasks[activeTaskIndex].options.map((opt, index) => (
                                        <div key={index} style={{display: 'flex', flexDirection:'row', gap:'10px'}}> 
                                        {opt != '' && (<CheckboxSquare 
                                            checked={tasks[activeTaskIndex].correctBoxOptions.includes(opt)}
                                            onChange={() => handleCheckboxChange(opt, tasks[activeTaskIndex].correctBoxOptions)}
                                        />)}
                                        <StyledInput 
                                            placeholder={`Вариант ${index + 1}`}
                                            value={opt}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            style={{borderRadius: '15px'}}
                                        />
                                        </div>
                                        ))}
                            </div>
                        )}
                        
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

                <ActionButton onClick={() => onSave()}
                    style={{borderRadius:'10px'}}>
                    Сохранить тест
                </ActionButton>
            </div>

        </div>
    );
};