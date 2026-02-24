import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, User, Cpu, Box, Anchor, Menu, X, Save, Share2 } from 'lucide-react';
import MarketPanel from './MarketPanel';

// === 配置常量 ===
const DATA_URL = 'https://cdn.jsdelivr.net/gh/your-username/your-repo/start.json'; // 替换为你的实际地址

// 简单的价格表 (根据 Tier 决定价格)
const COST_TABLE = {
  item: { 1: 30, 2: 60, 3: 90, 4: 120, 5: 150, 6: 180, 7: 420 },
  ship: { 1: 120, 2: 240, 3: 360, 4: 480, 5: 600, 6: 720, 7: 1024 },
  skill: { 1: 50, 2: 100, 3: 150, 4: 200, 5: 300, 6: 400, 7: 800 } // 假设的技能价格
};

export default function App() {
  // === 全局状态 ===
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('setup'); // setup | skills | items | ships
  const [inventory, setInventory] = useState([]); // 购物车
  const [totalRP, setTotalRP] = useState(1000);   // 总RP
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // === 初始化加载 ===
  useEffect(() => {
    // 模拟从CDN获取数据，这里使用 fetch
    const fetchData = async () => {
      try {
        // 在实际部署时取消注释下面这行
        // const response = await fetch(DATA_URL);
        // const json = await response.json();
        
        // 暂时用空数据占位，等待你填入真实的 fetch 逻辑
        // 这里为了演示，假设数据已经存在 (你需要确保 index.html 引入了数据或者 fetch 成功)
        console.log("Fetching data...");
        // setData(json); 
        // setLoading(false);
        
        // --- 调试用：模拟延迟 ---
        setTimeout(() => {
           // 假设这是 fetch 回来的数据结构，仅作演示防报错
           setData({
             items: { data: [] }, ships: { data: [] }, skills: { data: [] },
             scenarios: { data: [] }, factions: { data: [] }, stats: { data: [] }
           }); 
           setLoading(false);
        }, 800);

      } catch (error) {
        console.error("加载配置失败:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // === 逻辑处理 ===
  
  // 计算已消耗 RP
  const spentRP = useMemo(() => {
    return inventory.reduce((acc, item) => acc + item.cost, 0);
  }, [inventory]);

  const currentRP = totalRP - spentRP;

  // 添加到购物车
  const handleBuy = (item, type) => {
    const cost = COST_TABLE[type][item.tier] || 999;
    if (currentRP < cost) {
      alert("RP 点数不足！");
      return;
    }
    const newItem = {
      ...item,
      uid: Date.now() + Math.random().toString(36), // 唯一ID用于删除
      type,
      cost
    };
    setInventory(prev => [...prev, newItem]);
    // 手机端购买后提示
    if (window.innerWidth < 768) {
      // 可以加个 Toast 提示，这里简单处理
    }
  };

  // 移除物品
  const handleRemove = (uid) => {
    setInventory(prev => prev.filter(i => i.uid !== uid));
  };

  // 导出逻辑 (YAML Placeholder)
  const handleExport = () => {
    const yaml = `
# 星海转生协议导出
RP_REMAINING: ${currentRP}
INVENTORY:
${inventory.map(i => `  - [${i.type.toUpperCase()}] ${i.name} (T${i.tier})`).join('\n')}
    `;
    console.log(yaml);
    alert("配置已生成，请查看控制台 (实际部署时将触发文件下载)");
  };

  // === 渲染 ===

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080b12] text-cyan-500">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Cpu size={48} className="animate-spin" />
        <span className="text-xl font-mono tracking-widest">SYSTEM INITIALIZING...</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#080b12] text-slate-200 font-sans overflow-hidden">
      
      {/* --- Header (顶栏) --- */}
      <header className="h-14 bg-[#03050a] border-b border-cyan-900/30 flex items-center justify-between px-4 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/50">
            <Share2 size={18} className="text-cyan-400" />
          </div>
          <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hidden md:block">
            STAR OCEAN <span className="text-xs text-slate-500 align-top">v4.0</span>
          </h1>
        </div>

        {/* RP 显示器 */}
        <div className={`flex items-center gap-4 px-4 py-1.5 rounded border ${currentRP < 0 ? 'bg-red-950/30 border-red-500/50' : 'bg-cyan-950/20 border-cyan-500/30'}`}>
          <span className="text-xs text-slate-400 uppercase font-mono">Resonance Points</span>
          <span className={`font-mono text-xl font-bold ${currentRP < 0 ? 'text-red-500' : 'text-cyan-400'}`}>
            {currentRP}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 移动端购物车开关 */}
          <button 
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-400 relative"
          >
            <ShoppingCart size={20} />
            {inventory.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
          <button onClick={handleExport} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-all shadow-glow">
            导出协议
          </button>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 1. Left Sidebar Navigation (Desktop) */}
        <nav className="hidden md:flex flex-col w-20 bg-[#0a0e17] border-r border-slate-800 py-4 items-center gap-6 shrink-0">
          <NavItem icon={User} label="出身" active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} />
          <NavItem icon={Cpu} label="技能" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
          <NavItem icon={Box} label="物资" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
          <NavItem icon={Anchor} label="舰船" active={activeTab === 'ships'} onClick={() => setActiveTab('ships')} />
        </nav>

        {/* 2. Main Stage (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-[#0d121d] relative scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
            
            {activeTab === 'setup' && (
              <div className="text-center text-slate-500 mt-20">
                <User size={64} className="mx-auto mb-4 opacity-20" />
                <h2 className="text-xl">出身配置面板</h2>
                <p className="text-sm mt-2">（此处放置上一版定义的 Faction / Scenario / Stats 表单）</p>
                <div className="p-4 border border-dashed border-slate-700 rounded mt-8 inline-block">
                  开发中... 请点击左侧/底部导航栏前往商城购买装备
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <MarketPanel 
                type="skill" 
                data={data.skills} 
                onBuy={handleBuy} 
                costTable={COST_TABLE.skill} 
              />
            )}

            {activeTab === 'items' && (
              <MarketPanel 
                type="item" 
                data={data.items} 
                onBuy={handleBuy} 
                costTable={COST_TABLE.item} 
              />
            )}

            {activeTab === 'ships' && (
              <MarketPanel 
                type="ship" 
                data={data.ships} 
                onBuy={handleBuy} 
                costTable={COST_TABLE.ship} 
              />
            )}

          </div>
        </main>

        {/* 3. Right Sidebar: Inventory (Desktop & Mobile Drawer) */}
        <aside 
          className={`
            fixed inset-y-0 right-0 w-80 bg-[#121826] border-l border-slate-700 shadow-2xl z-30 transform transition-transform duration-300
            md:relative md:translate-x-0 md:w-80 md:shadow-none
            ${isInventoryOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#1a202e]">
              <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                <ShoppingCart size={16} /> 配给清单
              </h3>
              <button onClick={() => setIsInventoryOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
              {inventory.length === 0 ? (
                <div className="text-center text-slate-600 mt-10 text-xs">暂无配置</div>
              ) : (
                inventory.map((item) => (
                  <div key={item.uid} className="bg-[#0a0e17] p-3 rounded border border-slate-800 flex justify-between group animate-in slide-in-from-right-4 duration-300">
                    <div>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">{item.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex gap-2">
                        <span>T{item.tier}</span>
                        <span className="text-cyan-600">{item.type.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-cyan-500">-{item.cost}</span>
                      <button 
                        onClick={() => handleRemove(item.uid)}
                        className="text-[10px] text-red-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-700 bg-[#1a202e]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">项目数:</span>
                <span className="text-white">{inventory.length}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">总消耗:</span>
                <span className="text-cyan-400">{spentRP} RP</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden h-16 bg-[#0a0e17] border-t border-slate-800 flex items-center justify-around shrink-0 z-40">
        <NavItem icon={User} label="出身" active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} mobile />
        <NavItem icon={Cpu} label="技能" active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} mobile />
        <NavItem icon={Box} label="物资" active={activeTab === 'items'} onClick={() => setActiveTab('items')} mobile />
        <NavItem icon={Anchor} label="舰船" active={activeTab === 'ships'} onClick={() => setActiveTab('ships')} mobile />
      </nav>

    </div>
  );
}

// 辅助组件：导航按钮
function NavItem({ icon: Icon, label, active, onClick, mobile }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <div className={`p-1.5 rounded-lg ${active ? 'bg-cyan-900/20' : ''}`}>
        <Icon size={mobile ? 20 : 24} />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}