import React, {ReactNode} from "react";
import {Id, toast, TypeOptions} from "react-toastify";
import {
  FaInfo,
  FaCheck,
  FaExclamationTriangle,
  FaBug,
  FaExclamationCircle
} from "react-icons/fa";
import {ToastOptions} from "react-toastify/dist/types";

export const displayIcon = (type: string) => {
  switch (type) {
    case "success":
      return <FaCheck />;
    case "info":
      return <FaInfo />;
    case "error":
      return <FaExclamationCircle />;
    case "warning":
      return <FaExclamationTriangle />;
    default:
      return <FaBug />;
  }
};


interface ToastMessageProps {
  type: TypeOptions;
  message: string;
}

const ToastMessage = ({ type, message }: ToastMessageProps, options?: ToastOptions): Id => {
  // @ts-ignore
  return toast[type](
    <div className="flex">
      <div className="flex-grow px-2 py-1 text-lg">
        {message}
      </div>
    </div>, options
  );
}

ToastMessage.dismiss = toast.dismiss;

export default ToastMessage;