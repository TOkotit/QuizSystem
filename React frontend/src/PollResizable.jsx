import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { Resizable } from 're-resizable';
import { usePollsApi } from './hooks/usePollsApi'; 
import PollWidget from './components/Poll/PollWidget'; 
import TestWidget from './components/Test/TestWidget';

// Стили для самого компонента Resizable
const resizeStyle = {
  display: 'flex',
  flexDirection: 'column',
  background: 'transparent', 
  pointerEvents: 'all',
  position: 'relative', // Важно для абсолютного позиционирования детей
};

const PollResizable = (props) => {
  const { id, data, selected, xPos, yPos, dragging } = props;
  const [size, setSize] = useState({ width: 280, height: 450 });
  
  // Инициализация API
  const updateNodeInternals = useUpdateNodeInternals();
  const { setNodes } = useReactFlow(); 

  const onResizeStop = useCallback((e, direction, ref, d) => {
      const width = ref.offsetWidth;
      const height = ref.offsetHeight;

      setSize({ width, height }); 
      updateNodeInternals(id);
  }, []);

  const onResize = useCallback(() => {}, []);

  const handleClasses = {
    bottom: 'nodrag', right: 'nodrag', bottomRight: 'nodrag',
  };

  // Стили для ручек
  const handleStyles = {
    bottom: { height: 10, bottom: -5, cursor: 'ns-resize', zIndex: 999 },
    right: { width: 10, right: -5, cursor: 'ew-resize', zIndex: 999 },
    bottomRight: { width: 20, height: 20, right: -5, bottom: -5, cursor: 'nwse-resize', zIndex: 1000 },
  };

  return (
    <Resizable
      size={size}
      minWidth={800}
      minHeight={750} 
      style={resizeStyle}
      onResize={onResize}
      handleClasses={handleClasses}
      handleStyles={handleStyles} 
      onResizeStop={onResizeStop}
      enable={{ 
          top: false, 
          right: true, 
          bottom: true, 
          left: false, 
          topRight: false, 
          bottomRight: true, 
          bottomLeft: false, 
          topLeft: false 
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {/* Используем абсолютное позиционирование для контента */}
      <div 
        style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden', 
            outline: selected ? '2px solid #007bff' : 'none',
            borderRadius: '2px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            
        }}
      > 

        {/* Основной виджет опроса */}
        {<PollWidget
            initialTitle={data.label}
            pollId={data?.pollId}    // если node уже привязан к опросу
            nodeId={id}             // id узла в React Flow
            onSaved={(pollId) => {
                setNodes((nds) =>
                    nds.map((node) => {
                        if (node.id === id) {
                            return {
                                ...node,
                                data: { ...node.data, pollId: pollId },
                            };
                        }
                        return node;
                    })
                );
            }}
        />}

      </div>
      <Handle type="source" position={Position.Left} />
      <Handle type="target" position={Position.Top} />
    </Resizable>
  );
};

export default PollResizable;