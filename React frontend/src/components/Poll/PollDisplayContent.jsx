import React, { useState, useCallback } from 'react';
import { ActionButton, CheckboxSquare, RadioButton } from '../Atoms';
import { usePollsApi } from '../../hooks/usePollsApi';

export const PollDisplayContent = ({ pollData, setPollData }) => {
    // Получаем данные напрямую из структуры Django Serializer
    const { 
        id: pollId, 
        title, 
        choices, // Массив объектов {id, choice_text, votes_count}
        all_votes = [],
        is_anonymous, 
        multiple_answers, 
        end_date,
        total_votes // Общее кол-во голосов (приходит с бэкенда)
    } = pollData;

    // --- API: ПОДКЛЮЧЕНИЕ ХУКА ---
    const { votePoll, loading, error, setError, fetchPoll } = usePollsApi();

    // Достаем то самое имя пользователя, которое "другой человек" сохранил в localStorage
    const currentUserId = localStorage.getItem('userId') || 'Anonymous';
    const anonymityStatus = is_anonymous ? 'Анонимно' : 'Неанонимно';
    const displayEndDate = end_date ? `До ${end_date.split('T')[0]}` : 'Нет даты';

    // Подсчет процентов на основе данных с бэкенда
    const getPercentage = (votes) => {
        if (!total_votes || total_votes === 0) return "0%";
        return `${Math.round((votes / total_votes) * 100)}%`;
    };
    
    const [isSaved, setIsSaved] = useState(false);
    const [selectedOption, setSelectedOption] = useState();
    const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
    const [UsersVote, setUsersVote] = useState(all_votes.find(v => v.user === String(currentUserId)));

    const handleRadioChange = (choiceId) => {
        setSelectedOption(choiceId);
    };

    const handleCheckboxChange = (choiceIdStr) => {
        setSelectedCheckboxes((prev) => {
            if (prev.includes(choiceIdStr)) return prev.filter((i) => i !== choiceIdStr);
            return [...prev, choiceIdStr];
        });
    };

const handleVote = async () => {
    // Если ничего не выбрано - выходим
    if (!selectedOption || (Array.isArray(selectedOption) && selectedOption.length === 0)) return;

   

    try {
        const success = await votePoll(pollId,
            {choiceId: selectedOption,
            userId: currentUserId
            }
            );

        if (success) {
            setIsSaved(true);
            // Обновляем данные опроса, чтобы сразу увидеть результаты
            if (fetchPoll) fetchPoll(pollId).then(data => setPollData(data));
        }
    } catch (err) {
        console.error("Ошибка при голосовании:", err);
        setError("Не удалось сохранить голос");
    }
};

    const isVoteDisabled = isSaved || loading || (!multiple_answers && !selectedOption) || (multiple_answers && selectedCheckboxes.length === 0);

    return (
        <div className="nodrag" style={{ display: 'flex', color: '#000', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto', paddingRight: '5px' }} onWheel={(e) => e.stopPropagation()}>
            <div style={{ flexShrink: 0, width: '100%' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: '12px 16px', borderRadius: "10px" }}>
                    {title}
                </h3>
            </div>
            
            <div>{UsersVote?.user} - {String(UsersVote?.choice_id)}</div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                {anonymityStatus} | {displayEndDate} | Голосов: {total_votes || 0}
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}

            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                {choices?.map((choice) => {
                    const choiceId = String(choice.id);
                    const isChecked = multiple_answers ? selectedCheckboxes.includes(choiceId) : selectedOption === choiceId;
                    const percent = getPercentage(choice.votes_count);

                    return (
                        <div key={choiceId} onClick={() => !isSaved && (multiple_answers ? handleCheckboxChange(choiceId) : handleRadioChange(choiceId))} 
                        style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: isSaved ? 'default' : 'pointer', gap:"10px" }}>
                            {!isSaved && multiple_answers && <CheckboxSquare checked={isChecked} onChange={() => handleCheckboxChange(choice.id)} />}
                            {!isSaved && !multiple_answers && <RadioButton name={`poll-${pollId}`} checked={isChecked} onChange={() => handleRadioChange(choice.id)}/>}

                            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', backgroundColor: isChecked ? '#d0d0d0' : '#e0e0e0', padding: '12px 16px', borderRadius: "10px", position: 'relative', overflow: 'hidden' }}>
                                {/* Прогресс бар (виден после голосования) */}
                                {isSaved && <div style={{ position: 'absolute', top:0, left:0, height:'100%', width: percent, backgroundColor: 'rgba(0,123,255,0.2)', transition: 'width 0.5s' }}></div>}
                                
                                <span style={{zIndex: 1}}>{choice.choice_text}</span>
                                <span style={{ fontWeight: 'bold', zIndex: 1 }}>{isSaved ? `${percent} (${choice.votes_count})` : ''}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <ActionButton 
                    onClick={handleVote} 
                    disabled={isVoteDisabled} // <-- ИЗМЕНЕНО: Используем переменную для логики отключения
                    style={{ width: '100%', backgroundColor: isSaved ? '#5cb85c' : '#d9d9d9', borderRadius: "10px" }}
                >
                    {loading ? 'Отправка...' : (isSaved ? 'Голос принят' : 'Сохранить')}
                </ActionButton>
            </div>
        </div>
    );
};