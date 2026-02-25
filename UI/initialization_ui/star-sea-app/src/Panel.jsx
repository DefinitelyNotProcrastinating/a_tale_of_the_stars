import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

export default function Panel({ item, category, cost, onAdd }) {
  const [expanded, setExpanded] = useState(false);
  const isPurchasable = ['items', 'ships', 'skills'].includes(category);

  return (
    <div className="bg-card border border-border rounded-lg p-4 relative flex flex-col transition-all hover:border-brand/50 shadow-lg">
      <div 
        className="flex justify-between items-start cursor-pointer select-none" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 pr-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            {item.name}
            {expanded ? <ChevronUp size={16} className="text-brand" /> : <ChevronDown size={16} className="text-brand" />}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(item.tags ||[]).map(tag => (
              <span key={tag} className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/30">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {isPurchasable ? (
          <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-bold border border-accent/30 whitespace-nowrap">
            {cost} RP
          </span>
        ) : (
          <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
            {category === 'factions' ? `声望: ${item.base_reputation ?? 0}` : '设定'}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-border text-xs text-slate-300 space-y-3 animate-in fade-in duration-200">
          
          {item.quality && (
            <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded">
              <p><strong className="text-white">品质:</strong> <span className="text-brand">{item.quality}</span> (T{item.tier})</p>
              {item.dependent_stats && <p><strong className="text-white">依赖属性:</strong> {item.dependent_stats}</p>}
            </div>
          )}

          {item.defenses && (
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-2 rounded text-center">
              <div><span className="block text-brand mb-1">护盾</span>{item.defenses.shield.max}</div>
              <div><span className="block text-slate-400 mb-1">装甲</span>{item.defenses.armor.max}</div>
              <div><span className="block text-accent mb-1">结构</span>{item.defenses.hull.max}</div>
            </div>
          )}

          {item.effects && (
            <div>
              <strong className="text-white block mb-1">机制 / 效果:</strong>
              <p className="whitespace-pre-line text-brand/90">{item.effects}</p>
            </div>
          )}

          {item.description && (
            <div><strong className="text-white block mb-1">背景描述:</strong><p>{item.description}</p></div>
          )}
          
          {item.details && (
            <div><strong className="text-white block mb-1">外观 / 视觉细节:</strong><p className="text-slate-400">{item.details}</p></div>
          )}

          {isPurchasable && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAdd(item, category, cost); }} 
              className="mt-2 w-full flex items-center justify-center gap-2 bg-brand/10 hover:bg-brand hover:text-black text-brand py-2 rounded transition-colors font-bold text-xs border border-brand"
            >
              <PlusCircle size={14} /> 确认选择 / 消耗点数
            </button>
          )}
          
          {!isPurchasable && (
             <button 
             onClick={(e) => { e.stopPropagation(); onAdd(item, category, 0); }} 
             className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded transition-colors font-bold text-xs border border-slate-600"
           >
             <PlusCircle size={14} /> 确立命运 / 录入档案
           </button>
          )}
        </div>
      )}
    </div>
  );
}