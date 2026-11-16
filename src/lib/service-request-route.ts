/** Where a client's intake link opens: `/service-request/<token>`. */
const SERVICE_REQUEST_PAGE_PREFIX = "/service-request/";

/**
 * A service request page: the form, its confirmation and its error states.
 * It shows no link out, so the requester completes and submits.
 */
export function isServiceRequestPage(pathname: string): boolean {
  return (
    pathname.startsWith(SERVICE_REQUEST_PAGE_PREFIX) &&
    pathname.length > SERVICE_REQUEST_PAGE_PREFIX.length
  );
}
