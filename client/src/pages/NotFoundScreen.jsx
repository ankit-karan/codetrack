import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/ui/Logo';

const LINK_CLASSES =
  'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

/** NotFoundScreen — branded 404 page. */
export default function NotFoundScreen() {
  useDocumentTitle('Page not found');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <Logo size="lg" />
      <p className="mt-10 text-7xl font-extrabold tracking-tight sm:text-8xl">
        <span className="text-gradient">404</span>
      </p>
      <h1 className="mt-4 text-xl font-bold text-ink">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The link may be broken, or the page may have been moved. Head back to your dashboard to
        continue tracking your DSA progress.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className={`${LINK_CLASSES} bg-brand-500 font-semibold text-[#04211e] hover:bg-brand-400`}
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <Link
          to="/questions"
          className={`${LINK_CLASSES} border border-border text-muted hover:border-border-strong hover:text-ink`}
        >
          <Compass size={16} />
          Browse questions
        </Link>
      </div>
    </div>
  );
}
