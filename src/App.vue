<template>
  <div class="app-universe">
    <!-- 星空微光氛围背景层 -->
    <div class="ambient-nebula nebula-1"></div>
    <div class="ambient-nebula nebula-2"></div>

    <!-- 跨端自适应外壳容器（支持 PC 端一键切换手机视口与宽屏视口，Android 端自动全屏铺满） -->
    <div class="cross-device-shell" :class="{ 'wide-desktop-mode': isWideMode }">
      <!-- 顶部应用状态栏 -->
      <header class="app-topbar">
        <div class="brand-group">
          <span class="brand-logo">🔮</span>
          <div>
            <h1 class="brand-title">DreamTarot · 潜意识造梦</h1>
            <span class="brand-status">
              <i class="status-dot" :class="{ online: hasApiKey }"></i>
              {{ hasApiKey ? 'DeepSeek 实时引擎已连接' : '内置高仿真演示模式 (可配 Key)' }}
            </span>
          </div>
        </div>
        <div class="topbar-right-actions">
          <button
            type="button"
            class="viewport-switch-btn desktop-only"
            :title="isWideMode ? '切换为移动端手机视口' : '切换为电脑宽屏演示视口'"
            @click="isWideMode = !isWideMode"
          >
            {{ isWideMode ? '📱 手机视口' : '💻 宽屏视口' }}
          </button>
          <button
            type="button"
            class="topbar-gear-btn"
            title="配置 DeepSeek API Key 与数据管理"
            @click="showSettings = true"
          >
            ⚙️ 设置
          </button>
        </div>
      </header>

      <!-- 主内容滚动视图（对应 3 个底部 Tab 页面） -->
      <main class="app-main-viewport">
        <TabCreateDream
          v-if="currentTab === 'create'"
          @tarot-generated="onTarotGenerated"
          @toast="showToast"
        />

        <TabDreamGallery
          v-else-if="currentTab === 'gallery'"
          :dream-list="dreamList"
          :alchemy-list="alchemyList"
          @view-dream="onViewExistingDream"
          @delete-dream="onDeleteDream"
          @alchemy-created="onAlchemyCreated"
          @view-alchemy="onViewAlchemy"
          @delete-alchemy="onDeleteAlchemy"
          @toast="showToast"
        />

        <TabSubconsciousRadar
          v-else-if="currentTab === 'radar'"
          :dream-list="dreamList"
          @view-dream="onViewExistingDream"
        />
      </main>

      <!-- 底部 3 个 Tab 导航栏 -->
      <nav class="app-bottom-tabbar">
        <button
          type="button"
          class="tabbar-item"
          :class="{ active: currentTab === 'create' }"
          @click="currentTab = 'create'"
        >
          <span class="tab-icon">🌙</span>
          <span class="tab-label">造梦台</span>
        </button>

        <button
          type="button"
          class="tabbar-item"
          :class="{ active: currentTab === 'gallery' }"
          @click="currentTab = 'gallery'"
        >
          <span class="tab-icon">🎞️</span>
          <span class="tab-label">梦境画廊</span>
          <span v-if="dreamList.length" class="tab-badge">{{ dreamList.length }}</span>
        </button>

        <button
          type="button"
          class="tabbar-item"
          :class="{ active: currentTab === 'radar' }"
          @click="currentTab = 'radar'"
        >
          <span class="tab-icon">📡</span>
          <span class="tab-label">潜意识雷达</span>
        </button>
      </nav>

      <!-- 弹窗 1：单梦塔罗牌 3D 翻牌显影弹窗 -->
      <TarotCardModal
        :dream="activeTarotDream"
        :is-new="isTarotNew"
        @close="activeTarotDream = null"
        @collect="onCollectDreamToFilm"
        @toast="showToast"
      />

      <!-- 弹窗 2：金色流光《阶段潜意识合成报告》弹窗 -->
      <AlchemyReportModal
        :report="activeAlchemyReport"
        :dream-list="dreamList"
        @close="activeAlchemyReport = null"
        @toast="showToast"
      />

      <!-- 弹窗 3：DeepSeek API 配置与种子数据重置弹窗 -->
      <ApiSettingsModal
        :visible="showSettings"
        @close="showSettings = false"
        @saved="onApiConfigSaved"
        @reset-seed="onResetSeedData"
        @export-json="onExportJson"
        @import-json="onImportJson"
      />

      <!-- 轻提示 Toast（支持 4 秒内一键撤销删除） -->
      <transition name="fade">
        <div v-if="toastMsg" class="app-toast">
          <span>{{ toastMsg }}</span>
          <button
            v-if="undoSnapshot"
            type="button"
            class="toast-undo-btn"
            @click="handleUndoDelete"
          >
            ↩ 撤销
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TabCreateDream from './components/TabCreateDream.vue'
import TabDreamGallery from './components/TabDreamGallery.vue'
import TabSubconsciousRadar from './components/TabSubconsciousRadar.vue'
import TarotCardModal from './components/TarotCardModal.vue'
import AlchemyReportModal from './components/AlchemyReportModal.vue'
import ApiSettingsModal from './components/ApiSettingsModal.vue'
import {
  loadDreamList,
  saveDreamList,
  loadAlchemyList,
  saveAlchemyList,
  resetToSeedData,
  getApiConfig
} from './utils/storage'

const currentTab = ref('create')
const dreamList = ref([])
const alchemyList = ref([])
const isWideMode = ref(false)

// 弹窗控制状态
const activeTarotDream = ref(null)
const isTarotNew = ref(false)
const activeAlchemyReport = ref(null)
const showSettings = ref(false)
const hasApiKey = ref(false)
const toastMsg = ref('')
const undoSnapshot = ref(null)

let toastTimer = null
function showToast(msg, withUndo = null, duration = 3200) {
  toastMsg.value = msg
  undoSnapshot.value = withUndo
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
    undoSnapshot.value = null
  }, duration)
}

function checkApiKeyStatus() {
  const cfg = getApiConfig()
  hasApiKey.value = Boolean((cfg.apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || '').trim())
}

onMounted(() => {
  dreamList.value = loadDreamList()
  alchemyList.value = loadAlchemyList()
  checkApiKeyStatus()
})

// Tab 1 生成完单梦塔罗后，弹出 3D 翻牌显影卡片
function onTarotGenerated(newDreamCard) {
  activeTarotDream.value = newDreamCard
  isTarotNew.value = true
}

// 点击弹窗底部【收入记忆胶卷】：存入本地缓存并自动跳转到 Tab 2
function onCollectDreamToFilm(dreamCard) {
  const cleanCard = { ...dreamCard }
  delete cleanCard._source
  delete cleanCard._errorMsg

  dreamList.value = [cleanCard, ...dreamList.value]
  saveDreamList(dreamList.value)

  activeTarotDream.value = null
  isTarotNew.value = false
  currentTab.value = 'gallery'
  showToast('🎞️ 已收入记忆胶卷，自动跳转至梦境画廊')
}

// 点击历史梦境卡或雷达图柱体复看大图
function onViewExistingDream(dreamCard) {
  activeTarotDream.value = dreamCard
  isTarotNew.value = false
}

// Tab 2 删除单条梦境（支持 4 秒内一键撤销）
function onDeleteDream(id) {
  const index = dreamList.value.findIndex((d) => d.id === id)
  if (index === -1) return
  const removed = dreamList.value[index]

  dreamList.value = dreamList.value.filter((d) => d.id !== id)
  saveDreamList(dreamList.value)

  showToast(
    `已移除《${removed.title}》`,
    { type: 'dream', item: removed, index },
    4200
  )
}

// Tab 2 完成多梦潜意识炼金合成
function onAlchemyCreated(newReport) {
  const cleanReport = { ...newReport }
  delete cleanReport._source
  delete cleanReport._errorMsg

  alchemyList.value = [cleanReport, ...alchemyList.value]
  saveAlchemyList(alchemyList.value)
  activeAlchemyReport.value = newReport
  showToast('✨ 潜意识炼金合成成功！已收录至炼金图鉴')
}

// Tab 2 查看历史炼金报告
function onViewAlchemy(report) {
  activeAlchemyReport.value = report
}

// Tab 2 删除炼金报告（支持 4 秒内一键撤销）
function onDeleteAlchemy(id) {
  const index = alchemyList.value.findIndex((r) => r.id === id)
  if (index === -1) return
  const removed = alchemyList.value[index]

  alchemyList.value = alchemyList.value.filter((r) => r.id !== id)
  saveAlchemyList(alchemyList.value)

  showToast(
    `已删除《${removed.alchemyTitle}》`,
    { type: 'alchemy', item: removed, index },
    4200
  )
}

// 撤销刚才的删除操作
function handleUndoDelete() {
  if (!undoSnapshot.value) return
  const { type, item, index } = undoSnapshot.value
  if (type === 'dream') {
    const next = [...dreamList.value]
    next.splice(index, 0, item)
    dreamList.value = next
    saveDreamList(dreamList.value)
  } else if (type === 'alchemy') {
    const next = [...alchemyList.value]
    next.splice(index, 0, item)
    alchemyList.value = next
    saveAlchemyList(alchemyList.value)
  }
  undoSnapshot.value = null
  showToast('↩ 已恢复刚才删除的记录')
}

function onApiConfigSaved() {
  checkApiKeyStatus()
  showToast(
    hasApiKey.value
      ? '✅ DeepSeek API 密钥已保存并生效'
      : '已切换为内置高仿真演示模式'
  )
}

function onResetSeedData() {
  const { dreams, alchemies } = resetToSeedData()
  dreamList.value = dreams
  alchemyList.value = alchemies
  showSettings.value = false
  showToast('🔄 已恢复初始演示梦境库')
}

// 导出全部梦境与炼金报告为 JSON 文件
function onExportJson() {
  const payload = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    dreams: dreamList.value,
    alchemies: alchemyList.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dream-tarot-backup-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('📤 已导出记忆胶卷备份文件')
}

// 导入 JSON 备份文件
function onImportJson(rawJson) {
  try {
    const parsed = JSON.parse(rawJson)
    if (Array.isArray(parsed.dreams)) {
      dreamList.value = parsed.dreams
      saveDreamList(dreamList.value)
    }
    if (Array.isArray(parsed.alchemies)) {
      alchemyList.value = parsed.alchemies
      saveAlchemyList(alchemyList.value)
    }
    showSettings.value = false
    showToast('📥 备份数据导入成功！')
  } catch {
    showToast('❌ 导入失败：JSON 文件格式不合法')
  }
}
</script>
