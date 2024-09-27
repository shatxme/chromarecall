import { ColorMemoryGame } from '@/components/color-memory-game'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <h1 className="text-4xl sm:text-6xl font-bold text-white text-center mb-2 sm:mb-4">Chroma Recall</h1>
        <p className="text-xl text-white text-center mb-6 sm:mb-12">Test your color memory! Select the color you saw after it disappears.</p>
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-xl overflow-hidden">
          <ColorMemoryGame />
        </div>
      </div>
    </div>
  )
}
