import React, { useCallback, useEffect, useState } from 'react';
import { 
    ReactFlow, 
    ReactFlowProvider, 
    addEdge, 
    useNodesState, 
    useEdgesState,
    Background,
    BackgroundVariant,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ResizableNode from './ResizableNode.jsx';
import PollResizable from './PollResizable.jsx';
import TestRisizable from './TestRisizable.jsx';
import './App.css'; 

const nodeTypes = {
    resizable: ResizableNode,
    pollresizable: PollResizable,
    testresizable: TestRisizable,
};

const AppContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isFlowLoaded, setIsFlowLoaded] = useState(false);
    
    const fetchFromDB = useCallback(async (url) => {
        const res = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'true',
             }
        });
        if (!res.ok) throw new Error(`Ошибка загрузки: ${url}`);
        return res.json();
    }, []);

    const syncWithDatabase = useCallback(async () => {
        try {
            const [pollsData, testsData] = await Promise.all([
                fetchFromDB('https://polls-tests-widgets-backend-1357.loca.lt/api/polls/list/'),
                fetchFromDB('https://polls-tests-widgets-backend-1357.loca.lt/api/polls/tests/')
            ]);

            const newNodes = [];
            let currentX = 50;

            // 1. Создаем по ОДНОМУ пустому виджету для создания новых
            newNodes.push({
                id: 'new-poll-creator',
                type: 'pollresizable',
                position: { x: currentX, y: 50 },
                data: { label: 'Новый опрос', viewMode: 'creator' },
            });
            currentX += 450;

            newNodes.push({
                id: 'new-test-creator',
                type: 'testresizable',
                position: { x: currentX, y: 50 },
                data: { label: 'Новый тест', viewMode: 'creator' },
            });
            currentX += 900;

            // 2. Добавляем уже существующие опросы из БД
            if (Array.isArray(pollsData)) {
                pollsData.forEach((poll) => {
                    newNodes.push({
                        id: `poll-${poll.id}`,
                        type: 'pollresizable',
                        position: { x: currentX, y: 50 },
                        data: { 
                            label: poll.title, 
                            pollId: poll.id,
                            viewMode: 'display' // Указываем, что это готовый опрос
                        },
                    });
                    currentX += 450;
                });
            }

            // 3. Добавляем уже существующие тесты из БД
            if (Array.isArray(testsData)) {
                testsData.forEach((test) => {
                    newNodes.push({
                        id: `test-${test.id}`,
                        type: 'testresizable',
                        position: { x: currentX, y: 50 },
                        data: { 
                            label: test.title, 
                            pollId: test.id,
                            viewMode: 'display' // Указываем, что это готовый тест
                        },
                    });
                    currentX += 900;
                });
            }

            setNodes(newNodes);
            setIsFlowLoaded(true);
        } catch (err) {
            console.error("Ошибка синхронизации:", err);
            setIsFlowLoaded(true);
        }
    }, [fetchFromDB, setNodes]);

    useEffect(() => {
        syncWithDatabase();
    }, [syncWithDatabase]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    if (!isFlowLoaded) {
        return (
            <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Синхронизация...
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} bgColor="white" />
            </ReactFlow>
        </div>
    );
};

const App = () => {
    return (
        <ReactFlowProvider>
            <AppContent />
        </ReactFlowProvider>
    );
};

export default App;