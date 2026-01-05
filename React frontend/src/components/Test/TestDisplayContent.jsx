import React, { useState, useEffect } from 'react';
import { ActionButton, RadioButton, CheckboxSquare } from '../Atoms';
import { useTestsApi } from '../../hooks/useTestsApi';

export const TestDisplayContent = ({ testData }) => {
    // В опросах данные приходят извне, делаем так же
    const testId = testData?.id; 
    const title = testData?.title || '';
    const tasks = testData?.tasks || [];
    const settings = testData?.settings || {};
    
    const { submitAttempt, loading: isSubmitting } = useTestsApi();

    const [testBeginningMode, setTestBeginningMode] = useState(true);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [resultData, setResultData] = useState(null);
    const [completedTasks, setCompletedTasks] = useState([]);

    // ЖЕСТКАЯ ПРОВЕРКА: Инициализация как в рабочих опросах
    useEffect(() => {
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            console.log("Инициализация задач в Display:", tasks);
            const initial = tasks.map((task) => ({
                id: task.id,
                question: task.question,
                type: task.type,
                score: task.score,
                options: Array.isArray(task.options) ? task.options : [],
                completedText: '',
                completedRadioOptionId: '', 
                completedBoxOptionIds: [],
            }));
            setCompletedTasks(initial);
        }
    }, [tasks, testData]);

    const updateActiveCompletedTask = (field, value) => {
        setCompletedTasks(prev => {
            const updated = [...prev];
            if (updated[activeTaskIndex]) {
                updated[activeTaskIndex] = { ...updated[activeTaskIndex], [field]: value };
            }
            return updated;
        });
    };

    const handleCheckboxChange = (optionValue) => {
        const currentTask = completedTasks[activeTaskIndex];
        if (!currentTask) return;
        const currentSelected = currentTask.completedBoxOptions || [];
        const nextSelected = currentSelected.includes(optionValue)
            ? currentSelected.filter(item => item !== optionValue)
            : [...currentSelected, optionValue];
        updateActiveCompletedTask('completedBoxOptions', nextSelected);
    };

    const getOptionIdByText = (task, text) => {
        if (!text) return null;
        const found = task.options.find(o => String(o.text) === String(text));
        return found ? found.id : null;
    };


    const handleFinishTest = async () => {
        const currentUserName = localStorage.getItem('userId') || 'Anonymous';

        // Собираем данные для отправки (test_id, ответы и имя пользователя)
        const payload = {
                test: testId,
                user: currentUserName,
                answers: completedTasks.map(task => {
                    let selected_ids = [];
                    if (task.type === 'single') {
                        const id = getOptionIdByText(task, task.completedRadioOption);
                        if (id) selected_ids = [id];
                    } else if (task.type === 'multiple') {
                        selected_ids = task.completedBoxOptions
                            .map(text => getOptionIdByText(task, text))
                            .filter(id => id !== null);
                    }

                    return {
                        task: task.id,
                        answer_text: task.completedText,
                        selected_options: selected_ids
                    };
                })
            };

        try {
            const result = await submitAttempt(payload);
            if (result) {
                setResultData(result);
                setTestBeginningMode(false);
            }
        } catch (err) {
            console.error("Ошибка:", err);
        }
    };

    // ЭКРАН РЕЗУЛЬТАТА (как в опросах после голосования)
    if (resultData) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#000' }}>
                <h3 style={{color: '#28a745'}}>Тест завершен!</h3>
                <p style={{fontSize: '18px'}}>Результат: <b>{resultData.score_obtained}</b> / {resultData.total_score}</p>
                <ActionButton onClick={() => window.location.reload()}>ОК</ActionButton>
            </div>
        );
    }

    if (!testBeginningMode && completedTasks.length === 0) {
        return <div style={{color: '#000', padding: '20px'}}>Загрузка...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h3 style={{ color: '#000', marginBottom: '15px' }}>{title}</h3>
            
            {testBeginningMode ? (
                <div style={{color:'#000'}}>
                    <div style={{marginBottom: '15px'}}>
                        <p>Доступно до: {settings.endDate} {settings.endTime}</p>
                        <p>Попыток: {settings.attemptNumber}</p>
                    </div>
                    <ActionButton onClick={() => setTestBeginningMode(false)}>Начать тест</ActionButton>
                </div>
            ) : (
                <>
                    {/* Табы вопросов */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #333', marginBottom: '15px', overflowX: 'auto' }}>
                        {completedTasks.map((_, index) => (
                            <div 
                                key={index} 
                                onClick={() => setActiveTaskIndex(index)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: index === activeTaskIndex ? '#00a2ff' : '#eee',
                                    color: index === activeTaskIndex ? '#fff' : '#000',
                                    marginRight: '2px',
                                    borderRadius: '5px 5px 0 0'
                                }}
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>

                    <div style={{ color: '#000' }}>
                        <p style={{fontWeight: 'bold'}}>{completedTasks[activeTaskIndex]?.question}</p>
                        
                        {completedTasks[activeTaskIndex]?.type === 'text' && (
                            <textarea 
                                value={completedTasks[activeTaskIndex].completedText}
                                onChange={(e) => updateActiveCompletedTask('completedText', e.target.value)}
                                style={{ width: '100%', height: '80px', padding: '5px' }}
                            />
                        )}

                        {completedTasks[activeTaskIndex]?.type === 'single' && 
                            completedTasks[activeTaskIndex].options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                    <RadioButton 
                                        checked={completedTasks[activeTaskIndex].completedRadioOption === opt.text}
                                        onChange={() => updateActiveCompletedTask('completedRadioOption', opt.text)}
                                    />
                                    <label>{opt.text}</label>
                                </div>
                        ))}

                        {completedTasks[activeTaskIndex]?.type === 'multiple' && 
                            completedTasks[activeTaskIndex].options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                    <CheckboxSquare 
                                        checked={completedTasks[activeTaskIndex].completedBoxOptions.includes(opt.text)}
                                        onChange={() => handleCheckboxChange(opt.text)}
                                    />
                                    <label>{opt.text}</label>
                                </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        {activeTaskIndex === completedTasks.length - 1 && (
                            <ActionButton onClick={handleFinishTest} disabled={isSubmitting}>
                                {isSubmitting ? 'Сохранение...' : 'Завершить'}
                            </ActionButton>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};