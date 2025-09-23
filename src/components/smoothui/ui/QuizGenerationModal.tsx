"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Image, Send, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuizGeneration } from "@/hooks/useQuizGeneration"
import { QuizOptions } from "@/lib/llm/types"

interface QuizGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onQuizGenerated: (quiz: any) => void // Will be called when quiz is generated
  command: string
}

export function QuizGenerationModal({
  isOpen,
  onClose,
  onQuizGenerated,
  command
}: QuizGenerationModalProps) {
  const [content, setContent] = React.useState("")
  const [contentType, setContentType] = React.useState<'text' | 'pdf' | 'image'>('text')
  const [dragOver, setDragOver] = React.useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false)
  const [quizOptions, setQuizOptions] = React.useState<QuizOptions>({
    subject: 'General',
    class: 'Any',
    language: 'English',
    difficulty: 'medium',
    type: 'mcq',
    questionCount: 5
  })

  const { generateQuiz, isGenerating, error, availableProviders } = useQuizGeneration()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      const response = await generateQuiz(content, contentType, quizOptions)
      
      if (response.success && response.quiz) {
        onQuizGenerated(response.quiz)
        onClose()
      } else {
        console.error('Quiz generation failed:', response.error)
      }
    } catch (error) {
      console.error('Quiz generation failed:', error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, just read as text (we'll handle PDF/image processing later)
    const reader = new FileReader()
    reader.onload = (event) => {
      setContent(event.target?.result as string || "")
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setContent(event.target?.result as string || "")
    }
    reader.readAsText(file)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generate Quiz
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Command: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{command}</code>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Content Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Content Type
                </label>
                <div className="flex gap-3">
                  {[
                    { type: 'text', label: 'Text', icon: FileText },
                    { type: 'pdf', label: 'PDF', icon: Upload },
                    { type: 'image', label: 'Image', icon: Image }
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                        contentType === type
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Advanced Options
                  <span className={cn(
                    "transition-transform",
                    showAdvancedOptions ? "rotate-180" : "rotate-0"
                  )}>
                    ▼
                  </span>
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvancedOptions && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quiz Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                      <input
                        type="text"
                        value={quizOptions.subject || ''}
                        onChange={(e) => setQuizOptions(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                      <input
                        type="text"
                        value={quizOptions.class || ''}
                        onChange={(e) => setQuizOptions(prev => ({ ...prev, class: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Grade 6"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                      <select
                        value={quizOptions.difficulty || 'medium'}
                        onChange={(e) => setQuizOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Question Count</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={quizOptions.questionCount || 5}
                        onChange={(e) => setQuizOptions(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Available Providers</label>
                    <div className="flex gap-2">
                      {availableProviders.map(provider => (
                        <span key={provider} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {provider}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Content
                </label>
                
                {contentType === 'text' ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your content here (lesson notes, textbook content, etc.)"
                    className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors",
                      dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drop your {contentType.toUpperCase()} file here or click to browse
                    </p>
                    <input
                      type="file"
                      accept={contentType === 'pdf' ? '.pdf' : '.jpg,.jpeg,.png,.gif'}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>

              {/* Preview */}
              {content && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preview
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {content.length > 200 ? `${content.substring(0, 200)}...` : content}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isGenerating}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-colors",
                    !content.trim() || isGenerating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
