import React, { Suspense, useState } from 'react';

// Lazy load the federated CustomModal component
const CustomModal = React.lazy(() => import('uivisual/CustomModal'));

/**
 * Example component showing how to use the federated CustomModal
 * from FLow-Project-UIVisual
 */
function FederatedModalExample() {
  const [open, setOpen] = useState(false);
  const [modalSize, setModalSize] = useState('medium');

  const handleOpen = (size = 'medium') => {
    setModalSize(size);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Federated Modal Example</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleOpen('small')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Small Modal
        </button>
        <button
          onClick={() => handleOpen('medium')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Medium Modal
        </button>
        <button
          onClick={() => handleOpen('large')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Large Modal
        </button>
      </div>

      {/* Federated CustomModal with Suspense boundary */}
      <Suspense fallback={<div className="text-center p-4">Loading Modal...</div>}>
        <CustomModal
          id="federated-example-modal"
          title="Federated Custom Modal"
          open={open}
          onHide={handleClose}
          size={modalSize}
          downloadConfig={{
            isVisible: true,
            path: '#',
            toolTipMsg: 'Download this modal content',
            fileName: 'modal-content.png',
          }}
          modalActions={
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">Modal Content</h3>
            <p className="mb-4">
              This is a federated modal component loaded from FLow-Project-UIVisual
              using Module Federation.
            </p>
            <p>
              The modal is draggable, resizable, and includes features like:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Drag to move</li>
              <li>Resize handles</li>
              <li>Screenshot capability</li>
              <li>Download functionality</li>
            </ul>
          </div>
        </CustomModal>
      </Suspense>
    </div>
  );
}

export default FederatedModalExample;


