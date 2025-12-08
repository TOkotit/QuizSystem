import React, { useState, useEffect } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { PollCreatorContent } from './PollCreatorContent';
import { PollSettingsContent } from './PollSettingsContent';
import { PollDisplayContent } from './PollDisplayContent'; 
import { usePollsApi } from '../../hooks/usePollsApi';


const PollWidget = ({ initialTitle, pollId }) => {
  const [pollCreationData, setPollCreationData] = useState({ title: initialTitle || '', options: [''] });
  const [pollSettingsData, setPollSettingsData] = useState({ isAnonymous: false, multipleAnswers: false, endDate: '', endTime: '' });
  const [savedPollData, setSavedPollData] = useState(null);
  const [viewMode, setViewMode] = useState('creator');
    
    // --- API: ПОДКЛЮЧЕНИЕ ХУКА ---
    const { createPoll, loading, error, fetchPoll } = usePollsApi();

    useEffect(() => {
        if (!pollId) return;
        let mounted = true;
        (async () => {
        try {
            const serverPoll = await fetchPoll(pollId);
            if (!mounted || !serverPoll) return;
            setSavedPollData(serverPoll);
            setViewMode('display');
        } catch (e) {
            console.error('Ошибка загрузки опроса:', e);
        }
        })();
        return () => { mounted = false; };
    }, [pollId, fetchPoll]);

    const handleSave = async () => {
    const non_empty_options = pollCreationData.options.filter(o => o.trim() !== '');
    if (!pollCreationData.title.trim() || non_empty_options.length < 1) {
      alert("Min 1 option required");
      return;
    }

        try {
            console.log("Подготовка к createPoll, options:", non_empty_options);
            console.log("document.cookie:", document.cookie);

            // 1) Создаём опрос на сервере
            const savedData = await createPoll(pollCreationData, pollSettingsData);         
            // 2) Обновляем локальное состояние и переключаемся в display
            setSavedPollData(savedData);
            setViewMode('display');

            // 3) Вызываем callback родителю (PollResizable), чтобы он записал pollId в node.data
            if (typeof onSaved === 'function') {
                onSaved(savedData);
            }
         } catch (e) {
            console.error('Ошибка сохранения опроса:', e);
            alert('Ошибка при сохранении опроса: ' + (e.message || e));
        }
    };

    const toggleSettings = () => setViewMode((v) => v === 'creator' ? 'settings' : 'creator');
    const handleSettingsBack = () => setViewMode('creator');

    const getWidgetTitle = () => {
        // Логика заголовка (опущена для краткости, без изменений)
        return "Опрос";
    };

    return (
        <BaseWidgetCard title={getWidgetTitle()} toggleSettings={toggleSettings} showMenuDots={viewMode === 'creator'}>
            {<p style={{color: 'red', textAlign: 'center'}}></p>}
            
            {viewMode === 'creator' && (
                <PollCreatorContent onSave={handleSave} onDataChange={setPollCreationData} initialData={pollCreationData} />
            )}
            {viewMode === 'settings' && (
                <PollSettingsContent onDataChange={setPollSettingsData} initialData={pollSettingsData} toggleSettings={handleSettingsBack} />
            )}
            
            {viewMode === 'display' && savedPollData && ( 
                <PollDisplayContent 
                    pollData={savedPollData} 
                    setPollData={setSavedPollData} // --- API: ПЕРЕДАЕМ SETTER ДЛЯ ОБНОВЛЕНИЯ ПОСЛЕ ГОЛОСОВАНИЯ ---
                    toggleSettings={toggleSettings}
                />
            )}
        </BaseWidgetCard>
    );
};

export default PollWidget;