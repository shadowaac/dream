<template>
  <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
    <div class="settings-modal-card animate-tarot-in">
      <button class="modal-close-btn" @click="$emit('close')">✕</button>

      <div class="settings-header">
        <h3>⚙️ DeepSeek 引擎配置与跨端数据管理</h3>
        <p>密钥仅保存在当前设备 LocalStorage 中，严守安全红线不上传代码库</p>
      </div>

      <div class="settings-form">
        <div class="form-group">
          <label>AI 服务商快捷预设（兼容 OpenAI 接口规范）</label>
          <div class="preset-chips">
            <button type="button" class="preset-chip" @click="applyPreset('deepseek')">
              DeepSeek (默认推荐)
            </button>
            <button type="button" class="preset-chip" @click="applyPreset('glm')">
              智谱 GLM-4
            </button>
            <button type="button" class="preset-chip" @click="applyPreset('kimi')">
              Kimi (Moonshot)
            </button>
            <button type="button" class="preset-chip" @click="applyPreset('qwen')">
              通义千问
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>API Key（留空则自动启用内置高仿真离线演示引擎）</label>
          <input
            v-model="form.apiKey"
            type="password"
            class="settings-input"
            placeholder="sk-..."
            autocomplete="off"
          />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label>接口地址 (Base URL)</label>
            <input
              v-model="form.baseUrl"
              type="text"
              class="settings-input"
              placeholder="https://api.deepseek.com"
            />
          </div>

          <div class="form-group">
            <label>模型名称 (Model)</label>
            <input
              v-model="form.model"
              type="text"
              class="settings-input"
              placeholder="deepseek-chat"
            />
          </div>
        </div>

        <!-- 实时连通性测试栏 -->
        <div class="test-conn-bar">
          <button
            type="button"
            class="test-conn-btn"
            :disabled="testing"
            @click="handleTestConnection"
          >
            {{ testing ? '⏳ 正在检测连通性...' : '⚡ 测试 API 连通性' }}
          </button>
          <span
            v-if="testResult.message"
            class="test-conn-msg"
            :class="testResult.ok ? 'ok' : 'err'"
          >
            {{ testResult.message }}
          </span>
        </div>
      </div>

      <div class="settings-divider"></div>

      <!-- 跨端 JSON 数据导出与恢复 -->
      <div class="seed-reset-zone">
        <div>
          <div class="reset-title">📦 跨端记忆胶卷备份与迁移</div>
          <div class="reset-sub">支持在电脑端与 Android 手机端之间导出/导入全部梦境 JSON</div>
        </div>
        <div class="backup-btn-group">
          <button type="button" class="mini-backup-btn" @click="$emit('export-json')">
            📤 导出
          </button>
          <label class="mini-backup-btn import-label">
            📥 导入
            <input
              type="file"
              accept=".json,application/json"
              style="display: none"
              @change="onImportFile"
            />
          </label>
        </div>
      </div>

      <div class="seed-reset-zone">
        <div>
          <div class="reset-title">🔄 恢复初始演示梦境库</div>
          <div class="reset-sub">一键重置为 5 条经典梦境与 1 份炼金报告（适合答辩演示前复位）</div>
        </div>
        <button type="button" class="reset-seed-btn" @click="$emit('reset-seed')">
          重置数据
        </button>
      </div>

      <div class="settings-footer">
        <button type="button" class="cancel-btn" @click="$emit('close')">取消</button>
        <button type="button" class="save-btn" @click="handleSave">保存配置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { getApiConfig, saveApiConfig } from '../utils/storage'
import { testApiConnection } from '../services/deepseek'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'saved', 'reset-seed', 'export-json', 'import-json'])

const form = reactive({
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
})

const testing = ref(false)
const testResult = reactive({
  ok: false,
  message: ''
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      const current = getApiConfig()
      form.apiKey = current.apiKey || ''
      form.baseUrl = current.baseUrl || 'https://api.deepseek.com'
      form.model = current.model || 'deepseek-chat'
      testResult.message = ''
    }
  },
  { immediate: true }
)

function applyPreset(type) {
  testResult.message = ''
  if (type === 'deepseek') {
    form.baseUrl = 'https://api.deepseek.com'
    form.model = 'deepseek-chat'
  } else if (type === 'glm') {
    form.baseUrl = 'https://open.bigmodel.cn/api/paas/v4'
    form.model = 'glm-4-flash'
  } else if (type === 'kimi') {
    form.baseUrl = 'https://api.moonshot.cn/v1'
    form.model = 'moonshot-v1-8k'
  } else if (type === 'qwen') {
    form.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    form.model = 'qwen-plus'
  }
}

async function handleTestConnection() {
  testing.value = true
  testResult.message = ''
  try {
    const res = await testApiConnection(form)
    testResult.ok = res.ok
    testResult.message = res.message
  } finally {
    testing.value = false
  }
}

function onImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('import-json', String(reader.result || ''))
    e.target.value = ''
  }
  reader.readAsText(file)
}

function handleSave() {
  saveApiConfig({
    apiKey: form.apiKey.trim(),
    baseUrl: form.baseUrl.trim() || 'https://api.deepseek.com',
    model: form.model.trim() || 'deepseek-chat'
  })
  emit('saved')
  emit('close')
}
</script>
