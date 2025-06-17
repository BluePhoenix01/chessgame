import React from 'react';
import { useDialog } from '../hooks/useDialog';
import './ResignConfirm.css';

const ResignConfirm = ({  ws }) => {
  const { ref, open, close } = useDialog();

  const handleResign = () => {
    open();

    const dialog = ref.current;
    dialog.onclose = () => {
      if (dialog.returnValue === 'confirm') {
        ws.current.send(JSON.stringify({ type: "resign" }));
      }
    };
  };

  return (
    <>
      <button className="btn-resign" onClick={handleResign}>
        Resign
      </button>

      <dialog ref={ref} className="dialog">
        <form method="dialog" className="dialog-content">
          <h2>Are you sure?</h2>
          <p>This will end your current game.</p>
          <menu className="dialog-actions">
            <button className="btn-cancel" value="cancel">Cancel</button>
            <button className="btn-confirm" value="confirm">Yes, resign</button>
          </menu>
        </form>
      </dialog>
    </>
  );
};

export default ResignConfirm;