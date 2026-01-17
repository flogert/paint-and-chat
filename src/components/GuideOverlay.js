export default function GuideOverlay({ title, content, onClose }) {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-amber-100 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-stone-100 transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 mb-4 pr-8">
          {title}
        </h2>
        
        <div className="space-y-4 text-stone-600 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
          {content}
        </div>
        
        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transform active:scale-95 transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
