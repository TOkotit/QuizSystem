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
import ResizableNode from './ResizableNode.jsx';
import PollResizable from './PollResizable.jsx';
import TestRisizable from './TestRisizable.jsx'; // Импортируем ваш кастомный узел
import './App.css'; 
import { usePollsApi } from './hooks/usePollsApi';
const flowKey = 'app-flow-storage';

// 1. Определяем начальные данные (пока для примера)
const initialNodes = [
  { 
      id: 'init-1', 
      type: 'testesizable', 
      position: { x: 250, y: 5 }, 
      data: { label: 'Стартовый узел' }, 
  },
  { 
      id: 'init-2', 
      type: 'pollresizable',
      position: { x: 600, y: 5 }, 
      data: { label: 'Новый опрос' }, 
  },
];

const initialEdges = [{ id: 'e1-2', source: 'init-1', target: 'init-2' }];

// 2. Определяем карту кастомных узлов
const nodeTypes = {
  resizableNode: ResizableNode,
  testesizable: TestRisizable,
  pollresizable: PollResizable,
};

// ----------------------------------------------------
// КОМПОНЕНТ FLOW С ЛОГИКОЙ ПЕРСИСТЕНЦИИ
// ----------------------------------------------------

function Flow() {
    const instance = useReactFlow(); 
    const { fetchAllPolls } = usePollsApi(); 
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isFlowLoaded, setIsFlowLoaded] = useState(false);

    // ЭФФЕКТ 1: Умная загрузка (LocalStorage + БД)
    useEffect(() => {
        let isMounted = true;

        const initializeFlow = async () => {
            // 1. Сначала читаем LocalStorage (чтобы восстановить позиции)
            const flow = localStorage.getItem(flowKey);
            let nodesFromLS = initialNodes;
            let currentEdges = initialEdges;
            let savedViewport = null;

            if (flow) {
                try {
                    const parsedFlow = JSON.parse(flow);
                    // Берем все узлы, которые были сохранены в LS
                    if (parsedFlow.nodes) nodesFromLS = parsedFlow.nodes;
                    if (parsedFlow.edges) currentEdges = parsedFlow.edges;
                    if (parsedFlow.viewport) savedViewport = parsedFlow.viewport;
                } catch (e) {
                    console.error("Ошибка парсинга LocalStorage", e);
                }
            }

            // Создаем карту узлов из LS для быстрого доступа к позициям
            const positionMap = new Map(nodesFromLS.map(n => [n.id, n]));
            let currentNodes = []; // Финальный список узлов

            // 2. ВСЕГДА ДОБАВЛЯЕМ СТАТИЧЕСКИЕ УЗЛЫ (init-1, init-2)
            // Используем сохраненные позиции, если они есть в positionMap
            initialNodes.forEach(initNode => {
                if (positionMap.has(initNode.id)) {
                    // Берем узел из LS, чтобы сохранить позицию и данные (если были изменены)
                    currentNodes.push(positionMap.get(initNode.id));
                    positionMap.delete(initNode.id); 
                } else {
                    // Если узел был удален, добавляем его снова с дефолтной позицией
                    currentNodes.push(initNode);
                }
            });

            // 3. Всегда запрашиваем свежие данные из БД
            try {
                const dbPolls = await fetchAllPolls();
                
                if (isMounted && dbPolls && Array.isArray(dbPolls)) {
                    
                    dbPolls.forEach((poll, index) => {
                        const nodeId = `db-poll-${poll.id}`;
                        let dbNode;

                        // Ищем узел, который уже связан с этим pollId (по его уникальному ID 'db-poll-{id}')
                        if (positionMap.has(nodeId)) {
                            // Узел уже существует в LS, сохраняем его позицию и обновляем данные
                            dbNode = positionMap.get(nodeId);
                            dbNode = {
                                ...dbNode,
                                data: {
                                    ...dbNode.data,
                                    label: poll.title,
                                    pollId: poll.id 
                                }
                            };
                            positionMap.delete(nodeId); // Удаляем из map
                        } else {
                            // Узел новый, создаем его
                            dbNode = {
                                id: nodeId,
                                type: 'pollresizable',
                                position: { x: 100 + (index % 5) * 200, y: 400 + Math.floor(index / 5) * 200 }, // Более удобное размещение
                                data: { 
                                    label: poll.title,
                                    pollId: poll.id 
                                },
                            };
                        }
                        currentNodes.push(dbNode);
                    });
                }
            } catch (e) {
                console.error("Не удалось синхронизировать с БД:", e);
            }

            // 4. Добавляем остальные узлы из LS, которые не были ни статическими, ни узлами из БД 
            // (например, узлы, созданные пользователем, но не сохраненные)
            currentNodes = [...currentNodes, ...Array.from(positionMap.values())];


            // 5. Устанавливаем итоговое состояние
            if (isMounted) {
                setNodes(currentNodes);
                setEdges(currentEdges);
                if (savedViewport) {
                    instance.setViewport(savedViewport);
                }
                setIsFlowLoaded(true);
            }
        };

        initializeFlow();

        return () => { isMounted = false; };
    }, [instance, fetchAllPolls, setNodes, setEdges]); 

    // ЭФФЕКТ 2: Сохранение (в localStorage)
    const saveFlow = useCallback(() => {
        if (instance.toObject && isFlowLoaded) { 
            localStorage.setItem(flowKey, JSON.stringify(instance.toObject()));
        }
    }, [instance, isFlowLoaded]);

    useEffect(() => {
        if (isFlowLoaded) saveFlow();
    }, [nodes, edges, isFlowLoaded, saveFlow]); 

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    if (!isFlowLoaded) return <div style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Загрузка...</div>;

    return (
        <div style={{ width: '100vw', height: '100vh'}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} bgColor='white'/>
            </ReactFlow>
        </div>
    );
}


// 3. Создаем главный компонент приложения
function App() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}

// 4. Обязательный default экспорт!
export default App;