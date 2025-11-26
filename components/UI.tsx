import React from 'react';
import { X } from 'lucide-react';

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "custom";
}

export const Button = ({ children, variant = "primary", className = "", ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger: "bg-rose-500 hover:bg-rose-600 text-white",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    custom: ""
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, className = "", ...props }: InputProps) => (
  <div className="flex flex-col gap-1 mb-3 w-full">
    {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
    <input
      className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${className}`}
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = ({ label, children, className = "", ...props }: SelectProps) => (
  <div className="flex flex-col gap-1 mb-3 w-full">
    {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
    <select
      className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
