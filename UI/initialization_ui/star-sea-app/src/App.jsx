import React, { useState, useEffect, useMemo } from 'react';
import Panel from './Panel';
import { Search, Library, Box, Rocket, Zap, Globe, Map, ShoppingCart, Trash2, Send } from 'lucide-react';

// 设定您的 Github / jsDelivr RAW URL (替换为您的实际地址)
const DATA_URL = "https://raw.githubusercontent.com/YourName/YourRepo/main/star-sea-data.json";

// RP 点数阶梯表
const RP_COSTS = { 1: 30, 2: 60, 3: 90, 4: 120, 5: 150, 6: 180, 7: 420 };
const SHIP_COSTS = { 1: 120, 2: 240, 3: 360, 4: 480, 5: 600, 6: 720, 7: 1024 };

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 视图状态
  const[activeCategory, setActiveCategory] = useState('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  
  // 游戏状态
  const [totalRP, setTotalRP] = useState(1000);
  const[inventory, setInventory] = useState([]);

  // 初始化加载数据
  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(err => {
        console.error("Fetch failed, using fallback empty state", err);
        // 此处为了防止您没部署URL报错，可以提供一个备用空对象
        setData({ items: { data: [] }, ships: { data: [] }, skills: { data:[] }, factions: { data: [] }, scenarios: { data:[] }});
        setLoading(false);
      });
  }, []);

  // 类别菜单配置
  const categories =[
    { id: 'factions', name: '文明派系', icon: <Globe size={18} /> },
    { id: 'scenarios', name: '开局背景', icon: <Map size={18} /> },
    { id: 'items', name: '遗物与装备', icon: <Box size={18} /> },
    { id: 'ships', name: '传奇星舰', icon: <Rocket size={18} /> },
    { id: 'skills', name: '神恩与技能', icon: <Zap size={18} /> },
  ];

  // 计算已用 RP
  const rpSpent = inventory.reduce((sum, item) => sum + item.cost, 0);
  const rpRemain = totalRP - rpSpent;

  // 添加到清单
  const handleAdd = (item, category, cost) => {
    if (rpRemain < cost) { alert("RP 点数不足！"); return; }
    const uid = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setInventory([...inventory, { uid, name: item.name, category, cost, schema: item }]);
  };

  // 过滤并搜索当前分类下的数据
  const currentList = useMemo(() => {
    if (!data || !data[activeCategory]) return[];
    let list = data[activeCategory].data ||[];
    
    // 过滤品质
    if (tierFilter !== 'ALL' && ['items', 'ships', 'skills'].includes(activeCategory)) {
      list = list.filter(item => item.tier === parseInt(tierFilter));
    }
    
    // 搜索过滤 (匹配名称和 Tag)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return list;
  },[data, activeCategory, searchQuery, tierFilter]);

  // 工具函数：获取花费
  const getCost = (category, tier) => {
    if (category === 'ships') return SHIP_COSTS[tier] || 1024;
    return RP_COSTS[tier] || 420;
  };

  // 导出 YAML (简化版逻辑，对接您的酒馆代码)
  const handleExport = () => {
    console.log("Exporting to YAML...", inventory);
    alert("已打包数据！可对接原有 YAML 转换逻辑发送给 SillyTavern。");
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-brand">连接星海协议中...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden text-sm">
      
      {/* 1. 左侧导航栏 */}
      <aside className="w-full md:w-64 bg-panel border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border bg-card">
          <h1 className="text-lg font-black text-brand flex items-center gap-2 tracking-wider">
            <Library size={20} /> 星海转生 v4.0
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setTierFilter('ALL'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors shrink-0 md:shrink-auto ${
                activeCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/50' : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.icon} <span className="hidden md:inline">{cat.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. 中间主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 顶部搜索与过滤条 */}
        <header className="bg-card/80 backdrop-blur border-b border-border p-4 flex flex-wrap gap-4 items-center z-10">
          <div className="flex-1 relative min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索名称或标签 (如: 帝国, 狙击枪)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-border rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          
          {/* 品质过滤器 (仅在装备/飞船/技能分类下显示) */}
          {['items', 'ships', 'skills'].includes(activeCategory) && (
            <select 
              value={tierFilter} 
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-black/50 border border-border rounded-full px-4 py-2 text-white focus:outline-none focus:border-brand"
            >
              <option value="ALL">所有位阶 (All Tiers)</option>
              <option value="1">T1 - 普通</option>
              <option value="2">T2 - 优良</option>
              <option value="3">T3 - 精工</option>
              <option value="4">T4 - 史诗</option>
              <option value="5">T5 - 传说</option>
              <option value="6">T6 - 神话</option>
              <option value="7">T7 - 唯一/法则</option>
            </select>
          )}
        </header>

        {/* 瀑布流/网格内容区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentList.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-10">
                暂未找到匹配的数据库记录...
              </div>
            ) : (
              currentList.map((item, idx) => (
                <Panel 
                  key={item.name + idx} 
                  item={item} 
                  category={activeCategory} 
                  cost={getCost(activeCategory, item.tier)}
                  onAdd={handleAdd}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* 3. 右侧/底部 结算面板 */}
      <aside className="w-full md:w-80 bg-panel border-t md:border-t-0 md:border-l border-border flex flex-col shrink-0 h-48 md:h-full shadow-2xl z-20">
        <div className="p-4 border-b border-border bg-card flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 text-white"><ShoppingCart size={18}/> 个人配给库</h2>
          <div className="text-right leading-tight">
            <span className="text-xs text-gray-400">可用 RP</span>
            <div className={`text-xl font-black ${rpRemain < 0 ? 'text-accent' : 'text-brand'}`}>
              {rpRemain} / {totalRP}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {inventory.length === 0 ? (
            <p className="text-center text-gray-500 mt-10 text-xs">列表空空如也...</p>
          ) : (
            inventory.map(inv => (
              <div key={inv.uid} className="bg-card border border-border p-3 rounded flex justify-between items-center group">
                <div className="overflow-hidden">
                  <div className="text-white font-bold truncate">{inv.name}</div>
                  <div className="text-xs text-gray-500">{inv.category}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-accent text-xs font-bold">-{inv.cost}</span>
                  <button 
                    onClick={() => setInventory(inventory.filter(i => i.uid !== inv.uid))}
                    className="text-gray-500 hover:text-accent transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-card border-t border-border mt-auto">
          <button 
            onClick={handleExport}
            className="w-full bg-brand text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Send size={18} /> 确认并写入终端 (YAML)
          </button>
        </div>
      </aside>

    </div>
  );
}