<template>
  <section class="tab-panel radar-panel">
    <div class="radar-top-header">
      <h2 class="panel-heading">潜意识雷达</h2>
      <p class="panel-subtext">纯前端零延迟实时演算 · 睡眠精神状态统计大屏</p>
    </div>

    <!-- 空状态兜底 -->
    <div v-if="dreamList.length === 0" class="empty-gallery-box">
      <div class="empty-emoji">📡</div>
      <p>暂无梦境样本数据，快去【造梦台】录入第一条梦境吧！</p>
    </div>

    <template v-else>
      <!-- 卡片一：顶部徽章卡【近期精神状态称号】 -->
      <div class="radar-card badge-hero-card" :style="{ background: statusBadge.gradient }">
        <div class="badge-card-header">
          <span class="radar-chip">🏅 近期精神状态称号</span>
          <span class="sample-tag">基于 {{ dreamList.length }} 份样本</span>
        </div>
        <div class="badge-main-row">
          <div class="badge-big-icon">{{ statusBadge.icon }}</div>
          <div class="badge-text-col">
            <h3 class="badge-title">{{ statusBadge.title }}</h3>
            <p class="badge-desc">{{ statusBadge.desc }}</p>
          </div>
        </div>
        <div class="badge-kpi-strip">
          <div class="kpi-item">
            <span class="kpi-num">{{ avgStress }}<small>分</small></span>
            <span class="kpi-label">平均压力值</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-num">{{ dominantMood.tag }}</span>
            <span class="kpi-label">主导梦境情绪 ({{ dominantMood.percent }}%)</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-num">{{ favoritePersona }}</span>
            <span class="kpi-label">最常请教大师</span>
          </div>
        </div>
      </div>

      <!-- 卡片二：中部图表一【梦境情绪光谱分布】（含 SVG 环形饼图 + 严格100%进度条） -->
      <div class="radar-card spectrum-card">
        <div class="card-section-header">
          <div>
            <h3 class="radar-card-title">🌈 梦境情绪光谱分布</h3>
            <p class="radar-card-sub">最大余额法校准 · 五维情绪占比严格总和 100%</p>
          </div>
          <span class="total-pill">共 {{ dreamList.length }} 梦</span>
        </div>

        <div class="spectrum-visual-grid">
          <!-- 左侧 SVG 环形饼图 -->
          <div class="donut-chart-wrap">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="transparent"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="14"
              />
              <circle
                v-for="seg in donutSegments"
                :key="seg.tag"
                cx="60"
                cy="60"
                r="44"
                fill="transparent"
                :stroke="seg.color"
                stroke-width="14"
                :stroke-dasharray="seg.dashArray"
                :stroke-dashoffset="seg.dashOffset"
                stroke-linecap="butt"
              />
            </svg>
            <div class="donut-center-text">
              <span class="donut-top-tag">{{ dominantMood.tag }}</span>
              <span class="donut-top-pct">{{ dominantMood.percent }}%</span>
            </div>
          </div>

          <!-- 右侧 5 条圆角百分比进度条 -->
          <div class="spectrum-bars-list">
            <div v-for="item in moodSpectrum" :key="item.tag" class="spectrum-row">
              <div class="spectrum-label-row">
                <span class="spectrum-tag-name">
                  <i class="mood-dot" :style="{ background: item.color }"></i>
                  {{ item.tag }}
                </span>
                <span class="spectrum-stats">
                  {{ item.count }} 次 · <strong>{{ item.percent }}%</strong>
                </span>
              </div>
              <div class="spectrum-track">
                <div
                  class="spectrum-fill"
                  :style="{ width: item.percent + '%', background: item.gradient }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片三：底部图表二【近 7 次睡眠压力走势】（点击柱子可直接复看对应塔罗牌） -->
      <div class="radar-card trend-card">
        <div class="card-section-header">
          <div>
            <h3 class="radar-card-title">📈 近 {{ recentSevenDreams.length }} 次睡眠压力走势</h3>
            <p class="radar-card-sub">潜意识压力分值 (0~100) 高低起伏 · 点击柱体可复看该梦境</p>
          </div>
          <span class="avg-line-pill">均值 {{ avgStress }} 分</span>
        </div>

        <!-- 柱状走势图容器 -->
        <div class="trend-chart-box">
          <!-- 警戒线与均值虚线 -->
          <div class="chart-guide-line" :style="{ bottom: avgStress + '%' }">
            <span class="guide-label">均值 {{ avgStress }}</span>
          </div>

          <div class="bars-columns">
            <div
              v-for="item in recentSevenDreams"
              :key="item.id"
              class="bar-col-item clickable"
              :title="`点击查看：《${item.title}》(${item.stressScore}分)`"
              @click="$emit('view-dream', item)"
            >
              <span class="bar-score-top">{{ item.stressScore }}</span>
              <div class="bar-vertical-track">
                <div
                  class="bar-vertical-fill"
                  :class="getBarColorClass(item.stressScore)"
                  :style="{ height: item.stressScore + '%' }"
                ></div>
              </div>
              <span class="bar-emoji-bottom">{{ item.emoji }}</span>
              <span class="bar-date-label">{{ item.shortDate }}</span>
            </div>
          </div>
        </div>

        <!-- 底部自动计算的汇总提示 -->
        <div class="trend-summary-banner">
          <span>💡 汇总洞察：</span>
          <span>
            累计记录 <strong>{{ dreamList.length }}</strong> 个梦境，近期平均潜意识压力值为
            <strong>{{ avgStress }}</strong> 分（{{ stressEvaluationText }}）。
          </span>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { VALID_MOOD_TAGS } from '../utils/aiParser'

const props = defineProps({
  dreamList: {
    type: Array,
    required: true
  }
})

defineEmits(['view-dream'])

const MOOD_COLORS = {
  焦虑: {
    color: '#ff6b6b',
    gradient: 'linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%)'
  },
  荒诞: {
    color: '#a78bfa',
    gradient: 'linear-gradient(90deg, #8e2de2 0%, #4a00e0 100%)'
  },
  治愈: {
    color: '#34d399',
    gradient: 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)'
  },
  预言: {
    color: '#fbbf24',
    gradient: 'linear-gradient(90deg, #f7971e 0%, #ffd200 100%)'
  },
  赛博: {
    color: '#38bdf8',
    gradient: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)'
  }
}

// 计算平均压力值
const avgStress = computed(() => {
  if (!props.dreamList.length) return 0
  const total = props.dreamList.reduce((sum, d) => sum + (Number(d.stressScore) || 0), 0)
  return Math.round(total / props.dreamList.length)
})

// 最常使用的解梦大师人设
const favoritePersona = computed(() => {
  if (!props.dreamList.length) return '毒舌室友'
  const counts = {}
  props.dreamList.forEach((d) => {
    const p = d.persona || '毒舌室友'
    counts[p] = (counts[p] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
})

/**
 * 五大情绪光谱分布统计（采用“最大余额法”确保 5 项百分比之和严格等于 100%）
 */
const moodSpectrum = computed(() => {
  const total = props.dreamList.length
  if (!total) {
    return VALID_MOOD_TAGS.map((tag) => ({
      tag,
      count: 0,
      percent: 0,
      color: MOOD_COLORS[tag].color,
      gradient: MOOD_COLORS[tag].gradient
    }))
  }

  const rawItems = VALID_MOOD_TAGS.map((tag, index) => {
    const count = props.dreamList.filter((d) => d.moodTag === tag).length
    const exact = (count / total) * 100
    const floored = Math.floor(exact)
    return {
      tag,
      index,
      count,
      floored,
      remainder: exact - floored,
      color: MOOD_COLORS[tag].color,
      gradient: MOOD_COLORS[tag].gradient
    }
  })

  let remainderSum = 100 - rawItems.reduce((acc, item) => acc + item.floored, 0)
  const sortedByRemainder = [...rawItems].sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < remainderSum; i++) {
    sortedByRemainder[i % sortedByRemainder.length].floored += 1
  }

  return rawItems.map((item) => ({
    tag: item.tag,
    count: item.count,
    percent: item.floored,
    color: item.color,
    gradient: item.gradient
  }))
})

// SVG 环形饼图分段计算 (周长 C = 2 * π * 44 ≈ 276.46)
const donutSegments = computed(() => {
  const circumference = 2 * Math.PI * 44
  let accumulatedPercent = 0

  return moodSpectrum.value
    .filter((item) => item.percent > 0)
    .map((item) => {
      const segLength = (item.percent / 100) * circumference
      const dashArray = `${segLength} ${circumference - segLength}`
      // 从顶部 (-90deg，即周长 1/4 处) 开始顺时针绘制
      const dashOffset = circumference * 0.25 - (accumulatedPercent / 100) * circumference
      accumulatedPercent += item.percent
      return {
        tag: item.tag,
        color: item.color,
        dashArray,
        dashOffset
      }
    })
})

// 主导情绪
const dominantMood = computed(() => {
  if (!moodSpectrum.value.length) return { tag: '荒诞', percent: 0 }
  return [...moodSpectrum.value].sort((a, b) => b.count - a.count)[0]
})

// 顶部徽章卡【近期精神状态称号】自动推导逻辑
const statusBadge = computed(() => {
  const score = avgStress.value
  const topMood = dominantMood.value.tag

  if (score > 75) {
    return {
      icon: '⚡',
      title: '高压渡劫期·急需躺平',
      desc: '近期潜意识神经高度紧绷，建议今晚强制关机断网，给大脑放个假！',
      gradient: 'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)'
    }
  }
  if (topMood === '荒诞') {
    return {
      icon: '🌌',
      title: '脑洞漫游家·跨维造梦师',
      desc: '你的睡眠剧场充满天马行空的奇思妙想，右脑创造力正处于巅峰状态。',
      gradient: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)'
    }
  }
  if (topMood === '治愈' || score < 40) {
    return {
      icon: '🌿',
      title: '深海呼吸者·情绪稳定大师',
      desc: '潜意识温和澄澈，内心自我修复机制运转良好，继续保持这份松弛感。',
      gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
    }
  }
  if (topMood === '赛博') {
    return {
      icon: '👾',
      title: '赛博守夜人·霓虹漫游者',
      desc: '数字洪流与现实记忆在梦中高频交织，睡前不妨远离电子屏幕半小时。',
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
    }
  }
  if (topMood === '预言') {
    return {
      icon: '🔮',
      title: '星界观测者·直觉敏锐体',
      desc: '潜意识正积极预演未来可能，你对近期目标有着强烈的掌控欲与期待。',
      gradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)'
    }
  }
  return {
    icon: '🌙',
    title: '轻度备战态·潜意识活跃期',
    desc: '现实压力与奇幻想象处于微妙平衡，适当运动有助于提升深睡质量。',
    gradient: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)'
  }
})

// 最近 7 次睡眠压力走势（按时间从旧到新排列，便于观察趋势）
const recentSevenDreams = computed(() => {
  const sortedDesc = [...props.dreamList].sort((a, b) =>
    String(b.createTime).localeCompare(String(a.createTime))
  )
  return sortedDesc
    .slice(0, 7)
    .reverse()
    .map((d) => ({
      ...d,
      shortDate: d.createTime ? d.createTime.slice(5, 10) : '近期'
    }))
})

const stressEvaluationText = computed(() => {
  if (avgStress.value >= 75) return '处于高压预警区间，需注意解压'
  if (avgStress.value >= 50) return '处于中等活跃区间，劳逸结合即可'
  return '处于低压力放松区间，睡眠心理质量优良'
})

function getBarColorClass(score) {
  if (score >= 75) return 'bar-high'
  if (score >= 45) return 'bar-mid'
  return 'bar-low'
}
</script>
