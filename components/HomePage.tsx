"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Code, Image as ImageIcon, Mic, MessageSquare, Github, Sparkles } from "lucide-react"

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🤖 Henry Squad AI
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition">
              Features
            </a>
            <a href="#tech" className="text-gray-700 hover:text-purple-600 transition">
              Technology
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-600 transition">
              About
            </a>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered Learning Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
            Meet Henry Squad AI
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your friendly AI companion for learning, coding, creating, and having fun! Get instant help with homework,
            generate images, write code, and explore knowledge like never before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-lg gap-2">
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg rounded-lg"
            >
              Learn More
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-purple-200">
            <div>
              <div className="text-3xl font-bold text-purple-600">∞</div>
              <p className="text-gray-600 mt-2">Conversations</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">💻</div>
              <p className="text-gray-600 mt-2">Code Generation</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">🎨</div>
              <p className="text-gray-600 mt-2">Image Generation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white bg-opacity-50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Everything you need to learn and create</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-lg border border-purple-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Chat</h3>
              <p className="text-gray-700">Ask anything and get instant, friendly responses. Perfect for homework help and learning.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Code Writing</h3>
              <p className="text-gray-700">Generate code snippets in JavaScript, Python, and more. Copy with a single click!</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-lg border border-pink-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-pink-600 text-white rounded-lg flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Image Generation</h3>
              <p className="text-gray-700">Describe your ideas and let AI create beautiful images for you.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg border border-green-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Voice Input</h3>
              <p className="text-gray-700">Speak your questions and listen to responses. Learning made natural.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-lg border border-orange-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-700">Get instant responses powered by cutting-edge AI technology.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-lg border border-indigo-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chat History</h3>
              <p className="text-gray-700">Save and organize your conversations in different sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Built with Modern Tech
          </h2>
          <p className="text-gray-600 mb-12 text-lg">Powered by the latest technologies</p>

          <div className="grid md:grid-cols-4 gap-6">
            {["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"].map((tech) => (
              <div
                key={tech}
                className="bg-white bg-opacity-70 backdrop-blur border border-purple-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <p className="font-semibold text-gray-900">{tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90">Join Henry Squad AI and unlock your potential with AI-powered assistance.</p>
          <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg gap-2">
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Henry Squad AI</h3>
              <p className="text-gray-400">AI-powered learning assistant for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex justify-between items-center">
            <p className="text-gray-400">&copy; 2026 Henry Squad AI. All rights reserved.</p>
            <a href="https://github.com/swabnitzHD/HenrySquadAI" target="_blank" rel="noopener noreferrer">
              <Github className="w-6 h-6 text-gray-400 hover:text-white transition" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
