import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleGetAccess(e: React.MouseEvent) {
    e.preventDefault();
    router.push(user ? '/dashboard' : '/login');
  }

  return (
    <nav className="nav">
      <div className="inner">
        <Link href="/" className="brand" aria-label="Rescia Properties · Multifamily Mastery">
          {/* `rescia-mark.png` is the building mark cropped out of the
              full-lockup `rescia-logo.png` (which included a wordmark
              baked under the building). Using the bare mark here lets
              us pair it with the typeset "Rescia Properties" wordmark
              at parity sizes — and lets that 1080x1080 lockup keep
              living for marketing surfaces / favicons / PDFs. */}
          <img
            src="/rescia-mark.png"
            alt=""
            aria-hidden
            style={{ height: 40, width: 'auto', display: 'block' }}
          />
          <span>Rescia Properties</span>
        </Link>
        <div className="links">
          {/* Logged-out visitors see marketing links + Get Access.
              Logged-in members see Dashboard + Sign out — no pricing links,
              per the admin-grants-access flow. */}
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <button
                className="cta"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/#program">Program</Link>
              <Link href="/#curriculum">Curriculum</Link>
              <Link href="/pricing">Pricing</Link>
              <a href="/login" className="cta" onClick={handleGetAccess}>
                Get Access
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
