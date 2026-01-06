import React from 'react';
import { NodeResizer } from '@xyflow/react';

const TemplateGroupNode = ({ selected, data }) => {
  return (
    <>
      <NodeResizer 
        color="#009FDF" 
        isVisible={selected} 
        minWidth={100} 
        minHeight={100} 
      />
      {/* Using w-full and h-full ensures the visual box 
          follows the dimensions set in the node's style object 
      */}
      <div className="w-full h-full border-2 border-dashed border-[#009FDF] bg-blue-50/5 rounded-lg relative pointer-events-none">
        <div className="absolute -top-7 left-0 bg-[#009FDF] text-white text-[10px] px-2 py-1 rounded uppercase font-bold pointer-events-auto">
          {data.label || 'Template Group'}
        </div>
      </div>
    </>
  );
};

// Export the component as default
export default TemplateGroupNode;