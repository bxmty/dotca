import { ButtonLink } from "./components/Button";
import StatusPage from "./components/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      kicker="404"
      heading="Page not found"
      action={
        <ButtonLink href="/" variant="secondary">
          Return to home
        </ButtonLink>
      }
    >
      <p className="m-0">The page you are looking for does not exist.</p>
    </StatusPage>
  );
}
