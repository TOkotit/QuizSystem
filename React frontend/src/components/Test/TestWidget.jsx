import React, { useState, useEffect, useCallback } from 'react'; // Добавили useEffect и useCallback
import { BaseWidgetCard } from '../BaseWidgetCard';
import { TestCreatorContent } from './TestCreatorContent';
import { TestSettingsContent } from './TestSettingsContent';
import { TestDisplayContent } from './TestDisplayContent'; 
import { useTestsApi } from '../../hooks/useTestsApi';

// Проп pollId оставляем для совместимости с твоей логикой вызова виджетов
const TestWidget = ({ initialTitle, pollId }) => { 
    const { createTest, loading, error, fetchTest } = useTestsApi();

    const [testSettingsData, setTestSettingsData] = useState({
        completionTime: '',
        attemptNumber: '',
        endDate: '', 
        endTime: ''  
    });

    const [testCreationData, setTestCreationData] = useState({
        id: null,
        title: initialTitle || '',
        tasks: [],
        activeTaskIndex: null,
    });

    const [viewMode, setViewMode] = useState('creator');

    // 1. ПОДТЯГИВАНИЕ ДАННЫХ ИЗ БД (как в опросах)
    useEffect(() => {
        if (!pollId) return;
        let mounted = true;
        
        (async () => {
            try {
                const serverTest = await fetchTest(pollId);
                if (!mounted || !serverTest) return;

                // Записываем данные в стейт создания
                setTestCreationData({
                    id: serverTest.id,
                    title: serverTest.title,
                    tasks: serverTest.tasks || [],
                    activeTaskIndex: 0
                });

                // Записываем настройки
                if (serverTest.settings) {
                    setTestSettingsData(serverTest.settings);
                }

                // Сразу переходим в режим отображения
                setViewMode('display');
            } catch (err) {
                console.error("Ошибка загрузки теста из БД:", err);
            }
        })();

        return () => { mounted = false; };
    }, [pollId, fetchTest]);

    // 2. ФУНКЦИИ ПЕРЕКЛЮЧЕНИЯ (как в опросах)
    const handleSettingsBack = useCallback(() => setViewMode('creator'), []);
    const toggleSettings = useCallback(() => {
        setViewMode(prev => prev === 'settings' ? 'creator' : 'settings');
    }, []);

    const handleSave = async () => {
        try {
            const result = await createTest(testCreationData, testSettingsData);
            if (result && result.id) {
                setTestCreationData(result);
                setViewMode('display'); 
                
                // ОЧЕНЬ ВАЖНО: передаем ID созданного теста наверх в React Flow
                if (onSaved) {
                    onSaved(result.id);
                }
            }
        } catch (err) {
            console.error("Ошибка при сохранении теста:", err);
        }
    };

    const getWidgetTitle = () => {
        if (viewMode === 'settings') return "Настройки";
        return testCreationData.title || "Тест";
    };

    return (
        <BaseWidgetCard 
            title={getWidgetTitle()} 
            toggleSettings={viewMode !== 'display' ? toggleSettings : undefined} 
            showMenuDots={viewMode === 'creator'} 
        >
            {loading && <p style={{color: 'blue', textAlign: 'center'}}>Загрузка...</p>}
            
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
            
            {viewMode === 'display' && (
                <TestDisplayContent 
                    testData={{ ...testCreationData, settings: testSettingsData }}
                />
            )}
            
            {error && <div style={{color: 'red', fontSize: '12px', padding: '5px'}}>{error}</div>}
        </BaseWidgetCard>
    );
}

export default TestWidget;