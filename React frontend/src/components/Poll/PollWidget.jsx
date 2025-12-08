import React, { useState } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { PollCreatorContent } from './PollCreatorContent';
import { PollSettingsContent } from './PollSettingsContent';
import { PollDisplayContent } from './PollDisplayContent'; 
import { usePollsApi } from '../hooks/usePollsApi'; 

const PollWidget = ({ initialTitle }) => {
    const [pollCreationData, setPollCreationData] = useState({ title: initialTitle || '', options: [''] });
    const [pollSettingsData, setPollSettingsData] = useState({ isAnonymous: false, multipleAnswers: false, endDate: '', endTime: '' });
    const [savedPollData, setSavedPollData] = useState(null); 
    const [viewMode, setViewMode] = useState('creator'); 
    
    // --- API: ПОДКЛЮЧЕНИЕ ХУКА ---
    const { createPoll, loading, error } = usePollsApi(); 

    const handleSave = async () => { 
        const non_empty_options = pollCreationData.options.filter(o => o.trim() !== '');
        if (!pollCreationData.title.trim() || non_empty_options.length < 1) {
            alert("Min 1 option required");
            return;
        }

        try {
            // --- API: ВЫЗОВ СОЗДАНИЯ ---
            const savedData = await createPoll(pollCreationData, pollSettingsData);
            
            // Сохраняем полученные от бэкенда данные (с ID и пустыми голосами)
            setSavedPollData(savedData); 
            setViewMode('display'); 
        } catch (e) {
            console.error(e);
        }
    };

    const toggleSettings = () => viewMode === 'creator' ? setViewMode('settings') : setViewMode('creator');
    const handleSettingsBack = () => setViewMode('creator'); 

    const getWidgetTitle = () => {
        // Логика заголовка (опущена для краткости, без изменений)
        return "Опрос";
    };

    return (
        <BaseWidgetCard title={getWidgetTitle()} toggleSettings={toggleSettings} showMenuDots={viewMode === 'creator'}>
            {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
            
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