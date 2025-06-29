<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Выберите формат</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button v-for="format in formats" :key="format" @click="selectedFormat = format" :class="[
            'p-4 rounded-lg border-2 transition-all duration-200 text-center font-medium',
            selectedFormat === format
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          ]">
            {{ format.toUpperCase() }}
          </button>
        </div>
      </div>


      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div @drop="handleDrop" @dragover.prevent @dragenter.prevent :class="[
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        ]" @dragenter="isDragging = true" @dragleave="isDragging = false">
          <Upload class="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p class="text-lg font-medium text-gray-700 mb-2">
            Перетащите или нажмите на облась для загрузки изображений
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Поддерживаемые форматы: JPG, PNG, WebP, GIF • максимум 10 файлов
          </p>
          <input ref="fileInput" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif" @change="handleFileSelect"
            class="hidden" />
          <button @click="$refs.fileInput.click()"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200">
            выбрать файл
          </button>
        </div>

        <div v-if="selectedFiles.length > 0" class="mt-6">
          <h3 class="text-lg font-semibold mb-4">Выбранные файлы ({{ selectedFiles.length }}/10)</h3>
          <div class="grid gap-3">
            <div v-for="(file, index) in selectedFiles" :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <Image class="h-5 w-5 text-gray-500" />
                <span class="text-sm font-medium">{{ file.name }}</span>
                <span class="text-xs text-gray-500">({{ formatFileSize(file.size) }})</span>
              </div>
              <button @click="removeFile(index)" class="text-red-500 hover:text-red-700 transition-colors duration-200">
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedFiles.length > 0" class="text-center mb-6">
        <button @click="convertImages" :disabled="isConverting || !selectedFormat"
          class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:cursor-not-allowed">
          <div v-if="isConverting" class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Конвертиртация...</span>
          </div>
          <span v-else>Конвертировать в {{ selectedFormat?.toUpperCase() }}</span>
        </button>
      </div>

      <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {{ errorMessage }}
      </div>

      <div v-if="convertedImages.length > 0" class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Конвертированные изображения</h3>
          <button @click="downloadAll" :disabled="isCreatingZip"
            class="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center space-x-2">
            <div v-if="isCreatingZip"
              class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <Download v-else class="h-4 w-4" />
            <span>{{ isCreatingZip ? 'Сохранить в zip...' : 'Скачать все' }}</span>
          </button>
        </div>

        <div class="grid gap-3">
          <div v-for="(image, index) in convertedImages" :key="index"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <Image class="h-5 w-5 text-gray-500" />
              <span class="text-sm font-medium">{{ image.filename }}</span>
              <span class="text-xs text-gray-500">({{ selectedFormat?.toUpperCase() }})</span>
            </div>
            <button @click="downloadSingle(image)"
              class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center space-x-1">
              <Download class="h-3 w-3" />
              <span>Скачать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload, Image, X, Download } from 'lucide-vue-next'
import { useFetch, useHead } from '#app'

const selectedFiles = ref([])
const selectedFormat = ref('webp')
const convertedImages = ref([])
const isDragging = ref(false)
const isConverting = ref(false)
const isCreatingZip = ref(false)
const errorMessage = ref('')

const formats = ['jpg', 'png', 'webp', 'gif']

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  addFiles(files)
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  addFiles(files)
}

const addFiles = (files) => {
  const validFiles = files.filter(file => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    return validTypes.includes(file.type)
  })

  const remainingSlots = 10 - selectedFiles.value.length
  const filesToAdd = validFiles.slice(0, remainingSlots)

  selectedFiles.value = [...selectedFiles.value, ...filesToAdd]
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const convertImages = async () => {
  if (!selectedFormat.value || selectedFiles.value.length === 0) return

  isConverting.value = true
  convertedImages.value = []
  errorMessage.value = ''

  try {
    const formData = new FormData()
    selectedFiles.value.forEach((file, index) => {
      formData.append(`file${index}`, file)
    })
    formData.append('format', selectedFormat.value)
    formData.append('count', selectedFiles.value.length.toString())

    const response = await useFetch('/api/convert', {
      method: 'POST',
      body: formData
    })

    if (response.data.value.success) {
      convertedImages.value = response.data.value.images
    } else {
      throw new Error(response.data.value.message || 'Conversion failed')
    }
  } catch (error) {
    console.error('Conversion failed:', error)
    errorMessage.value = error.message || 'Conversion failed. Please try again.'
  } finally {
    isConverting.value = false
  }
}

const downloadSingle = (image) => {
  try {
    const link = document.createElement('a')
    link.href = `data:${image.mimeType};base64,${image.data}`
    link.download = image.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Download failed:', error)
    errorMessage.value = 'Download failed. Please try again.'
  }
}

const downloadAll = async () => {
  if (convertedImages.value.length === 0) return

  isCreatingZip.value = true
  errorMessage.value = ''

  try {
    const response = await useFetch('/api/download-zip', {
      method: 'POST',
      body: {
        images: convertedImages.value
      }
    })

    if (response.data.value.success) {
      const link = document.createElement('a')
      link.href = `data:application/zip;base64,${response.data.value.zipData}`
      link.download = response.data.value.filename || `converted-images-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      throw new Error(response.data.value.message || 'ZIP creation failed')
    }
  } catch (error) {
    console.error('ZIP creation failed:', error)
    errorMessage.value = error.message || 'Failed to create ZIP file. Please try again.'
  } finally {
    isCreatingZip.value = false
  }
}

useHead({
  title: 'Конвертер',
  meta: [
    { name: 'description', content: 'Конвертация изображений' }
  ]
})
</script>
