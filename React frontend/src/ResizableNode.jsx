import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { Resizable } from 're-resizable';
import { usePollsApi } from './hooks/usePollsApi'; 
import PollWidget from './components/PollWidget'; 

// Стили для самого компонента Resizable
const resizeStyle = {
  display: 'flex',
  flexDirection: 'column',
  background: 'transparent', 
  pointerEvents: 'all',
  position: 'relative', // Важно для абсолютного позиционирования детей
};

const ResizableNode = ({ id, data, selected }) => {
  const [size, setSize] = useState({ width: 280, height: 450 });
  
  // Инициализация API
  const { isAuthReady, error } = usePollsApi(); 
  const updateNodeInternals = useUpdateNodeInternals();
  const { setNodes } = useReactFlow(); 

  const onResizeStop = useCallback((e, direction, ref, d) => {
      const width = ref.offsetWidth;
      const height = ref.offsetHeight;

      setSize({ width, height }); 
      updateNodeInternals(id);

      // if (d.x !== 0 || d.y !== 0) {
      //     setNodes((nds) => 
      //         nds.map((node) => {
      //             if (node.id === id) {
      //                 return {
      //                     ...node,
      //                     position: { x: node.position.x + d.x, y: node.position.y + d.y }, 
      //                 };
      //             }
      //             return node;
      //         })
      //     );
      // }
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
      minWidth={200}
      minHeight={150} 
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
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' 
        }}
      > 

        {/* Основной виджет опроса */}
        {isAuthReady && <PollWidget initialTitle={data.label} />}

      </div>
      <Handle type="source" position={Position.Left} />
      <Handle type="target" position={Position.Top} />
    </Resizable>
  );
};

export default ResizableNode;