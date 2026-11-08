<template>
  <section class="tab-panel gallery-panel">
    <!-- 顶部标题与【✨ 潜意识炼金】入口按钮 -->
    <div class="gallery-top-header">
      <div>
        <h2 class="panel-heading">梦境画廊</h2>
        <p class="panel-subtext">
          已封存 {{ dreamList.length }} 枚记忆胶卷 · {{ alchemyList.length }} 份炼金报告
        </p>
      </div>
      <div class="gallery-header-actions">
        <button
          type="button"
          class="alchemy-mode-btn"
          :class="{ active: isAlchemyMode }"
          @click="toggleAlchemyMode"
        >
          <span>{{ isAlchemyMode ? '✕ 退出炼金' : '✨ 潜意识炼金' }}</span>
        </button>
      </div>
    </div>

    <!-- 视图切换：记忆胶卷卡片墙 vs 炼金图鉴子列表 -->
    <div class="subview-tabs">
      <button
        type="button"
        class="subview-tab"
        :class="{ active: activeSubview === 'dreams' }"
        @click="activeSubview = 'dreams'"
      >
        🎞️ 梦境卡片墙 ({{ dreamList.length }})
      </button>
      <button
        type="button"
        class="subview-tab"
        :class="{ active: activeSubview === 'alchemies' }"
        @click="activeSubview = 'alchemies'"
      >
        🔮 炼金图鉴 ({{ alchemyList.length }})
      </button>
    </div>

    <!-- 子视图 A：梦境卡片墙 -->
    <template v-if="activeSubview === 'dreams'">
      <!-- 顶栏快捷筛选区（搜索框 + 情绪胶囊过滤 + 人设筛选 + 排序/单双列切换） -->
      <div class="filter-bar-container">
        <!-- 关键词实时搜索与人设过滤栏 -->
        <div class="search-and-persona-row">
          <div class="gallery-search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchKeyword"
              type="text"
              class="gallery-search-input"
              placeholder="搜索梦境标题、关键词或解梦手记..."
            />
            <button
              v-if="searchKeyword"
              type="button"
              class="search-clear-btn"
              @click="searchKeyword = ''"
            >
              ✕
            </button>
          </div>
          <select v-model="activePersona" class="persona-filter-select" title="按解梦大师人设筛选">
            <option value="全部">🎭 全部人设</option>
            <option value="弗洛伊德">🧐 弗洛伊德</option>
            <option value="赛博周公">🤖 赛博周公</option>
            <option value="毒舌室友">🌶️ 毒舌室友</option>
          </select>
        </div>

        <!-- 第一行：横向情绪胶囊按钮 -->
        <div class="mood-filter-scroll">
          <button
            v-for="tag in filterTags"
            :key="tag"
            type="button"
            class="filter-capsule"
            :class="{ active: activeMood === tag }"
            @click="activeMood = tag"
          >
            {{ tag }}
            <span v-if="tag !== '全部'" class="tag-count">{{ getTagCount(tag) }}</span>
          </button>
        </div>

        <!-- 第二行：炼金提示 / 结果数 + 排序与布局切换 -->
        <div class="toolbar-second-row">
          <span class="alchemy-tip-text" v-if="isAlchemyMode">
            ⚡ 请勾选 2~3 张梦境卡进行潜意识碰撞合成
          </span>
          <span class="result-count-text" v-else>
            匹配到 {{ filteredDreams.length }} 条记录
          </span>

          <div class="sort-and-layout-btns">
            <button type="button" class="mini-tool-btn" @click="toggleSortMode">
              {{ sortBy === 'time' ? '🕒 按时间' : '🔥 按压力值' }}
            </button>
            <button
              type="button"
              class="mini-tool-btn"
              @click="isTwoColumn = !isTwoColumn"
              :title="isTwoColumn ? '切换单列' : '切换双列'"
            >
              {{ isTwoColumn ? '⊞ 双列' : '☰ 单列' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredDreams.length === 0" class="empty-gallery-box">
        <div class="empty-emoji">🌌</div>
        <p>未找到匹配的梦境记录</p>
        <button
          v-if="activeMood !== '全部' || activePersona !== '全部' || searchKeyword"
          type="button"
          class="reset-filter-link"
          @click="resetFilters"
        >
          清除筛选条件
        </button>
      </div>

      <!-- 双列/单列彩色梦境卡片墙 -->
      <div
        v-else
        class="dream-cards-wall"
        :class="{
          'two-col': isTwoColumn,
          'one-col': !isTwoColumn,
          'with-alchemy-bar': isAlchemyMode
        }"
      >
        <article
          v-for="item in filteredDreams"
          :key="item.id"
          class="dream-wall-card"
          :class="{
            'is-selected': selectedIds.includes(item.id),
            'alchemy-selectable': isAlchemyMode
          }"
          :style="{ background: item.cssGradient }"
          @click="handleCardClick(item)"
        >
          <!-- 右上角：情绪标签 + 高压预警角标 + 炼金多选框/删除按钮 -->
          <div class="card-top-bar">
            <div class="card-top-tags">
              <span class="card-mood-pill">{{ item.moodTag }}</span>
              <span v-if="item.stressScore >= 75" class="high-stress-pill" title="高压梦境预警">
                ⚡ 高压
              </span>
            </div>
            <div
              v-if="isAlchemyMode"
              class="alchemy-checkbox"
              :class="{ checked: selectedIds.includes(item.id) }"
            >
              <span v-if="selectedIds.includes(item.id)">✓</span>
            </div>
            <button
              v-else
              type="button"
              class="card-delete-btn"
              title="删除此梦境（可撤销）"
              @click.stop="$emit('delete-dream', item.id)"
            >
              ✕
            </button>
          </div>

          <!-- 中央大号 Emoji 与标题 -->
          <div class="card-center-visual">
            <div class="card-big-emoji">{{ item.emoji }}</div>
            <h3 class="card-dream-title">{{ item.title }}</h3>
            <p v-if="!isTwoColumn" class="card-raw-excerpt">{{ item.rawText }}</p>
          </div>

          <!-- 底部压力分值与日期 -->
          <div class="card-bottom-meta">
            <div class="card-stress-badge">
              <span>压力 {{ item.stressScore }}</span>
              <div class="mini-stress-bar">
                <div class="mini-stress-fill" :style="{ width: item.stressScore + '%' }"></div>
              </div>
            </div>
            <div class="card-date-persona">
              <span>{{ item.persona }}</span>
              <span>·</span>
              <span>{{ formatShortDate(item.createTime) }}</span>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- 子视图 B：炼金图鉴子列表 -->
    <template v-else>
      <div v-if="alchemyList.length === 0" class="empty-gallery-box">
        <div class="empty-emoji">⚗️</div>
        <p>尚未进行过潜意识炼金合成，点击右上角【✨ 潜意识炼金】试试吧！</p>
      </div>

      <div v-else class="alchemy-archive-list">
        <article
          v-for="rep in alchemyList"
          :key="rep.id"
          class="alchemy-archive-card"
          @click="$emit('view-alchemy', rep)"
        >
          <div class="archive-card-left">
            <span class="archive-emoji">{{ rep.badgeEmoji || '🔮' }}</span>
          </div>
          <div class="archive-card-body">
            <div class="archive-title-row">
              <h4>《{{ rep.alchemyTitle }}》</h4>
              <button
                type="button"
                class="archive-del-btn"
                title="删除报告（可撤销）"
                @click.stop="$emit('delete-alchemy', rep.id)"
              >
                ✕
              </button>
            </div>
            <p class="archive-commonality">{{ rep.coreCommonality }}</p>
            <div class="archive-footer-meta">
              <span class="prescription-tag">💊 {{ rep.actionAdvice }}</span>
              <span class="archive-time">{{ rep.createTime }}</span>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- 底部浮现的半透明潜意识炼金操作栏 -->
    <transition name="slide-up">
      <div v-if="isAlchemyMode" class="alchemy-floating-dock">
        <div class="dock-status">
          <span class="dock-orb">⚗️</span>
          <div>
            <div class="dock-count">
              已选 <strong>{{ selectedIds.length }}</strong> / 3 个梦境碎片
            </div>
            <div class="dock-sub">至少选择 2 个不同梦境触发平行宇宙合成</div>
          </div>
        </div>
        <button
          type="button"
          class="start-alchemy-btn"
          :disabled="selectedIds.length < 2 || alchemyLoading"
          @click="handleStartAlchemy"
        >
          <template v-if="alchemyLoading">
            <span class="spinner-ring small"></span>
            <span>炼金融合中...</span>
          </template>
          <template v-else>
            <span>🔥 开始炼金合成</span>
          </template>
        </button>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VALID_MOOD_TAGS } from '../utils/aiParser'
import { generateDreamAlchemy } from '../services/deepseek'
import { formatNowTime } from '../utils/storage'

const props = defineProps({
  dreamList: {
    type: Array,
    required: true
  },
  alchemyList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'view-dream',
  'delete-dream',
  'alchemy-created',
  'view-alchemy',
  'delete-alchemy',
  'toast'
])

const filterTags = ['全部', ...VALID_MOOD_TAGS]
const activeMood = ref('全部')
const activePersona = ref('全部')
const searchKeyword = ref('')
const sortBy = ref('time') // 'time' | 'stress'
const isTwoColumn = ref(true)
const activeSubview = ref('dreams') // 'dreams' | 'alchemies'

// 进阶 1：潜意识炼金多选状态
const isAlchemyMode = ref(false)
const selectedIds = ref([])
const alchemyLoading = ref(false)

function getTagCount(tag) {
  return props.dreamList.filter((d) => d.moodTag === tag).length
}

function resetFilters() {
  activeMood.value = '全部'
  activePersona.value = '全部'
  searchKeyword.value = ''
}

const filteredDreams = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()

  let list = props.dreamList.filter((d) => {
    const matchMood = activeMood.value === '全部' || d.moodTag === activeMood.value
    const matchPersona = activePersona.value === '全部' || d.persona === activePersona.value
    const matchKeyword =
      !kw ||
      String(d.title || '').toLowerCase().includes(kw) ||
      String(d.rawText || '').toLowerCase().includes(kw) ||
      String(d.analysis || '').toLowerCase().includes(kw)
    return matchMood && matchPersona && matchKeyword
  })

  if (sortBy.value === 'stress') {
    list.sort((a, b) => (Number(b.stressScore) || 0) - (Number(a.stressScore) || 0))
  } else {
    list.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
  }
  return list
})

function toggleSortMode() {
  sortBy.value = sortBy.value === 'time' ? 'stress' : 'time'
}

function toggleAlchemyMode() {
  isAlchemyMode.value = !isAlchemyMode.value
  selectedIds.value = []
  if (isAlchemyMode.value) {
    activeSubview.value = 'dreams'
  }
}

function handleCardClick(dream) {
  if (!isAlchemyMode.value) {
    emit('view-dream', dream)
    return
  }

  const idx = selectedIds.value.indexOf(dream.id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    if (selectedIds.value.length >= 3) {
      emit('toast', '最多只能同时勾选 3 个梦境碎片进行炼金合成哦！')
      return
    }
    selectedIds.value.push(dream.id)
  }
}

async function handleStartAlchemy() {
  if (selectedIds.value.length < 2 || alchemyLoading.value) return

  const selectedDreams = props.dreamList.filter((d) => selectedIds.value.includes(d.id))
  alchemyLoading.value = true

  try {
    const aiAlchemy = await generateDreamAlchemy(selectedDreams)
    const newReport = {
      id: `alchemy_${Date.now()}`,
      createTime: formatNowTime(),
      sourceDreamIds: [...selectedIds.value],
      alchemyTitle: aiAlchemy.alchemyTitle,
      badgeEmoji: aiAlchemy.badgeEmoji,
      coreCommonality: aiAlchemy.coreCommonality,
      mashupStory: aiAlchemy.mashupStory,
      actionAdvice: aiAlchemy.actionAdvice,
      _source: aiAlchemy._source
    }

    isAlchemyMode.value = false
    selectedIds.value = []
    emit('alchemy-created', newReport)
  } finally {
    alchemyLoading.value = false
  }
}

function formatShortDate(timeStr = '') {
  return timeStr.length >= 16 ? timeStr.slice(5, 16) : timeStr
}
</script>
