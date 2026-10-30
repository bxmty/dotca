// Usage: node scripts/sdr-link.ts "<SDR name>" <staging|production|local>
//
// Prints a signed discovery-call console URL. Reads SDR_LINK_SIGNING_SECRET
// from the environment; `just sdr-link` supplies it from 1Password. Never
// prints the secret.
import {
  buildSdrConsoleUrl,
  isSdrLinkEnvironment,
} from "../src/lib/sdr-link.ts";

const [name, environment] = process.argv.slice(2);

if (!name || !environment || !isSdrLinkEnvironment(environment)) {
  console.error(
    'Usage: node scripts/sdr-link.ts "<SDR name>" <staging|production|local>',
  );
  process.exit(1);
}

try {
  console.log(buildSdrConsoleUrl({ name, environment }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
