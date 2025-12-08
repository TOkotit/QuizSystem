import { useState, useCallback } from 'react';

const API_BASE_URL = '/api/polls/';

const getCsrfToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

export const usePollsApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(true); 

    const csrfToken = getCsrfToken();

    const fetchAllPolls = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // --- API: ЗАПРОС СПИСКА ОПРОСОВ ---
            const response = await fetch(`${API_BASE_URL}list/`); 
            if (!response.ok) throw new Error('Error fetching polls');
            return await response.json();
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);
    
    const createPoll = useCallback(async (pollData, pollSettings) => {
        setLoading(true);
        setError(null);
        
        const choices = pollData.options
            .filter(o => o.trim() !== '')
            .map(text => ({ choice_text: text })); 
        
        const payload = {
            title: pollData.title,
            choices: choices,
            is_anonymous: pollSettings.isAnonymous,
            multiple_answers: pollSettings.multipleAnswers,
            end_date: pollSettings.endDate ? `${pollSettings.endDate}T${pollSettings.endTime || '23:59'}:00Z` : null,
        };
        
        if (!csrfToken) throw new Error("CSRF token missing");

        try {
            // --- API: СОЗДАНИЕ ОПРОСА (POST) ---
            const response = await fetch(`${API_BASE_URL}create/`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, 
                },
                body: JSON.stringify(payload),
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }

            return await response.json(); 
            
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [csrfToken]);

    const votePoll = useCallback(async (pollId, choiceId) => {
        setLoading(true);
        setError(null);

        if (!csrfToken) throw new Error("CSRF token missing");

        try {
            // --- API: ОТПРАВКА ГОЛОСА (POST) ---
            // Отправляем ID опроса в URL и ID варианта в body
            const response = await fetch(`${API_BASE_URL}${pollId}/vote/`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, 
                },
                body: JSON.stringify({ choice_id: choiceId }), 
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }

            // Бэкенд должен вернуть обновленный объект опроса с новыми голосами
            return await response.json();

        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [csrfToken]);


    return {
        isAuthReady,
        loading,
        error,
        setError, 
        fetchAllPolls,
        createPoll,
        votePoll,
    };
};