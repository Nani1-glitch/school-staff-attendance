import { X } from 'lucide-react';

export default function NotesModal({ teacher, notes, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl w-full max-w-md animate-scale-in border border-blue-100 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 border-b border-blue-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-white">
            Notes - {teacher.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-300 transform hover:scale-110"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-base leading-relaxed">
            {notes || 'No notes available'}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-blue-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
