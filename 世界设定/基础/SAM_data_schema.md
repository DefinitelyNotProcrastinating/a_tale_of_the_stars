<%
// --- 基础等级与经验值计算 ---

const engineering_exp = getvar("SAM_data.static.player.fieldsEXP.engineering") || 0;
const gunnery_exp = getvar("SAM_data.static.player.fieldsEXP.gunnery") || 0;
const science_exp = getvar("SAM_data.static.player.fieldsEXP.science") || 0
const psionics_exp = getvar("SAM_data.static.player.fieldsEXP.psionics") || 0;
const control_exp = getvar("SAM_data.static.player.fieldsEXP.control") || 0;
const detection_exp = getvar("SAM_data.static.player.fieldsEXP.detection") || 0;

function calculateLevel(exp){
    return Math.floor(Math.pow((exp/50.0 -1.0),1/2.7)+1);
}

const engineeringLevel = calculateLevel(engineering_exp);
const gunneryLevel = calculateLevel(gunnery_exp);
const scienceLevel = calculateLevel(science_exp);
const psionicsLevel = calculateLevel(psionics_exp);
const controlLevel = calculateLevel(control_exp);
const detectionLevel = calculateLevel(detection_exp);

%>


<status_current_variables>

##IMPORTANT! OBJECT MANIPULATION PROTOCOLS
###STABILITY PROTOCOL: IF you are using @.DB, you are NOT ALLOWED to change or set FULL OBJECTS UNLESS it is a SHIP, ITEM (INCLUDING GEAR), or SKILL.
###COHERENCE PROTOCOL: IF you are updating or setting full objects, you are NOT ALLOWED TO OMIT ANY DETAILS. ADD the object FULLY AND COMPLETELY according to the object's properties.
极其重要的变量表！

<变量描述>
  [Special] 时间: <%-getvar("SAM_data.time")%>
  _time_desc: 当前的系统时间戳，格式为YYYY-MM-DD HH:MM:SS。使用唯一的@.TIME() 指令更新。
  **主角**: 
    *名字*: <user>的名称。String
    *种族*: <user>的种族。String
    *性别*: <user>的性别。String
    *年龄*: <user>的年龄，包含计数单位的String。
    *身份*: <user>所具有的所有称号。list[string]
    //战斗相关
    *生命值*: <user>的生命值，float
    *能量*: <user>的能量值，float
    *能量回复*: <user>的能量回复，float
    *舰队*: |
        // <user>当前的舰队，用is_flagship 标注哪个是旗舰。此载具信息涵盖所有其他载具，**不要违反此载具格式**，严格按照格式进行。注意载具 extends 物品，**载具**为拥有额外属性和数值的**物品**，所以船体自己也有effects 和 details。如果某艘飞船未被激活，则视为物品放在inventory下，但依然加入所有properties。
        示例舰船名称: { 
            // 基础数据
            为旗舰: true/false 
            标签: ["飞船","载具",...] // list[string]
            品质: OneOf(T1,T2,T3,T4,T5,T6,T0) // T0 为唯一
            护盾: 现在的护盾值
            护盾DR: 护盾抗性减伤
            最大护盾: 护盾最大值
            装甲: 现在的装甲值
            装甲DR: 装甲抗性减伤，int
            最大装甲: 护甲最大值，int
            结构: 现在的结构值，int
            结构DR: 结构抗性减伤，int
            最大结构: 结构最大值，int
            基础侦测范围: 舰载侦测器侦测范围，string，含单位（AU / LY等）
            能量: 现在的能量值，float
            能量回复: 能量回复速度，float，单位为每个dt
            机动评级: 0 - 20，整数，代表机动性能
            依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
            效果: 属于*船体*的特殊效果，和特殊战斗效果，可多行
            描述: 属于*船体*的外观描述和背景故事，详细描述舰船的长度，舰船的外形和外观特征，如具有变形能力，也将写入。可多行。
            //舰载模块
            模块名称:  {
                品质: OneOf(T1,T2,T3,T4,T5,T6,T0) // T0 为唯一
                依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
                消耗:模块的能量消耗，float，单位为每个dt
                效果: （如果是武器的话，武器伤害在此）模块的基础功能描述和数值效果，以及模块的任何特殊效果，可多行。
                描述: 模块的外观描述和背景故事，详细的描述模块启动的时候的样子，和模块的外貌。舰载模块统一大小巨大。可能有多个舰载模块，但船体模块不算作模块（例如装甲，跃迁引擎等）。} 
                }
    *装备*: |
    //<user>当前所装备的武器列表。
        装备名称: {
        标签: ["武器","装甲", "配饰",...也在此填写基础伤害，防御，属性加值和能量消耗。]
        品质: OneOf(T1,T2,T3,T4,T5,T6,T0) // T0 为唯一
        依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
        资源加值：{
            生命值: int，装备对最大生命值的加值
            能量: int，装备对最大能量的加值
            能量回复: int，装备对能量回复的加值
            反应速度: int，装备对反应速度的加值，但反应速度会被卡在20上限
        }
        效果: 如果是武器，在此处填写伤害机制，消耗，和数值，如果是护甲，在此处填写提供的生命值加成和任何特殊效果，如果是配饰，在此处填写提供的属性加成和任何特殊效果。可多行。
        描述: 装备的形状和外形描述，包括颜色，形状，材质等。装备的背景故事。}
    *技能*: |
    //<user>当前的技能列表，包含所有主动技能和被动技能。
        技能名称: {
            消耗: 技能能量消耗，int // 如果没有消耗 / 被动技能则填0
            品质: OneOf(T1,T2,T3,T4,T5,T6,T0) // T0 为唯一
            效果: 用具体数值和机制描述技能效果。
            描述: 在此处描述技能的详细信息和背景故事。}
    //领域熟练度相关
    *领域经验值*: 
      工程: <%-getvar("SAM_data.static.player.fieldsEXP.engineering") || 0%>
      炮术: <%-getvar("SAM_data.static.player.fieldsEXP.gunnery") || 0%>
      科学: <%-getvar("SAM_data.static.player.fieldsEXP.science") || 0%>
      灵能: <%-getvar("SAM_data.static.player.fieldsEXP.psionics") || 0%>
      控制: <%-getvar("SAM_data.static.player.fieldsEXP.control") || 0%>
      侦测: <%-getvar("SAM_data.static.player.fieldsEXP.detection") || 0%>
    *领域领悟技能*:
    //<user>每个领域的【领悟】技能名字和描述。沿用技能区的格式。如果技能等级超过15级但没有选择领悟，请立即展示领悟技能选单。
        领悟技能名称: {
            领域：工程/炮术/科学/灵能/控制/侦测
            消耗: 能量值，float // 如果没有消耗 / 被动技能则填写"无"
            依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
            效果: 用具体数值和机制描述技能效果。
            描述: 在此处描述领域技能的详细信息和背景故事。}
    *领域境界技能*: 
    //<user>的每个领域的【境界】技能名字和描述。如果<user>的某个领域技能等级已达30级但没有选择境界，则立即为<user>显示境界技能选单。
        境界技能名称: {
            领域：工程/炮术/科学/灵能/控制/侦测
            消耗: 能量值，float // 如果没有消耗 / 被动技能则填写"无"
            依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
            效果: 用具体数值和机制描述技能效果。
            描述: 在此处描述技能的详细信息和背景故事。}
    //领域等级
    <DERIVED>
    领域技能等级:
    //<user>在各个专业领域的熟练度等级，由fieldsEXP计算得出。只读变量。如果任意一个领域等级达到15级且该领域没有领悟技能，接下来立即输出领悟技能选单。如果任意一个领域等级达到30级且该领域没有境界技能，接下来立即输出境界技能选单。
        工程: <%-engineeringLevel%>
        炮术:<%-gunneryLevel%>
        科学:<%-scienceLevel%>
        灵能:<%-psionicsLevel%>
        控制:<%-controlLevel%>
        侦测:<%-detectionLevel%>
    </DERIVED>
    *位置*: <user>当前所在的位置描述。必须按照“扇区 - 星区 - 星座 - 星系 - 最近天体/人造天体 - 具体位置”的格式填写。例子:S3为扇区。扇区必然是24+1个扇区之一。
    *天象*: <user>当前所处的天象描述。
    *声望*: <user>与各个势力的关系好感度，格式为“势力名称:好感度数值”，好感度数值为-100到100的整数，负数代表敌对，正数代表友好，0代表中立。
    *信用点*: <user> 拥有的信用点。
    *CP*: <user>的CP数量。CP是系统点数，如果{{user}}没有作弊系统，则CP锁定为0。
    *物品栏*: |
    //<user>的物品栏，包含所持有的所有物品。
        示例物品名称: {
            标签: ["物品","示例"] // 特殊tag: SomeOf("载具","手持武器","舰船","消耗品","弹药"])
            堆叠: 堆叠数量，int
            品质: OneOf(T1,T2,T3,T4,T5,T6,T0) // T0 为唯一
            依赖技能: "技能名称:值……,技能名称:值,... 所有值加和等于1.0，每个值都为正数" 
            效果: "在此处描述物品的基础伤害等，战斗性能和特殊能力。"
            描述: "在此处描述物品的详细信息和背景故事。"}
    *任务*: |
    //<user>当前的任务列表，包含所有未完成的任务。
        示例任务名字:
            状态: 第N步 // 因为已完成的任务将被移除，请移除任何已经完成的任务。
            描述: 在此处描述任务的详细信息和目标。
            奖励: 在此处描述任务完成后可获得的奖励。
  
  **世界**: 
    *重要事件*: 当前银河级范围内发生的重要事件，可多行（使用`\n` 分行）。
    *新闻*: 
      以下新闻部分，如果无则需要全部更新，不得有任何遗漏部分。
      全局新闻: 
      // 当前银河级范围内的最新新闻报道。
        新闻报道1: 新闻报道1的详细内容，可多行（使用`\n` 分行）。新闻报告1大多数为突发新闻。
        新闻报道2: 新闻报道2的详细内容，可多行（使用`\n` 分行）。新闻报告2大多数为政治经济类新闻。
        新闻报道3: 新闻报道3的详细内容，可多行（使用`\n` 分行）。新闻报告3大多数为战争类新闻。
        新闻报道4: 新闻报道4的详细内容，可多行（使用`\n` 分行）。新闻报告4大多数为科技类新闻。
      本地新闻:
      // 当前本地星座范围内的最新新闻报道。
        本地新闻1: 新闻报道1的详细内容，可多行（使用`\n` 分行）。新闻报告1大多数为本地的天象预报。
        本地新闻2: 新闻报道2的详细内容，可多行（使用`\n` 分行）。新闻报告2大多数为本地的政治经济类新闻。
        本地新闻3: 新闻报道3的详细内容，可多行（使用`\n` 分行）。新闻报告3大多数为本地的悬赏类新闻。
        本地新闻4: 新闻报道4的详细内容，可多行（使用`\n` 分行）。新闻报告4大多数为本地的八卦类新闻。
      邂逅预告:
      // 当前银河级范围内的最新八卦新闻报道。预告下一次邂逅。
        邂逅预告1: 和某个异性角色的远程关系。
        邂逅预告2: 专注于附近10LY内的邂逅对象。
        邂逅预告3: 专注于远距的邂逅可能。
        邂逅预告4: 八卦新闻报道4的详细内容，可多行（使用`\n` 分行）。
    *重大行动*:|
    // 当前银河级范围内正在进行的重大行动。每个行动包含以下信息：
        重大行动名称:
            等级：代表行动的危险程度，整数，范围1-10。
            参与势力：列出参与行动的主要势力。
            描述: 重大行动的详细描述，可多行（使用`\n` 分行）。

  **角色记录**: 
  // 非玩家角色管理。不要随便把野怪加入角色记录中！ 只有具有重要剧情作用的NPC才应该被加入角色记录中。
    // 示例角色的格式如下：
    角色名称: {
      性别: str
      种族: str
      身份: list[str]
      最大生命值：int
      最大能量：int
      领域技能等级: {
        工程: int
        炮术: int
        科学: int
        灵能: int
        控制: int
        侦测: int}
      领域领悟技能: {// insights...}
      领域境界技能: {// principles...}
      装备: map{string, Object}
      技能：map{string, Object}
      舰队：map{string, Object}
      好感度: int
      想法: string}
    // 必须完整地加入整个object，不得有任何遗漏或者简写，必须做到详细且事无巨细地描述每一个上述property！
    // 仅有虚体的AI不算做角色。系统人格，除非特别说明，不算做角色。
</变量描述>

<变量真值>
以下是上述所有变量的真值。

<%-JSON.stringify(getvar("SAM_data.static"), null, 2) || ""%>

</变量真值>
    
</status_current_variables>