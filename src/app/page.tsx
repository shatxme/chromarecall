import { ColorMemoryGame } from '@/components/color-memory-game'
import AnimatedHeader from '@/components/AnimatedHeader'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <AnimatedHeader />
        <p className="text-xl sm:text-2xl text-white text-center mb-8 sm:mb-16">Test your color memory! Select the color you saw after it disappears.</p>
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-xl overflow-hidden">
          <ColorMemoryGame />
        </div>
      </div>
    </div>
  )
}
