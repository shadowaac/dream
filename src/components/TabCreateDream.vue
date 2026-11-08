<template>
  <section class="tab-panel create-dream-panel">
    <!-- 顶部引导标题 -->
    <div class="hero-intro">
      <div class="moon-orb">🌙</div>
      <h2 class="panel-heading">潜意识造梦台</h2>
      <p class="panel-subtext">将醒来尚存余温的梦境碎片交付于此，显影专属情绪塔罗</p>
    </div>

    <!-- 带呼吸微光的文本输入框 -->
    <div class="breathing-input-wrapper" :class="{ focused: isFocused, recording: isRecording }">
      <div class="input-glow-header">
        <span class="glow-dot" :class="{ pulse: isRecording }"></span>
        <span>{{ isRecording ? '🎙️ 正在聆听你的梦境叙述...' : '梦境碎片捕捉器' }}</span>
        <div class="input-header-right">
          <button
            type="button"
            class="voice-input-btn"
            :class="{ active: isRecording }"
            :disabled="loading"
            @click="toggleVoiceRecognition"
            title="语音口述录入梦境"
          >
            {{ isRecording ? '⏹ 停止口述' : '🎙️ 语音录入' }}
          </button>
          <span class="char-counter">{{ dreamText.length }}/240</span>
        </div>
      </div>

      <textarea
        v-model="dreamText"
        class="dream-textarea"
        maxlength="240"
        rows="4"
        placeholder="记录刚醒来的梦境碎片...（例如：梦见在教学楼里骑扫帚找考场，结果考卷发下来全是乱码）"
        :disabled="loading"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>

      <!-- 快捷灵感胶囊（方便现场演示一键填入） -->
      <div class="quick-prompts-bar">
        <span class="quick-label">✨ 灵感速填：</span>
        <button
          v-for="sample in samplePrompts"
          :key="sample.short"
          type="button"
          class="sample-chip"
          :disabled="loading"
          @click="applySample(sample.text)"
        >
          {{ sample.short }}
        </button>
        <button
          v-if="dreamText"
          type="button"
          class="clear-text-btn"
          :disabled="loading"
          @click="dreamText = ''"
        >
          清空
        </button>
      </div>
    </div>

    <!-- 解梦大师人设胶囊单选框（并排放置） -->
    <div class="persona-section">
      <div class="section-label-row">
        <span class="section-title">选择解梦大师人设</span>
        <span class="section-hint">不同视角将赋予截然不同的解析语调</span>
      </div>
      <div class="persona-capsules-grid">
        <button
          v-for="item in personas"
          :key="item.name"
          type="button"
          class="persona-capsule-card"
          :class="{ active: selectedPersona === item.name }"
          :disabled="loading"
          @click="selectedPersona = item.name"
        >
          <span class="persona-icon">{{ item.icon }}</span>
          <span class="persona-name">{{ item.name }}</span>
          <span class="persona-desc">{{ item.desc }}</span>
        </button>
      </div>
    </div>

    <!-- 底部大号渐变色按钮【生成梦境塔罗】（含多阶段动态轮播文案） -->
    <div class="action-submit-area">
      <button
        type="button"
        class="generate-tarot-btn"
        :class="{ 'is-loading': loading }"
        :disabled="loading || !dreamText.trim()"
        @click="handleGenerate"
      >
        <template v-if="loading">
          <span class="spinner-ring"></span>
          <span class="stage-loading-text">{{ currentLoadingStageText }}</span>
        </template>
        <template v-else>
          <span class="sparkle-icon">🔮</span>
          <span>生成梦境塔罗</span>
        </template>
      </button>

      <!-- 阶段进度指示点 -->
      <div v-if="loading" class="loading-stage-dots">
        <span
          v-for="idx in 4"
          :key="idx"
          class="stage-dot"
          :class="{ active: loadingStageIndex >= idx - 1 }"
        ></span>
      </div>
      <p v-else class="engine-footnote">
        基于 DeepSeek 结构化渲染引擎 · 实时调配流体情绪色彩与潜意识压力值
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { generateDreamTarot } from '../services/deepseek'
import { formatNowTime } from '../utils/storage'

const emit = defineEmits(['tarot-generated', 'toast'])

const dreamText = ref('')
const selectedPersona = ref('毒舌室友')
const isFocused = ref(false)
const loading = ref(false)
const loadingStageIndex = ref(0)
const isRecording = ref(false)

let stageTimer = null
let recognitionInstance = null

const personas = [
  {
    name: '弗洛伊德',
    icon: '🧐',
    desc: '温和专业·潜意识剖析'
  },
  {
    name: '赛博周公',
    icon: '🤖',
    desc: '量子卦象·赛博黑话'
  },
  {
    name: '毒舌室友',
    icon: '🌶️',
    desc: '损友锐评·专治熬夜'
  }
]

const samplePrompts = [
  {
    short: '🧹 骑扫帚找考场乱码',
    text: '梦见在教学楼里骑扫帚找考场，结果考卷发下来全是乱码。'
  },
  {
    short: '⏰ 机械闹钟慢动作追赶',
    text: '梦见在霓虹街道被长着机械触手的巨大闹钟追赶，怎么跑都是慢动作。'
  },
  {
    short: '🐋 深海图书馆蓝鲸吃Bug',
    text: '梦见图书馆变成了深海，一只戴着眼镜的蓝鲸游过来帮我把代码里的Bug全吃掉了。'
  },
  {
    short: '🌠 天台流星雨变通知书',
    text: '梦见站在教学楼天台看流星雨，每一颗流星落下来都变成了一封未来的录取通知书。'
  }
]

// 根据所选人设动态定制 4 阶段等待文案
const currentLoadingStageText = computed(() => {
  const stageMap = {
    弗洛伊德: [
      '正在潜入潜意识冰山底层...',
      '正在捕捉梦境核心象征意象...',
      '弗洛伊德正在翻阅精神分析手记...',
      '正在调制流体情绪光谱与塔罗牌面...'
    ],
    赛博周公: [
      '正在接入脑机接口潜意识信道...',
      '正在演算量子周易六十四卦象...',
      '赛博周公正在编译神经元运势...',
      '正在渲染赛博霓虹流体塔罗牌面...'
    ],
    毒舌室友: [
      '正在潜入你熬夜过载的大脑皮层...',
      '正在锁定梦境里的心虚与摸鱼证据...',
      '毒舌室友正在酝酿一针见血的吐槽...',
      '正在生成专属梦境塔罗与压力指数...'
    ]
  }
  const list = stageMap[selectedPersona.value] || stageMap['毒舌室友']
  return list[loadingStageIndex.value % list.length]
})

function applySample(text) {
  dreamText.value = text
}

// 浏览器原生 Web Speech API 语音识别录入
function toggleVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    emit('toast', '当前浏览器环境暂不支持原生语音识别，请直接输入或使用灵感速填')
    return
  }

  if (isRecording.value && recognitionInstance) {
    recognitionInstance.stop()
    isRecording.value = false
    return
  }

  recognitionInstance = new SpeechRecognition()
  recognitionInstance.lang = 'zh-CN'
  recognitionInstance.continuous = false
  recognitionInstance.interimResults = true

  const baseText = dreamText.value ? dreamText.value + ' ' : ''

  recognitionInstance.onstart = () => {
    isRecording.value = true
  }

  recognitionInstance.onresult = (event) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    dreamText.value = (baseText + transcript).slice(0, 240)
  }

  recognitionInstance.onerror = () => {
    isRecording.value = false
    emit('toast', '语音识别中断，请检查麦克风权限')
  }

  recognitionInstance.onend = () => {
    isRecording.value = false
  }

  recognitionInstance.start()
}

async function handleGenerate() {
  const raw = dreamText.value.trim()
  if (!raw || loading.value) return

  loading.value = true
  loadingStageIndex.value = 0
  stageTimer = setInterval(() => {
    if (loadingStageIndex.value < 3) {
      loadingStageIndex.value += 1
    }
  }, 550)

  try {
    const aiResult = await generateDreamTarot(raw, selectedPersona.value)
    const completeDreamCard = {
      id: `dream_${Date.now()}`,
      createTime: formatNowTime(),
      rawText: raw,
      persona: selectedPersona.value,
      title: aiResult.title,
      emoji: aiResult.emoji,
      moodTag: aiResult.moodTag,
      stressScore: aiResult.stressScore,
      cssGradient: aiResult.cssGradient,
      analysis: aiResult.analysis,
      _source: aiResult._source
    }

    emit('tarot-generated', completeDreamCard)
    dreamText.value = ''
  } finally {
    if (stageTimer) {
      clearInterval(stageTimer)
      stageTimer = null
    }
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (stageTimer) clearInterval(stageTimer)
  if (recognitionInstance && isRecording.value) {
    recognitionInstance.stop()
  }
})
</script>
