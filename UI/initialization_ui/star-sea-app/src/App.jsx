import React, { useState, useEffect, useMemo } from 'react';
import yaml from 'js-yaml';
import Panel from './Panel';
import { Search, Library, Box, Rocket, Zap, Globe, Map, ShoppingCart, Trash2, Send, User } from 'lucide-react';

// 设定您的远程 JSON 地址 (必须支持跨域，建议用 raw.githubusercontent 或是 jsdelivr)
const DATA_URL = "https://cdn.jsdelivr.net/gh/DefinitelyNotProcrastinating/a_tale_of_the_stars@main/UI/initialization_ui/initialization_choices.json";

const RP_COSTS = { 1: 30, 2: 60, 3: 90, 4: 120, 5: 150, 6: 180, 7: 420 };
const SHIP_COSTS = { 1: 120, 2: 240, 3: 360, 4: 480, 5: 600, 6: 720, 7: 1024 };

export default function App() {
  const[data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('basics');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  
  const [totalRP, setTotalRP] = useState(1000);
  const[inventory, setInventory] = useState([]);

  // 基础档案状态
  const [stats, setStats] = useState({ STR: 1, DEX: 1, CON: 1, INT: 1, WIL: 1 });
  const [freePoints, setFreePoints] = useState(6);
  const [expInvest, setExpInvest] = useState({ money: 0, baseEXP: 0, engineering: 0, psionics: 0, gunnery: 0, science: 0, cybernetics: 0, detection: 0 });

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(err => {
        console.error("数据加载失败", err);
        // 如果 JSON 加载失败的兜底空结构
        setData({ items: { data:[] }, ships: { data:[] }, skills: { data:[] }, factions: { data:[] }, scenarios: { data:[] } });
        setLoading(false);
      });
  }, []);

  const categories =[
    { id: 'basics', name: '个人档案 (加点)', icon: <User size={18} /> },
    { id: 'factions', name: '文明与派系', icon: <Globe size={18} /> },
    { id: 'scenarios', name: '命运与背景', icon: <Map size={18} /> },
    { id: 'skills', name: '神恩与技能', icon: <Zap size={18} /> },
    { id: 'items', name: '遗物与装备', icon: <Box size={18} /> },
    { id: 'ships', name: '传奇星舰', icon: <Rocket size={18} /> },
  ];

  const expSpent = Object.values(expInvest).reduce((a, b) => a + b, 0);
  const invSpent = inventory.reduce((sum, item) => sum + item.cost, 0);
  const rpRemain = totalRP - expSpent - invSpent;

  const handleStatChange = (stat, delta) => {
    if (delta > 0 && freePoints > 0) { setStats({ ...stats, [stat]: stats[stat] + 1 }); setFreePoints(freePoints - 1); }
    else if (delta < 0 && stats[stat] > 1) { setStats({ ...stats, [stat]: stats[stat] - 1 }); setFreePoints(freePoints + 1); }
  };

  const handleAdd = (item, category, cost) => {
    if (rpRemain < cost && cost > 0) { alert("RP 点数不足！"); return; }
    // 检查排他性：势力和开局只能选一个
    if (['factions', 'scenarios'].includes(category)) {
      setInventory(inventory.filter(i => i.category !== category).concat([{ uid: Date.now().toString(), name: item.name, category, cost, schema: item }]));
    } else {
      setInventory([...inventory, { uid: Date.now().toString() + Math.random(), name: item.name, category, cost, schema: item }]);
    }
  };

  const currentList = useMemo(() => {
    if (!data || !data[activeCategory] || activeCategory === 'basics') return [];
    let list = data[activeCategory].data || [];
    if (tierFilter !== 'ALL' && ['items', 'ships', 'skills'].includes(activeCategory)) {
      list = list.filter(item => item.tier === parseInt(tierFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(q) || (item.tags && item.tags.some(t => t.toLowerCase().includes(q))));
    }
    return list;
  }, [data, activeCategory, searchQuery, tierFilter]);

  const handleExport = async () => {
    if(rpRemain < 0) { alert("警告：转生点数超支，请精简您的清单！"); return; }

    const finalExport = {
      character_setup: {
        attributes: stats,
        credits: expInvest.money * 10000,
        experience: {
          baseEXP: expInvest.baseEXP * 100,
          engineering: expInvest.engineering * 100,
          psionics: expInvest.psionics * 100,
          gunnery: expInvest.gunnery * 100,
          science: expInvest.science * 100,
          cybernetics: expInvest.cybernetics * 100,
          detection: expInvest.detection * 100,
        }
      },
      selections: {}
    };

    inventory.forEach(inv => {
      if (!finalExport.selections[inv.category]) finalExport.selections[inv.category] = [];
      finalExport.selections[inv.category].push(inv.schema);
    });

    const yamlStr = yaml.dump(finalExport);
    const promptMessage = `\`\`\`yaml\n${yamlStr}\n\`\`\`\n\n---\n根据以上YAML设定的角色数据、资产以及选择的开局背景，生成一个符合描述和情景的初始剧情！完整地加入所有开局初始武器，装备，技能，舰队，不得有功能省略，也不能省略任何描述。同时，初始化{{user}}的HP，MP，SP到9999999，会有一个脚本将它们设置为正确的值。`;

    try {
      if (typeof window.createChatMessages !== 'undefined' && typeof window.triggerSlash !== 'undefined') {
        await window.createChatMessages([{ role: 'user', message: promptMessage }]);
        await window.triggerSlash('/trigger');
        alert("✅ 协议已确认，设定已发往星海 (SillyTavern)！");
      } else {
        console.log(promptMessage);
        alert("未检测到酒馆运行环境。提示词 YAML 已成功生成并打印在 F12 控制台中！");
      }
    } catch (e) {
      console.error(e);
      alert("投递至终端时发生异常。");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-brand font-bold text-xl tracking-widest animate-pulse">对接星海数据总线中...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen text-sm overflow-hidden bg-dark">
      
      {/* 侧边导航 */}
      <aside className="w-full md:w-56 bg-panel border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0">
        <div className="p-4 bg-card border-b border-border shadow-md z-10">
          <h1 className="text-base font-black text-brand tracking-widest text-center flex items-center justify-center gap-2">
            <Library size={18} /> 星海协议 v4
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setTierFilter('ALL'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold transition-all shrink-0 md:shrink-auto ${activeCategory === cat.id ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-slate-400 hover:bg-white/5 border-l-4 border-transparent'}`}>
              {cat.icon} <span className="hidden md:inline">{cat.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 主面板 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeCategory !== 'basics' && (
          <header className="bg-panel border-b border-border p-3 flex flex-wrap gap-4 items-center z-10 shadow-sm">
            <div className="flex-1 relative min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="检索数据库 (如：帝国, T4)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark border border-border rounded-full pl-9 pr-4 py-2 text-white focus:outline-none focus:border-brand transition-colors" />
            </div>
            {['items', 'ships', 'skills'].includes(activeCategory) && (
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="bg-dark border border-border rounded-full px-4 py-2 text-white focus:outline-none focus:border-brand">
                <option value="ALL">所有位阶全集</option>
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
        )}
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {activeCategory === 'basics' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-card border border-border p-5 rounded-xl shadow-lg">
                <h3 className="text-brand font-bold text-lg mb-5 border-b border-border pb-2">本源五维体质 <span className="text-xs font-normal text-slate-400 ml-2">(剩余点数: {freePoints})</span></h3>
                {Object.keys(stats).map(s => (
                  <div key={s} className="flex justify-between items-center mb-3 bg-dark/50 p-2.5 rounded-lg border border-border/50">
                    <span className="font-bold w-12 text-white">{s}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleStatChange(s, -1)} className="bg-border px-3 py-1 rounded hover:bg-accent text-white font-bold transition-colors">-</button>
                      <span className="w-6 text-center text-lg font-black text-brand">{stats[s]}</span>
                      <button onClick={() => handleStatChange(s, 1)} className="bg-border px-3 py-1 rounded hover:bg-brand text-white font-bold transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border p-5 rounded-xl shadow-lg">
                <h3 className="text-brand font-bold text-lg mb-5 border-b border-border pb-2">资源与经验兑换 <span className="text-xs font-normal text-slate-400 ml-2">(投入 RP 点数)</span></h3>
                <div className="space-y-4">
                  {Object.keys(expInvest).map(key => (
                    <div key={key}>
                      <label className="block text-xs text-slate-400 mb-1">{key === 'money' ? '信用点资金 (1 RP = 10,000)' : `经验领域 - ${key} (1 RP = 100 EXP)`}</label>
                      <div className="flex gap-2">
                        <input type="number" min="0" value={expInvest[key]} onChange={(e) => setExpInvest({...expInvest,[key]: Math.max(0, parseInt(e.target.value)||0)})}
                          className="w-full bg-dark border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand" />
                        <span className="w-24 shrink-0 flex items-center justify-end text-brand font-bold text-xs bg-brand/10 rounded-lg px-3 border border-brand/20">
                          获得: {key === 'money' ? (expInvest[key] * 10000).toLocaleString() : (expInvest[key] * 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {currentList.length === 0 ? <div className="col-span-full text-center text-slate-500 py-20 text-lg">当前筛选条件未找到记录...</div> : 
                currentList.map((item, idx) => <Panel key={idx} item={item} category={activeCategory} cost={activeCategory === 'ships' ? (SHIP_COSTS[item.tier]||0) : (RP_COSTS[item.tier]||0)} onAdd={handleAdd} />)
              }
            </div>
          )}
        </div>
      </main>

      {/* 结算侧边栏 */}
      <aside className="w-full md:w-80 bg-panel border-t md:border-t-0 md:border-l border-border flex flex-col shrink-0 h-64 md:h-full z-20 shadow-2xl">
        <div className="p-4 bg-card border-b border-border flex justify-between items-center shadow-md">
          <h2 className="font-bold flex items-center gap-2 text-white"><ShoppingCart size={18}/> 个人配给库</h2>
          <div className="text-right leading-tight">
            <span className="text-xs text-slate-400">可用转生点 (RP)</span>
            <div className={`text-2xl font-black tracking-tight ${rpRemain < 0 ? 'text-accent' : 'text-brand'}`}>{rpRemain} <span className="text-sm text-slate-500 font-normal">/ {totalRP}</span></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {inventory.length === 0 ? <p className="text-center text-slate-600 mt-10 text-sm">清单空空如也...</p> : 
            inventory.map(inv => (
              <div key={inv.uid} className="bg-dark border border-border p-3 rounded-lg flex justify-between items-center group shadow-sm">
                <div className="overflow-hidden flex-1">
                  <div className="text-white font-bold text-sm truncate pr-2">{inv.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{inv.category}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {inv.cost > 0 && <span className="text-accent text-xs font-black bg-accent/10 px-2 py-1 rounded border border-accent/20">-{inv.cost}</span>}
                  <button onClick={() => setInventory(inventory.filter(i => i.uid !== inv.uid))} className="text-slate-500 hover:text-accent transition-colors p-1.5 bg-slate-800 rounded hover:bg-slate-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div className="p-4 bg-card border-t border-border mt-auto shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)]">
          <button onClick={handleExport} className="w-full bg-brand text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Send size={18} /> 发送投递协议 (YAML)
          </button>
        </div>
      </aside>

    </div>
  );
}