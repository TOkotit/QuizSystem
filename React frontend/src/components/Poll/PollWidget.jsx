import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { PollCreatorContent } from './PollCreatorContent';
import { PollSettingsContent } from './PollSettingsContent';
import { PollDisplayContent } from './PollDisplayContent';
import { usePollsApi } from '../../hooks/usePollsApi';


const PollWidget = ({ initialTitle, pollId, onSaved }) => {
    const [pollCreationData, setPollCreationData] = useState({ title: initialTitle || '', options: [''] });
    const [pollSettingsData, setPollSettingsData] = useState({ isAnonymous: false, multipleAnswers: false, endDate: '', endTime: '' });
    const [savedPollData, setSavedPollData] = useState(null);
    const [viewMode, setViewMode] = useState('creator');

    const { createPoll, loading, error, fetchPoll } = usePollsApi();

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
        const non_empty_options = pollCreationData.options.filter(o => o.trim() !== '');
        if (!pollCreationData.title.trim() || non_empty_options.length < 1) {
            alert("Min 1 option required");
            return;
        }

        try {
            const savedData = await createPoll(pollCreationData, pollSettingsData);
            
            setSavedPollData(savedData);

            if (typeof onSaved === 'function') {
                onSaved(savedData);
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
            title={getWidgetTitle()} 
            toggleSettings={viewMode !== 'settings' ? toggleSettings : undefined}
            showMenuDots={viewMode === 'creator'}
            onTitleClick={viewMode === 'display' ? toggleCreator : undefined} 
        > 
            {<p style={{color: 'red', textAlign: 'center'}}>{loading ? 'Сохранение...' : error}</p>}
            
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
                <PollDisplayContent 
                    pollData={savedPollData} 
                    setPollData={setSavedPollData} 
                />
            )}

        </BaseWidgetCard>
    );
};

export default PollWidget;