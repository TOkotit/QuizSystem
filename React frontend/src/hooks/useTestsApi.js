import { useState, useCallback } from 'react';

// Базовый URL теперь включает префикс polls, так как мы решили не менять структуру
const API_BASE_URL = '/api/polls/tests/';

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
export const useTestsApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Создание теста
  const createTest = useCallback(async (testCreationData, testSettingsData) => {
    setLoading(true);
    setError(null);
    
    const csrfToken = getCsrfToken();
    
    // Формируем payload точно по структуре TestSerializer
    const payload = {
      title: testCreationData.title,
      completion_time: testSettingsData.completionTime || null,
      attempt_number: testSettingsData.attemptNumber || 1,
      end_date: testSettingsData.endDate ? `${testSettingsData.endDate}T${testSettingsData.endTime || '00:00'}` : null,
      tasks: testCreationData.tasks.map((t, index) => ({
        question: t.question,
        type: t.type,
        score: t.score,
        order: index,
        correct_text: t.correctText,
        options: t.options
          .filter(o => o.trim() !== '')
          .map((o, optIndex) => ({
            text: o,
            is_correct: t.type === 'single' 
                ? t.correctRadioOption === o // Сравнение по тексту варианта
                : t.correctBoxOptions.includes(o)
          }))
      }))
    };

    try {
      return await apiFetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
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
    const submitAttempt = useCallback(async (testId, completedTasks) => {
        setLoading(true);
        setError(null);

        const csrfToken = getCsrfToken();

      const normalizeOptionId = (opt, task) => {
    if (opt == null) return null;
    if (typeof opt === 'number') return opt;
    if (typeof opt === 'string') {
      const n = parseInt(opt, 10);
      if (!isNaN(n)) return n;
      // сравнение по тексту/label (чтобы подстраховать случаи, когда опции — строки)
      if (Array.isArray(task.options)) {
        const found = task.options.find(o =>
          (o && (String(o.id) === opt || String(o.text) === opt || String(o.choice_text) === opt))
        );
        return found ? found.id : null;
      }
      return null;
    }
    if (typeof opt === 'object') {
      if (opt.id) return opt.id;
      if (opt.value && typeof opt.value === 'number') return opt.value;
      if (typeof opt.text === 'string' && Array.isArray(task.options)) {
        const found = task.options.find(o => String(o.text) === String(opt.text) || String(o.id) === String(opt.id));
        return found ? found.id : null;
      }
    }
    return null;
  };

  // Формируем answers в точном формате, что ждёт DRF
  const answers = (completedTasks || []).map(t => {
    const taskId = t.id;
    let selected_options = [];

    if (t.type === 'single') {
      const sel = t.completedRadioOption;
      const id = normalizeOptionId(sel, t);
      if (id) selected_options = [id];
    } else if (t.type === 'multiple') {
      selected_options = (t.completedBoxOptions || [])
        .map(opt => normalizeOptionId(opt, t))
        .filter(id => id != null);
    }

    return {
      task: taskId,
      answer_text: t.type === 'text' ? (t.completedText || '') : null,
      selected_options: selected_options
    };
  });

  const payload = {
    test: testId,
    answers
  };

  // DEBUG: покажем полезный лог перед отправкой
  console.log('submitAttempt: payload ->', payload);

  try {
    return await apiFetch(`${API_BASE_URL}submit/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Передаём в состояние детализацию ошибки, если есть
    setError(err.data || err.message || String(err));
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  return { createTest, submitAttempt, loading, error };
};