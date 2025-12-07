import React, { useState } from 'react';
import { BaseWidgetCard } from '../BaseWidgetCard';
import { TestCreatorContent } from './TestCreatorContent';
// import { TestDisplayContent } from './TestDisplayContent'; 

const TestWidget = ({initialTitle}) => {
    // Состояние для хранения данных 
    const [testCreationData, setPollCreationData] = useState({ 
        title: initialTitle || '', 
        options: [''] 
    });
    // Состояние для хранения данных настроек всего теста
    const [testSettingsData, setPollSettingsData] = useState({
        completionTime: '',
        endDate: '', 
        endTime: ''  
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

    // Динамический заголовок для BaseWidgetCard
    const getWidgetTitle = () => {

    };

    return (
        <BaseWidgetCard 
                title={getWidgetTitle()}
            >
                {viewMode === 'creator' && (
                <TestCreatorContent 

                />
                )}
                {viewMode === 'display' && (
                <TestDisplayContent 

                />
                )}
        </BaseWidgetCard>
    );
}


export default TestWidget;