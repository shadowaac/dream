/**
 * 前端必配“防崩溃”JSON清洗与结构校验工具函数
 * 对应报告第 4 章“表B：踩坑记录”与现场代码抽查核心模块
 */

export const VALID_MOOD_TAGS = ['焦虑', '荒诞', '治愈', '预言', '赛博']

/**
 * Tab 1 单梦塔罗解析默认兜底数据
 */
const TAROT_FALLBACK = {
  title: '迷雾中的未知电波',
  emoji: '🌌',
  moodTag: '荒诞',
  stressScore: 50,
  cssGradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  analysis: '潜意识信号受到宇宙射线干扰，大师未能完全看清全貌，但请放宽心，今晚定能好眠。'
}

/**
 * Tab 2 多梦潜意识炼金默认兜底数据
 */
const ALCHEMY_FALLBACK = {
  alchemyTitle: '跨维度的潜意识共鸣',
  badgeEmoji: '🔮',
  coreCommonality: '这几段梦境碎片虽表象各异，却共同映射出你近期在快节奏生活中渴望掌控感与心灵喘息的隐秘期待。',
  mashupStory: '在平行宇宙的午夜走廊里，所有的梦境道具突然汇聚成一道星河漩涡，你跨过发光的门槛，发现那些曾经让你紧张的难题都化作了脚下温顺的星尘。',
  actionAdvice: '今晚提前半小时放下手机，听一首白噪音或纯音乐安稳入眠。'
}

/**
 * 安全解析 AI 返回的 JSON 字符串（含正则清洗、字段归一化与分场景异常兜底）
 * @param {string} rawResponse - 大模型返回的原始文本
 * @param {'tarot' | 'alchemy'} scene - 调用场景：'tarot'(单梦塔罗) | 'alchemy'(多梦炼金)
 * @returns {object} 解析并校验后的安全对象
 */
export function safeParseAIJson(rawResponse, scene = 'tarot') {
  try {
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('AI 返回内容为空或类型错误')
    }

    // 1. 清洗可能存在的 Markdown 代码块标记 (```json 和 ```)
    let cleaned = rawResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    // 2. 正则截取最外层的 { ... }，防止 AI 在开头或结尾夹带寒暄废话
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      cleaned = match[0]
    }

    const parsed = JSON.parse(cleaned)

    // 3. 结构化字段归一化与边界校验（防止字段越界或格式不合规范）
    if (scene === 'alchemy') {
      return normalizeAlchemyData(parsed)
    }
    return normalizeTarotData(parsed)
  } catch (error) {
    console.error(`[AI JSON解析失败 - ${scene}] 触发降级兜底:`, error, '原始返回:', rawResponse)
    // 4. 异常降级兜底数据（区分单梦与多梦炼金，确保前端 UI 绝不崩溃白屏）
    return scene === 'alchemy' ? { ...ALCHEMY_FALLBACK } : { ...TAROT_FALLBACK }
  }
}

/**
 * 校验并归一化 Tab 1 单梦塔罗数据
 */
export function normalizeTarotData(data = {}) {
  // 锁定枚举值：必须严格在 5 个预设情绪分类中，否则自动映射或兜底为 '荒诞'
  const rawTag = String(data.moodTag || '').trim()
  const moodTag = VALID_MOOD_TAGS.includes(rawTag) ? rawTag : '荒诞'

  // 压力分数钳制在 0 ~ 100 的整数之间
  const parsedScore = Number.parseInt(data.stressScore, 10)
  const stressScore = Number.isNaN(parsedScore)
    ? 50
    : Math.min(100, Math.max(0, parsedScore))

  // 清洗 CSS 渐变代码（去除末尾可能误带的分号，确保 linear-gradient 开头）
  let cssGradient = String(data.cssGradient || TAROT_FALLBACK.cssGradient)
    .replace(/;+$/, '')
    .trim()
  if (!cssGradient.includes('gradient')) {
    cssGradient = TAROT_FALLBACK.cssGradient
  }

  return {
    title: String(data.title || TAROT_FALLBACK.title).slice(0, 14),
    emoji: String(data.emoji || TAROT_FALLBACK.emoji).trim() || '🌙',
    moodTag,
    stressScore,
    cssGradient,
    analysis: String(data.analysis || TAROT_FALLBACK.analysis).trim()
  }
}

/**
 * 校验并归一化 Tab 2 潜意识炼金数据
 */
export function normalizeAlchemyData(data = {}) {
  return {
    alchemyTitle: String(data.alchemyTitle || ALCHEMY_FALLBACK.alchemyTitle).slice(0, 16),
    badgeEmoji: String(data.badgeEmoji || ALCHEMY_FALLBACK.badgeEmoji).trim() || '🔮',
    coreCommonality: String(data.coreCommonality || ALCHEMY_FALLBACK.coreCommonality).trim(),
    mashupStory: String(data.mashupStory || ALCHEMY_FALLBACK.mashupStory).trim(),
    actionAdvice: String(data.actionAdvice || ALCHEMY_FALLBACK.actionAdvice).trim()
  }
}

