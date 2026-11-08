import { safeParseAIJson } from '../utils/aiParser'
import { getApiConfig } from '../utils/storage'

/**
 * 一、Tab 1：单梦塔罗解析 System Prompt（严格对应设计规范）
 */
export const TAROT_SYSTEM_PROMPT = `你是一个跨端梦境解析App的后端数据渲染引擎。用户会输入一段【梦境描述】以及所选的【解梦大师人设】（可选值：弗洛伊德 / 赛博周公 / 毒舌室友）。
请你根据对应的人设风格解析该梦境，并严格且仅输出一个合法的 JSON 字符串，绝对不要包含 \`\`\`json 标签、Markdown 格式或任何多余的解释说明文字。

【人设风格指南】
1. 弗洛伊德：温和专业的心理学家口吻，从潜意识欲望、防御机制、近期现实压力源角度剖析。
2. 赛博周公：半文言文结合赛博朋克黑话（如“卦象显示你的神经元过载”、“此乃大吉之兆，宜清理缓存”），带一点趣味玄学运势。
3. 毒舌室友：极度接地气的大学生损友口吻，一针见血地吐槽用户的熬夜、拖延症或备考焦虑，幽默搞笑。

【输出 JSON 字段严格约束】
{
  "title": "8个字以内的奇幻感梦境标题（如：失重考场的乱码飞行）",
  "emoji": "1个最能代表梦境核心意象的Emoji字符（仅限单个Emoji，如 🧹）",
  "moodTag": "只能从 ['焦虑', '荒诞', '治愈', '预言', '赛博'] 这5个词中严格选1个",
  "stressScore": 0到100之间的整数（代表潜意识压力值，越紧张焦虑分数越高）,
  "cssGradient": "1组契合该梦境情绪色彩的CSS渐变背景代码（格式如：linear-gradient(135deg, #667eea 0%, #764ba2 100%)，注意配色要有高级感且深浅适中，方便衬托白色文字）",
  "analysis": "80到100字左右的解梦文案，必须强烈体现所选的【解梦大师人设】语气"
}`

/**
 * 二、Tab 2（进阶 1）：多梦“潜意识炼金炉” System Prompt（严格对应设计规范）
 */
export const ALCHEMY_SYSTEM_PROMPT = `你是一个“潜意识梦境炼金术士”。用户会输入近期做过的 2 到 3 个不同梦境碎片。
请你找出这些看似毫无关联的梦境背后的潜意识共性，并将它们强行串联融合，严格且仅输出一个合法的 JSON 字符串，绝对不要包含 \`\`\`json 标签或任何多余文字。

【输出 JSON 字段严格约束】
{
  "alchemyTitle": "10个字以内的合成报告名称（如：高压期的失控与逃离幻想）",
  "badgeEmoji": "1个代表合成产物的特殊Emoji（如 🔮 或 🧬）",
  "coreCommonality": "60字以内，一针见血地指出这几个梦背后共同反映的现实心理症结或情绪状态",
  "mashupStory": "100字左右，【平行宇宙脑洞剧场】：把这几个梦里的核心元素强行串联改编成一段荒诞有趣的奇幻微小说连续剧",
  "actionAdvice": "30字以内，给出一条极度具体、今天就能立刻执行的现实解压行动处方（如：今晚11点前必须关机，奖励自己喝一杯热奶茶）"
}`

/**
 * 拼接 Tab 1 用户端传入格式（User Message 拼接模板）
 */
export function buildTarotUserMessage(rawText, persona) {
  return `【解梦大师人设】：${persona}\n【梦境描述】：${rawText}`
}

/**
 * 拼接 Tab 2 多梦炼金用户端传入格式
 */
export function buildAlchemyUserMessage(selectedDreams) {
  const lines = selectedDreams.map(
    (d, index) =>
      `梦境碎片${index + 1}（情绪标签：${d.moodTag}，压力值：${d.stressScore}）：${d.rawText}`
  )
  return lines.join('\n')
}

/**
 * 带超时熔断 (AbortController) 与原生 JSON Mode 的 DeepSeek 请求封装
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} timeoutMs - 默认 12 秒超时自动熔断，防止现场网络卡死
 */
async function callDeepSeekChat(systemPrompt, userMessage, timeoutMs = 12000) {
  const config = getApiConfig()
  const apiKey = (config.apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || '').trim()
  const baseUrl = (config.baseUrl || import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const model = (config.model || import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat').trim()

  if (!apiKey) {
    return { usedMock: true, rawText: null }
  }

  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.85,
      max_tokens: 600,
      // 开启 DeepSeek / OpenAI 兼容接口原生 JSON Mode，与前端 safeParseAIJson 构成双重保障
      response_format: { type: 'json_object' }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`DeepSeek API 请求异常 (${response.status}): ${errText || response.statusText}`)
    }

    const result = await response.json()
    const content = result?.choices?.[0]?.message?.content || ''
    return { usedMock: false, rawText: content }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`API 请求超过 ${timeoutMs / 1000} 秒未响应，已触发超时熔断`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 测试 API Key 与接口连通性（供设置弹窗【⚡ 测试连接】按钮调用）
 */
export async function testApiConnection(tempConfig) {
  const apiKey = (tempConfig.apiKey || '').trim()
  const baseUrl = (tempConfig.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '')
  const model = (tempConfig.model || 'deepseek-chat').trim()

  if (!apiKey) {
    return { ok: false, message: '请先填入 API Key 再测试连接（留空保存可使用内置演示引擎）' }
  }

  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const start = Date.now()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '请仅回复 OK' }],
        max_tokens: 10
      }),
      signal: controller.signal
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { ok: false, message: `连接失败 (${res.status})：${errText.slice(0, 80) || res.statusText}` }
    }

    const latency = Date.now() - start
    return { ok: true, message: `连接成功！模型 ${model} 响应耗时 ${latency}ms` }
  } catch (err) {
    return {
      ok: false,
      message: err.name === 'AbortError' ? '连接超时（超过 8 秒），请检查网络或接口地址' : `网络异常：${err.message}`
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Tab 1：调用 AI 生成单梦塔罗牌解析
 */
export async function generateDreamTarot(rawText, persona) {
  const userMessage = buildTarotUserMessage(rawText, persona)

  try {
    const { usedMock, rawText: aiRawText } = await callDeepSeekChat(TAROT_SYSTEM_PROMPT, userMessage)
    if (usedMock) {
      await new Promise((r) => setTimeout(r, 1800))
      const mockJson = buildSmartMockTarot(rawText, persona)
      return {
        ...safeParseAIJson(JSON.stringify(mockJson), 'tarot'),
        _source: 'mock'
      }
    }

    const parsed = safeParseAIJson(aiRawText, 'tarot')
    return {
      ...parsed,
      _source: 'deepseek'
    }
  } catch (err) {
    console.warn('调用 DeepSeek 接口异常，已自动切换智能兜底解析:', err)
    const fallbackMock = buildSmartMockTarot(rawText, persona)
    return {
      ...safeParseAIJson(JSON.stringify(fallbackMock), 'tarot'),
      _source: 'fallback',
      _errorMsg: err.message
    }
  }
}

/**
 * Tab 2：调用 AI 进行多梦“潜意识炼金合成”
 */
export async function generateDreamAlchemy(selectedDreams) {
  const userMessage = buildAlchemyUserMessage(selectedDreams)

  try {
    const { usedMock, rawText: aiRawText } = await callDeepSeekChat(ALCHEMY_SYSTEM_PROMPT, userMessage)
    if (usedMock) {
      await new Promise((r) => setTimeout(r, 1800))
      const mockJson = buildSmartMockAlchemy(selectedDreams)
      return {
        ...safeParseAIJson(JSON.stringify(mockJson), 'alchemy'),
        _source: 'mock'
      }
    }

    const parsed = safeParseAIJson(aiRawText, 'alchemy')
    return {
      ...parsed,
      _source: 'deepseek'
    }
  } catch (err) {
    console.warn('调用 DeepSeek 炼金接口异常，已自动切换智能兜底合成:', err)
    const fallbackMock = buildSmartMockAlchemy(selectedDreams)
    return {
      ...safeParseAIJson(JSON.stringify(fallbackMock), 'alchemy'),
      _source: 'fallback',
      _errorMsg: err.message
    }
  }
}

/**
 * 免 Key 演示模式下的智能单梦生成器（根据输入关键词与所选人设动态匹配）
 */
function buildSmartMockTarot(rawText, persona) {
  const text = rawText.trim()
  const isExamOrWork = /考|题|作业|论文|迟到|挂科|代码|bug|答辩/i.test(text)
  const isCyber = /机甲|赛博|AI|乱码|数据|矩阵|飞船|霓虹|游戏/i.test(text)
  const isHeal = /海|猫|花|云|飞|星空|森林|晒太阳|奶茶|风/i.test(text)

  let emoji = '🌙'
  let moodTag = '荒诞'
  let stressScore = 62
  let cssGradient = 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)'
  let title = '午夜潜意识漫游'

  if (isExamOrWork) {
    emoji = '🧹'
    moodTag = '焦虑'
    stressScore = 82
    cssGradient = 'linear-gradient(135deg, #232526 0%, #414345 50%, #8e2de2 100%)'
    title = '失重考场的乱码飞行'
  } else if (isCyber) {
    emoji = '👾'
    moodTag = '赛博'
    stressScore = 68
    cssGradient = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #00d2ff 100%)'
    title = '霓虹矩阵的神经漫游'
  } else if (isHeal) {
    emoji = '🐋'
    moodTag = '治愈'
    stressScore = 28
    cssGradient = 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
    title = '云端鲸落的微风森林'
  } else if (text.length > 18) {
    emoji = '🔮'
    moodTag = '预言'
    stressScore = 55
    cssGradient = 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)'
    title = '星界迷宫的命运折叠'
  }

  const personaReplies = {
    弗洛伊德: `从精神分析视角来看，“${text.slice(0, 14)}...”中的超现实意象是你近期自我防御机制的投射。超我正对现实中的日程压力发出提醒，而本我渴望通过奇幻失重感寻求释放。接纳这份不确定感，焦虑自会消解。`,
    赛博周公: `卦象显示你的脑机接口缓存区有些许过载！梦中“${text.slice(0, 12)}”乃赛博紫微星动之兆，主近期算力消耗偏大但暗藏转机。宜今夜子时前断开Wi-Fi休眠重构神经元，明日必逢吉兆。`,
    毒舌室友: `别怀疑了，这就是你白天疯狂划水、晚上熬夜刷手机的心虚写照！连做梦都在上演“${text.slice(0, 12)}”，说明你潜意识里想直接开倍速跳过DDL。赶紧合上手机去把正事干完，不然梦里都得加班！`
  }

  return {
    title,
    emoji,
    moodTag,
    stressScore,
    cssGradient,
    analysis: personaReplies[persona] || personaReplies['毒舌室友']
  }
}

/**
 * 免 Key 演示模式下的智能多梦炼金生成器
 */
function buildSmartMockAlchemy(dreams) {
  const avgStress = Math.round(
    dreams.reduce((acc, d) => acc + (Number(d.stressScore) || 50), 0) / dreams.length
  )
  const keywords = dreams.map((d) => `“${d.title}”`).join('与')

  return {
    alchemyTitle: avgStress >= 70 ? 'Deadline前夕的赛博逃亡' : '平行时空的多重脑洞共振',
    badgeEmoji: avgStress >= 70 ? '🔮' : '🧬',
    coreCommonality: `这 ${dreams.length} 个梦表面场景各异，实则都映射出你近期面对多项任务并行时的时间紧迫感，以及渴望打破常规束缚的潜意识防御心理。`,
    mashupStory: `在平行宇宙里，你正穿梭于${keywords}交织的奇幻走廊，情急之下你把梦里的焦虑道具折成发光纸飞机掷向虚空，没想到乱码瞬间化作星河桥梁，带你稳稳降落在满是晚风的天台长舒了一口气。`,
    actionAdvice: '把最头疼的任务拆成15分钟能做完的第一小步，做完立刻奖励自己一杯热饮。'
  }
}
