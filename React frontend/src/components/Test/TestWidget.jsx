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

const TestWidget = ({ initialTitle, pollId: testId }) => { 
    const { createTest, loading, error, fetchTest, deleteTest } = useTestsApi();

    const [viewMode, setViewMode] = useState(testId ? 'display' : 'creator');
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [testCreationData, setTestCreationData] = useState({
        id: null,
        owner: '',
        title: initialTitle || '',
        tasks: []
    });
    const [testSettingsData, setTestSettingsData] = useState({
        completionTime: null, 
        attemptNumber: 1, 
        endDate:null, 
        endTime:null,
    });

    const [savedTestData, setSavedTestData] = useState(null);

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

    const getInfo = useCallback((data) => {
            if (!data) return;
    
            console.log("Test Widget initialized with:", data);
    
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
                        const serverTest = await fetchTest(widgetId);
                        if (!serverTest) return;

                        setSavedTestData(serverTest);

                        setTestCreationData({ 
                            id: serverTest.id,
                            title: serverTest.title,
                            tasks: serverTest.tasks || [],
                            all_attempts: serverTest.all_attempts,
                            owner: serverTest.owner
                        });

                        if (serverTest.settings) 
                                setTestSettingsData(serverTest.settings);
                        
                        setIsDataLoaded(true);
                        
                    } catch (e) {
                        console.error('Ошибка загрузки теста:', e);
                    }
                })();
            }
    
            const canEdit = ['admin', 'editor', 'owner'].includes(role);
            
            if (canEdit) {
                setViewMode(prev => (widgetId ? 'display' : 'creator'));
            } else {
                setViewMode('display');
            }
        }, [fetchTest]);

    useEffect(() => {
        if (!testId) return;
        let isMounted = true;

        (async () => {
            try {
                const serverTest = await fetchTest(testId);
                if (!isMounted || !serverTest) return;

                setSavedTestData(serverTest);

                setTestCreationData({ 
                    id: serverTest.id,
                    title: serverTest.title,
                    tasks: serverTest.tasks || [],
                    all_attempts: serverTest.all_attempts,
                    owner: serverTest.owner
                });

                if (serverTest.settings) 
                        setTestSettingsData(serverTest.settings);
                
                setIsDataLoaded(true);
                
            } catch (e) {
                console.error('Ошибка загрузки теста:', e);
            }
        })();
        return () => { isMounted = false; };
    }, [testId, fetchTest]);

    const handleSettingsBack = useCallback(() => setViewMode('creator'), []);
    
    const toggleSettings = useCallback(() => {
        setViewMode(prev => prev === 'settings' ? 'creator' : 'settings');
    }, []);

    const handleDeleteClick = async () => {
    // Берем ID из данных, пришедших от сервера
        const actualTestId = testCreationData?.id || pollId;
        const userId = localStorage.getItem('userId') || 'Anonymous';

        if (!actualTestId) {
            alert("Ошибка: ID теста не найден");
            return;
        }

        if (window.confirm("Вы уверены, что хотите полностью удалить этот тест?")) {
            try {
                await deleteTest(actualTestId, userId);
                alert("Тест успешно удален");
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            } catch (err) {
                console.error("Ошибка удаления:", err);
                if (err.status === 403) {
                    alert("У вас нет прав на удаление (вы не автор).");
                } else {
                    alert("Не удалось удалить тест: " + err.message);
                }
            }
        }
    };


    const handleSave = useCallback(async () => {
        try {
            const result = await createTest(testCreationData, testSettingsData);
            if (result && result.id) {
                setSavedTestData(result); 
                setIsDataLoaded(true);
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

    if (testId && !isDataLoaded) {
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

                <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
                {/* Кнопка удаления (идентичная опросам) */}
                {testCreationData?.id && String(testCreationData.owner) === String(currentUserId) && (
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
                            zIndex: 1000, // Повыше, чтобы перекрыть контент
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            lineHeight: '1'
                        }}
                        title="Удалить тест"
                    >
                        &times;
                    </div>
                )}


                <TestDisplayContent 
                    testData={savedTestData}
                    setTestData={setSavedTestData}
                />
            </div>
            )}
            
            {error && <div style={{color: 'red', fontSize: '12px', padding: '10px', textAlign: 'center'}}>{error}</div>}
        </BaseWidgetCard>
    );
}

export default TestWidget;