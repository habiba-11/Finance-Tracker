import { useEffect, useState } from 'react';
import { ToastContainer as ReactToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import notificationService from '../services/notification';

export default function ToastContainer() {
  useEffect(() => {
    // Subscribe to notification service
    const unsubscribe = notificationService.subscribe((type, message) => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'info':
          toast.info(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast(message);
      }
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return (
    <ReactToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
}


