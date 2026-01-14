export default function Footer() {
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH;

  return (
    <footer className="py-4 py-md-5 border-top mt-auto">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 mb-4 mb-md-0 text-center text-md-start">
            <div className="fs-4 fw-semibold mb-2">boximity msp</div>
            <p className="small text-secondary mb-0">
              © 2025 boximity msp. All rights reserved.
            </p>
            {commitHash && (
              <p className="small text-muted mb-0 mt-1">Build: {commitHash}</p>
            )}
          </div>
          <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
            <div className="d-flex gap-4 align-items-center">
              <a href="/privacy-policy" className="text-secondary small">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="text-secondary small">
                Terms of Service
              </a>
              <a
                href="https://www.linkedin.com/company/19035825/"
                className="text-secondary"
              >
                <span className="visually-hidden">LinkedIn</span>
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
