'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { obituaryService, supabase } from '@/lib/supabase'
import { GiphyPicker } from './GiphyPicker'

interface FormData {
  title: string
  blurb: string
  causes: string[]
  storyMd: string
  mediaUrls: string[]
}

const COMMON_CAUSES = [
  'founder-burnout',
  'bad-ui',
  'market-saturation',
  'over-engineering',
  'no-market-need',
  'ai-hype',
  'crypto-winter',
  'regulatory-issues',
  'terrible-idea',
  'ran-out-of-money',
  'team-conflict',
  'bad-timing',
  'competition',
  'pivot-fatigue',
  'feature-creep',
  'poor-execution'
]

export function CreateObituaryForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    blurb: '',
    causes: [],
    storyMd: '',
    mediaUrls: []
  })
  const [customCause, setCustomCause] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [selectedGifs, setSelectedGifs] = useState<string[]>([])

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const addCause = (cause: string) => {
    if (!formData.causes.includes(cause)) {
      setFormData(prev => ({
        ...prev,
        causes: [...prev.causes, cause]
      }))
    }
  }

  const removeCause = (cause: string) => {
    setFormData(prev => ({
      ...prev,
      causes: prev.causes.filter(c => c !== cause)
    }))
  }

  const addCustomCause = () => {
    if (customCause.trim() && !formData.causes.includes(customCause.trim())) {
      addCause(customCause.trim())
      setCustomCause('')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const urls = await obituaryService.uploadMedia(files)
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...urls]
      }))
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload media. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGifs(prev => [...prev, gifUrl])
    setShowGiphyPicker(false)
  }

  const removeGif = (index: number) => {
    setSelectedGifs(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.blurb.trim() || !formData.storyMd.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Combine uploaded media and GIFs
      const allMediaUrls = [...formData.mediaUrls, ...selectedGifs]
      const finalFormData = {
        ...formData,
        mediaUrls: allMediaUrls
      }
      
      const obituary = await obituaryService.createObituary(finalFormData)
      router.push(`/obituary/${obituary.id}`)
    } catch (error) {
      console.error('Failed to create obituary:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create obituary: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.title.trim() && formData.blurb.trim()
      case 2: return formData.causes.length > 0
      case 3: return formData.storyMd.trim()
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-neutral-100">
          Confess Your Startup&apos;s Death
        </h1>
        <p className="text-neutral-400 mb-2">
          Step {step} of 4: Let&apos;s give your failed startup a proper send-off
        </p>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span>🔒</span>
          <span>Anonymous posting - Your real name and photo are never shown</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-100">
              {step === 1 && "💀 The Basics"}
              {step === 2 && "🏷️ Causes of Death"}
              {step === 3 && "📖 The Full Story"}
              {step === 4 && "📸 Media & Submit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Startup Name *
                  </label>
                  <Input
                    placeholder="e.g., SnackSendr"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-neutral-800 border-neutral-700 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Death Blurb * (120 chars max)
                  </label>
                  <Textarea
                    placeholder="A brief, darkly humorous summary of how it died..."
                    value={formData.blurb}
                    onChange={(e) => setFormData(prev => ({ ...prev, blurb: e.target.value.slice(0, 120) }))}
                    className="bg-neutral-800 border-neutral-700 text-neutral-100 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.blurb.length}/120 characters
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Select Causes of Death
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_CAUSES.map(cause => (
                      <Button
                        key={cause}
                        variant={formData.causes.includes(cause) ? "default" : "outline"}
                        size="sm"
                        onClick={() => formData.causes.includes(cause) ? removeCause(cause) : addCause(cause)}
                        className="text-xs justify-start"
                      >
                        {cause}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Add Custom Cause
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="custom-cause"
                      value={customCause}
                      onChange={(e) => setCustomCause(e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-neutral-100"
                    />
                    <Button onClick={addCustomCause} variant="outline" size="sm">
                      Add
                    </Button>
                  </div>
                </div>
                {formData.causes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Selected Causes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.causes.map(cause => (
                        <Badge
                          key={cause}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeCause(cause)}
                        >
                          {cause} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  The Full Story * (Markdown supported)
                </label>
                <Textarea
                  placeholder="Tell the full story of your startup's demise. What went wrong? What did you learn? Be honest, be funny, be cathartic..."
                  value={formData.storyMd}
                  onChange={(e) => setFormData(prev => ({ ...prev, storyMd: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 min-h-[200px]"
                />
              </div>
            )}

            {step === 4 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Upload Media (optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
                    />
                    
                    {/* GIPHY Picker */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGiphyPicker(!showGiphyPicker)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                      >
                        🎬 Add GIF from GIPHY
                      </Button>
                      <GiphyPicker
                        isOpen={showGiphyPicker}
                        onSelect={handleGifSelect}
                        onClose={() => setShowGiphyPicker(false)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Supports images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV). Max 10MB for images, 50MB for videos.
                  </p>
                  {isUploading && <p className="text-sm text-neutral-400 mt-2">Uploading...</p>}
                </div>

                {/* Selected GIFs Preview */}
                {selectedGifs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Selected GIFs ({selectedGifs.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedGifs.map((gifUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={gifUrl}
                            alt={`GIF ${index + 1}`}
                            className="rounded-lg max-h-32 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeGif(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.mediaUrls.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Uploaded Media ({formData.mediaUrls.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.mediaUrls.map((url, index) => (
                        <div key={index} className="relative">
                          {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                            <video
                              src={url}
                              controls
                              className="rounded-lg max-h-32 w-full object-cover"
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Upload ${index + 1}`}
                              className="rounded-lg max-h-32 w-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
                            }))}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <Separator />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Obituary'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-100">🔍 Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.title && (
                <h3 className="text-xl font-bold text-neutral-100">
                  RIP {formData.title} 💀
                </h3>
              )}
              
              {formData.blurb && (
                <p className="text-sm text-neutral-400">{formData.blurb}</p>
              )}
              
              {formData.causes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.causes.map(cause => (
                    <Badge key={cause} variant="secondary" className="text-xs">
                      {cause}
                    </Badge>
                  ))}
                </div>
              )}
              
              {formData.storyMd && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{formData.storyMd}</ReactMarkdown>
                </div>
              )}
              
              {(formData.mediaUrls.length > 0 || selectedGifs.length > 0) && (
                <div className="space-y-2">
                  {formData.mediaUrls.map((url, index) => (
                    <div key={`media-${index}`}>
                      {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                        <video
                          src={url}
                          controls
                          className="rounded-lg max-h-48 w-full object-cover"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="rounded-lg max-h-48 w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {selectedGifs.map((gifUrl, index) => (
                    <div key={`gif-${index}`}>
                      <img
                        src={gifUrl}
                        alt={`GIF Preview ${index + 1}`}
                        className="rounded-lg max-h-48 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 