import React, { useState, useEffect, useCallback } from 'react'; // Добавили useEffect и useCallback
import { BaseWidgetCard } from '../BaseWidgetCard';
import { TestCreatorContent } from './TestCreatorContent';
import { TestSettingsContent } from './TestSettingsContent';
import { TestDisplayContent } from './TestDisplayContent'; 
import { useTestsApi } from '../../hooks/useTestsApi';

// Вспомогательная функция для получения cookie по имени
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};


// Проп pollId оставляем для совместимости с твоей логикой вызова виджетов
const TestWidget = ({ initialTitle, pollId }) => { 
    const { createTest, loading, error, fetchTest } = useTestsApi();

    const [currentUserId, setCurrentUserId] = useState(null);

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

        console.log("Widget initialized with:", data);

        const { 
            widgetId, 
            userId, 
            role, 
            config, 
            board 
        } = data;

        // 1. Обработка Конфигурации (Config)
        // Предполагаем, что pollId лежит внутри config, если виджет уже был настроен ранее
        if (config && config.pollId) {
            // Если есть ID теста, сохраняем его, это триггернет useEffect для загрузки из БД
            // (Логика уже есть в вашем TestWidget: useEffect на pollId)
            // Но нам нужно как-то передать этот pollId в пропсы или стейт. 
            // В текущей архитектуре pollId приходит пропсом, но здесь мы получаем его динамически.
            // Решение: Добавить локальный стейт для overridePollId или вызывать fetchTest напрямую.
            
            // Для примера вызовем fetchTest напрямую, если pollId пришел в конфиге:
            fetchTest(config.pollId).then(serverTest => {
                if (serverTest) {
                    setTestCreationData({
                        id: serverTest.id,
                        title: serverTest.title,
                        tasks: serverTest.tasks || [],
                        activeTaskIndex: 0
                    });
                    if (serverTest.settings) {
                        setTestSettingsData(serverTest.settings);
                    }
                }
            });
        }

        // 2. Обработка Ролей (Role)
        // Определяем режим просмотра в зависимости от роли пользователя на доске
        // 'admin'/'editor' -> могут редактировать ('creator')
        // 'viewer'/'guest' -> только проходят тест ('display')
        const canEdit = ['admin', 'editor', 'owner'].includes(role);
        
        if (canEdit) {
            // Если админ, но тест уже создан (есть данные), показываем настройки или превью
            // Если тест пустой, показываем 'creator'
            setViewMode(prev => (config?.pollId ? 'display' : 'creator'));
        } else {
            // Обычные пользователи всегда видят только режим прохождения
            setViewMode('display');
        }

        // 3. Сохранение контекста пользователя (опционально)
        // Можно сохранить userId, чтобы привязать ответы именно к этому пользователю
        // localStorage.setItem('current_board_user_id', userId); 
    
    }, [fetchTest]);

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