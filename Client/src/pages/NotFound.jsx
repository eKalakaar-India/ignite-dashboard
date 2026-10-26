import React from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
        <Compass size={28} className="text-primary-600" />
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-sm text-slate-500 mt-2">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary-800 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
