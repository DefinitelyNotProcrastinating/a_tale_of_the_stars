import React, { useState, useMemo } from 'react';

// 品质等级映射
const QUALITY_MAP = { 1: "普通", 2: "优良", 3: "精工", 4: "史诗", 5: "传说", 6: "神话", 7: "唯一" };

export default function Panel({ data, onBuy }) {
  const [activeTab, setActiveTab] = useState('items');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const[currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // 重置分页
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setTierFilter('All');
  };

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!data[activeTab] || !data[activeTab].data) return[];
    
    return data[activeTab].data.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
      const matchTier = tierFilter === 'All' || item.tier === parseInt(tierFilter);
      return matchSearch && matchTier;
    });
  }, [data, activeTab, search, tierFilter]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 渲染卡片详细内容
  const renderDetails = (item) => {
    return (
      <div className="text-xs text-slate-400 mt-2 space-y-1">
        <div className="text-cyan-200"><strong>依赖:</strong> {item.dependent_skills ? Object.entries(item.dependent_skills).map(([k,v]) => `${k}(${v})`).join(', ') : '无'}</div>
        
        {/* 舰船特有防御属性 */}
        {item.defenses && (
          <div className="grid grid-cols-3 gap-1 bg-slate-800/50 p-1 rounded border border-slate-700 my-2">
            <div>护盾: <span className="text-white">{item.defenses.shield.max}</span></div>
            <div>装甲: <span className="text-white">{item.defenses.armor.max}</span></div>
            <div>结构: <span className="text-white">{item.defenses.hull.max}</span></div>
          </div>
        )}

        <div className="whitespace-pre-wrap"><strong className="text-slate-300">效果:</strong><br/>{item.effects}</div>
        <div className="whitespace-pre-wrap mt-1"><strong className="text-slate-300">描述:</strong><br/>{item.details}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
      
      {/* 左侧类型导航 (手机端为横向滚动) */}
      <div className="md:w-32 bg-slate-950 border-r border-slate-800 flex md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0">
        {[
          { id: 'items', label: '物质遗物' },
          { id: 'ships', label: '传奇星舰' },
          { id: 'skills', label: '权能技能' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap md:whitespace-normal transition-colors text-left
              ${activeTab === tab.id ? 'bg-cyan-900/40 text-cyan-400 border-l-4 border-cyan-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        
        {/* 顶部搜索与过滤工具栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
          <input 
            type="text" 
            placeholder="搜索名称或 Tag..." 
            value={search}
            onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
            className="flex-1 bg-slate-950 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <select 
            value={tierFilter} 
            onChange={(e) => {setTierFilter(e.target.value); setCurrentPage(1);}}
            className="bg-slate-950 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">所有品质 (等阶)</option>
            {[1,2,3,4,5,6,7].map(t => <option key={t} value={t}>T{t} - {QUALITY_MAP[t]}</option>)}
          </select>
        </div>

        {/* 动态卡片网格 */}
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {currentData.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 text-sm">未找到匹配的项...</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
              {currentData.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="bg-slate-800 border border-slate-700 rounded p-4 flex flex-col relative hover:border-cyan-700 transition-colors">
                  <div className="flex justify-between items-start mb-2 pr-16">
                    <h3 className="font-bold text-slate-100 text-base leading-tight">{item.name}</h3>
                  </div>
                  
                  {/* 品质和花费标签悬浮右上角 */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${item.tier >= 5 ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20' : 'border-slate-600 text-slate-300'}`}>
                      T{item.tier} {QUALITY_MAP[item.tier]}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags?.map(t => (
                      <span key={t} className="bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>

                  <div className="flex-1">
                    {renderDetails(item)}
                  </div>

                  <button 
                    onClick={() => onBuy(item, activeTab)}
                    className="mt-4 w-full bg-slate-700 hover:bg-cyan-600 text-white font-bold py-1.5 rounded text-xs transition-colors"
                  >
                    选择并消耗点数
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部翻页组件 */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700 shrink-0">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded disabled:opacity-50">上一页</button>
            <span className="text-xs text-slate-400">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded disabled:opacity-50">下一页</button>
          </div>
        )}

      </div>
    </div>
  );
}