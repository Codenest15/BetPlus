/** Send the user to Moolre hosted checkout when the API returns a payment URL. */
export function redirectToMoolreCheckout(
  authorizationUrl: string | null | undefined,
): boolean {
  const url = authorizationUrl?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return false;
  window.location.assign(url);
  return true;
}
