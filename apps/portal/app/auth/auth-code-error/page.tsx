import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.298 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Authentication Error
            </h1>
            <p className="text-slate-600">
              There was a problem signing you in. This could be due to:
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-slate-600">The authorization code was invalid or expired</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-slate-600">The authentication request was cancelled</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-slate-600">A temporary server issue occurred</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}