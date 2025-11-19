import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, BarChart3, Flame, AlertTriangle } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
      <div className="flex justify-around max-w-2xl mx-auto">
        <button onClick={() => navigate('/daily')} className="flex flex-col items-center gap-1 text-orange-500">
          <Target className="w-6 h-6" />
          <span className="text-xs">Daily</span>
        </button>
        <button onClick={() => navigate('/insights')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-500">
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs">Insights</span>
        </button>
        <button onClick={() => navigate('/streak')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-500">
          <Flame className="w-6 h-6" />
          <span className="text-xs">Streak</span>
        </button>
        <button onClick={() => navigate('/quit')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-xs">Quit</span>
        </button>
      </div>
    </div>
  )
}