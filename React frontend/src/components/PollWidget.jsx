import React, { useState } from 'react';
import { BaseWidgetCard } from './BaseWidgetCard';
import { PollCreatorContent } from './PollCreatorContent';
import { PollSettingsContent } from './PollSettingsContent';
import { PollDisplayContent } from './PollDisplayContent'; 

// --- [4] POLL WIDGET (Main Orchestrator) ---
const PollWidget = ({ initialTitle }) => {
  // Состояние для хранения данных создания опроса (чтобы они не терялись при переключении)
  const [pollCreationData, setPollCreationData] = useState({ 
    title: initialTitle || '', 
    options: [''] 
  });
  // Состояние для хранения данных настроек
  const [pollSettingsData, setPollSettingsData] = useState({
    isAnonymous: false,
    multipleAnswers: false,
    endDate: '', 
    endTime: ''  
  });

  // Состояние, которое определяет, что показываем: 'creator', 'settings', или 'display'
  const [viewMode, setViewMode] = useState('creator'); // 'creator' (создание), 'settings' (настройки), 'display' (отображение)

  const handleSave = (data) => {
    // Концептуальное сохранение. Просто переходим в режим отображения.
    // Реальный вызов БД будет здесь позже.
    setViewMode('display'); 
  };

  const toggleSettings = () => {
    // MenuDots доступны только в режиме 'creator' и ведут в 'settings'
    if (viewMode === 'creator') {
        setViewMode('settings');
    } 
  };

  // Функция для возврата из настроек обратно в режим создания/отображения
  const handleSettingsBack = () => {
      // Возвращаемся в режим создания, т.к. только оттуда можно попасть в настройки
      setViewMode('creator'); 
  };


  // Динамический заголовок для BaseWidgetCard
  const getWidgetTitle = () => {
    if (viewMode === 'settings') {
      return "Настройки";
    } else if (viewMode === 'display') {
      // Форматируем заголовок для режима отображения как на макете
      const anonymityStatus = pollSettingsData.isAnonymous ? 'Анонимно' : 'Неанонимно';
      // Формат даты DD.MM.YY
      const displayEndDate = pollSettingsData.endDate ? `До ${pollSettingsData.endDate.split('-').reverse().join('.')}` : ''; 
      return `Опрос - ${anonymityStatus} ${displayEndDate}`.trim();
    }
    return "Опрос"; // Режим создания
  };

  return (
    <BaseWidgetCard 
        title={getWidgetTitle()} 
        toggleSettings={toggleSettings} 
        // MenuDots видны ТОЛЬКО в режиме 'creator'
        showMenuDots={viewMode === 'creator'} 
    >
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
          // Кнопка "Назад к опросу" в настройках ведет обратно в режим создания
          toggleSettings={handleSettingsBack} 
        />
      )}
      {viewMode === 'display' && (
        <PollDisplayContent 
          pollData={{ ...pollCreationData, settings: pollSettingsData }} 
          // В режиме отображения "три точки" не нужны.
        />
      )}
    </BaseWidgetCard>
  );
};

export default PollWidget;