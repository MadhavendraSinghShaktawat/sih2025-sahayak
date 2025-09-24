"use client";

import AiInputDemo from "@/components/smoothui/examples/AiInputDemo";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Slash Command Test
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test the AI Quiz Generator slash command system
          </p>

          {/* Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              How to Test:
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  1
                </span>
                <span>
                  Type{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    /
                  </code>{" "}
                  to see available commands
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  2
                </span>
                <span>
                  Select{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    quiz
                  </code>{" "}
                  from the dropdown
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  3
                </span>
                <span>
                  Add parameters like:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    topic:maths class:6
                  </code>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  4
                </span>
                <span>
                  Use ↑↓ arrows to navigate, Enter to select, Escape to close
                </span>
              </div>
            </div>
          </div>

          {/* Example Commands */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Example Commands:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Basic Quiz:</div>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  /quiz topic:mathematics
                </code>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Advanced Quiz:</div>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  /quiz topic:science class:8 language:english difficulty:medium
                  type:mcq
                </code>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">
                  True/False Quiz:
                </div>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  /quiz topic:history class:10 type:t-f
                </code>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Mixed Quiz:</div>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  /quiz topic:geography class:7 type:mixup difficulty:hard
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* AI Input Demo */}
        <div className="flex justify-center">
          <AiInputDemo />
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Slash Command System Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
