import { useState, useCallback } from 'react';

const API_BASE_URL = '/api/polls/';

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
  await fetch("/api/csrf/", { credentials: "include" }); 
};

const apiFetch = async (url, opts = {}) => {
  const baseOptions = {
    credentials: 'include',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
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
    const message = (data && (data.detail || data.message)) || res.statusText || 'Ошибка сервера';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const usePollsApi = (externalApiBaseUrl) => {

  const API_BASE_URL = externalApiBaseUrl || '/api/polls/';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllPolls = useCallback(async () => {
      try {
          // Предполагается, что GET-запрос на /api/polls/ возвращает массив всех опросов
         const data = await apiFetch(`${API_BASE_URL}list/`, { method: 'GET' }); 
          return data;
      } catch (e) {
          console.error('Ошибка получения списка опросов:', e);
          throw e;
      }
  }, [apiFetch, API_BASE_URL]);

  const fetchPoll = useCallback(async (pollId) => {
    setLoading(true);
    setError(null);
    try {
     const data = await apiFetch(`${API_BASE_URL}${pollId}/`, { method: 'GET' });
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

    const payload = {
      owner: pollData.ownerID,
      title: pollData.title,
      choices,
      is_anonymous: pollSettings.isAnonymous,
      multiple_answers: pollSettings.multipleAnswers,
      end_date: pollSettings.endDate ? `${pollSettings.endDate}T${pollSettings.endTime || '23:59'}:00Z` : null,
    };

    try {
      const data = await apiFetch(`${API_BASE_URL}create/`, {
        method: 'POST',
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
     const data = await apiFetch(`${API_BASE_URL}${pollId}/`, { method: 'GET' });
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
      const data = await apiFetch(`${API_BASE_URL}${pollId}/vote/`, {
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




  return {
    createPoll,
    loading,
    error,
    setError,
    fetchAllPolls,
    fetchPoll,
    createPoll,
    votePoll,
  };
};