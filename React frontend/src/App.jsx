import React, { useCallback } from 'react';
import { 
    ReactFlow, 
    ReactFlowProvider, 
    addEdge, 
    useNodesState, 
    useEdgesState,
    Background,
    BackgroundVariant
} from '@xyflow/react';
import ResizableNode from './ResizableNode.jsx'; // Импортируем ваш кастомный узел
import './App.css'; 

// 1. Определяем начальные данные (пока для примера)
const initialNodes = [
  { 
      id: '1', 
      type: 'resizableNode', // Используйте тип вашего кастомного узла
      position: { x: 250, y: 5 }, 
      data: { label: 'Начальный узел' }, 
  },
  { 
      id: '2', 
      type: 'resizableNode',
      position: { x: 800, y: 5 }, 
      data: { label: 'Начальный узел2' }, 
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// 2. Определяем карту кастомных узлов
const nodeTypes = {
  resizableNode: ResizableNode,
};

// 3. Создаем главный компонент приложения
function App() {
    // Используем хуки для управления состоянием узлов и ребер
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Функция для создания соединения (ребра)
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        // ReactFlowProvider необходим, если вы используете хуки (например, useReactFlow) внутри потомков
        <ReactFlowProvider>
            <div style={{ width: '100vw', height: '100vh'}}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes} // Передаем кастомные узлы
                >
                    {/* Здесь могут быть MiniMap, Controls и т.д. */}
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} bgColor='white'/>
                </ReactFlow>
            </div>
        </ReactFlowProvider>
    );
}

// 4. Обязательный default экспорт!
export default App;