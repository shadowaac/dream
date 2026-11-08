<template>
  <div v-if="report" class="modal-backdrop" @click.self="$emit('close')">
    <!-- 带有流光金边特效的特殊大卡片 -->
    <div class="alchemy-gold-wrapper animate-tarot-in">
      <div class="alchemy-modal-card">
        <button class="modal-close-btn gold" @click="$emit('close')" title="关闭">✕</button>

        <!-- 顶部炼金徽章与报告头 -->
        <div class="alchemy-header">
          <div class="alchemy-subtitle">✦ 阶段潜意识合成报告 ✦</div>
          <div class="alchemy-badge-emoji">{{ report.badgeEmoji || '🔮' }}</div>
          <!-- 模块 1：合成产物名称 -->
          <h3 class="alchemy-title">《{{ report.alchemyTitle }}》</h3>
          <div class="alchemy-meta-row">
            <span>炼成时间：{{ report.createTime }}</span>
            <span v-if="sourceDreams.length" class="source-count-pill">
              融合 {{ sourceDreams.length }} 枚梦境碎片
            </span>
          </div>
        </div>

        <!-- 参与合成的源梦境微缩胶囊 -->
        <div v-if="sourceDreams.length" class="alchemy-sources-bar">
          <div
            v-for="item in sourceDreams"
            :key="item.id"
            class="source-mini-chip"
            :style="{ background: item.cssGradient }"
          >
            <span>{{ item.emoji }}</span>
            <span class="source-mini-title">{{ item.title }}</span>
          </div>
        </div>

        <!-- 四个核心高亮模块 -->
        <div class="alchemy-sections">
          <!-- 模块 2：潜意识核心共性 -->
          <div class="alchemy-section-card commonality">
            <div class="section-tag">🔍 潜意识核心共性</div>
            <p class="section-body">{{ report.coreCommonality }}</p>
          </div>

          <!-- 模块 3：平行宇宙脑洞剧场 -->
          <div class="alchemy-section-card mashup">
            <div class="section-tag">🌌 平行宇宙脑洞剧场</div>
            <p class="section-body story-text">{{ report.mashupStory }}</p>
          </div>

          <!-- 模块 4：现实解压处方 -->
          <div class="alchemy-section-card advice">
            <div class="section-tag">💊 今日现实解压处方</div>
            <p class="section-body advice-highlight">{{ report.actionAdvice }}</p>
          </div>
        </div>

        <div class="alchemy-footer-row">
          <button type="button" class="copy-alchemy-btn" @click="handleCopyAlchemy">
            📋 复制诊断书
          </button>
          <button type="button" class="gold-confirm-btn" @click="$emit('close')">
            ✨ 已收录至炼金图鉴
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  report: {
    type: Object,
    default: null
  },
  dreamList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'toast'])

const sourceDreams = computed(() => {
  if (!props.report || !Array.isArray(props.report.sourceDreamIds)) return []
  return props.dreamList.filter((d) => props.report.sourceDreamIds.includes(d.id))
})

async function handleCopyAlchemy() {
  if (!props.report) return
  const r = props.report
  const text = [
    `${r.badgeEmoji || '🔮'}【潜意识炼金诊断书】《${r.alchemyTitle}》`,
    `🔍 核心共性：${r.coreCommonality}`,
    `🌌 平行宇宙脑洞剧场：${r.mashupStory}`,
    `💊 今日现实解压处方：${r.actionAdvice}`,
    `—— 来自 DreamTarot 潜意识炼金炉`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(text)
    emit('toast', '📋 炼金诊断书已复制到剪贴板！')
  } catch {
    emit('toast', '复制失败，请手动选择复制')
  }
}
</script>
