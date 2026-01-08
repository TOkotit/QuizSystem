import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { TestCreatorContent } from './TestCreatorContent';
import { TestSettingsContent } from './TestSettingsContent';
import { TestDisplayContent } from './TestDisplayContent'; 
import { useTestsApi } from '../../hooks/useTestsApi';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const TestWidget = ({ initialTitle, pollId }) => { 
    const { createTest, loading, error, fetchTest } = useTestsApi();

    const [viewMode, setViewMode] = useState(pollId ? 'display' : 'creator');
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [testCreationData, setTestCreationData] = useState({
        ownerID: '',
        title: initialTitle || '',
        tasks: []
    });
    const [testSettingsData, setTestSettingsData] = useState({
        completionTime: null, 
        attemptNumber: 1, 
        endDate:null, 
        endTime:null,
    });

    useEffect(() => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = getCookie('user_id'); 
        }
        if (!userId) {
            userId = 'anon_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('userId', userId);
        }
        setCurrentUserId(userId);
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (pollId) {
            fetchTest(pollId).then(data => {
                if (data && isMounted) {
                    setTestCreationData({
                        id: data.id,
                        title: data.title,
                        tasks: data.tasks || [],
                        all_attempts: data.all_attempts
                    });
                    if (data.settings) setTestSettingsData(data.settings);
                    setIsDataLoaded(true);
                }
            }).catch(err => {
                console.error("Ошибка загрузки:", err);
                setIsDataLoaded(true);
            });
        } else {
            setIsDataLoaded(true);
        }
        return () => { isMounted = false; };
    }, [pollId, fetchTest]);

    const handleSettingsBack = useCallback(() => setViewMode('creator'), []);
    
    const toggleSettings = useCallback(() => {
        setViewMode(prev => prev === 'settings' ? 'creator' : 'settings');
    }, []);

    const handleSave = useCallback(async () => {
        try {
            const result = await createTest(testCreationData, testSettingsData);
            if (result && result.id) {
                setTestCreationData(result); 
                setViewMode('display'); 
            }
        } catch (err) {
            console.error("Ошибка при сохранении:", err);
        }
    }, [createTest, testCreationData, testSettingsData]);

    const getWidgetTitle = () => {
        if (viewMode === 'settings') return "Настройки";
        return testCreationData.title || "Тест";
    };

    if (pollId && !isDataLoaded) {
        return (
            <BaseWidgetCard title="Загрузка...">
                <div style={{padding: '20px', textAlign: 'center'}}>Загрузка данных теста...</div>
            </BaseWidgetCard>
        );
    }

    return (
        <BaseWidgetCard 
            title={getWidgetTitle()} 
            toggleSettings={viewMode !== 'display' ? toggleSettings : undefined} 
            showMenuDots={viewMode === 'creator'} 
        >
            {loading && <p style={{color: 'blue', textAlign: 'center', margin: '5px 0'}}>Синхронизация...</p>}

            <div style={{ position: 'relative' }}>
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
                <TestCreatorContent 
                    onDataChange={setTestCreationData} 
                    initialData={testCreationData} 
                    onSave={handleSave}
                />
            )}
            
            {viewMode === 'settings' && (
                <TestSettingsContent
                    onDataChange={setTestSettingsData} 
                    initialData={testSettingsData} 
                    toggleSettings={handleSettingsBack} 
                />
            )}
            
            {viewMode === 'display' && isDataLoaded &&(
                <TestDisplayContent 
                    testId={testCreationData.id || pollId}
                    testData={{
                        ...testCreationData,
                        id: testCreationData.id || pollId,
                        settings: testSettingsData,
                        tasks: testCreationData.tasks || []
                     }}
                />
            )}
            
            {error && <div style={{color: 'red', fontSize: '12px', padding: '10px', textAlign: 'center'}}>{error}</div>}
        </BaseWidgetCard>
    );
}

export default TestWidget;