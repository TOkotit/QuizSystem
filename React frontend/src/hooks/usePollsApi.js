import { useState, useCallback } from 'react';



export const usePollsApi = (baseUrl) => {

  // const API_BASE_URL = '/api/polls/';

  if (!baseUrl) baseUrl = 'https://polls-tests-widgets-backend-1357.loca.lt';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция для сборки полного URL
  const makeUrl = (endpoint) => {
    // Если baseUrl передан, используем его, иначе пустая строка (относительный путь)
    const base = baseUrl ? baseUrl.replace(/\/$/, '') : ''; 
    return `${base}/api/polls${endpoint}`;
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

  const fetchCsrf = async () => {
    await fetch(makeUrl("/csrf/"), { credentials: "include" }); 
  };

  const apiFetch = async (url, opts = {}) => {
    const baseOptions = {
      credentials: 'include',
      method: 'GET',
      mode: 'cors',
      headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
      },
    };




    const finalOptions = {
      ...baseOptions,
      ...opts,
      headers: {
          ...baseOptions.headers,
          ...(opts.headers || {}),
      }
    };
    
    const res = await fetch(url, finalOptions);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

    if (!res.ok) {
      const error = new Error((data && (data.detail || data.message)) || res.statusText);
      error.status = res.status;
      throw error;
    }
    return data;
  };

  const deletePoll = useCallback(async (pollId, userId) => {
    setLoading(true);
    setError(null);
    try {
      await fetchCsrf();
      const csrfToken = getCsrfToken();

      const data = await apiFetch(makeUrl(`/${pollId}/`), {
        method: 'DELETE',
        mode: 'cors',
        headers: { 
            'X-CSRFToken': csrfToken,
            'X-User-ID': userId
        },
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);



  const fetchAllPolls = useCallback(async () => {
      try {
          // Предполагается, что GET-запрос на /api/polls/ возвращает массив всех опросов
         const data = await apiFetch(makeUrl('/list/'), { method: 'GET' }); 
          return data;
      } catch (e) {
          console.error('Ошибка получения списка опросов:', e);
          throw e;
      }
  }, [apiFetch]);

  const fetchPoll = useCallback(async (pollId) => {
    setLoading(true);
    setError(null);
    try {
     const data = await apiFetch(makeUrl(`/${pollId}/`), { method: 'GET', mode: 'cors', });
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPoll = useCallback(async (pollData, pollSettings) => {
    setLoading(true);
    setError(null);

    await fetchCsrf();
    const csrfToken = getCsrfToken();
    if (!csrfToken) throw new Error("CSRF token missing!");

    const choices = (pollData.options || [])
      .filter(o => o.trim() !== '')
      .map(text => ({ choice_text: text }));


    let formattedEndDate = null;
    if (pollSettings.endDate) {
      const localDateTime = new Date(`${pollSettings.endDate}T${pollSettings.endTime || '23:59:59'}`);
      
      formattedEndDate = localDateTime.toISOString();
    }

    const payload = {
      owner: pollData.ownerID,
      title: pollData.title,
      choices,
      is_anonymous: pollSettings.isAnonymous,
      multiple_answers: pollSettings.multipleAnswers,
      end_date: formattedEndDate,
    };

    try {
      const data = await apiFetch(makeUrl('/create/'), {
        method: 'POST',
        mode: 'cors',
        headers: { 
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(payload),
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllPollVotes = useCallback(async (pollId) => {
    setLoading(true);
    setError(null);
    try {
     const data = await apiFetch(makeUrl(`/${pollId}/`), { method: 'GET' });
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [])

  const votePoll = useCallback(async (pollId, voteData) => {
    setLoading(true);
    setError(null);

    await fetchCsrf();
    const csrfToken = getCsrfToken();
    if (!csrfToken) throw new Error("CSRF token missing!");

    try {
      const data = await apiFetch(makeUrl(`/${pollId}/vote/`), {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ choice_id: voteData.choiceId,  user: voteData.userId}),
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unvotePoll = useCallback(async (pollId, userId) => {
    setLoading(true);
    setError(null);

    await fetchCsrf();
    const csrfToken = getCsrfToken();

    try {
      // Отправляем POST запрос на /unvote/
      const data = await apiFetch(makeUrl(`/${pollId}/unvote/}`), {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ user: userId }), // Передаем ID пользователя
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);



  return {
    createPoll,
    loading,
    error,
    setError,
    fetchAllPolls,
    fetchPoll,
    createPoll,
    votePoll,
    unvotePoll,
    deletePoll,
  };
};