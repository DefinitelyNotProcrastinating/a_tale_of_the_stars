import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

export default function Panel({ item, category, cost, onAdd }) {
  const [expanded, setExpanded] = useState(false);
  
  // 判断当前类别是否属于“需要消耗 RP 购买”的类型
  const isPurchasable =['items', 'ships', 'skills'].includes(category);

  return (
    <div className="bg-card border border-border rounded-lg p-4 relative flex flex-col transition-all hover:border-brand/50 shadow-lg">
      
      {/* 头部：标题与基础信息 (点击折叠/展开) */}
      <div 
        className="flex justify-between items-start cursor-pointer select-none" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 pr-4">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            {item.name}
            {expanded ? <ChevronUp size={16} className="text-brand" /> : <ChevronDown size={16} className="text-brand" />}
          </h3>
          
          {/* Tags 渲染 */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags?.map(tag => (
              <span key={tag} className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/30">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 右上角：RP 花费 或 品质显示 */}
        {isPurchasable ? (
          <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-bold border border-accent/30 whitespace-nowrap">
            {cost} RP
          </span>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {category === 'factions' ? '声望: ' + item.base_reputation : '基础设定'}
          </span>
        )}
      </div>

      {/* 折叠内容区 */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-border text-xs text-gray-300 space-y-3 leading-relaxed animate-in fade-in duration-200">
          
          {item.quality && (
            <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded">
              <p><strong className="text-white">品质:</strong> <span className="text-brand">{item.quality}</span> (T{item.tier})</p>
              {item.dependent_stats && <p><strong className="text-white">依赖属性:</strong> {item.dependent_stats}</p>}
            </div>
          )}

          {/* 针对飞船的特殊防御面板 */}
          {item.defenses && (
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-2 rounded text-center">
              <div><span className="block text-brand">护盾</span>{item.defenses.shield.max}</div>
              <div><span className="block text-gray-400">装甲</span>{item.defenses.armor.max}</div>
              <div><span className="block text-accent">结构</span>{item.defenses.hull.max}</div>
            </div>
          )}

          {item.effects && (
            <div>
              <strong className="text-white block mb-1">功能 / 效果:</strong>
              <p className="whitespace-pre-line text-brand/90">{item.effects}</p>
            </div>
          )}

          {item.description && (
            <div><strong className="text-white block mb-1">背景描述:</strong><p>{item.description}</p></div>
          )}
          
          {item.details && (
            <div><strong className="text-white block mb-1">外观 / 视觉细节:</strong><p className="text-gray-400">{item.details}</p></div>
          )}

          {/* 购买按钮 */}
          {isPurchasable && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAdd(item, category, cost); }} 
              className="mt-2 w-full flex items-center justify-center gap-2 bg-brand/10 hover:bg-brand hover:text-black text-brand py-2 rounded transition-colors font-bold text-xs border border-brand"
            >
              <PlusCircle size={14} /> 确认选择 / 消耗点数
            </button>
          )}
        </div>
      )}
    </div>
  );
}