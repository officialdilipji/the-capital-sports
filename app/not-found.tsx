import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h2 className="text-4xl font-bold text-slate-900 mb-4">404 - Page Not Found</h2>
      <p className="text-slate-600 mb-8">The page you are looking for does not exist.</p>
      <Link 
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
