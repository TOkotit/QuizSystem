// hooks/usePollsApi.js
import { useState, useCallback } from 'react';

const API_BASE_URL = '/api/polls/'; // базовый путь к API

// Получение CSRF токена из cookie
const getCsrfToken = () => {
  const name = 'csrftoken=';
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (let c of cookies) {
    c = c.trim();
    if (c.startsWith(name)) return decodeURIComponent(c.substring(name.length));
  }
  return null;
};

// Запрос к эндпоинту бэка для установки CSRF cookie
const fetchCsrf = async () => {
  // Если бэкенд на другом origin, укажи полный URL: 'http://127.0.0.1:8000/api/csrf/'
  await fetch("/api/csrf/", { credentials: "include" });
};

// Универсальный fetch с обработкой ошибок
const apiFetch = async (url, opts = {}) => {
  const options = {
    credentials: 'include', // важно: отправляем куки вместе с запросом
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  };

  console.log("[apiFetch] URL:", url, "options:", options);
  const res = await fetch(url, options);
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

export const usePollsApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`${API_BASE_URL}list/`);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPoll = useCallback(async (pollId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`${API_BASE_URL}${pollId}/`);
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

    // Гарантируем, что csrftoken cookie установлен
    await fetchCsrf();
    const csrfToken = getCsrfToken();
    if (!csrfToken) throw new Error("CSRF token missing even after fetching it!");

    const choices = (pollData.options || [])
      .filter(o => o.trim() !== '')
      .map(text => ({ choice_text: text }));

    const payload = {
      title: pollData.title,
      choices,
      is_anonymous: pollSettings.isAnonymous,
      multiple_answers: pollSettings.multipleAnswers,
      end_date: pollSettings.endDate ? `${pollSettings.endDate}T${pollSettings.endTime || '23:59'}:00Z` : null,
    };

    console.log("[createPoll] payload:", payload);

    try {
      const data = await apiFetch(`${API_BASE_URL}create/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
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

  const votePoll = useCallback(async (pollId, choiceId) => {
    setLoading(true);
    setError(null);

    await fetchCsrf();
    const csrfToken = getCsrfToken();
    if (!csrfToken) throw new Error("CSRF token missing even after fetching it!");

    try {
      const data = await apiFetch(`${API_BASE_URL}${pollId}/vote/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ choice_id: choiceId }),
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
    loading,
    error,
    setError,
    fetchAllPolls,
    fetchPoll,
    createPoll,
    votePoll,
  };
};