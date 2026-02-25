import React, { useState, useEffect } from 'react';
import Panel from './Panel';

// 各类型消耗设定规则
const COST_MAP = {
  items:  { 1: 30,  2: 60,  3: 90,  4: 120, 5: 150, 6: 180, 7: 420 },
  ships:  { 1: 120, 2: 240, 3: 360, 4: 480, 5: 600, 6: 720, 7: 1024 },
  skills: { 1: 40,  2: 80,  3: 120, 4: 160, 5: 200, 6: 250, 7: 600 }
};

// 工具函数：JSON转格式化YAML
const jsonToYaml = (obj, indent = 0) => {
  let yaml = "";
  const spaces = " ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) yaml += `${spaces}${key}:[]\n`;
      else {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => { yaml += `${spaces}  - ${item}\n`; });
      }
    } else if (typeof value === 'object') {
      if (Object.keys(value).length === 0) yaml += `${spaces}${key}: {}\n`;
      else {
        yaml += `${spaces}${key}:\n`;
        yaml += jsonToYaml(value, indent + 2);
      }
    } else if (typeof value === 'string') {
      const cleanValue = value.replace(/\r/g, '').replace(/\n$/, '');
      if (cleanValue.includes('\n') || cleanValue.length > 50) {
        yaml += `${spaces}${key}: |\n`;
        cleanValue.split('\n').forEach(line => { yaml += line.trim() === "" ? "\n" : `${spaces}  ${line}\n`; });
      } else {
        yaml += `${spaces}${key}: "${cleanValue.replace(/"/g, '\\"')}"\n`;
      }
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }
  return yaml;
};

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 核心状态
  const[totalRP, setTotalRP] = useState(1000);
  const [stats, setStats] = useState({ STR: 1, DEX: 1, CON: 1, INT: 1, WIL: 1 });
  const [freeStats, setFreeStats] = useState(6);
  const[expInvest, setExpInvest] = useState({ baseEXP:0, engineering:0, psionics:0, science:0, gunnery:0, cybernetics:0, detection:0 });
  const[moneyRP, setMoneyRP] = useState(0);
  const [setupData, setSetupData] = useState({ faction: '', location: '', scenario: '' });
  const [inventory, setInventory] = useState([]);
  
  // UI状态
  const [openAccordion, setOpenAccordion] = useState('base');

  // 获取数据 (替换为你的 jsDelivr URL)
// 获取数据
  useEffect(() => {
    // ---------------------------------------------------------
    // 【方式一：读取本地 public 目录下的 data.json】
    // 只要把 JSON 文件命名为 data.json 并放入 public 文件夹即可。
    // 这种方式最适合开发阶段。
    // const DATA_URL = '/data.json'; 
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // 【方式二：直接读取 Public Repo 的 JSON (推荐)】
    // 替换为您自己的 GitHub 仓库的 Raw 链接。
    // 只要 Repo 是 public 的，无需任何 token 即可跨域读取。
    const DATA_URL = 'https://raw.githubusercontent.com/YourUsername/YourRepo/main/data.json';
    // ---------------------------------------------------------

    fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(json => { 
        setData(json); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("Fetch failed:", err);
        alert("JSON 数据加载失败，请检查网络或 URL 是否正确。\n如果是本地测试，请确保 data.json 在 public 目录下。");
        
        // 失败时的安全回退结构，防止页面白屏崩溃
        setData({ 
          factions: { data: [] }, 
          spawn_locations: { data:[] }, 
          scenarios: { data: [] }, 
          items: { data: [] }, 
          ships: { data:[] }, 
          skills: { data:[] } 
        });
        setLoading(false);
      });
  },[]);

  // 计算当前消耗
  const spentRP = useMemo(() => {
    let spent = moneyRP;
    Object.values(expInvest).forEach(val => spent += val);
    inventory.forEach(item => spent += item.cost);
    return spent;
  },[moneyRP, expInvest, inventory]);

  const currentRP = totalRP - spentRP;

  // 购买逻辑
  const handleBuy = (item, category) => {
    const cost = COST_MAP[category][item.tier] || 50;
    if (currentRP < cost) return alert("RP点数不足！");
    
    setInventory(prev =>[...prev, {
      id: Date.now() + Math.random(),
      type: category,
      cost,
      name: item.name,
      schema: item
    }]);
  };

  const removeInventory = (id) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  const changeStat = (stat, delta) => {
    if (delta > 0 && freeStats > 0) {
      setStats(s => ({...s, [stat]: s[stat] + 1}));
      setFreeStats(f => f - 1);
    } else if (delta < 0 && stats[stat] > 1) {
      setStats(s => ({...s, [stat]: s[stat] - 1}));
      setFreeStats(f => f + 1);
    }
  };

  const exportYAML = async () => {
    if (currentRP < 0) return alert("点数超支，请精简清单！");
    
    const finalExport = {
      character_setup: {
        faction: setupData.faction || "未定",
        spawn_location: setupData.location || "未定",
        scenario: setupData.scenario || "未定",
        attributes: stats,
        credits: moneyRP * 10000,
        experience: Object.fromEntries(Object.entries(expInvest).map(([k,v]) => [k, v * 100]))
      },
      inventory: { items: {}, ships: {}, skills: {} }
    };

    let counts = { items: 1, ships: 1, skills: 1 };
    inventory.forEach(inv => {
      const typeStr = inv.type; // 'items', 'ships', 'skills'
      finalExport.inventory[typeStr][`${typeStr.slice(0,-1)}_${String(counts[typeStr]++).padStart(2,'0')}`] = inv.schema;
    });

    const yamlString = jsonToYaml(finalExport);
    const promptMessage = `\`\`\`yaml\n${yamlString}\n\`\`\`\n\n---\n根据以上YAML设定的角色数据、所在星区位置、资产以及选择的开局背景，生成一个符合描述和情景的初始剧情！完整地加入所有开局初始武器，装备，技能，舰队，不得有功能省略，也不能省略任何描述。同时，初始化{{user}}的HP，MP，SP到9999999，会有一个脚本将它们设置为正确的值。`;

    try {
      if (typeof createChatMessages !== 'undefined' && typeof triggerSlash !== 'undefined') {
        await createChatMessages([{ role: 'user', message: promptMessage }]);
        await triggerSlash('/trigger');
        alert("已成功发送至酒馆！");
      } else {
        console.log("=============== 导出YAML ===============");
        console.log(promptMessage);
        alert("未检测到酒馆环境。生成的Prompt已打印在 F12 控制台。");
      }
    } catch (e) {
      console.error(e);
      alert("导出失败，请检查控制台。");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">正在重构星海协议数据...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col">
      {/* 顶部通栏 */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-800 p-4 shadow-lg flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-black text-cyan-400 tracking-wider">星海转生协议 v4.0 (React版)</h1>
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded border border-slate-700">
          <div className="font-bold text-sm">
            RP点数: <span className={`text-lg ${currentRP < 0 ? 'text-red-500' : 'text-cyan-400'}`}>{currentRP}</span> / {totalRP}
          </div>
          <button onClick={() => setTotalRP(Math.floor(Math.random() * 501) + 800)} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">随机</button>
          <button onClick={exportYAML} className="text-xs bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-1.5 rounded font-bold shadow-md transition-transform active:scale-95">确认导出 (YAML)</button>
        </div>
      </header>

      {/* 主体布局 */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-[1800px] mx-auto w-full h-[calc(100vh-80px)]">
        
        {/* 左侧：折叠表单区 (固定宽度或随容器自适应) */}
        <div className="w-full lg:w-[350px] flex flex-col gap-2 overflow-y-auto no-scrollbar shrink-0">
          
          {/* 手风琴 1: 基础设定 */}
          <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
            <button className="w-full px-4 py-3 bg-slate-800 font-bold text-left text-cyan-300 flex justify-between" onClick={() => setOpenAccordion('base')}>
              <span>基础与本源</span><span>{openAccordion === 'base' ? '-' : '+'}</span>
            </button>
            {openAccordion === 'base' && (
              <div className="p-4 space-y-4 text-sm">
                <div>
                  <label className="block text-slate-400 mb-1">选择文明</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded p-2" onChange={e => setSetupData({...setupData, faction: e.target.value})}>
                    <option value="">-- 请选择 --</option>
                    {data.factions?.data.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">降生星区</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded p-2" onChange={e => setSetupData({...setupData, location: e.target.value})}>
                    <option value="">-- 请选择 --</option>
                    {data.spawn_locations?.data.map(l => <option key={l.constellation} value={`${l.sector} - ${l.constellation}`}>{l.sector} : {l.constellation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-cyan-500 font-bold mb-2">五维属性 (剩余点数: {freeStats})</label>
                  {Object.keys(stats).map(stat => (
                    <div key={stat} className="flex justify-between items-center bg-slate-950 p-2 rounded mb-1 border border-slate-800">
                      <span className="font-bold w-10">{stat}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => changeStat(stat, -1)} className="bg-slate-800 px-2 rounded">-</button>
                        <span className="w-4 text-center">{stats[stat]}</span>
                        <button onClick={() => changeStat(stat, 1)} className="bg-slate-800 px-2 rounded">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 手风琴 2: 背景与经验 */}
          <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
            <button className="w-full px-4 py-3 bg-slate-800 font-bold text-left text-cyan-300 flex justify-between" onClick={() => setOpenAccordion('scenario')}>
              <span>命运织锦 (开局与资源)</span><span>{openAccordion === 'scenario' ? '-' : '+'}</span>
            </button>
            {openAccordion === 'scenario' && (
              <div className="p-4 space-y-4 text-sm">
                <div>
                  <label className="block text-slate-400 mb-1">选择开局背景</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded p-2" onChange={e => setSetupData({...setupData, scenario: e.target.value})}>
                    <option value="">-- 请选择 --</option>
                    {data.scenarios?.data.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="border-t border-slate-700 pt-3 mt-3">
                  <label className="block text-cyan-500 font-bold mb-1">初始资金 (1 RP = 1万)</label>
                  <input type="number" min="0" value={moneyRP} onChange={e => setMoneyRP(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 rounded p-2" />
                  <div className="text-xs text-slate-500 mt-1">获得: {(moneyRP * 10000).toLocaleString()} 信用点</div>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <label className="block text-cyan-500 font-bold mb-2">经验兑换 (1 RP = 100 EXP)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(expInvest).map(key => (
                      <div key={key}>
                        <div className="text-[10px] text-slate-400">{key}</div>
                        <input type="number" min="0" value={expInvest[key]} onChange={e => setExpInvest({...expInvest, [key]: parseInt(e.target.value)||0})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间：核心选单区 (占用主要空间) */}
        <div className="w-full lg:flex-1 h-[600px] lg:h-full">
          <Panel data={data} onBuy={handleBuy} />
        </div>

        {/* 右侧：配置清单 (个人配给库) */}
        <div className="w-full lg:w-[280px] bg-slate-900 border border-slate-700 rounded flex flex-col overflow-hidden shrink-0 h-[400px] lg:h-full">
          <div className="bg-slate-800 p-3 border-b border-slate-700 text-center font-bold text-cyan-400 text-sm shadow-md z-10">
            个人配给库 (已选清单)
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar bg-slate-950">
            {inventory.length === 0 ? (
              <p className="text-center text-slate-600 text-xs mt-10">清单空空如也...</p>
            ) : (
              inventory.map(item => (
                <div key={item.id} className="bg-slate-800 border border-slate-700 p-2 rounded flex justify-between items-center group hover:border-red-900 transition-colors">
                  <div className="flex flex-col overflow-hidden pr-2">
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.type} | <span className="text-red-400">-{item.cost} RP</span></span>
                  </div>
                  <button onClick={() => removeInventory(item.id)} className="text-[10px] px-2 py-1 border border-red-500/50 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors shrink-0">移除</button>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}