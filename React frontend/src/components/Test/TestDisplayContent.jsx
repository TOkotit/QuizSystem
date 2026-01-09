import React, { useState, useEffect } from 'react';
import { ActionButton, RadioButton, CheckboxSquare } from '../Atoms';
import { useTestsApi } from '../../hooks/useTestsApi';

export const TestDisplayContent = ({ testData, setTestData }) => {
    // В опросах данные приходят извне, делаем так же
    const testId = testData?.id; 
    const title = testData?.title || '';
    const tasks = testData?.tasks || [];
    const settings = testData?.settings || {};
    
    const { submitAttempt, loading: isSubmitting, fetchTest } = useTestsApi();

    const currentUserId = localStorage.getItem('userId') || 'Anonymous';
    const [testBeginningMode, setTestBeginningMode] = useState(true);
    const [resultMode, setResultMode] = useState(false);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [resultData, setResultData] = useState(null);
    const [completedTasks, setCompletedTasks] = useState([]);

    const userAttempts = testData?.all_attempts.filter(v => v.user === String(currentUserId));
    const remainingAttempts = testData.attempt_number - userAttempts.length;
    // ЖЕСТКАЯ ПРОВЕРКА: Инициализация как в рабочих опросах
    useEffect(() => {
        initializeTasks
    }, []);
    const initializeTasks = () => {
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            console.log("Инициализация задач в Display:", tasks);
            const initial = tasks.map((task) => ({
                id: task.id,
                question: task.question,
                type: task.task_type,
                score: task.score,
                options: Array.isArray(task.options) ? task.options : [],
                completedText: '',
                completedRadioOptionId: '', 
                completedBoxOptionIds: [],
            }));
            setCompletedTasks(initial);
            setActiveTaskIndex(0);
        }
    };

    const updateActiveCompletedTask = (field, value) => {
        setCompletedTasks(prev => {
            const updated = [...prev];
            if (updated[activeTaskIndex]) {
                updated[activeTaskIndex] = { ...updated[activeTaskIndex], [field]: value };
            }
            return updated;
        });
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

    const handleCheckboxChange = (optionValue) => {
        const currentTask = completedTasks[activeTaskIndex];
        if (!currentTask) return;
        const currentSelected = currentTask.completedBoxOptionIds || [];
        const nextSelected = currentSelected.includes(optionValue)
            ? currentSelected.filter(item => item !== optionValue)
            : [...currentSelected, optionValue];
        updateActiveCompletedTask('completedBoxOptionIds', nextSelected);
    };


    const handleFinishTest = async () => {
        // Собираем данные для отправки (test_id, ответы и имя пользователя)
        const payload = {
                test: testId,
                user: currentUserId,
                answers: completedTasks.map(task => {
                    let selected_ids = [];
                    if (task.type === 'single') {
                        const id = task.completedRadioOptionId;
                        if (id) selected_ids = [id];
                    } else if (task.type === 'multiple') {
                        selected_ids = task.completedBoxOptionIds;
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
                setResultMode(true);
                setTestBeginningMode(false);
                if (fetchTest) setTestData(await fetchTest(testId));
            }

        } catch (err) {
            console.error("Ошибка:", err);
        }
    };
    const handleStartTest = () => {
        initializeTasks();
        setTestBeginningMode(false);
    }
    const handleQuitResult = () => {
        setResultMode(false);
        setTestBeginningMode(true);
    }

    // ЭКРАН РЕЗУЛЬТАТА (как в опросах после голосования)
    if (resultData && resultMode) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#000' }}>
                <h3 style={{color: '#28a745'}}>Тест завершен!</h3>
                <p style={{fontSize: '18px'}}>Результат: <b>{resultData.score_obtained}</b> / {resultData.total_score}</p>
                <ActionButton onClick={handleQuitResult}>ОК</ActionButton>
            </div>
        );
    }

    if (!testBeginningMode && completedTasks.length === 0) {
        return <div style={{color: '#000', padding: '20px'}}>Загрузка...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', color: '#000', }}>
            <h3 style={{ color: '#000', marginBottom: '15px' }}>{title}</h3>
            {testData?.owner === currentUserId && (<div>
                {/* --- СЕКЦИЯ С ВСЕМИ РЕЗУЛЬТАТАМИ --- */}
                {(testData?.all_attempts && testData?.all_attempts.length > 0) ? (
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <h4 style={{ marginBottom: '10px' }}>Все результаты:</h4>
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '10px', 
                            padding: '10px',
                            maxHeight: '200px',       
                            overflowY: 'auto',        
                            border: '1px solid #ddd'  
                        }}>
                            {testData?.all_attempts.map((attempt, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '10px 5px',
                                    borderBottom: index !== testData?.all_attempts.length - 1 ? '1px solid #ddd' : 'none'
                                }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                        {attempt.user} 
                                    </span>
                                    <span style={{ fontSize: '14px' }}>
                                        {new Date(attempt.completed_at).toLocaleDateString()}
                                    </span>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                        {attempt.score_obtained} / {attempt.total_score} баллов
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (<div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        Нет результатов
                    </div>)}
            </div>)}
            
            {testData?.owner !== currentUserId && (<div>
                {/* начало теста */}
                {testBeginningMode ? (
                    <div style={{color:'#000'}}>
                        <div style={{marginBottom: '15px'}}>
                            <p>Автор: {testData.owner}</p>
                            <p>Заданий: {tasks.length}</p>
                            {testData.completion_time && <p>Время: {testData.completion_time} мин.</p>}
                            {testData.end_date && <p>Доступно до: {testData.end_date} {testData.end_time}</p>}
                            <p>Попыток: {remainingAttempts}/{testData.attempt_number}</p>
                        </div>
                        <ActionButton onClick={handleStartTest}
                            style={{borderRadius: "10px"}}
                            disabled={remainingAttempts <= 0}>Начать тест</ActionButton>
                        
                        {/* --- СЕКЦИЯ С личными РЕЗУЛЬТАТАМИ --- */}
                        {(userAttempts && userAttempts.length > 0) ? (
                            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                                <h4 style={{ marginBottom: '10px' }}>Ваши предыдущие результаты:</h4>
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '10px', 
                                    padding: '10px',
                                    maxHeight: '200px',       
                                    overflowY: 'auto',        
                                    border: '1px solid #ddd'  
                                }}>
                                    {userAttempts.map((attempt, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            padding: '10px 5px',
                                            borderBottom: index !== userAttempts.length - 1 ? '1px solid #ddd' : 'none'
                                        }}>
                                            <span style={{ fontSize: '14px' }}>
                                                {new Date(attempt.completed_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                {attempt.score_obtained} / {attempt.total_score} баллов
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (<div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        Нет результатов
                    </div>)}

                    </div>
                ) : (
                    <>
                        {/* Табы вопросов */}
                        <div style={{ display: 'flex',
                            borderBottom: '2px solid #333' }}>
                            <ActionButton onClick={handleSetPreviousTask}
                                style={{borderRadius:'10px'}}>
                                ←
                            </ActionButton>
                            <div style={{ display: 'flex', overflowX: 'auto' }}>
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
                                            borderRadius: '5px 5px 0 0',
                                            minWidth:'25px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                ))}
                            </div>
                            <ActionButton onClick={handleSetNextTask}
                                style={{borderRadius:'10px', marginLeft: 'auto'}}>
                                →
                            </ActionButton>
                        </div>
                        {/* область самого задания */}
                        <div style={{ color: '#000' }}>
                            {/* текст задания */}
                            <p style={{fontWeight: 'bold'}}>{completedTasks[activeTaskIndex]?.question}</p>
                            
                            {/* тип текст */}
                            {completedTasks[activeTaskIndex]?.type === 'text' && (
                                <textarea 
                                    value={completedTasks[activeTaskIndex].completedText}
                                    onChange={(e) => updateActiveCompletedTask('completedText', e.target.value)}
                                    style={{ width: '100%', height: '80px', padding: '5px' }}
                                />
                            )}

                            {/* тип один выбор */}
                            {completedTasks[activeTaskIndex]?.type === 'single' && 
                                completedTasks[activeTaskIndex].options.map((opt, i) => (
                                    <div key={i} 
                                        style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', gap:"10px" }}>
                                        <RadioButton 
                                            checked={completedTasks[activeTaskIndex].completedRadioOptionId === opt.id}
                                            onChange={() => updateActiveCompletedTask('completedRadioOptionId', opt.id)}
                                        />
                                        <div onClick={() => updateActiveCompletedTask('completedRadioOptionId', opt.id)} 
                                            style={{ flexGrow: 1, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            backgroundColor: completedTasks[activeTaskIndex].completedRadioOptionId === opt.id ? '#d0d0d0' : '#e0e0e0', 
                                            padding: '12px 16px', 
                                            borderRadius: "10px", 
                                            position: 'relative', 
                                            overflow: 'hidden' }}>
                                            <span >{opt.text}</span>
                                        </div>   
                                    </div> 
                            ))}

                            {/* тип несколько ответов */}
                            {completedTasks[activeTaskIndex]?.type === 'multiple' && 
                                completedTasks[activeTaskIndex].options.map((opt, i) => (
                                    <div key={i}  
                                        style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', gap:"10px" }}>
                                        <CheckboxSquare 
                                            checked={completedTasks[activeTaskIndex].completedBoxOptionIds.includes(opt.id)}
                                            onChange={() => handleCheckboxChange(opt.id)}
                                        />
                                        <div onClick={() => handleCheckboxChange(opt.id)}
                                            style={{ flexGrow: 1, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            backgroundColor: completedTasks[activeTaskIndex].completedBoxOptionIds.includes(opt.id) ? '#d0d0d0' : '#e0e0e0', 
                                            padding: '12px 16px', 
                                            borderRadius: "10px", 
                                            position: 'relative', 
                                            overflow: 'hidden' }}>
                                            <span >{opt.text}</span>
                                        </div>   
                                    </div> 
                            ))}
                        </div>
                        {/* следующее задание */}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            {activeTaskIndex !== completedTasks.length - 1 && (
                                <ActionButton onClick={handleSetNextTask}>
                                    Дальше
                                </ActionButton>
                            )}
                        </div>
                        {/* завершение теста */}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            {activeTaskIndex === completedTasks.length - 1 && (
                                <ActionButton onClick={handleFinishTest} disabled={isSubmitting}>
                                    {isSubmitting ? 'Сохранение...' : 'Завершить'}
                                </ActionButton>
                            )}
                        </div>
                    </>
                )}
            </div>)}
            
        </div>
    );
};