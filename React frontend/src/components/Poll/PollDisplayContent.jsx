import React, { useState, useCallback, useEffect } from 'react';
import { ActionButton, CheckboxSquare, RadioButton } from '../Atoms';
import { usePollsApi } from '../../hooks/usePollsApi';

export const PollDisplayContent = ({ pollData, setPollData }) => {
    // Получаем данные напрямую из структуры Django Serializer
    const { 
        id: pollId, 
        title, 
        choices, // Массив объектов {id, choice_text, votes_count}
        all_votes = [],
        voted_users = [],
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
        if (!voted_users || voted_users.length === 0) return "0%";
        return `${Math.round((votes / voted_users.length) * 100)}%`;
    };
    
    const [isSaved, setIsSaved] = useState(all_votes.some(v => v.user === String(currentUserId)));
    const [selectedOption, setSelectedOption] = useState();
    const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
    const [UsersVote, setUsersVote] = useState(all_votes.find(v => v.user === String(currentUserId)));


    const [optionDetailsMode, setOptionDetailsMode] = useState(false);
    const [activeOptionDetails, setActiveOptionDetails] = useState(0);

    const  [isVoteDisabled, setIsVoteDisabled] = useState(isSaved || loading 
        || (!multiple_answers && !selectedOption) || (multiple_answers && selectedCheckboxes.length === 0)); 

    useEffect(() => {
        setIsVoteDisabled(isSaved || loading 
        || (!multiple_answers && !selectedOption) || (multiple_answers && selectedCheckboxes.length === 0))
    }, [isSaved, loading, multiple_answers, selectedOption, selectedCheckboxes]);

    const handleRadioChange = (choiceId) => {
        setSelectedOption(choiceId);
    };

    const handleCheckboxChange = (choiceIdStr) => {
        setSelectedCheckboxes((prev) => {
            if (prev.includes(choiceIdStr)) return prev.filter((i) => i !== choiceIdStr);
            return [...prev, choiceIdStr];
        });
    };

    const handleOpenOptionDetailsMode = (choice) => {
        setOptionDetailsMode(true);
        setActiveOptionDetails(choice);
    }
    const handleCloseOptionDetailsMode = () => {
        setOptionDetailsMode(false);

    }

const handleVote = async () => {
    // Если ничего не выбрано - выходим
    if ((!multiple_answers && !selectedOption) || (multiple_answers && selectedCheckboxes.length === 0)) return;

   
    try {
        let success = true;
        if (multiple_answers) {
            // 1. Создаем массив промисов (запросов)
            const votePromises = selectedCheckboxes.map(checkbox => 
                votePoll(pollId, {
                    choiceId: checkbox,
                    userId: currentUserId
                })
            );

            // 2. Ждем, пока ВСЕ запросы выполнятся
            try {
                await Promise.all(votePromises);
                success = true;
            } catch (e) {
                console.error("Один из голосов не прошел", e);
                success = false;
            }
        }
        else{
            success = await votePoll(pollId,
            {choiceId: selectedOption,
            userId: currentUserId
            });
        }

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

    return (
        <div className="nodrag" style={{ display: 'flex', color: '#000', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto', paddingRight: '5px' }} onWheel={(e) => e.stopPropagation()}>
            <div style={{ flexShrink: 0, width: '100%' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: '12px 16px', borderRadius: "10px" }}>
                    {title}
                </h3>
            </div>
            
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                {anonymityStatus} | {displayEndDate} | Голосов: {voted_users.length || 0}
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}

            {optionDetailsMode && (<div style={{ display: 'flex', color: '#000', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto'}}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#e0e0e0', padding: '12px 16px', borderRadius: "10px", position: 'relative', overflow: 'hidden' }}>
                    {<div style={{ position: 'absolute', top:0, left:0, height:'100%', width: getPercentage(activeOptionDetails?.votes_count), backgroundColor: 'rgba(0,123,255,0.2)', transition: 'width 0.5s' }}></div>}
                    
                    <span style={{zIndex: 1}}>{activeOptionDetails?.choice_text}</span>
                    <span style={{ fontWeight: 'bold', zIndex: 1 }}>{`${getPercentage(activeOptionDetails?.votes_count)} (${activeOptionDetails?.votes_count})`}</span>
                </div>
                <div  style={{overflowY: 'auto', marginTop: '15px' }}>

                {all_votes?.filter(v => v.choice_id === activeOptionDetails?.id)?.map((vote, i) => 
                        <div key={i}
                        style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap:"10px" }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', backgroundColor: '#e0e0e0', padding: '12px 16px', borderRadius: "10px", position: 'relative' }}>
                                <span style={{}}>{vote.user}</span>
                            </div>
                        </div>
                )}
                </div>
                
                <ActionButton onClick={handleCloseOptionDetailsMode}>
                    Назад
                </ActionButton>
            </div>)}

            {!optionDetailsMode && (<div style={{ display: 'flex', color: '#000', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto'}}>
                {isSaved ? (<div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {choices?.map((choice) => {
                        const choiceId = choice.id;
                        const isChecked = multiple_answers ? selectedCheckboxes.includes(choiceId) : selectedOption === choiceId;
                        const percent = getPercentage(choice.votes_count);

                        return (
                            <div key={choice.id} onClick={() => {handleOpenOptionDetailsMode(choice)}} 
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', gap:"10px" }}>

                                <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', backgroundColor: isChecked ? '#d0d0d0' : '#e0e0e0', padding: '12px 16px', borderRadius: "10px", position: 'relative', overflow: 'hidden' }}>
                                    {<div style={{ position: 'absolute', top:0, left:0, height:'100%', width: percent, backgroundColor: 'rgba(0,123,255,0.2)', transition: 'width 0.5s' }}></div>}
                                    
                                    <span style={{zIndex: 1}}>{choice.choice_text}</span>
                                    <span style={{ fontWeight: 'bold', zIndex: 1 }}>{`${percent} (${choice.votes_count})`}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>) : (<div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {choices?.map((choice) => {
                        const choiceId = choice.id;
                        const isChecked = multiple_answers ? selectedCheckboxes.includes(choiceId) : selectedOption === choiceId;

                        return (
                            <div key={choice.id} onClick={() => (multiple_answers ? handleCheckboxChange(choiceId) : handleRadioChange(choiceId))} 
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', gap:"10px" }}>
                                {multiple_answers && <CheckboxSquare checked={isChecked} onChange={() => handleCheckboxChange(choiceId)} />}
                                {!multiple_answers && <RadioButton name={`poll-${pollId}`} checked={isChecked} onChange={() => handleRadioChange(choiceId)}/>}

                                <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', backgroundColor: isChecked ? '#d0d0d0' : '#e0e0e0', padding: '12px 16px', borderRadius: "10px", position: 'relative', overflow: 'hidden' }}>

                                    <span style={{zIndex: 1}}>{choice.choice_text}</span>
                                    <span style={{ fontWeight: 'bold', zIndex: 1 }}>{''}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>)}

                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <ActionButton 
                        onClick={handleVote} 
                        disabled={isVoteDisabled}
                        style={{ width: '100%', backgroundColor: isSaved ? '#10c24cff' : '#d9d9d9', borderRadius: "10px" }}
                    >
                        {loading ? 'Отправка...' : (isSaved ? 'Голос принят' : 'Сохранить')}
                    </ActionButton>
                </div>
            </div>)}
            
        </div>
    );
};