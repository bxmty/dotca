import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="container text-center my-5">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">
        <button className="btn btn-primary">Return to Home</button>
      </Link>
    </div>
  );
}