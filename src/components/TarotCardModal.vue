<template>
  <div v-if="dream" class="modal-backdrop" @click.self="$emit('close')">
    <div class="tarot-3d-scene animate-tarot-in">
      <div class="tarot-3d-flipper" :class="{ 'is-flipped': isFlipped }">
        <!-- 牌背（神秘星月罗盘塔罗牌背，用于 3D 翻牌显影仪式感） -->
        <div class="tarot-face tarot-face-back" @click="isFlipped = true">
          <div class="back-celestial-frame">
            <div class="back-corner tl">✦</div>
            <div class="back-corner tr">✦</div>
            <div class="back-corner bl">✦</div>
            <div class="back-corner br">✦</div>
            <div class="back-compass-circle">
              <div class="back-moon-symbol">🔮</div>
            </div>
            <div class="back-mystic-title">SUBCONSCIOUS TAROT</div>
            <div class="back-mystic-sub">潜意识命运之轮 · 点击或等待显影</div>
          </div>
        </div>

        <!-- 牌面（正面：AI 动态渲染流体渐变 + 解析层） -->
        <div class="tarot-face tarot-face-front tarot-modal-card">
          <!-- 右上角操作按钮组 -->
          <div class="modal-top-right-btns">
            <button
              type="button"
              class="modal-flip-btn"
              title="翻转查看塔罗牌背"
              @click="isFlipped = !isFlipped"
            >
              🔄 牌背
            </button>
            <button
              type="button"
              class="modal-close-btn"
              title="关闭"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>

          <!-- 上半区（视觉层）：AI 实时调配的 CSS 流体渐变色 + 80px 核心意象 Emoji -->
          <div class="tarot-visual-top" :style="{ background: dream.cssGradient }">
            <div class="tarot-cosmic-ring"></div>
            <div class="tarot-top-meta">
              <span class="tarot-persona-badge">🎭 {{ dream.persona }}</span>
              <span v-if="dream._source === 'deepseek'" class="tarot-source-tag live">
                DeepSeek 实时显影
              </span>
              <span v-else class="tarot-source-tag demo">潜意识仿真显影</span>
            </div>
            <div class="tarot-hero-emoji">{{ dream.emoji }}</div>
            <div class="tarot-card-ornament">✦ TAROT OF SUBCONSCIOUS ✦</div>
          </div>

          <!-- 下半区（解析层）：8字奇幻标题、情绪胶囊、压力指数进度条、人设解梦文案 -->
          <div class="tarot-analysis-bottom">
            <div class="tarot-title-row">
              <h3 class="tarot-title">《{{ dream.title }}》</h3>
              <span class="mood-capsule" :class="'mood-' + dream.moodTag">
                {{ dream.moodTag }}
              </span>
            </div>

            <!-- 压力指数进度条 -->
            <div class="stress-meter-box">
              <div class="stress-meter-header">
                <span class="stress-label">潜意识压力指数</span>
                <span class="stress-value" :class="getStressLevelClass(dream.stressScore)">
                  {{ dream.stressScore }}<small>/100</small>
                </span>
              </div>
              <div class="stress-bar-track">
                <div
                  class="stress-bar-fill"
                  :class="getStressLevelClass(dream.stressScore)"
                  :style="{ width: dream.stressScore + '%' }"
                ></div>
              </div>
            </div>

            <!-- 原始梦境回显 -->
            <div class="raw-dream-quote">
              “{{ dream.rawText }}”
            </div>

            <!-- 80~100字解梦大师人设文案 -->
            <div class="analysis-content-box">
              <div class="analysis-speaker">{{ dream.persona }}解梦手记：</div>
              <p class="analysis-text">{{ dream.analysis }}</p>
            </div>

            <!-- 底部归档与复制分享动作按钮 -->
            <div class="tarot-modal-footer">
              <div v-if="isNew" class="new-tarot-actions">
                <button
                  type="button"
                  class="copy-sign-btn"
                  @click="handleCopyTarotText"
                  title="复制解梦签文"
                >
                  📋 复制签文
                </button>
                <button
                  type="button"
                  class="collect-film-btn"
                  @click="$emit('collect', dream)"
                >
                  <span>🎞️ 收入记忆胶卷</span>
                </button>
              </div>
              <div v-else class="preview-footer-actions">
                <span class="dream-time-stamp">记录于 {{ dream.createTime }}</span>
                <div class="preview-btn-group">
                  <button type="button" class="copy-sign-btn mini" @click="handleCopyTarotText">
                    📋 复制签文
                  </button>
                  <button type="button" class="secondary-close-btn" @click="$emit('close')">
                    合上塔罗牌
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  dream: {
    type: Object,
    default: null
  },
  isNew: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'collect', 'toast'])

const isFlipped = ref(true)
let flipTimer = null

watch(
  () => props.dream,
  (val) => {
    if (flipTimer) clearTimeout(flipTimer)
    if (!val) return
    if (props.isNew) {
      // 新生成的塔罗牌先展示神秘背面，420ms 后自动 3D 翻牌显影正面
      isFlipped.value = false
      flipTimer = setTimeout(() => {
        isFlipped.value = true
      }, 420)
    } else {
      isFlipped.value = true
    }
  },
  { immediate: true }
)

function getStressLevelClass(score) {
  if (score >= 75) return 'stress-high'
  if (score >= 45) return 'stress-mid'
  return 'stress-low'
}

async function handleCopyTarotText() {
  if (!props.dream) return
  const d = props.dream
  const shareText = [
    `🔮【潜意识梦境塔罗】${d.emoji}《${d.title}》`,
    `🏷️ 情绪光谱：${d.moodTag} ｜ ⚡ 压力指数：${d.stressScore}/100`,
    `💭 梦境原片：“${d.rawText}”`,
    `🎭 ${d.persona}解梦：${d.analysis}`,
    `—— 来自 DreamTarot 潜意识造梦台`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(shareText)
    emit('toast', '📋 解梦签文已复制到剪贴板，快去分享吧！')
  } catch {
    emit('toast', '复制失败，请手动长按选择文本复制')
  }
}
</script>
