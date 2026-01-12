import { useState, useCallback } from 'react';



export const useTestsApi = (baseUrl) => {

  if (!baseUrl) baseUrl = 'https://polls-tests-widgets-backend-1357.loca.lt';

  // const API_BASE_URL = '/api/polls/tests/';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция для сборки полного URL
  const makeUrl = (endpoint) => {
    // Если baseUrl передан, используем его, иначе пустая строка (относительный путь)
    const base = baseUrl ? baseUrl.replace(/\/$/, '') : ''; 
    return `${base}/api/polls/tests${endpoint}`;
  };

  const getCsrfToken = () => {
    const name = 'csrftoken=';
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name)) return decodeURIComponent(c.substring(name.length));
    }
    return null;
  };

  const apiFetch = async (url, opts = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      ...opts,
      headers: { 
        'Content-Type': 'application/json', 
        'bypass-tunnel-reminder': 'true',
        ...opts.headers 
      }
    });
    
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.detail || res.statusText || 'Ошибка сервера');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  const fetchTest = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
        const data = await apiFetch(makeUrl(`/${id}/`));
        return data;
    } catch (err) {
        setError(err.message);
        throw err;
    } finally {
        setLoading(false);
    }
  }, []);

  const deleteTest = useCallback(async (testId, userId) => {
    setLoading(true);
    setError(null);
    try {
        const csrfToken = getCsrfToken();
        return await apiFetch(makeUrl(`/${testId}/`), {
            method: 'DELETE',
            headers: { 
                'X-CSRFToken': csrfToken 
            },
            // Передаем owner в теле, если бэкенд проверяет права по нему
            body: JSON.stringify({ owner: userId })
        });
      } catch (err) {
          setError(err.message);
          throw err;
      } finally {
          setLoading(false);
      }
  }, []);
  
  // Создание теста
const createTest = useCallback(async (testCreationData, testSettingsData) => {
    setLoading(true);
    setError(null);
    try {
      let formattedEndDate = null;

      if (testSettingsData.endDate) {
        // 1. Создаем объект даты из строки даты и времени (местное время пользователя)
        const localDateTime = new Date(`${testSettingsData.endDate}T${testSettingsData.endTime || '23:59:59'}`);
        
        // 2. Преобразуем в ISO строку (она всегда в GMT 0 / UTC)
        // Результат будет в формате: "2023-10-25T20:59:59.000Z"
        formattedEndDate = localDateTime.toISOString();
      }
      const payload = {
        title: testCreationData.title,
        owner: localStorage.getItem('userId') || 'Anonymous',
        tasks: testCreationData.tasks.map(task => ({
            question: task.question,
            task_type: task.type, 
            score: task.score,
            correct_text: task.correctText, 
            options: task.options.filter(o => o.trim() !== '').map(opt => ({
                text: opt,
                is_correct: task.type === 'single' 
                    ? opt === task.correctRadioOption 
                    : task.correctBoxOptions.includes(opt)
            }))
        })),
        
        // Маппинг настроек из camelCase в snake_case
        completion_time: testSettingsData.completionTime === '' ? null : parseInt(testSettingsData.completionTime),
        attempt_number: testSettingsData.attemptNumber === '' ? null : parseInt(testSettingsData.attemptNumber),
        // Собираем end_date из даты и времени, если нужно, или передаем как есть
        end_date: formattedEndDate ? formattedEndDate : null
      };

      return await apiFetch(makeUrl('/'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
}, []);

  // Отправка результатов (попытки) теста
const submitAttempt = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch(makeUrl(`/submit/`), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createTest,
    fetchTest,
    submitAttempt,
    deleteTest
  };
};