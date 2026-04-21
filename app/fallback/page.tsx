export default function FallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">Henry Squad AI Chat</h1>
        <div className="mb-6">
          <img
            src="/placeholder.svg?height=120&width=120"
            alt="Henry Squad AI"
            className="mx-auto rounded-full bg-purple-100 p-4"
          />
        </div>
        <p className="text-gray-700 mb-6">
          I'm Henry Squad AI! I'm here to help elementary school students learn and explore. Unfortunately, I'm having
          some technical difficulties right now.
        </p>
        <p className="text-gray-700 mb-6">Here are some fun facts while we wait:</p>
        <ul className="text-left text-gray-700 mb-6 space-y-2">
          <li>• A day on Venus is longer than a year on Venus!</li>
          <li>• Octopuses have three hearts and blue blood.</li>
          <li>• The Great Wall of China is not visible from space with the naked eye.</li>
          <li>• A group of flamingos is called a "flamboyance."</li>
          <li>• The shortest war in history was between Britain and Zanzibar in 1896. It lasted just 38 minutes!</li>
        </ul>
        <p className="text-gray-700">Please try again later or ask a teacher or parent for help.</p>
      </div>
    </div>
  )
}
