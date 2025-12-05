import { useState, useCallback, useEffect } from 'react';

// Заглушка вместо реального API URL
const API_BASE_URL = '/api/polls/'; 

// --- ХУК ДЛЯ УПРАВЛЕНИЯ API ОПРОСОВ ---
export const usePollsApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Имитируем, что аутентификация всегда готова
    const [isAuthReady, setIsAuthReady] = useState(true); 


    // 3. МЕТОД: ПОЛУЧЕНИЕ ВСЕХ ОПРОСОВ (MOCK)
    const fetchAllPolls = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Возвращаем тестовые данные
            return [
                { id: 1, text: "Опрос о качестве обслуживания клиентов" }, 
                { id: 2, text: "Опрос о новых функциях продукта X" },
                { id: 3, text: "Опрос об удовлетворенности работой" },
            ];
        } catch (err) {
            setError("Ошибка загрузки опросов");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);
    
    // 4. МЕТОД: СОЗДАНИЕ ОПРОСА (MOCK)
    const createPoll = useCallback(async (pollData) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log("MOCK API: Опрос создан с данными:", pollData);
            
            // Возвращаем объект, похожий на ответ реального API
            return {
                id: Math.floor(Math.random() * 1000),
                title: pollData.title,
                is_anonymous: pollData.settings.isAnonymous,
                multiple_answers: pollData.settings.multipleAnswers,
                end_date: pollData.settings.endDate,
                created_at: new Date().toISOString(),
                choices: pollData.options.map((text, index) => ({ id: index, text }))
            };
        } catch (err) {
            setError("Не удалось создать опрос");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);


    return {
        isAuthReady,
        loading,
        error,
        setError, 
        fetchAllPolls,
        createPoll,
    };
};