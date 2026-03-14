/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, FileText, Loader2, RefreshCw, Copy, Check, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setImage(reader.result as string);
                setTranscription("");
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setTranscription("");
      };
      reader.readAsDataURL(file);
    }
  };

  const transcribeHandwriting = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      const model = "gemini-3-flash-preview";
      const base64Data = image.split(',')[1];
      
      const response = await genAI.models.generateContent({
        model: model,
        contents: [
          {
            parts: [
              { text: "Hãy đọc và chuyển đổi nội dung chữ viết tay tiếng Việt trong hình ảnh này sang văn bản. Chỉ trả về nội dung văn bản đã đọc được, không thêm bất kỳ lời giải thích nào khác." },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      setTranscription(response.text || "Không thể nhận diện được nội dung.");
    } catch (error) {
      console.error("Error transcribing image:", error);
      setTranscription("Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const reset = () => {
    setImage(null);
    setTranscription("");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
          >
            Nhận Diện Chữ Viết Tay
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm md:text-base"
          >
            Chụp, tải lên hoặc dán ảnh (Ctrl+V) chứa chữ viết tay tiếng Việt
          </motion.p>
        </header>

        <main className="space-y-6">
          {/* Action Buttons */}
          {!image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <Camera className="text-emerald-600 w-6 h-6" />
                </div>
                <span className="font-medium">Chụp ảnh mới</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleImageUpload}
                />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <Upload className="text-indigo-600 w-6 h-6" />
                </div>
                <span className="font-medium">Chọn từ thiết bị</span>
                <span className="text-[10px] text-muted-foreground mt-1 opacity-60">Hoặc nhấn Ctrl+V để dán</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </button>
            </motion.div>
          )}

          {/* Image Preview & Result */}
          <AnimatePresence mode="wait">
            {image && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                  <div className="relative aspect-video bg-black/5 rounded-xl overflow-hidden mb-4">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {!transcription && !isLoading && (
                    <button
                      onClick={transcribeHandwriting}
                      className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      Bắt đầu nhận diện
                    </button>
                  )}

                  {isLoading && (
                    <div className="w-full py-4 bg-black/5 rounded-xl flex items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý hình ảnh...
                    </div>
                  )}
                </div>

                {transcription && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm relative"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kết quả</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors text-muted-foreground"
                          title="Sao chép"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={reset}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors text-muted-foreground"
                          title="Làm mới"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {transcription}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>© 2026 Trình Nhận Diện Chữ Viết Tay Tiếng Việt</p>
          <p className="mt-1">Sử dụng công nghệ Gemini AI để nhận diện chính xác</p>
        </footer>
      </div>
    </div>
  );
}
