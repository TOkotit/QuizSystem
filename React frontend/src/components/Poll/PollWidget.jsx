import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { PollCreatorContent } from './PollCreatorContent';
import { PollSettingsContent } from './PollSettingsContent';
import { PollDisplayContent } from './PollDisplayContent';
import { usePollsApi } from '../../hooks/usePollsApi';


const PollWidget = ({ initialTitle, pollId}) => {
    
    const [pollCreationData, setPollCreationData] = useState({ 
        ownerID: '',
        title: initialTitle || '', 
        options: [''] 
    });
    const [pollSettingsData, setPollSettingsData] = useState({ 
        isAnonymous: false, 
        multipleAnswers: false, 
        endDate: '', 
        endTime: '' 
    });

    const handleDeleteClick = async () => {

        const actualPollId = savedPollData?.id;
    
        // 2. Берем ID пользователя точно так же, как в PollDisplayContent
        const userId = localStorage.getItem('userId') || 'Anonymous';

        if (!actualPollId) {
            alert("Ошибка: ID опроса не определен.");
            return;
        }
        if (window.confirm("Вы уверены, что хотите полностью удалить этот опрос?")) {
            try {
                await deletePoll(actualPollId, currentUserId); 
                alert("Опрос успешно удален из базы");
                setTimeout(() => {
                        window.location.reload();
                    }, 100);
                } catch (err) {
                console.error("Детали ошибки:", err);
                if (err.status === 403) {
                    alert("У вас нет прав на удаление этого опроса. Удалять может только автор.");
                } else {
                    // Все остальные ошибки (сервер упал, нет интернета и т.д.)
                    alert("Произошла ошибка при удалении: " + err.message);
                }
                console.warn("Побочная ошибка (вероятно расширение браузера):", err);
            }
        }
    };


    const [savedPollData, setSavedPollData] = useState(null);
    const [viewMode, setViewMode] = useState('creator');

    const { createPoll, loading, error, fetchPoll, deletePoll } = usePollsApi();

    const [currentUserId, setCurrentUserId] = useState();
    
    useEffect(() => {
        // 1. Пытаемся взять из localStorage
        let userId = localStorage.getItem('userId');

        // 2. Если там нет, пытаемся взять из Cookie (например, 'user_id' или 'session_id')
        if (!userId) {
            userId = getCookie('user_id'); 
        }

        if (!userId) {
            // Генерируем случайный ID, если его нет
            userId = 'anon_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('userId', userId);
        }
        
        if (userId) {
            setCurrentUserId(userId);
            console.log("ID пользователя загружен:", userId);
        }
    }, []);
    
    const getInfo = useCallback((data) => {
        if (!data) return;

        console.log("Poll Widget initialized with:", data);

        const { 
            widgetId, 
            userId, 
            role, 
            config, 
            board 
        } = data;
        if (widgetId) {
            
            (async () => {
                try {
                    const serverPoll = await fetchPoll(widgetId);
                    if (!serverPoll) return;
                    setSavedPollData(serverPoll);

                    const optionsFromDB = (serverPoll.choices || []).map(c => c.choice_text);

                    setPollCreationData({ 
                        title: serverPoll.title, 
                        options: [...optionsFromDB.filter(o => o.trim() !== ''), optionsFromDB.length > 0 ? '' : '']
                    });

                    let datePart = '';
                    let timePart = '';
                    if (serverPoll.end_date) {
                        const parts = serverPoll.end_date.split('T');
                        datePart = parts[0];
                        timePart = parts[1] ? parts[1].substring(0, 5) : ''; 
                    }

                    setPollSettingsData({
                        isAnonymous: serverPoll.is_anonymous,
                        multipleAnswers: serverPoll.multiple_answers,
                        endDate: datePart,
                        endTime: timePart,
                    });

                    setViewMode('display');
                    
                } catch (e) {
                    console.error('Ошибка загрузки опроса:', e);
                }
            })();
        }

        const canEdit = ['admin', 'editor', 'owner'].includes(role);
        
        if (canEdit) {
            setViewMode(prev => (widgetId ? 'display' : 'creator'));
        } else {
            setViewMode('display');
        }
    }, [fetchPoll]);

    useEffect(() => {
        if (!pollId) return;
        let mounted = true;
        
        (async () => {
            try {
                const serverPoll = await fetchPoll(pollId);
                if (!mounted || !serverPoll) return;

                setSavedPollData(serverPoll);

                const optionsFromDB = (serverPoll.choices || []).map(c => c.choice_text);

                setPollCreationData({ 
                    title: serverPoll.title, 
                    options: [...optionsFromDB.filter(o => o.trim() !== ''), optionsFromDB.length > 0 ? '' : '']
                });

                let datePart = '';
                let timePart = '';
                if (serverPoll.end_date) {
                    const parts = serverPoll.end_date.split('T');
                    datePart = parts[0];
                    timePart = parts[1] ? parts[1].substring(0, 5) : ''; 
                }

                setPollSettingsData({
                    isAnonymous: serverPoll.is_anonymous,
                    multipleAnswers: serverPoll.multiple_answers,
                    endDate: datePart,
                    endTime: timePart,
                });

                setViewMode('display');
                
            } catch (e) {
                console.error('Ошибка загрузки опроса:', e);
            }
        })();
        return () => { mounted = false; };
    }, [pollId, fetchPoll]);

    const handleSave = async () => {
    // 1. Фильтруем пустые варианты
        const non_empty_options = pollCreationData.options.filter(o => o.trim() !== '');
        
        // 2. Валидация
        if (!pollCreationData.title.trim() || non_empty_options.length < 1) {
            alert("Заполните название и хотя бы один вариант ответа");
            return;
        }
        
        try {
            // 3. Собираем данные для отправки вручную.
            // Мы НЕ ждем обновления стейта, а берем всё свежее прямо сейчас.
            const dataToSend = {
                ...pollCreationData,
                options: non_empty_options,
                ownerID: currentUserId // Добавляем имя пользователя как владельца
            };

            const savedData = await createPoll(dataToSend, pollSettingsData);
            
            // 4. Обновляем локальный стейт данными, которые вернул бэкенд (там уже будет id)
            setSavedPollData(savedData);

            // 5. Уведомляем React Flow (чтобы в ноде сохранился ID для автозагрузки)
            if (typeof onSaved === 'function' && savedData?.id) {
                onSaved(savedData.id);
            }
            
            setViewMode('display');

        } catch (e) {
            console.error('Ошибка сохранения опроса:', e);
            alert('Ошибка при сохранении опроса: ' + (e.message || e));
        }
    };

    const toggleSettings = useCallback(() => setViewMode((v) => v === 'creator' ? 'settings' : 'creator'), []);
    const handleSettingsBack = useCallback(() => setViewMode('creator'), []);
    const toggleCreator = useCallback(() => setViewMode('creator'), []); 

    const getWidgetTitle = () => {
        return "Опрос";
    };

    return (
        <BaseWidgetCard 
            style={{ position: 'relative' }}
            title={getWidgetTitle()} 
            onSettingsClick={viewMode === 'display' ? toggleCreator : undefined}
            toggleSettings={viewMode !== 'settings' ? toggleSettings : undefined}
            showMenuDots={viewMode === 'creator'}   
            onTitleClick={viewMode === 'display' ? toggleCreator : undefined} 
        > 
            {<p style={{color: 'red', textAlign: 'center'}}>{loading ? 'Сохранение...' : error}</p>}
                    
            
            <div style={{ position: 'relative' }}>
                    {/* Маленькая метка с ID в углу для теста */}
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#999', 
                        textAlign: 'right', 
                        padding: '0 15px' 
                    }}>
                        User ID: {currentUserId}
                    </div>
            </div>

            

            {viewMode === 'creator' && (
                <PollCreatorContent 
                    onSave={handleSave} 
                    onDataChange={setPollCreationData} 
                    initialData={pollCreationData} 
                />
            )}
            
            {viewMode === 'settings' && (
                <PollSettingsContent 
                    onDataChange={setPollSettingsData} 
                    initialData={pollSettingsData} 
                    toggleSettings={handleSettingsBack} 
                />
            )}
            
            {viewMode === 'display' && savedPollData && (
                <>
                {/* КНОПКА КРЕСТИК: Показываем только создателю в режиме отображения */}
                {savedPollData?.id && String(savedPollData.owner) === String(currentUserId) && (
                        <div 
                            onClick={handleDeleteClick}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#ff4d4d',
                                color: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                zIndex: 100,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                lineHeight: '1'
                            }}
                            title="Удалить опрос"
                        >
                            &times;
                        </div>
                    )}
                    <PollDisplayContent 
                        pollData={savedPollData} 
                        setPollData={setSavedPollData} 
                    />
    </>
)}

        </BaseWidgetCard>
    );
};

export default PollWidget;