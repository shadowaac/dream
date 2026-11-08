const DREAM_LIST_KEY = 'dream_tarot_dream_list_v1'
const ALCHEMY_LIST_KEY = 'dream_tarot_alchemy_list_v1'
const API_CONFIG_KEY = 'dream_tarot_api_config_v1'

/**
 * 预置种子梦境数据（包含题目示例，保证首次打开 Tab 2 与 Tab 3 即有丰富视觉呈现）
 */
export const SEED_DREAMS = [
  {
    id: 'dream_1731052800000',
    createTime: '2026-11-08 08:30',
    rawText: '梦见在教学楼里骑扫帚找考场，结果考卷发下来全是乱码。',
    persona: '毒舌室友',
    title: '扫帚上的乱码裸考',
    emoji: '🧹',
    moodTag: '焦虑',
    stressScore: 82,
    cssGradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
    analysis:
      '别怀疑了，这就是你平时上课划水、考前临时抱佛脚的心虚写照！连做梦都在骑扫帚赶场，说明你潜意识里想直接飞过复习阶段。建议立刻合上手机去背两道题，不然下周考卷在你眼里真就是乱码！'
  },
  {
    id: 'dream_1730966400000',
    createTime: '2026-11-07 07:45',
    rawText: '梦见自己在赛博霓虹街道被一只长着机械触手的巨大闹钟追赶，怎么跑都是慢动作。',
    persona: '赛博周公',
    title: '霓虹街头的机械时差',
    emoji: '⏰',
    moodTag: '赛博',
    stressScore: 76,
    cssGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    analysis:
      '卦象显示你的生物钟固件已严重掉帧！机械闹钟乃“死线（Deadline）”化身，慢动作奔跑说明你后台挂载了过多未完成进程导致算力枯竭。此乃预警之兆，宜今晚清理后台缓存、拔掉充电线早睡。'
  },
  {
    id: 'dream_1730880000000',
    createTime: '2026-11-06 08:10',
    rawText: '梦见图书馆变成了海底世界，一只戴着眼镜的蓝鲸游过来帮我把毕设代码里的Bug全吃掉了。',
    persona: '弗洛伊德',
    title: '深海书阁的吞Bug蓝鲸',
    emoji: '🐋',
    moodTag: '治愈',
    stressScore: 34,
    cssGradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    analysis:
      '深海象征着宁静包容的无意识母体，而温顺智慧的蓝鲸则是你内心“理想化援助者”的投射。这表明你在经历阶段性高压后，心理防御机制正通过温柔的幻想进行自我修复，你比自己想象中更有力量解决难题。'
  },
  {
    id: 'dream_1730793600000',
    createTime: '2026-11-05 09:00',
    rawText: '梦见食堂阿姨打菜时手不抖了，还偷偷塞给我一张写着下周彩票号码的发光鸡蛋灌饼。',
    persona: '毒舌室友',
    title: '食堂阿姨的发光灌饼',
    emoji: '🥞',
    moodTag: '荒诞',
    stressScore: 45,
    cssGradient: 'linear-gradient(135deg, #614385 0%, #516395 100%)',
    analysis:
      '醒醒吧！食堂阿姨手不抖的概率比你暴富的概率还低！这梦纯粹是因为你昨晚没吃夜宵饿着肚子睡着了，大脑皮层为了安慰你那干瘪的钱包和胃，强行给你编了一出爽文剧本。快起床去买个真灌饼吧！'
  },
  {
    id: 'dream_1730707200000',
    createTime: '2026-11-04 07:20',
    rawText: '梦见站在教学楼天台看流星雨，每一颗流星落下来都变成了一封未来的录取通知书。',
    persona: '弗洛伊德',
    title: '星坠天台的未来信笺',
    emoji: '🌠',
    moodTag: '预言',
    stressScore: 52,
    cssGradient: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)',
    analysis:
      '高处与星空代表着自我实现的崇高愿景，化作信笺的流星则是潜意识对长久努力的正向预期。虽然伴随些许对未知结果的期盼性紧张，但你的内在驱动力非常充沛，请继续保持当下的节奏。'
  }
]

/**
 * 预置种子炼金合成报告（对应题目 JSON 示例）
 */
export const SEED_ALCHEMIES = [
  {
    id: 'alchemy_1731059900000',
    createTime: '2026-11-08 21:15',
    sourceDreamIds: ['dream_1731052800000', 'dream_1730966400000'],
    alchemyTitle: 'Deadline前夕的赛博逃亡',
    badgeEmoji: '🔮',
    coreCommonality:
      '这两个梦表面一个是考试一个是被追赶，实则都映射出你近期面对多项任务并行时的时间紧迫感与害怕出错的防御心理。',
    mashupStory:
      '在平行宇宙里，你正骑着扫帚在教学楼走廊狂飙逃避身后的代码怪兽，情急之下你把那张印满乱码的考卷折成纸飞机扔向怪兽，没想到乱码瞬间化作防火墙将怪兽封印，你稳稳降落在天台长舒了一口气。',
    actionAdvice: '把最头疼的大作业拆成15分钟能做完的第一小步，做完立刻去吃顿夜宵。'
  }
]

/**
 * 格式化当前时间为 YYYY-MM-DD HH:mm
 */
export function formatNowTime() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`
}

/**
 * 读取本地梦境列表
 */
export function loadDreamList() {
  try {
    const raw = localStorage.getItem(DREAM_LIST_KEY)
    if (!raw) {
      localStorage.setItem(DREAM_LIST_KEY, JSON.stringify(SEED_DREAMS))
      return [...SEED_DREAMS]
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...SEED_DREAMS]
  } catch (e) {
    console.error('读取本地梦境缓存失败:', e)
    return [...SEED_DREAMS]
  }
}

/**
 * 保存本地梦境列表
 */
export function saveDreamList(list) {
  try {
    localStorage.setItem(DREAM_LIST_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('保存梦境列表失败:', e)
  }
}

/**
 * 读取本地炼金合成报告列表
 */
export function loadAlchemyList() {
  try {
    const raw = localStorage.getItem(ALCHEMY_LIST_KEY)
    if (!raw) {
      localStorage.setItem(ALCHEMY_LIST_KEY, JSON.stringify(SEED_ALCHEMIES))
      return [...SEED_ALCHEMIES]
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...SEED_ALCHEMIES]
  } catch (e) {
    console.error('读取炼金列表失败:', e)
    return [...SEED_ALCHEMIES]
  }
}

/**
 * 保存本地炼金合成报告列表
 */
export function saveAlchemyList(list) {
  try {
    localStorage.setItem(ALCHEMY_LIST_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('保存炼金列表失败:', e)
  }
}

/**
 * 重置为初始演示数据
 */
export function resetToSeedData() {
  localStorage.setItem(DREAM_LIST_KEY, JSON.stringify(SEED_DREAMS))
  localStorage.setItem(ALCHEMY_LIST_KEY, JSON.stringify(SEED_ALCHEMIES))
  return {
    dreams: [...SEED_DREAMS],
    alchemies: [...SEED_ALCHEMIES]
  }
}

/**
 * 获取与保存 DeepSeek API 配置
 */
export function getApiConfig() {
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY)
    if (!raw) {
      return {
        apiKey: '',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      }
    }
    return JSON.parse(raw)
  } catch {
    return {
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat'
    }
  }
}

export function saveApiConfig(config) {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config))
}

