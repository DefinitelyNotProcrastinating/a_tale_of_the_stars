import React, { useState, useMemo } from 'react';
import { Search, Filter, Info, Plus } from 'lucide-react';

// 品质颜色映射 (边框与文字)
const TIER_CONFIG = {
  1: { color: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-500/10' },
  2: { color: 'text-green-400', border: 'border-green-600', bg: 'bg-green-500/10' },
  3: { color: 'text-blue-400', border: 'border-blue-600', bg: 'bg-blue-500/10' },
  4: { color: 'text-purple-400', border: 'border-purple-600', bg: 'bg-purple-500/10' },
  5: { color: 'text-orange-400', border: 'border-orange-600', bg: 'bg-orange-500/10' },
  6: { color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-500/10' },
  7: { color: 'text-yellow-300', border: 'border-yellow-400', bg: 'bg-yellow-500/10' },
};

export default function MarketPanel({ data, type, onBuy, costTable }) {
  // === 本地筛选状态 ===
  const [search, setSearch] = useState('');
  const [selectedTiers, setSelectedTiers] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [selectedTag, setSelectedTag] = useState('All');

  // 安全检查：防止数据未加载时崩溃
  const items = data?.data || [];

  // 1. 提取所有 Tag 用于顶部筛选条
  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [items]);

  // 2. 核心过滤逻辑
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 搜索匹配 (名称 or 详情 or 效果)
      const matchSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        (item.details && item.details.toLowerCase().includes(search.toLowerCase())) ||
        (item.effects && item.effects.toLowerCase().includes(search.toLowerCase()));

      // 阶级匹配
      const matchTier = selectedTiers.includes(item.tier);

      // 标签匹配
      const matchTag = selectedTag === 'All' || item.tags.includes(selectedTag);

      return matchSearch && matchTier && matchTag;
    });
  }, [items, search, selectedTiers, selectedTag]);

  // 处理 Tier Checkbox 变化
  const toggleTier = (tier) => {
    if (selectedTiers.includes(tier)) {
      setSelectedTiers(prev => prev.filter(t => t !== tier));
    } else {
      setSelectedTiers(prev => [...prev, tier]);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      
      {/* === 顶部控制栏 (Sticky) === */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-[#0d121d]/95 backdrop-blur py-2 border-b border-slate-800">
        
        {/* 第一行：搜索与过滤器 */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          
          {/* 搜索框 */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={`搜索 ${type === 'ship' ? '舰船' : type === 'skill' ? '技能' : '物资'}...`}
              className="w-full bg-[#121826] border border-slate-700 rounded pl-9 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Tier 选择器 */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide mask-linear px-1">
            <Filter size={14} className="text-slate-500 mr-2 shrink-0" />
            {[1, 2, 3, 4, 5, 6, 7].map(tier => (
              <button
                key={tier}
                onClick={() => toggleTier(tier)}
                className={`
                  px-2 py-1 text-xs font-mono font-bold rounded border transition-all shrink-0
                  ${selectedTiers.includes(tier) 
                    ? `${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].border} ${TIER_CONFIG[tier].color}` 
                    : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}
                `}
              >
                T{tier}
              </button>
            ))}
          </div>
        </div>

        {/* 第二行：Tag 横向滚动条 */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`
                  whitespace-nowrap px-3 py-1 rounded-full text-xs transition-colors border
                  ${selectedTag === tag
                    ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300'
                    : 'bg-[#121826] border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === 内容网格区域 === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-600">
            <Info className="mx-auto mb-2 opacity-50" />
            没有找到符合条件的条目
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <ItemCard 
              key={`${item.name}-${idx}`} 
              item={item} 
              type={type} 
              onBuy={onBuy} 
              cost={costTable[item.tier]} 
            />
          ))
        )}
      </div>
    </div>
  );
}

// === 单个卡片组件 ===
function ItemCard({ item, type, onBuy, cost }) {
  const [expanded, setExpanded] = useState(false);
  const theme = TIER_CONFIG[item.tier] || TIER_CONFIG[1];

  return (
    <div 
      className={`
        group relative flex flex-col bg-[#0f141e] rounded-lg border border-slate-800 
        hover:border-opacity-100 hover:shadow-lg transition-all duration-200 overflow-hidden
        ${expanded ? 'row-span-2' : ''}
      `}
      style={{ borderColor: expanded ? '' : 'rgba(30,41,59,0.5)' }} // Default state border
    >
      {/* 顶部彩色条 (指示稀有度) */}
      <div className={`h-1 w-full ${theme.bg.replace('/10', '/80')}`} />

      <div className="p-4 flex flex-col h-full relative z-0">
        
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className={`font-bold text-sm leading-tight ${theme.color}`}>
            {item.name}
          </h3>
          <span className="shrink-0 text-xs font-mono font-bold text-cyan-500 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/50">
            {cost} RP
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800">
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && <span className="text-[10px] text-slate-600">...</span>}
        </div>

        {/* 描述文本区域 */}
        <div className="flex-1 text-xs text-slate-300 space-y-2 mb-4">
           {/* 如果是舰船，显示防御属性 */}
           {type === 'ship' && item.defenses && (
             <div className="grid grid-cols-3 gap-1 mb-2 bg-slate-900/50 p-1 rounded border border-slate-800/50 text-[10px] text-center font-mono">
               <div>
                 <div className="text-blue-400">盾</div>
                 <div>{(item.defenses.shield.max / 1000).toFixed(0)}k</div>
               </div>
               <div>
                 <div className="text-slate-400">甲</div>
                 <div>{(item.defenses.armor.max / 1000).toFixed(0)}k</div>
               </div>
               <div>
                 <div className="text-orange-400">构</div>
                 <div>{(item.defenses.hull.max / 1000).toFixed(0)}k</div>
               </div>
             </div>
           )}

           {/* 主要效果 (折叠/展开逻辑) */}
           <div className={`relative ${expanded ? '' : 'line-clamp-3'}`}>
             <p className="opacity-90 leading-relaxed">{item.effects}</p>
             {!expanded && <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-[#0f141e] to-transparent" />}
           </div>
           
           {/* 只有展开才显示的细节 */}
           {expanded && (
             <div className="animate-in fade-in duration-300 pt-2 border-t border-slate-800 mt-2">
               <p className="italic text-slate-500 mb-2">{item.details}</p>
               {item.dependent_skills && (
                 <div className="text-[10px] text-slate-400">
                   <strong>依赖:</strong> {Object.entries(item.dependent_skills).map(([k,v]) => `${k}:${v}`).join(', ')}
                 </div>
               )}
             </div>
           )}
        </div>

        {/* 底部按钮栏 */}
        <div className="mt-auto flex gap-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            {expanded ? '收起' : '详情'}
          </button>
          <button 
            onClick={() => onBuy(item, type)}
            className="flex-1 py-1.5 text-xs font-bold text-black bg-cyan-600 hover:bg-cyan-400 rounded transition-colors flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(8,145,178,0.3)] hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          >
            <Plus size={14} /> 采购
          </button>
        </div>

      </div>
    </div>
  );
}