import { Button } from "@/components/ui/button"

interface GameIntroProps {
  startGame: () => void;
}

export default function GameIntro({ startGame }: GameIntroProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-10 text-gray-800 text-center">
        Ready to test your color perception skills?
      </h2>
      <div className="bg-white bg-opacity-80 p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed text-center mb-2">
          Here&apos;s how to play:
        </p>
        <ul className="text-sm sm:text-base md:text-lg text-gray-700 list-disc list-inside mt-2 space-y-2 text-left">
          <li>A color will appear briefly</li>
          <li>Memorize it, then choose the matching color from the options</li>
          <li>You can pick close matches, but you&apos;re limited to 3 in early levels</li>
          <li>Be quick and accurate to score high!</li>
        </ul>
      </div>
      <div className="space-y-2">
        <Button 
          onClick={startGame} 
          size="lg" 
          className="w-full sm:w-auto text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 md:text-xl md:px-12 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          aria-label="Start Game"
        >
          Start Game
        </Button>
      </div>
    </div>
  )
}