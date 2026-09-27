const POLICY_TITLES: Record<string, string> = {
  'privacy-policy': 'Politique de confidentialité',
  'refund-policy': 'Politique de remboursement',
  'shipping-policy': 'Politique de livraison',
  'subscription-policy': 'Politique d’abonnement',
  'terms-of-service': 'Conditions de vente',
};

export function policyTitle(handle: string, fallback: string) {
  return POLICY_TITLES[handle] ?? fallback;
}
