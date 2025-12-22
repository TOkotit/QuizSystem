import React, { useState } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { TestCreatorContent } from './TestCreatorContent';
import { TestSettingsContent } from './TestSettingsContent';
import { TestDisplayContent } from './TestDisplayContent'; 

const TestWidget = ({initialTitle}) => {
    // Состояние для хранения данных настроек всего теста
    const [testSettingsData, setTestSettingsData] = useState({
        completionTime: '',
        attemptNumber: '',
        endDate: '', 
        endTime: ''  
    });

    // Состояние для списка заданий и активного индекса
    const [testCreationData, setTestCreationData] = useState({
        title: initialTitle || '',
        tasks: [],
        activeTaskIndex: '',
    });

    // Состояние для отображений
    const [viewMode, setViewMode] = useState('creator'); 

    const handleSave = (data) => {
    // Концептуальное сохранение. Просто переходим в режим отображения.
    // Реальный вызов БД будет здесь позже.
    setViewMode('display'); 
    };

    // Функция для возврата из настроек обратно в режим создания/отображения
    const handleSettingsBack = () => {
        // Возвращаемся в режим создания, т.к. только оттуда можно попасть в настройки
        setViewMode('creator'); 
    };
    const toggleSettings = () => {
        if (viewMode === 'creator') {
            setViewMode('settings');
        } 
    };
    // Динамический заголовок для BaseWidgetCard
    const getWidgetTitle = () => {
        if (viewMode === 'settings') {
        return "Настройки";
        } else if (viewMode === 'display') {
        
        return 'Тест';
        }
        return "Тест"; // Режим создания
    };

    return (
        <BaseWidgetCard 
                title={getWidgetTitle()} 
                toggleSettings={toggleSettings} 
                // MenuDots видны ТОЛЬКО в режиме 'creator'
                showMenuDots={viewMode === 'creator'} 
            >
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
                        // Кнопка "Назад к опросу" в настройках ведет обратно в режим создания
                        toggleSettings={handleSettingsBack} 
                    />
                )}
                {viewMode === 'display' && (
                    <TestDisplayContent 
                        testData={{ ...testCreationData, settings: testSettingsData }}
                    />
                )}
        </BaseWidgetCard>
    );
}


export default TestWidget;