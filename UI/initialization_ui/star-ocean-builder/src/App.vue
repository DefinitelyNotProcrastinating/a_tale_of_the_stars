<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'

// --- 1. 类型定义 ---
type CategoryType = 'skills' | 'items' | 'ships'
type TabType = 'origin' | 'review' | CategoryType

interface Item {
  name: string
  tags: string[]
  tier: number
  description?: string
  effects?: string
  details?: string
  [key: string]: any
}

// --- 2. 默认后备数据 ---
const FALLBACK_DB = {
  factions: {
    data: [
      { name: "示例文明", description: "无法加载远程配置，这是默认的后备文明数据。", base_reputation: 0 }
    ]
  },
  spawn_locations: {
    data: [
      { sector: "未知扇区", constellation: "虚空", description: "数据加载失败显示的默认位置", danger_level: 0 }
    ]
  },
  scenarios: {
    data: [
      { name: "默认开局", description: "由于配置文件缺失，你只能选择这个默认开局。", starting_wealth_bonus: 0 }
    ]
  },
  stats: {
    data: [
      { code: "STR", name: "力量" }, { code: "DEX", name: "敏捷" },
      { code: "CON", name: "体质" }, { code: "INT", name: "智力" }, { code: "WIL", name: "意志" }
    ]
  },
  skills: {
    data: [
      { name: "示例技能", tags: ["系统"], tier: 1, effects: "无消耗", details: "这是后备数据的占位技能。" }
    ]
  },
  items: {
    data: [
      { name: "示例物品", tags: ["杂物"], tier: 1, effects: "无效果", details: "这是后备数据的占位物品。" }
    ]
  },
  ships: {
    data: [
      { name: "示例飞船", tags: ["载具"], tier: 1, effects: "无", details: "这是后备数据的占位飞船。" }
    ]
  }
}

// --- 3. 状态管理 ---
const DATA_URL = './data.json'
const db = ref<any>(null)
const loading = ref(true)
const loadError = ref(false)

const state = reactive({
  currentTab: 'origin' as TabType,
  totalRP: 1000,
  spentRP: 0,
  
  faction: '',
  location: '',
  scenario: '',
  stats: { STR: 1, DEX: 1, CON: 1, INT: 1, WIL: 1 } as Record<string, number>,
  freeStatPoints: 5,
  
  cart: {
    skills: [] as Item[],
    items: [] as Item[],
    ships: [] as Item[]
  }
})

const filters = reactive({
  search: '',
  tier: 'ALL'
})

// --- 4. 核心逻辑 ---

onMounted(async () => {
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const json = await res.json()
    if (!json.factions || !json.items) throw new Error("Invalid JSON structure")
    db.value = json
  } catch (e) {
    console.warn("加载配置失败，使用后备数据:", e)
    db.value = FALLBACK_DB
    loadError.value = true
  } finally {
    loading.value = false
    if (db.value.factions?.data?.[0]) state.faction = db.value.factions.data[0].name
    if (db.value.scenarios?.data?.[0]) state.scenario = db.value.scenarios.data[0].name
  }
})

// === 修复的核心：使用函数来处理属性变更，避免模板中的 TS 报错 ===
const updateStat = (key: string, delta: number) => {
  // 安全检查：确保 key 存在于 stats 对象中
  if (typeof state.stats[key] === 'number') {
    if (delta > 0 && state.freeStatPoints > 0) {
      state.stats[key]++
      state.freeStatPoints--
    } else if (delta < 0 && state.stats[key] > 1) {
      state.stats[key]--
      state.freeStatPoints++
    }
  }
}

const getFilteredList = (type: CategoryType) => {
  if (!db.value || !db.value[type]) return []
  let list: Item[] = db.value[type].data || []
  
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  
  if (filters.tier !== 'ALL') {
    list = list.filter(i => i.tier === Number(filters.tier))
  }

  return list
}

const getCost = (item: Item, type: CategoryType) => {
  if (type === 'skills') return item.tier * 20
  if (type === 'items') return item.tier === 7 ? 420 : item.tier * 30
  if (type === 'ships') return item.tier === 7 ? 1024 : item.tier * 120
  return 0
}

const toggleCart = (item: Item, type: CategoryType) => {
  const list = state.cart[type]
  const idx = list.findIndex(i => i.name === item.name)
  
  if (idx > -1) {
    list.splice(idx, 1)
  } else {
    // 深拷贝
    list.push(JSON.parse(JSON.stringify(item))) 
  }
  calculateTotal()
}

const isInCart = (name: string, type: CategoryType) => {
  return state.cart[type].some(i => i.name === name)
}

const calculateTotal = () => {
  let total = 0
  state.cart.skills.forEach(i => total += getCost(i, 'skills'))
  state.cart.items.forEach(i => total += getCost(i, 'items'))
  state.cart.ships.forEach(i => total += getCost(i, 'ships'))
  state.spentRP = total
}

const yamlOutput = computed(() => {
  const lines = []
  lines.push(`character_setup:`)
  lines.push(`  faction: "${state.faction}"`)
  lines.push(`  spawn: "${state.location || '随机'}"`)
  lines.push(`  scenario: "${state.scenario}"`)
  lines.push(`  attributes:`)
  Object.entries(state.stats).forEach(([k, v]) => lines.push(`    ${k}: ${v}`))
  
  lines.push(`inventory:`)
  lines.push(`  skills:`)
  state.cart.skills.forEach(s => lines.push(`    - "${s.name}"`))
  lines.push(`  items:`)
  state.cart.items.forEach(i => lines.push(`    - "${i.name}"`))
  lines.push(`  ships:`)
  state.cart.ships.forEach(s => lines.push(`    - "${s.name}"`))
  
  return lines.join('\n')
})

const copyToClipboard = () => {
  navigator.clipboard.writeText("```yaml\n" + yamlOutput.value + "\n```")
  alert('已复制到剪贴板！请发送给 AI。')
}

// UI 配色常量
const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400 border-gray-600',
  2: 'text-green-400 border-green-600',
  3: 'text-blue-400 border-blue-600',
  4: 'text-purple-400 border-purple-600',
  5: 'text-orange-400 border-orange-600',
  6: 'text-red-500 border-red-600',
  7: 'text-accent border-accent shadow-[0_0_10px_#ff0055]'
}
</script>

<template>
  <div class="min-h-screen bg-bg text-gray-200 font-sans selection:bg-primary selection:text-bg flex flex-col h-screen overflow-hidden">
    
    <!-- 加载与错误状态 -->
    <div v-if="loading" class="absolute inset-0 z-50 bg-bg flex items-center justify-center">
      <div class="text-primary text-2xl animate-pulse">正在建立星际连接...</div>
    </div>

    <!-- Header -->
    <header class="bg-panel border-b border-dim p-4 flex flex-wrap justify-between items-center z-10 shadow-lg shrink-0">
      <div class="flex items-center gap-2">
        <div class="i-carbon-rocket text-3xl text-primary"></div>
        <div>
          <h1 class="text-xl font-bold tracking-wider hidden md:block">星海转生协议 <span class="text-xs text-gray-500">v4.1</span></h1>
          <div v-if="loadError" class="text-[10px] text-orange-400 md:hidden">⚠ 离线模式</div>
        </div>
      </div>
      
      <div v-if="loadError" class="hidden md:block text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/30">
        ⚠ 无法连接至服务器，已加载后备协议数据。
      </div>

      <div class="flex items-center gap-4 bg-bg px-4 py-2 rounded border border-dim">
        <span class="text-xs uppercase text-gray-400 hidden sm:inline">资源点数 (RP)</span>
        <span class="text-xl font-mono font-bold" :class="state.totalRP - state.spentRP < 0 ? 'text-accent' : 'text-primary'">
          {{ state.totalRP - state.spentRP }}
        </span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边导航 -->
      <nav class="w-full md:w-64 bg-panel border-r border-dim flex md:flex-col justify-between md:justify-start fixed md:static bottom-0 z-20 h-16 md:h-auto shrink-0">
        <div class="flex md:flex-col w-full overflow-x-auto md:overflow-visible">
          <button 
            v-for="tab in ['origin', 'skills', 'items', 'ships', 'review']" 
            :key="tab"
            @click="state.currentTab = tab as TabType"
            class="flex-1 md:flex-none p-4 min-w-[80px] text-center md:text-left hover:bg-white/5 transition-colors border-b border-transparent md:border-dim flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3"
            :class="state.currentTab === tab ? 'text-primary bg-white/5 border-primary' : 'text-gray-400'"
          >
            <div class="text-xl" :class="{
              'origin': 'i-carbon-user-avatar',
              'skills': 'i-carbon-flash',
              'items': 'i-carbon-tool-box',
              'ships': 'i-carbon-rocket',
              'review': 'i-carbon-document-export'
            }[tab]"></div>
            <span class="capitalize text-[10px] md:text-sm font-bold">{{ tab }}</span>
          </button>
        </div>
        
        <div class="p-4 hidden md:block mt-auto">
            <button @click="copyToClipboard" class="w-full py-3 bg-primary text-bg font-bold rounded hover:bg-white transition">
              导出 YAML
            </button>
        </div>
      </nav>

      <!-- 主界面 -->
      <main class="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[url('https://assets.codepen.io/13471/noise.png')]">
        
        <!-- ORIGIN TAB -->
        <div v-if="state.currentTab === 'origin'" class="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
           <section class="bg-panel border border-dim p-6 rounded">
              <h2 class="text-primary text-lg font-bold mb-4 border-b border-dim pb-2">文明与出身</h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">选择文明</label>
                  <select v-model="state.faction" class="w-full bg-bg border border-dim p-2 rounded text-sm text-white focus:border-primary outline-none">
                    <option v-for="f in db.factions.data" :value="f.name" :key="f.name">{{ f.name }}</option>
                  </select>
                  <p class="text-xs text-gray-500 mt-2 h-12 overflow-y-auto">{{ db.factions.data.find((f:any) => f.name === state.faction)?.description }}</p>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">开局背景</label>
                  <select v-model="state.scenario" class="w-full bg-bg border border-dim p-2 rounded text-sm text-white focus:border-primary outline-none">
                    <option v-for="s in db.scenarios.data" :value="s.name" :key="s.name">{{ s.name }}</option>
                  </select>
                   <p class="text-xs text-gray-500 mt-2 h-12 overflow-y-auto">{{ db.scenarios.data.find((s:any) => s.name === state.scenario)?.description }}</p>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs text-gray-500 mb-1">出生地</label>
                  <select v-model="state.location" class="w-full bg-bg border border-dim p-2 rounded text-sm text-white focus:border-primary outline-none">
                     <option value="">-- 随机分配 --</option>
                     <option v-for="l in db.spawn_locations.data" :value="`${l.sector} - ${l.constellation}`" :key="l.constellation">
                       {{ l.sector }} - {{ l.constellation }} (危险度:{{l.danger_level}})
                     </option>
                  </select>
                </div>
              </div>
            </section>

            <!-- 属性加点部分，已修复报错 -->
             <section class="bg-panel border border-dim p-6 rounded">
              <div class="flex justify-between items-center mb-4">
                 <h2 class="text-primary text-lg font-bold">五维属性</h2>
                 <span class="text-xs text-accent">剩余点数: {{ state.freeStatPoints }}</span>
              </div>
              <div class="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                <div v-for="(val, key) in state.stats" :key="key" class="text-center bg-bg p-2 border border-dim rounded">
                  <div class="font-bold text-gray-400 text-xs mb-1">{{ key }}</div>
                  <div class="text-xl font-mono text-white mb-1">{{ val }}</div>
                  <div class="flex justify-center gap-1">
                    <!-- 使用 updateStat 函数替代内联逻辑 -->
                    <button class="w-5 h-5 bg-dim text-white rounded text-xs hover:bg-primary hover:text-bg" 
                      @click="updateStat(String(key), -1)">-</button>
                    <button class="w-5 h-5 bg-dim text-white rounded text-xs hover:bg-primary hover:text-bg"
                      @click="updateStat(String(key), 1)">+</button>
                  </div>
                </div>
              </div>
            </section>
        </div>

        <!-- LIST TABS -->
        <div v-else-if="['skills','items','ships'].includes(state.currentTab)" class="h-full flex flex-col">
          <div class="flex flex-wrap gap-4 mb-4 items-center bg-panel p-3 rounded border border-dim sticky top-0 z-10 shadow-lg">
              <input v-model="filters.search" type="text" placeholder="搜索名称或标签..." 
                class="bg-bg border border-dim px-3 py-1 text-sm rounded w-full md:w-64 focus:border-primary outline-none text-white">
              
              <div class="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar w-full md:w-auto">
                <button v-for="t in ['ALL','1','2','3','4','5','6','7']" :key="t"
                  @click="filters.tier = t"
                  class="px-3 py-1 text-xs border rounded transition-colors whitespace-nowrap"
                  :class="filters.tier === t ? 'bg-primary text-bg border-primary font-bold' : 'border-dim text-gray-500 hover:text-white'">
                  {{ t === 'ALL' ? '全阶' : `T${t}` }}
                </button>
              </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
            <div v-for="item in getFilteredList(state.currentTab as CategoryType)" :key="item.name" 
              class="bg-panel border p-4 rounded relative group hover:-translate-y-1 transition-transform duration-200 flex flex-col"
              :class="[TIER_COLORS[item.tier] || 'text-gray-400 border-gray-600', isInCart(item.name, state.currentTab as CategoryType) ? 'bg-primary/5 ring-1 ring-primary' : '']"
            >
              <div class="absolute top-2 right-2 text-xs font-mono font-bold px-2 py-0.5 rounded bg-bg border border-current opacity-80">
                {{ getCost(item, state.currentTab as CategoryType) }} RP
              </div>

              <h3 class="font-bold text-base pr-12 text-gray-100">{{ item.name }}</h3>
              <div class="flex flex-wrap gap-1 my-2">
                  <span v-for="tag in item.tags?.slice(0,3)" :key="tag" class="text-[10px] px-1 border border-white/20 rounded text-gray-400">
                    {{ tag }}
                  </span>
              </div>
              
              <div class="text-xs text-gray-500 line-clamp-3 mb-4 flex-1">
                {{ item.effects || item.description || item.details }}
              </div>

              <button 
                @click="toggleCart(item, state.currentTab as CategoryType)"
                class="w-full py-1.5 text-xs font-bold uppercase tracking-wide border rounded transition-colors hover:bg-current hover:text-bg"
                :class="isInCart(item.name, state.currentTab as CategoryType) ? 'bg-current text-bg' : 'bg-transparent'"
              >
                {{ isInCart(item.name, state.currentTab as CategoryType) ? '已装配' : '装配' }}
              </button>
            </div>
          </div>
        </div>

        <!-- REVIEW TAB -->
        <div v-else-if="state.currentTab === 'review'" class="max-w-2xl mx-auto bg-panel border border-dim p-6 rounded pb-24">
            <h2 class="text-xl text-primary font-bold mb-4">协议确认</h2>
            <div class="mb-4 text-xs text-gray-400">请复制下方内容并发送给 AI 开始游戏：</div>
            <pre class="bg-bg p-4 rounded text-xs md:text-sm font-mono text-green-400 overflow-x-auto border border-dim whitespace-pre-wrap">{{ yamlOutput }}</pre>
            <button @click="copyToClipboard" class="mt-4 md:hidden w-full py-3 bg-primary text-bg font-bold rounded">复制到剪贴板</button>
        </div>

      </main>
    </div>
  </div>
</template>

<style>
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #050b14; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #00f0ff; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>